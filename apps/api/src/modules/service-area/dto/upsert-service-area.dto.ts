import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpsertServiceAreaDto {
  @IsString()
  nome!: string;

  @IsString()
  municipio!: string;

  @IsString()
  estado!: string;

  @IsOptional()
  @IsNumber()
  latitudeCentro?: number;

  @IsOptional()
  @IsNumber()
  longitudeCentro?: number;

  @IsOptional()
  @IsNumber()
  raioMetros?: number;

  @IsOptional()
  polygonJson?: unknown;

  @IsOptional()
  @IsBoolean()
  validacaoAtiva?: boolean;

  @IsOptional()
  @IsBoolean()
  bloquearForaDaArea?: boolean;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
