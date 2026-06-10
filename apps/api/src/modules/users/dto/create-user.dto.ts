import { IsEmail, IsIn, IsOptional, IsString, MinLength, IsUUID } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsIn(['ADMIN', 'PREFEITURA', 'SECRETARIA', 'TRIAGEM', 'EQUIPE_CAMPO', 'CIDADAO'])
  role!: string;

  @IsOptional()
  @IsUUID()
  municipalityId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
