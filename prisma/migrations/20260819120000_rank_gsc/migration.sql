-- Google Search Console config for the rank tracker (kept separate from SERP rank).

-- CreateTable
CREATE TABLE "RankGscConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "siteUrl" TEXT,
    "serviceAccountEnc" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RankGscConfig_pkey" PRIMARY KEY ("id")
);
