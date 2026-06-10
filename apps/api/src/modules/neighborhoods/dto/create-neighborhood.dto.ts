import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateNeighborhoodDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsUUID()
  municipalityId?: string;
}
