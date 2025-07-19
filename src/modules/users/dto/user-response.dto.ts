import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { Role } from '../../../common/enums/roles.enum';
import { UserStatus } from '../../../common/enums/status.enum';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Username', example: 'johndoe' })
  @Expose()
  username: string;

  @ApiProperty({ description: 'Email', example: 'john.doe@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'User roles', example: ['user'] })
  @Expose()
  roles: Role[];

  @ApiProperty({ description: 'User status', example: 'active' })
  @Expose()
  status: UserStatus;

  @ApiProperty({ description: 'Creation date' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  @Expose()
  updatedAt: Date;

  @Exclude()
  passwordHash: string;
}
