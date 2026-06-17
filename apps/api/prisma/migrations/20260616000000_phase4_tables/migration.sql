-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "AlertLevel" AS ENUM ('INFO', 'WARNING', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE "IndicatorCache" (
    "id" TEXT NOT NULL,
    "indicatorType" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "filtersJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndicatorCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriorityCalculation" (
    "id" TEXT NOT NULL,
    "occurrenceId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "classification" TEXT NOT NULL,
    "detailsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriorityCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagerialAlert" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "level" "AlertLevel" NOT NULL,
    "departmentId" TEXT,
    "neighborhoodId" TEXT,
    "occurrenceId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagerialAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeatmapCache" (
    "id" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "categoriaId" TEXT,
    "latitudeCentro" DOUBLE PRECISION,
    "longitudeCentro" DOUBLE PRECISION,
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "periodoInicio" TIMESTAMP(3),
    "periodoFim" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeatmapCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OccurrenceRating" (
    "id" TEXT NOT NULL,
    "occurrenceId" TEXT NOT NULL,
    "citizenId" TEXT,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OccurrenceRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ServiceArea" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "latitudeCentro" DOUBLE PRECISION,
    "longitudeCentro" DOUBLE PRECISION,
    "raioMetros" INTEGER,
    "polygonJson" JSONB,
    "validacaoAtiva" BOOLEAN NOT NULL DEFAULT true,
    "bloquearForaDaArea" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorCache_cacheKey_key" ON "IndicatorCache"("cacheKey");

-- CreateIndex
CREATE UNIQUE INDEX "PriorityCalculation_occurrenceId_key" ON "PriorityCalculation"("occurrenceId");

-- CreateIndex
CREATE INDEX "ManagerialAlert_createdAt_idx" ON "ManagerialAlert"("createdAt");

-- CreateIndex
CREATE INDEX "ManagerialAlert_read_idx" ON "ManagerialAlert"("read");

-- CreateIndex
CREATE INDEX "HeatmapCache_bairro_idx" ON "HeatmapCache"("bairro");

-- CreateIndex
CREATE UNIQUE INDEX "OccurrenceRating_occurrenceId_key" ON "OccurrenceRating"("occurrenceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ServiceArea_ativo_idx" ON "ServiceArea"("ativo");

-- AddForeignKey
ALTER TABLE "PriorityCalculation" ADD CONSTRAINT "PriorityCalculation_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "Occurrence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerialAlert" ADD CONSTRAINT "ManagerialAlert_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerialAlert" ADD CONSTRAINT "ManagerialAlert_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerialAlert" ADD CONSTRAINT "ManagerialAlert_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "Occurrence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OccurrenceRating" ADD CONSTRAINT "OccurrenceRating_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "Occurrence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
