import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get hello message' })
  @ApiResponse({ status: 200, description: 'Returns a hello message.' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Get health status' })
  @ApiResponse({
    status: 200,
    description: 'Returns health status, timestamp, and environment.',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2024-06-01T12:00:00.000Z',
        environment: 'development',
      },
    },
  })
  getHealth() {
    return this.appService.getHealth();
  }
}
