import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { AppointmentStatus } from '../entities/appointment.entity';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AppointmentResponseDto {
  @ApiProperty({ description: 'Appointment ID', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ description: 'User ID', example: 1 })
  @Expose()
  userId: number;

  @ApiProperty({ description: 'Appointment title', example: 'Medical Checkup' })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Appointment description',
    example: 'Annual health checkup with Dr. Smith',
  })
  @Expose()
  description: string;

  @ApiProperty({
    description: 'Date and time of appointment',
    example: '2024-12-25T10:30:00Z',
  })
  @Expose()
  dateTime: Date;

  @ApiProperty({
    description: 'Appointment status',
    example: 'scheduled',
  })
  @Expose()
  status: AppointmentStatus;

  @ApiProperty({ description: 'Creation date' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ description: 'User information', type: UserResponseDto })
  @Expose()
  user?: UserResponseDto;
}
