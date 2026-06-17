import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { TransparencyService } from './transparency.service';

@Public()
@Controller('transparency')
export class TransparencyController {
  constructor(private readonly transparencyService: TransparencyService) {}

  @Get()
  summary(@Query() query: { periodStart?: string; periodEnd?: string; categoryId?: string; neighborhoodId?: string; status?: string; priority?: string }) {
    return this.transparencyService.summary(query);
  }
}
