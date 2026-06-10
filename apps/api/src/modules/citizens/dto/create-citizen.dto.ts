import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateCitizenDto {
  @IsString()
  name!: string;

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
}
