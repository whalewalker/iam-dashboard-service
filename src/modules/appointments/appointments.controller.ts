import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentResponseDto } from './dto/appointment-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiResponseWrapper } from '../../common/dto/api-response-wrapper.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({
    status: 201,
    description: 'Appointment created successfully',
    type: AppointmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async create(
    @Body() createAppointmentDto: CreateAppointmentDto,
  ): Promise<ApiResponseWrapper<AppointmentResponseDto>> {
    const response =
      await this.appointmentsService.create(createAppointmentDto);
    return ApiResponseWrapper.successfulResponse({
      data: response,
      message: 'Appointment created successfully',
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all appointments' })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Filter appointments by user ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'List of appointments',
    type: [AppointmentResponseDto],
  })
  async findAll(
    @CurrentUser() user: User,
  ): Promise<ApiResponseWrapper<AppointmentResponseDto[]>> {
    const response = await this.appointmentsService.findAll(user.id);
    return ApiResponseWrapper.successfulResponse({
      data: response,
      message: 'Appointments retrieved successfully',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiParam({ name: 'id', description: 'Appointment ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Appointment found',
    type: AppointmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseWrapper<AppointmentResponseDto>> {
    const response = await this.appointmentsService.findOne(id);
    return ApiResponseWrapper.successfulResponse({
      data: response,
      message: 'Appointment retrieved successfully',
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update appointment' })
  @ApiParam({ name: 'id', description: 'Appointment ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Appointment updated successfully',
    type: AppointmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAppointmentDto: Partial<CreateAppointmentDto>,
  ): Promise<ApiResponseWrapper<void>> {
    await this.appointmentsService.update(id, updateAppointmentDto);
    return ApiResponseWrapper.successfulResponse({
      message: 'Appointment updated successfully',
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete appointment' })
  @ApiParam({ name: 'id', description: 'Appointment ID', type: 'number' })
  @ApiResponse({ status: 204, description: 'Appointment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseWrapper<void>> {
    await this.appointmentsService.remove(id);
    return ApiResponseWrapper.successfulResponse({
      message: 'Appointment deleted successfully',
    });
  }
}
