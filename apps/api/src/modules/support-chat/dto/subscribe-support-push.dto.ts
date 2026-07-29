import { IsString } from 'class-validator';

export class SubscribeSupportPushDto {
  @IsString()
  endpoint!: string;

  @IsString()
  p256dh!: string;

  @IsString()
  auth!: string;
}
