-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "discountLabel" TEXT NOT NULL,
    "couponCode" TEXT,
    "url" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Deal_active_endsAt_idx" ON "Deal"("active", "endsAt");

-- CreateIndex
CREATE INDEX "Deal_featured_active_idx" ON "Deal"("featured", "active");

-- CreateIndex
CREATE INDEX "Deal_toolId_idx" ON "Deal"("toolId");

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
