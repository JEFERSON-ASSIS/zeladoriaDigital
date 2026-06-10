import { IsIn, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOccurrenceDto {
  @IsString()
  description!: string;

  @IsString()
  address!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsIn(['ABERTO', 'EM_ANALISE', 'ENCAMINHADO', 'EM_EXECUCAO', 'CONCLUIDO', 'CANCELADO'])
  status?: string;

  @IsOptional()
  @IsIn(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'])
  priority?: string;

  @IsOptional()
  @IsUUID()
  citizenId?: string;

  @IsOptional()
  @IsUUID()
  municipalityId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  neighborhoodId?: string;

  @IsOptional()
  @IsUUID()
  suggestedDepartmentId?: string;
}
