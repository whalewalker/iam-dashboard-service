import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { Role } from '../../common/enums/roles.enum';

@Injectable()
export class AdminUsersService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    try {
      const username = this.configService.get<string>('ADMIN_USERNAME');
      const password = this.configService.get<string>('ADMIN_PASSWORD');

      if (!username || !password) {
        this.logger.warn(
          'ADMIN_USERNAME and ADMIN_PASSWORD must be set in environment variables',
        );
        return;
      }

      const existingAdmin = await this.usersService.findByUsername(username);

      if (!existingAdmin) {
        await this.usersService.create({
          username,
          email: `${username}@example.com`,
          password,
          roles: [Role.ADMIN],
        });
        this.logger.log('Admin user created');
      } else {
        this.logger.log('Admin user already exists');
      }
    } catch (error) {
      this.logger.error('Failed to seed admin user', error);
    }
  }
}
