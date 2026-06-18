import { IsBoolean, IsString, Length, Matches } from 'class-validator';

export class CitizenAccessDto {
  @IsString()
  @Matches(/^\d{10,11}$/, { message: 'Celular inválido' })
  phone!: string;

  @IsString()
  @Length(11, 11, { message: 'CPF inválido' })
  @Matches(/^\d{11}$/, { message: 'CPF inválido' })
  cpf!: string;

  @IsBoolean()
  lgpdAccepted!: boolean;
}
