import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertServiceAreaDto } from './dto/upsert-service-area.dto';

@Injectable()
export class ServiceAreaService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.serviceArea.findMany({
      orderBy: [{ ativo: 'desc' }, { updatedAt: 'desc' }]
    });
  }

  findActive() {
    return this.prisma.serviceArea.findFirst({
      where: { ativo: true },
      orderBy: { updatedAt: 'desc' }
    });
  }

  upsert(id: string | undefined, data: UpsertServiceAreaDto) {
    const payload = {
      nome: data.nome,
      municipio: data.municipio,
      estado: data.estado,
      latitudeCentro: data.latitudeCentro,
      longitudeCentro: data.longitudeCentro,
      raioMetros: data.raioMetros ? Math.round(data.raioMetros) : undefined,
      polygonJson: data.polygonJson as Prisma.InputJsonValue | undefined,
      validacaoAtiva: data.validacaoAtiva ?? true,
      bloquearForaDaArea: data.bloquearForaDaArea ?? false,
      ativo: data.ativo ?? true
    };

    if (id) {
      return this.prisma.serviceArea.update({ where: { id }, data: payload });
    }

    return this.prisma.serviceArea.create({ data: payload });
  }

  async validate(input: { latitude?: number; longitude?: number; municipio?: string; estado?: string }) {
    const serviceArea = await this.findActive();
    if (!serviceArea || !serviceArea.validacaoAtiva) {
      return { valid: true, blocked: false, reason: 'ValidaÃ§Ã£o geogrÃ¡fica desativada.' };
    }

    const matchesMunicipality =
      !input.municipio || !input.estado ||
      serviceArea.municipio.toLowerCase() === input.municipio.toLowerCase() &&
      serviceArea.estado.toLowerCase() === input.estado.toLowerCase();

    const withinRadius =
      serviceArea.latitudeCentro != null &&
      serviceArea.longitudeCentro != null &&
      input.latitude != null &&
      input.longitude != null &&
      serviceArea.raioMetros != null
        ? this.distanceMeters(
            serviceArea.latitudeCentro,
            serviceArea.longitudeCentro,
            input.latitude,
            input.longitude
          ) <= serviceArea.raioMetros
        : true;

    const valid = matchesMunicipality && withinRadius;
    return {
      valid,
      blocked: !valid && serviceArea.bloquearForaDaArea,
      reason: valid ? 'Dentro da Ã¡rea atendida.' : 'Fora da Ã¡rea atendida.',
      serviceArea
    };
  }

  private distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const earthRadius = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
