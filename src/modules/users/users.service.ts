import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../../common/enums/roles.enum';
import { compare, genSalt, hash } from 'bcryptjs';

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS: number = 10;
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: [
        { username: createUserDto.username },
        { email: createUserDto.email },
      ],
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    const salt = await genSalt(this.SALT_ROUNDS);
    const passwordHash = await hash(createUserDto.password, salt);

    const user = this.usersRepository.create({
      ...createUserDto,
      passwordHash,
      roles: createUserDto.roles || [Role.USER],
    });

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
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
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
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

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<void> {
    if (updateUserDto.username || updateUserDto.email) {
      const existingUser = await this.usersRepository.findOne({
        where: [
          ...(updateUserDto.username
            ? [{ username: updateUserDto.username }]
            : []),
          ...(updateUserDto.email ? [{ email: updateUserDto.email }] : []),
        ],
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Username or email already exists');
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await hash(
        updateUserDto.password,
        this.SALT_ROUNDS,
      );
    }

    await this.usersRepository.update(id, {
      ...updateUserDto,
      ...(updateUserDto.password && { passwordHash: updateUserDto.password }),
    });
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.findByUsername(username);
    if (user && (await compare(password, user.passwordHash))) {
      return user;
    }
    return null;
  }
}
