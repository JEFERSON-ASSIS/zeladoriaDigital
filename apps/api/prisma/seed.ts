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

  const departmentNames = [
    'Secretaria Municipal de Agricultura, Meio Ambiente e Desenvolvimento Econômico',
    'Secretaria Municipal de Desenvolvimento Social e Cidadania',
    'Secretaria Municipal de Educação',
    'Secretaria Municipal de Esporte, Cultura, Turismo e Juventude',
    'Secretaria Municipal de Fazenda e Planejamento',
    'Secretaria Municipal de Gestão',
    'Secretaria Municipal de Obras e Serviços',
    'Secretaria Municipal de Saúde'
  ] as const;

  const departmentIds = [
    'dept-agricultura',
    'dept-desenvolvimento-social',
    'dept-educacao',
    'dept-esporte-cultura',
    'dept-fazenda',
    'dept-gestao',
    'dept-obras',
    'dept-saude'
  ] as const;

  const departments = await Promise.all(
    departmentNames.map((name, index) =>
      prisma.department.upsert({
        where: { id: departmentIds[index] },
        update: { name, municipalityId: municipality.id },
        create: {
          id: departmentIds[index],
          name,
          municipalityId: municipality.id
        }
      })
    )
  );

  const departmentObras = departments.find((item) => item.id === 'dept-obras') ?? departments[6];

  await prisma.occurrenceMovement.updateMany({
    where: { changedBy: { email: 'triagem@zeladoria.local' } },
    data: { changedById: null }
  });

  await prisma.user.deleteMany({
    where: { email: 'triagem@zeladoria.local' }
  });

  const [admin, prefeitura, secretaria, equipe, citizen] = await Promise.all([
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
        name: 'Admin secretaria — Obras',
        password: operatorPassword,
        municipalityId: municipality.id,
        role: UserRole.SECRETARIA,
        departmentId: departmentObras.id
      },
      create: {
        name: 'Admin secretaria — Obras',
        email: 'secretaria@zeladoria.local',
        password: operatorPassword,
        role: UserRole.SECRETARIA,
        municipalityId: municipality.id,
        departmentId: departmentObras.id
      }
    }),
    prisma.user.upsert({
      where: { email: 'equipe@zeladoria.local' },
      update: {
        name: 'Usuário secretaria — Obras',
        password: operatorPassword,
        municipalityId: municipality.id,
        role: UserRole.EQUIPE_CAMPO,
        departmentId: departmentObras.id
      },
      create: {
        name: 'Usuário secretaria — Obras',
        email: 'equipe@zeladoria.local',
        password: operatorPassword,
        role: UserRole.EQUIPE_CAMPO,
        municipalityId: municipality.id,
        departmentId: departmentObras.id
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
      departmentId: departmentObras.id
    },
    create: {
      id: 'team-infra-demo',
      name: 'Equipe Obras Demo',
      departmentId: departmentObras.id
    }
  });

  const occurrence = await prisma.occurrence.upsert({
    where: { protocol: 'OC-0001' },
    update: {
      latitude: -15.601,
      longitude: -56.097,
      status: OccurrenceStatus.ABERTO
    },
    create: {
      protocol: 'OC-0001',
      title: 'Buraco na rua principal',
      description: 'Buraco grande na via, com risco para veículos e pedestres.',
      address: 'Rua Principal, 100',
      latitude: -15.601,
      longitude: -56.097,
      status: OccurrenceStatus.ABERTO,
      priority: PriorityLevel.ALTA,
      citizenId: citizen.id,
      municipalityId: municipality.id,
      categoryId: category.id,
      neighborhoodId: neighborhood.id,
      suggestedDepartmentId: departmentObras.id,
      priorityScore: 82,
      aiSummary: 'Ocorrência prioritária por risco viário e alto impacto público.'
    }
  });

  await prisma.occurrence.upsert({
    where: { protocol: 'OC-0002' },
    update: {
      latitude: -15.608,
      longitude: -56.104,
      status: OccurrenceStatus.ABERTO
    },
    create: {
      protocol: 'OC-0002',
      title: 'Lâmpada queimada',
      description: 'Poste sem iluminação na praça central.',
      address: 'Praça Central, 45',
      latitude: -15.608,
      longitude: -56.104,
      status: OccurrenceStatus.ABERTO,
      priority: PriorityLevel.MEDIA,
      citizenId: citizen.id,
      municipalityId: municipality.id,
      categoryId: category.id,
      neighborhoodId: neighborhood.id,
      suggestedDepartmentId: departmentObras.id,
      priorityScore: 55
    }
  });

  await prisma.occurrence.upsert({
    where: { protocol: 'OC-0003' },
    update: {
      latitude: -15.595,
      longitude: -56.088,
      status: OccurrenceStatus.ENCAMINHADO
    },
    create: {
      protocol: 'OC-0003',
      title: 'Entulho em via pública',
      description: 'Entulho de construção obstruindo a calçada.',
      address: 'Av. Brasil, 220',
      latitude: -15.595,
      longitude: -56.088,
      status: OccurrenceStatus.ENCAMINHADO,
      priority: PriorityLevel.URGENTE,
      citizenId: citizen.id,
      municipalityId: municipality.id,
      categoryId: category.id,
      neighborhoodId: neighborhood.id,
      suggestedDepartmentId: departmentObras.id,
      priorityScore: 91
    }
  });

  await prisma.occurrence.upsert({
    where: { protocol: 'OC-0004' },
    update: {
      latitude: -15.612,
      longitude: -56.11,
      status: OccurrenceStatus.CONCLUIDO
    },
    create: {
      protocol: 'OC-0004',
      title: 'Poda de árvore concluída',
      description: 'Serviço finalizado e não deve aparecer no mapa operacional.',
      address: 'Rua das Palmeiras, 18',
      latitude: -15.612,
      longitude: -56.11,
      status: OccurrenceStatus.CONCLUIDO,
      priority: PriorityLevel.BAIXA,
      citizenId: citizen.id,
      municipalityId: municipality.id,
      categoryId: category.id,
      neighborhoodId: neighborhood.id,
      suggestedDepartmentId: departmentObras.id,
      priorityScore: 20
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
          changedById: prefeitura.id
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
      departmentId: departmentObras.id,
      fieldTeamId: fieldTeam.id,
      priority: PriorityLevel.ALTA,
      slaHours: 48,
      plannedAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      teamNote: 'Ordem criada automaticamente para validar o fluxo operacional.'
    },
    create: {
      occurrenceId: occurrence.id,
      departmentId: departmentObras.id,
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

  await prisma.serviceArea.upsert({
    where: { id: 'service-area-demo' },
    update: {},
    create: {
      id: 'service-area-demo',
      nome: 'Município Demo',
      municipio: 'Cuiabá',
      estado: 'MT',
      latitudeCentro: -15.601,
      longitudeCentro: -56.097,
      raioMetros: 15000,
      validacaoAtiva: true,
      bloquearForaDaArea: false,
      ativo: true
    }
  });

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
