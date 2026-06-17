-- CreateTable
CREATE TABLE "ServiceArea" (
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
CREATE INDEX "ServiceArea_ativo_idx" ON "ServiceArea"("ativo");
