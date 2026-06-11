import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      // Keep the app bootable in local dev when Postgres is unavailable.
      console.warn('Prisma connection unavailable, continuing with fallback auth path.');
      console.warn(error);
    }
  }
}
