import { IsBoolean, IsOptional, IsString, Length, Matches } from 'class-validator';

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
  @Length(11, 11, { message: 'CPF inválido' })
  @Matches(/^\d{11}$/, { message: 'CPF inválido' })
  cpf?: string;

  @IsOptional()
  @IsBoolean()
  lgpdAccepted?: boolean;
}
