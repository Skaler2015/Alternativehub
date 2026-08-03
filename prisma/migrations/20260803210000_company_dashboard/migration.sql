-- AlterTable: Company claim/ownership
ALTER TABLE "Company" ADD COLUMN     "claimedById" TEXT;
ALTER TABLE "Company" ADD COLUMN     "claimVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Company" ADD COLUMN     "claimedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Company_claimedById_idx" ON "Company"("claimedById");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "CompanyFollow" (
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyFollow_pkey" PRIMARY KEY ("userId","companyId")
);

-- CreateIndex
CREATE INDEX "CompanyFollow_companyId_idx" ON "CompanyFollow"("companyId");

-- AddForeignKey
ALTER TABLE "CompanyFollow" ADD CONSTRAINT "CompanyFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyFollow" ADD CONSTRAINT "CompanyFollow_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
