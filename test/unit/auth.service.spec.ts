import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../src/modules/auth/auth.service';
import { UsersService } from '../../src/modules/users/users.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { User } from '../../src/modules/users/entities/user.entity';
import { LoginDto } from '../../src/modules/auth/dto/login.dto';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    roles: ['USER'],
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            validateUser: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('24h'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('login', () => {
    it('should return JWT token and user info for valid user', async () => {
      const mockToken = 'jwt-token';
      jest
        .spyOn(usersService, 'validateUser')
        .mockResolvedValue(mockUser as User);
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);

      const loginDto = { username: 'testuser', password: 'password' };
      const result = await service.login(loginDto as LoginDto);

      expect(result).toEqual({
        accessToken: mockToken,
        tokenType: 'Bearer',
        expiresIn: '24h',
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          roles: mockUser.roles,
          status: mockUser.status,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      jest.spyOn(usersService, 'validateUser').mockResolvedValue(null);

      const loginDto = { username: 'wrong', password: 'wrong' };
      await expect(service.login(loginDto as LoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should use default expiresIn if config is missing', async () => {
      jest
        .spyOn(usersService, 'validateUser')
        .mockResolvedValue(mockUser as User);
      jest.spyOn(jwtService, 'sign').mockReturnValue('jwt-token');
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      const loginDto = { username: 'testuser', password: 'password' };
      const result = await service.login(loginDto as LoginDto);

      expect(result.expiresIn).toBe('24h');
    });

    it('should handle user with missing fields gracefully', async () => {
      const incompleteUser = { id: 2, username: '', roles: [], status: null };
      jest
        .spyOn(usersService, 'validateUser')
        .mockResolvedValue(incompleteUser as unknown as User);
      jest.spyOn(jwtService, 'sign').mockReturnValue('jwt-token');

      const loginDto = { username: '', password: '' };
      const result = await service.login(loginDto as LoginDto);

      expect(result.user).toMatchObject({
        id: 2,
        username: '',
        roles: [],
        status: null,
      });
    });

    it('should handle empty username/password', async () => {
      jest.spyOn(usersService, 'validateUser').mockResolvedValue(null);

      const loginDto = { username: '', password: '' };
      await expect(service.login(loginDto as LoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile for valid userId', async () => {
      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser as User);

      const result = await service.getProfile(1);

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(usersService, 'findOne').mockImplementation(() => {
        throw new NotFoundException('User with ID 999 not found');
      });

      await expect(service.getProfile(999)).rejects.toThrow(NotFoundException);
    });
  });
});
