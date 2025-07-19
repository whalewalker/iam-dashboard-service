import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../../src/modules/users/users.service';
import { User } from '../../src/modules/users/entities/user.entity';
import { Role } from '../../src/common/enums/roles.enum';
import { UserStatus } from '../../src/common/enums/status.enum';
import { CreateUserDto } from '../../src/modules/users/dto/create-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const createMockUser = (overrides: Partial<User> = {}): User => {
    const defaultUser: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hashedPassword',
      roles: [Role.USER],
      status: UserStatus.ACTIVE,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      appointments: [],
    };

    return { ...defaultUser, ...overrides };
  };

  const mockUser = createMockUser();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123',
      roles: [Role.USER],
    };

    it('should create a new user with hashed password', async () => {
      const expectedUser = createMockUser({
        username: 'newuser',
        email: 'new@example.com',
        passwordHash: 'hashedPassword',
      });

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt' as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
      jest.spyOn(repository, 'create').mockReturnValue(expectedUser);
      jest.spyOn(repository, 'save').mockResolvedValue(expectedUser);

      const result = await service.create(createUserDto);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
      expect(repository.create).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        roles: [Role.USER],
        passwordHash: 'hashedPassword',
      });
      expect(repository.save).toHaveBeenCalledWith(expectedUser);
      expect(result).toEqual(expectedUser);
    });

    it('should default roles to USER if not provided', async () => {
      const dtoWithoutRoles: CreateUserDto = {
        username: 'newuser2',
        email: 'new2@example.com',
        password: 'password123',
      };

      const expectedUser = createMockUser({
        username: 'newuser2',
        email: 'new2@example.com',
        roles: [Role.USER],
      });

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt' as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
      jest.spyOn(repository, 'create').mockReturnValue(expectedUser);
      jest.spyOn(repository, 'save').mockResolvedValue(expectedUser);

      const result = await service.create(dtoWithoutRoles);

      expect(repository.create).toHaveBeenCalledWith({
        username: 'newuser2',
        email: 'new2@example.com',
        password: 'password123',
        passwordHash: 'hashedPassword',
        roles: [Role.USER],
      });
      expect(result.roles).toEqual([Role.USER]);
    });

    it('should throw ConflictException when username already exists', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('Username or email already exists'),
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: [{ username: 'newuser' }, { email: 'new@example.com' }],
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      const existingUserWithSameEmail = createMockUser({
        email: 'new@example.com',
      });

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(existingUserWithSameEmail);

      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('Username or email already exists'),
      );
    });

    it('should handle repository save errors', async () => {
      const expectedUser = createMockUser();

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt' as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
      jest.spyOn(repository, 'create').mockReturnValue(expectedUser);
      jest
        .spyOn(repository, 'save')
        .mockRejectedValue(new Error('DB save error'));

      await expect(service.create(createUserDto)).rejects.toThrow(
        'DB save error',
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of users with selected fields', async () => {
      const users = [
        createMockUser(),
        createMockUser({ id: 2, username: 'user2' }),
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(users);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        select: [
          'id',
          'username',
          'email',
          'roles',
          'status',
          'createdAt',
          'updatedAt',
        ],
      });
      expect(result).toEqual(users);
    });

    it('should return empty array when no users exist', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should handle repository errors', async () => {
      jest
        .spyOn(repository, 'find')
        .mockRejectedValue(new Error('DB find error'));

      await expect(service.findAll()).rejects.toThrow('DB find error');
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        select: [
          'id',
          'username',
          'email',
          'roles',
          'status',
          'createdAt',
          'updatedAt',
        ],
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        new NotFoundException('User with ID 999 not found'),
      );
    });

    it('should handle repository errors', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValue(new Error('DB error'));

      await expect(service.findOne(1)).rejects.toThrow('DB error');
    });
  });

  describe('findByUsername', () => {
    it('should return a user by username', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.findByUsername('testuser');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await service.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove a user successfully', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'remove').mockResolvedValue(mockUser);

      await service.remove(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(repository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(new NotFoundException('User with ID 999 not found'));

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('should handle repository remove errors', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      jest
        .spyOn(repository, 'remove')
        .mockRejectedValue(new Error('Remove error'));

      await expect(service.remove(1)).rejects.toThrow('Remove error');
    });
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      jest.spyOn(service, 'findByUsername').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.validateUser('testuser', 'password123');

      expect(service.findByUsername).toHaveBeenCalledWith('testuser');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword',
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      jest.spyOn(service, 'findByUsername').mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password123');

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      jest.spyOn(service, 'findByUsername').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const result = await service.validateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });
  });
});
