import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
  ValidationError,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateUserDto } from 'src/users/dtos/update-user.dto';

@Injectable()
export class UpdateUserValidationPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    const object = plainToInstance(UpdateUserDto, value, {
      enableImplicitConversion: true,
    });

    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new BadRequestException({
        message: this.formatErrors(errors),
      });
    }

    if (
      (object.password && !object.confirmPassword) ||
      (!object.password && object.confirmPassword)
    ) {
      throw new BadRequestException({
        message: ['Please provide both password and confirm password'],
      });
    }

    if (object.password !== object.confirmPassword) {
      throw new BadRequestException({
        message: ['Password and confirm password do not match'],
      });
    }

    return object;
  }

  private formatErrors(errors: ValidationError[]): string[] {
    const messages: string[] = [];

    errors.forEach((err) => {
      const constraints = err.constraints ?? {};
      Object.values(constraints).forEach((message: string) => {
        messages.push(message);
      });
    });
    return messages;
  }
}
