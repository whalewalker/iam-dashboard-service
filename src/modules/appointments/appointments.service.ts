import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    private readonly usersService: UsersService,
  ) {}

  async create(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    // Verify user exists
    const user = await this.usersService.findOne(createAppointmentDto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate appointment date is in the future
    const appointmentDate = new Date(createAppointmentDto.dateTime);
    if (appointmentDate <= new Date()) {
      throw new BadRequestException('Appointment date must be in the future');
    }

    const appointment = this.appointmentsRepository.create({
      ...createAppointmentDto,
      dateTime: appointmentDate,
    });

    return this.appointmentsRepository.save(appointment);
  }

  async findAll(userId?: number): Promise<Appointment[]> {
    const queryBuilder = this.appointmentsRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.user', 'user')
      .orderBy('appointment.dateTime', 'ASC');

    if (userId) {
      queryBuilder.where('appointment.userId = :userId', { userId });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: number): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async update(
    id: number,
    updateAppointmentDto: Partial<CreateAppointmentDto>,
  ): Promise<void> {
    if (updateAppointmentDto.userId) {
      const user = await this.usersService.findOne(updateAppointmentDto.userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
    }

    if (updateAppointmentDto.dateTime) {
      const appointmentDate = new Date(updateAppointmentDto.dateTime);
      if (appointmentDate <= new Date()) {
        throw new BadRequestException('Appointment date must be in the future');
      }
      updateAppointmentDto.dateTime = appointmentDate.toISOString();
    }

    await this.appointmentsRepository.update(id, updateAppointmentDto);
  }

  async remove(id: number): Promise<void> {
    const appointment = await this.findOne(id);
    await this.appointmentsRepository.remove(appointment);
  }
}
