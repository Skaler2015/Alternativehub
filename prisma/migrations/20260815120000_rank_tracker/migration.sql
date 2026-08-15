-- SEO Rank Tracker (admin-only) — new enums, tables, indexes and foreign keys.

-- CreateEnum
CREATE TYPE "RankDevice" AS ENUM ('DESKTOP', 'MOBILE');
CREATE TYPE "RankJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRY');
CREATE TYPE "RankCheckStatus" AS ENUM ('FOUND', 'NOT_FOUND', 'ERROR');

-- CreateTable
CREATE TABLE "RankProject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "searchEngine" TEXT NOT NULL DEFAULT 'google',
    "country" TEXT NOT NULL DEFAULT 'in',
    "language" TEXT NOT NULL DEFAULT 'en',
    "device" "RankDevice" NOT NULL DEFAULT 'DESKTOP',
    "rankDepth" INTEGER NOT NULL DEFAULT 100,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "autoTracking" BOOLEAN NOT NULL DEFAULT false,
    "frequency" TEXT NOT NULL DEFAULT 'daily',
    "preferredHour" INTEGER NOT NULL DEFAULT 7,
    "intervalDays" INTEGER NOT NULL DEFAULT 1,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "historyRetentionDays" INTEGER NOT NULL DEFAULT 365,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RankProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankKeyword" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "targetUrl" TEXT,
    "groupName" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "currentRank" INTEGER,
    "previousRank" INTEGER,
    "rankingUrl" TEXT,
    "lastStatus" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RankKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankHistory" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "keywordId" TEXT NOT NULL,
    "rank" INTEGER,
    "rankingUrl" TEXT,
    "rankingTitle" TEXT,
    "allUrls" JSONB,
    "searchEngine" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "device" "RankDevice" NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "RankCheckStatus" NOT NULL,
    "errorMessage" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RankHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankJob" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "keywordId" TEXT NOT NULL,
    "status" "RankJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "nextRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RankJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankProviderConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "provider" TEXT NOT NULL DEFAULT 'none',
    "apiKeyEnc" TEXT,
    "apiSecretEnc" TEXT,
    "endpoint" TEXT,
    "requestsPerMinute" INTEGER NOT NULL DEFAULT 30,
    "batchSize" INTEGER NOT NULL DEFAULT 10,
    "requestDelayMs" INTEGER NOT NULL DEFAULT 1200,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "dailyQuota" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RankProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankApiUsage" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "success" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RankApiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankLog" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "keyword" TEXT,
    "provider" TEXT,
    "httpStatus" INTEGER,
    "attempt" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RankLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RankProject_active_idx" ON "RankProject"("active");
CREATE INDEX "RankKeyword_projectId_active_idx" ON "RankKeyword"("projectId", "active");
CREATE INDEX "RankKeyword_projectId_groupName_idx" ON "RankKeyword"("projectId", "groupName");
CREATE INDEX "RankKeyword_projectId_currentRank_idx" ON "RankKeyword"("projectId", "currentRank");
CREATE UNIQUE INDEX "RankKeyword_projectId_normalized_key" ON "RankKeyword"("projectId", "normalized");
CREATE INDEX "RankHistory_keywordId_checkedAt_idx" ON "RankHistory"("keywordId", "checkedAt");
CREATE INDEX "RankHistory_projectId_checkedAt_idx" ON "RankHistory"("projectId", "checkedAt");
CREATE INDEX "RankHistory_projectId_status_checkedAt_idx" ON "RankHistory"("projectId", "status", "checkedAt");
CREATE INDEX "RankJob_status_nextRunAt_idx" ON "RankJob"("status", "nextRunAt");
CREATE INDEX "RankJob_projectId_status_idx" ON "RankJob"("projectId", "status");
CREATE INDEX "RankJob_keywordId_status_idx" ON "RankJob"("keywordId", "status");
CREATE UNIQUE INDEX "RankApiUsage_date_key" ON "RankApiUsage"("date");
CREATE INDEX "RankLog_type_createdAt_idx" ON "RankLog"("type", "createdAt");
CREATE INDEX "RankLog_createdAt_idx" ON "RankLog"("createdAt");

-- AddForeignKey
ALTER TABLE "RankKeyword" ADD CONSTRAINT "RankKeyword_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "RankProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RankHistory" ADD CONSTRAINT "RankHistory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "RankProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RankHistory" ADD CONSTRAINT "RankHistory_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "RankKeyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RankJob" ADD CONSTRAINT "RankJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "RankProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RankJob" ADD CONSTRAINT "RankJob_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "RankKeyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;
