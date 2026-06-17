import { IsIn, IsString, Length, Matches } from 'class-validator';

export class SubscribeSchedulingReminderDto {
  @IsString()
  @Length(11, 11)
  @Matches(/^\d{11}$/)
  cpf!: string;

  @IsIn(['psf1', 'psf2', 'psf3'])
  psfId!: string;

  @IsString()
  endpoint!: string;

  @IsString()
  p256dh!: string;

  @IsString()
  auth!: string;
}
