import { IsEmail, IsIn, IsOptional, IsString, MinLength, IsUUID } from 'class-validator';

export class UpdateUserDto {
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
  @IsIn(['ADMIN', 'PREFEITURA', 'SECRETARIA', 'TRIAGEM', 'EQUIPE_CAMPO', 'CIDADAO'])
  role?: string;

  @IsOptional()
  @IsUUID()
  municipalityId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
