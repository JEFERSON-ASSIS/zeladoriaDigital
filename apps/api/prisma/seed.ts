import bcrypt from 'bcryptjs';
import { OccurrenceStatus, PrismaClient, PriorityLevel, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const municipality = await prisma.municipality.upsert({
    where: { code: '0001' },
    update: {},
    create: {
      name: 'Município Demo',
      code: '0001'
    }
  });

  const adminPassword = await bcrypt.hash('secret123', 10);
  const operatorPassword = await bcrypt.hash('secret123', 10);
  const citizenPassword = await bcrypt.hash('secret123', 10);

  const [admin, prefeitura, secretaria, triagem, equipe, citizen] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@zeladoria.local' },
      update: {
        password: adminPassword,
        municipalityId: municipality.id,
        role: UserRole.ADMIN
      },
      create: {
        name: 'Administrador',
        email: 'admin@zeladoria.local',
        password: adminPassword,
        role: UserRole.ADMIN,
        municipalityId: municipality.id
      }
    }),
    prisma.user.upsert({
      where: { email: 'prefeitura@zeladoria.local' },
      update: {
        password: operatorPassword,
        municipalityId: municipality.id,
        role: UserRole.PREFEITURA
      },
      create: {
        name: 'Atendimento Prefeitura',
        email: 'prefeitura@zeladoria.local',
        password: operatorPassword,
        role: UserRole.PREFEITURA,
        municipalityId: municipality.id
      }
    }),
    prisma.user.upsert({
      where: { email: 'secretaria@zeladoria.local' },
      update: {
        password: operatorPassword,
        municipalityId: municipality.id,
        role: UserRole.SECRETARIA
      },
      create: {
        name: 'Secretaria Demo',
        email: 'secretaria@zeladoria.local',
        password: operatorPassword,
        role: UserRole.SECRETARIA,
        municipalityId: municipality.id
      }
    }),
    prisma.user.upsert({
      where: { email: 'triagem@zeladoria.local' },
      update: {
        password: operatorPassword,
        municipalityId: municipality.id,
        role: UserRole.TRIAGEM
      },
      create: {
        name: 'Triagem Demo',
        email: 'triagem@zeladoria.local',
        password: operatorPassword,
        role: UserRole.TRIAGEM,
        municipalityId: municipality.id
      }
    }),
    prisma.user.upsert({
      where: { email: 'equipe@zeladoria.local' },
      update: {
        password: operatorPassword,
        municipalityId: municipality.id,
        role: UserRole.EQUIPE_CAMPO
      },
      create: {
        name: 'Equipe de Campo',
        email: 'equipe@zeladoria.local',
        password: operatorPassword,
        role: UserRole.EQUIPE_CAMPO,
        municipalityId: municipality.id
      }
    }),
    prisma.citizen.upsert({
      where: { email: 'cidadao@zeladoria.local' },
      update: {
        password: citizenPassword,
        municipalityId: municipality.id
      },
      create: {
        name: 'Cidadão Demo',
        email: 'cidadao@zeladoria.local',
        password: citizenPassword,
        phone: '+5566999999999',
        municipalityId: municipality.id
      }
    })
  ]);

  const category =
    (await prisma.category.findFirst({ where: { name: 'Infraestrutura' } })) ??
    (await prisma.category.create({
      data: {
        name: 'Infraestrutura',
        description: 'Demandas de buraco, asfalto, drenagem e calçadas.'
      }
    }));

  const department = await prisma.department.upsert({
    where: { id: 'dept-infra-demo' },
    update: {},
    create: {
      id: 'dept-infra-demo',
      name: 'Secretaria de Infraestrutura',
      municipalityId: municipality.id
    }
  });

  const neighborhood = await prisma.neighborhood.upsert({
    where: { id: 'bairro-centro-demo' },
    update: {},
    create: {
      id: 'bairro-centro-demo',
      name: 'Centro',
      municipalityId: municipality.id
    }
  });

  const fieldTeam = await prisma.fieldTeam.upsert({
    where: { id: 'team-infra-demo' },
    update: {
      departmentId: department.id
    },
    create: {
      id: 'team-infra-demo',
      name: 'Equipe Infra Demo',
      departmentId: department.id
    }
  });

  const occurrence = await prisma.occurrence.upsert({
    where: { protocol: 'OC-0001' },
    update: {},
    create: {
      protocol: 'OC-0001',
      title: 'Buraco na rua principal',
      description: 'Buraco grande na via, com risco para veículos e pedestres.',
      address: 'Rua Principal, 100',
      status: OccurrenceStatus.ABERTO,
      priority: PriorityLevel.ALTA,
      citizenId: citizen.id,
      municipalityId: municipality.id,
      categoryId: category.id,
      neighborhoodId: neighborhood.id,
      suggestedDepartmentId: department.id,
      priorityScore: 82,
      aiSummary: 'Ocorrência prioritária por risco viário e alto impacto público.'
    }
  });

  await prisma.occurrenceMovement.upsert({
    where: { id: 'movement-demo-1' },
    update: {},
    create: {
      id: 'movement-demo-1',
      occurrenceId: occurrence.id,
      fromStatus: null,
      toStatus: OccurrenceStatus.ABERTO,
      note: 'Ocorrência criada pelo seed.',
      changedById: admin.id
    }
  });

  const forwardedMovement = await prisma.occurrenceMovement.findFirst({
    where: {
      occurrenceId: occurrence.id,
      toStatus: OccurrenceStatus.ENCAMINHADO
    }
  });

  if (!forwardedMovement) {
    await prisma.occurrenceMovement.createMany({
      data: [
        {
          occurrenceId: occurrence.id,
          fromStatus: OccurrenceStatus.ABERTO,
          toStatus: OccurrenceStatus.ENCAMINHADO,
          note: 'Encaminhamento automático de validação.',
          changedById: triagem.id
        },
        {
          occurrenceId: occurrence.id,
          fromStatus: OccurrenceStatus.ENCAMINHADO,
          toStatus: OccurrenceStatus.EM_EXECUCAO,
          note: 'Equipe acionada para execução.',
          changedById: secretaria.id
        }
      ]
    });
  }

  await prisma.serviceOrder.upsert({
    where: { occurrenceId: occurrence.id },
    update: {
      departmentId: department.id,
      fieldTeamId: fieldTeam.id,
      priority: PriorityLevel.ALTA,
      slaHours: 48,
      plannedAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      teamNote: 'Ordem criada automaticamente para validar o fluxo operacional.'
    },
    create: {
      occurrenceId: occurrence.id,
      departmentId: department.id,
      fieldTeamId: fieldTeam.id,
      priority: PriorityLevel.ALTA,
      slaHours: 48,
      plannedAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      teamNote: 'Ordem criada automaticamente para validar o fluxo operacional.'
    }
  });

  const existingNotification = await prisma.notification.findFirst({
    where: {
      userId: admin.id,
      title: 'Seed concluído'
    }
  });

  if (!existingNotification) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: 'Seed concluído',
        body: 'Dados mínimos criados para teste do sistema.'
      }
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SEED_COMPLETED',
      entity: 'SYSTEM',
      entityId: occurrence.id,
      metadata: {
        protocol: occurrence.protocol,
        municipality: municipality.code
      }
    }
  });

  console.log('Seed concluído com sucesso.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
