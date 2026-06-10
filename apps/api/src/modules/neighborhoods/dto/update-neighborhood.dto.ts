import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateNeighborhoodDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  municipalityId?: string;
}
