import { IsBoolean, IsIn, IsOptional, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';
import { HEALTH_UNIT_PSF_IDS } from '@zeladoria/shared';

export class CitizenPhoneLookupDto {
  @IsString()
  @Matches(/^\d{10,11}$/, { message: 'Celular inválido' })
  phone!: string;
}

export class CitizenAccessDto {
  @IsString()
  @Matches(/^\d{10,11}$/, { message: 'Celular inválido' })
  phone!: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Nome completo inválido' })
  @MaxLength(120, { message: 'Nome completo inválido' })
  name?: string;

  @IsOptional()
  @IsString()
  @Length(11, 11, { message: 'CPF inválido' })
  @Matches(/^\d{11}$/, { message: 'CPF inválido' })
  cpf?: string;

  @IsOptional()
  @IsBoolean()
  lgpdAccepted?: boolean;

  @IsOptional()
  @IsString()
  @IsIn([...HEALTH_UNIT_PSF_IDS], { message: 'Unidade de saúde inválida' })
  healthUnitPsfId?: string;
}
