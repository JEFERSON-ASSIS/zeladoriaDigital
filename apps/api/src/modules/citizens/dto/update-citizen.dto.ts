import { IsEmail, IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { HEALTH_UNIT_PSF_IDS } from '@zeladoria/shared';

export class UpdateCitizenDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsUUID()
  municipalityId?: string;

  @IsOptional()
  @IsString()
  @IsIn([...HEALTH_UNIT_PSF_IDS])
  healthUnitPsfId?: string | null;
}
