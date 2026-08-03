-- AlterTable: Review v2 fields
ALTER TABLE "Review" ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Review" ADD COLUMN     "useCase" TEXT;
ALTER TABLE "Review" ADD COLUMN     "industry" TEXT;
ALTER TABLE "Review" ADD COLUMN     "companySize" TEXT;
ALTER TABLE "Review" ADD COLUMN     "reply" TEXT;
ALTER TABLE "Review" ADD COLUMN     "repliedAt" TIMESTAMP(3);
ALTER TABLE "Review" ADD COLUMN     "repliedById" TEXT;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_repliedById_fkey" FOREIGN KEY ("repliedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
