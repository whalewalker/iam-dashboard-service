import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { User } from '../../src/modules/users/entities/user.entity';

interface UserResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    username: string;
    email: string;
    roles: string[];
    status: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface UsersListResponse {
  success: boolean;
  message: string;
  data: Array<{
    id: number;
    username: string;
    email: string;
    roles: string[];
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface ErrorResponse {
  success: boolean;
  message: string;
  error?: string;
  statusCode: number;
}

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

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userToken: string;
  let adminToken: string;

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

    // Create test users and get tokens
    await request(app.getHttpServer())
      .post('/users')
      .send({
        username: 'regularuser',
        email: 'user@example.com',
        password: 'password123',
        roles: ['USER'],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/users')
      .send({
        username: 'adminuser',
        email: 'admin@example.com',
        password: 'password123',
        roles: ['ADMIN'],
      })
      .expect(201);

    const userLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'regularuser',
        password: 'password123',
      })
      .expect(200);

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'adminuser',
        password: 'password123',
      })
      .expect(200);

    const userLoginData = userLoginResponse.body as LoginResponse;
    const adminLoginData = adminLoginResponse.body as LoginResponse;

    userToken = userLoginData.data.access_token;
    adminToken = adminLoginData.data.access_token;
  });

  afterAll(async () => {
    if (dataSource) {
      await dataSource.destroy();
    }
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.query(`
      DELETE FROM "user" 
      WHERE username NOT IN ( 'admin')
    `);
  });

  describe('/users (GET)', () => {
    it('should return users array when authenticated as user', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const usersResponse = response.body as UsersListResponse;
      expect(usersResponse.success).toBe(true);
      expect(usersResponse.message).toBe('Users retrieved successfully');
      expect(Array.isArray(usersResponse.data)).toBe(true);
      expect(usersResponse.data.length).toBeGreaterThan(0);

      const firstUser = usersResponse.data[0];
      expect(firstUser).toHaveProperty('id');
      expect(firstUser).toHaveProperty('username');
      expect(firstUser).toHaveProperty('email');
      expect(firstUser).toHaveProperty('roles');
      expect(firstUser).toHaveProperty('status');
      expect(firstUser).not.toHaveProperty('passwordHash');
    });

    it('should return users array when authenticated as admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const usersResponse = response.body as UsersListResponse;
      expect(usersResponse.success).toBe(true);
      expect(usersResponse.message).toBe('Users retrieved successfully');
      expect(Array.isArray(usersResponse.data)).toBe(true);
      expect(usersResponse.data.length).toBeGreaterThan(0);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .expect(401);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(401);
    });
  });

  describe('/users (POST)', () => {
    it('should create a new user when authenticated', async () => {
      const newUser = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        roles: ['USER'],
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newUser)
        .expect(201);

      const userResponse = response.body as UserResponse;
      expect(userResponse.success).toBe(true);
      expect(userResponse.message).toBe('User created successfully');
      expect(userResponse.data.username).toBe(newUser.username);
      expect(userResponse.data.email).toBe(newUser.email);
      expect(userResponse.data.roles).toEqual(newUser.roles);
      expect(userResponse.data).not.toHaveProperty('passwordHash');
      expect(userResponse.data).toHaveProperty('id');
      expect(userResponse.data).toHaveProperty('createdAt');
      expect(userResponse.data).toHaveProperty('updatedAt');
    });

    it('should default roles to USER if not provided', async () => {
      const newUser = {
        username: 'defaultroleuser',
        email: 'defaultrole@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newUser)
        .expect(201);

      const userResponse = response.body as UserResponse;
      expect(userResponse.success).toBe(true);
      expect(userResponse.data.roles).toEqual(['USER']);
    });

    it('should return 409 for duplicate username', async () => {
      const duplicateUser = {
        username: 'regularuser',
        email: 'different@example.com',
        password: 'password123',
        roles: ['USER'],
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send(duplicateUser)
        .expect(409);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(409);
      expect(errorResponse.message).toContain('already exists');
    });

    it('should return 409 for duplicate email', async () => {
      const duplicateUser = {
        username: 'differentuser',
        email: 'user@example.com',
        password: 'password123',
        roles: ['USER'],
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send(duplicateUser)
        .expect(409);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(409);
      expect(errorResponse.message).toContain('already exists');
    });

    it('should return 400 for invalid user data', async () => {
      const invalidUser = {
        username: '',
        email: 'invalid-email',
        password: '123',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidUser)
        .expect(400);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(400);
    });

    it('should return 401 when not authenticated', async () => {
      const newUser = {
        username: 'unauthuser',
        email: 'unauth@example.com',
        password: 'password123',
        roles: ['USER'],
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(newUser)
        .expect(401);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(401);
    });
  });

  describe('/users/:id (GET)', () => {
    let testUserId: number;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          username: 'getuser',
          email: 'getuser@example.com',
          password: 'password123',
          roles: ['USER'],
        })
        .expect(201);

      const userResponse = createResponse.body as UserResponse;
      testUserId = userResponse.data.id;
    });

    it('should return user by id when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const userResponse = response.body as UserResponse;
      expect(userResponse.success).toBe(true);
      expect(userResponse.message).toBe('User retrieved successfully');
      expect(userResponse.data.id).toBe(testUserId);
      expect(userResponse.data.username).toBe('getuser');
      expect(userResponse.data.email).toBe('getuser@example.com');
      expect(userResponse.data).not.toHaveProperty('passwordHash');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/999999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(404);
      expect(errorResponse.message).toContain('not found');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${testUserId}`)
        .expect(401);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(401);
    });

    it('should return 400 for invalid user id format', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/invalid')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(400);
    });
  });

  describe('/users/:id (PATCH)', () => {
    let testUserId: number;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          username: 'updateuser',
          email: 'updateuser@example.com',
          password: 'password123',
          roles: ['USER'],
        })
        .expect(201);

      const userResponse = createResponse.body as UserResponse;
      testUserId = userResponse.data.id;
    });

    it('should update user when authenticated', async () => {
      const updateData = {
        username: 'updateduser',
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User updated successfully');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .patch('/users/999999')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ username: 'newname' })
        .expect(404);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(404);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${testUserId}`)
        .send({ username: 'newname' })
        .expect(401);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(401);
    });

    it('should return 400 for invalid update data', async () => {
      const invalidUpdateData = {
        email: 'invalid-email-format',
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidUpdateData)
        .expect(400);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(400);
    });
  });

  describe('/users/:id (DELETE)', () => {
    let testUserId: number;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'deleteuser',
          email: 'deleteuser@example.com',
          password: 'password123',
          roles: ['USER'],
        })
        .expect(201);

      const userResponse = createResponse.body as UserResponse;
      testUserId = userResponse.data.id;
    });

    it('should delete user when authenticated as admin', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deleted successfully');

      // Verify user is actually deleted
      await request(app.getHttpServer())
        .get(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 403 when authenticated as regular user', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .delete('/users/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(404);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/users/${testUserId}`)
        .expect(401);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(401);
    });

    it('should return 400 for invalid user id format', async () => {
      const response = await request(app.getHttpServer())
        .delete('/users/invalid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      const errorResponse = response.body as ErrorResponse;
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(400);
    });
  });
});
