import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { User } from '../../src/modules/users/entities/user.entity';

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    user: {
      id: number;
      username: string;
      email: string;
      roles: string[];
      status: string;
      createdAt: string;
      updatedAt: string;
    };
  };
}

interface ErrorResponse {
  success: boolean;
  message: string;
  error: string;
  statusCode: number;
}

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_TEST_HOST || 'localhost',
          port: parseInt(process.env.DATABASE_PORT ?? '5433', 10),
          username: process.env.DATABASE_USERNAME || 'test',
          password: process.env.DATABASE_PASSWORD || 'test',
          database: process.env.DATABASE_NAME || 'test_db',
          entities: [User],
          synchronize: true,
          dropSchema: true,
          logging: false,
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    await app.init();
  });

  afterAll(async () => {
    if (dataSource) {
      await dataSource.destroy();
    }
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await dataSource.query('TRUNCATE TABLE "user" RESTART IDENTITY CASCADE');
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          roles: ['USER'],
        })
        .expect(201);
    });

    it('should return JWT token for valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200);

      const loginResponse = response.body as LoginResponse;

      expect(loginResponse.success).toBe(true);
      expect(loginResponse.message).toBe('Login successful');
      expect(loginResponse.data).toHaveProperty('access_token');
      expect(loginResponse.data).toHaveProperty('user');
      expect(loginResponse.data.user.username).toBe('testuser');
      expect(loginResponse.data.user.email).toBe('test@example.com');
      expect(typeof loginResponse.data.access_token).toBe('string');
      expect(loginResponse.data.access_token.length).toBeGreaterThan(0);
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        })
        .expect(401);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(401);
      expect(errorResponse.message).toBeDefined();
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123',
        })
        .expect(401);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(401);
      expect(errorResponse.message).toBeDefined();
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(400);
    });

    it('should return 400 for empty username', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: '',
          password: 'password123',
        })
        .expect(400);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(400);
    });

    it('should return 400 for empty password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: '',
        })
        .expect(400);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(400);
    });
  });

  describe('/auth/profile (GET)', () => {
    let accessToken: string;

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'profileuser',
          email: 'profile@example.com',
          password: 'password123',
          roles: ['USER'],
        })
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'profileuser',
          password: 'password123',
        })
        .expect(200);

      const loginData = loginResponse.body as LoginResponse;
      accessToken = loginData.data.access_token;
    });

    it('should return user profile for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User profile retrieved successfully');
      expect(response.body.data.username).toBe('profileuser');
      expect(response.body.data.email).toBe('profile@example.com');
      expect(response.body.data).not.toHaveProperty('passwordHash');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('roles');
      expect(response.body.data).toHaveProperty('status');
    });

    it('should return 401 for missing token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(401);
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(401);
    });

    it('should return 401 for malformed authorization header', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'invalid-format')
        .expect(401);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(401);
    });
  });
});
