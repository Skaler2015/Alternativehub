-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "employees" TEXT,
ADD COLUMN     "founder" TEXT,
ADD COLUMN     "funding" TEXT;

-- AlterTable
ALTER TABLE "Tool" ADD COLUMN     "apiAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "changelogUrl" TEXT,
ADD COLUMN     "docsUrl" TEXT,
ADD COLUMN     "gdpr" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasFreeTrial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "industries" TEXT[],
ADD COLUMN     "integrations" TEXT[],
ADD COLUMN     "launchYear" INTEGER,
ADD COLUMN     "soc2" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "useCases" TEXT[];
