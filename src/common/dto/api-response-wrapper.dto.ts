import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiError {
  @ApiProperty({
    description: 'The name of the field that caused the error',
    example: 'email',
  })
  fieldName: string;

  @ApiProperty({
    description: 'Error message describing the issue',
    example: 'Email format is invalid',
  })
  message: string;

  constructor(fieldName: string, message: string) {
    this.fieldName = fieldName;
    this.message = message;
  }
}

export class ApiResponseWrapper<T = any> {
  @ApiProperty({
    description: 'Response message',
    example: 'Successful',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'List of errors if any occurred',
    type: [ApiError],
  })
  errors?: ApiError[];

  @ApiPropertyOptional({
    description: 'Payload data',
    type: Object,
    additionalProperties: true,
  })
  data?: T;

  constructor(message: string, data?: T, errors?: ApiError[]) {
    this.message = message;
    this.data = data;
    this.errors = errors;
  }

  static successfulResponse<T>(options: {
    data?: T;
    message?: string;
  }): ApiResponseWrapper<T> {
    const { data, message = 'Successful' } = options;
    return new ApiResponseWrapper<T>(message, data, undefined);
  }
}
