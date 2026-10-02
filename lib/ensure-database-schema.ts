import { prisma } from '@/lib/db';

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" TEXT DEFAULT 'user',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User" ("email")`,

  `CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account" ("provider", "providerAccountId")`,

  `CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session" ("sessionToken")`,

  `CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken" ("token")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken" ("identifier", "token")`,

  `CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "energyInvested" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "objectives" JSONB,
    "nextSteps" JSONB,
    "resources" JSONB,
    "relatedPeople" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "impactLevel" DOUBLE PRECISION,
    "satisfactionLevel" DOUBLE PRECISION,
    "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "monthlyRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "lastTransactionAt" TIMESTAMP(3),
    "activeAgents" INTEGER NOT NULL DEFAULT 0,
    "agentMode" TEXT NOT NULL DEFAULT 'auto',
    "marketSentiment" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "userActivityLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "transactionsPerHour" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Project_userId_status_idx" ON "Project" ("userId", "status")`,

  `CREATE TABLE IF NOT EXISTS "Relationship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "relationshipType" TEXT NOT NULL,
    "connectionQuality" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "energyExchange" TEXT NOT NULL DEFAULT 'balanced',
    "contactFrequency" TEXT,
    "lastInteraction" TIMESTAMP(3),
    "notes" TEXT,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "importance" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Relationship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Relationship_userId_relationshipType_idx" ON "Relationship" ("userId", "relationshipType")`,

  `CREATE TABLE IF NOT EXISTS "Manifestation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "timeframe" TEXT NOT NULL,
    "energyRequired" DOUBLE PRECISION NOT NULL,
    "impactLevel" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'intention',
    "manifestationStage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "intendedBy" TIMESTAMP(3),
    "actionStarted" TIMESTAMP(3),
    "manifestedDate" TIMESTAMP(3),
    "specificGoals" JSONB,
    "actionSteps" JSONB,
    "resources" JSONB,
    "obstacles" JSONB,
    "evidenceLog" JSONB,
    "gratitudeLogs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Manifestation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Manifestation_userId_status_idx" ON "Manifestation" ("userId", "status")`,

  `CREATE TABLE IF NOT EXISTS "DailyEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emotionalState" DOUBLE PRECISION NOT NULL,
    "energyLevel" DOUBLE PRECISION NOT NULL,
    "coherenceLevel" DOUBLE PRECISION,
    "sleepQuality" DOUBLE PRECISION,
    "significantEvents" TEXT,
    "mainThoughts" TEXT,
    "events" JSONB,
    "decisions" JSONB,
    "plannedActions" JSONB,
    "actualActions" JSONB,
    "alignmentScore" DOUBLE PRECISION,
    "observations" TEXT,
    "insights" TEXT,
    "synchronicities" TEXT,
    "synchronicitiesData" JSONB,
    "reflectiveQuestions" JSONB,
    "aiInsights" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "DailyEntry_userId_date_idx" ON "DailyEntry" ("userId", "date")`,

  `CREATE TABLE IF NOT EXISTS "Intention" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'daily',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "totalExpectedDays" INTEGER,
    "totalFulfilledDays" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Intention_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Intention_userId_status_idx" ON "Intention" ("userId", "status")`,
  `CREATE INDEX IF NOT EXISTS "Intention_userId_frequency_idx" ON "Intention" ("userId", "frequency")`,

  `CREATE TABLE IF NOT EXISTS "Pattern" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "patternType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "frequency" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "impact" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "firstDetected" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastObserved" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "supportingData" JSONB,
    "suggestions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pattern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Pattern_userId_patternType_idx" ON "Pattern" ("userId", "patternType")`,
  `CREATE INDEX IF NOT EXISTS "Pattern_userId_lastObserved_idx" ON "Pattern" ("userId", "lastObserved")`,

  `CREATE TABLE IF NOT EXISTS "UserMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overallCoherence" DOUBLE PRECISION NOT NULL,
    "emotionalCoherence" DOUBLE PRECISION NOT NULL,
    "logicalCoherence" DOUBLE PRECISION NOT NULL,
    "energeticCoherence" DOUBLE PRECISION NOT NULL,
    "dominantPatterns" JSONB,
    "energyCycles" JSONB,
    "decisionPatterns" JSONB,
    "synchronicityCount" INTEGER NOT NULL DEFAULT 0,
    "synchronicityScore" DOUBLE PRECISION,
    "manifestationRate" DOUBLE PRECISION,
    "projectCompletion" DOUBLE PRECISION,
    "relationshipHealth" DOUBLE PRECISION,
    "weeklyTrend" TEXT,
    "monthlyPattern" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserMetrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "UserMetrics_userId_date_key" ON "UserMetrics" ("userId", "date")`,
  `CREATE INDEX IF NOT EXISTS "UserMetrics_userId_date_idx" ON "UserMetrics" ("userId", "date")`,

  `CREATE TABLE IF NOT EXISTS "NodeSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "nodeType" TEXT NOT NULL,
    "nodeLabel" TEXT NOT NULL,
    "energy" DOUBLE PRECISION NOT NULL,
    "coherence" DOUBLE PRECISION NOT NULL,
    "connections" INTEGER NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggerReason" TEXT,
    "statusLabel" TEXT,
    "recommendation" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NodeSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "NodeSnapshot_userId_nodeId_idx" ON "NodeSnapshot" ("userId", "nodeId")`,
  `CREATE INDEX IF NOT EXISTS "NodeSnapshot_userId_nodeType_idx" ON "NodeSnapshot" ("userId", "nodeType")`,
  `CREATE INDEX IF NOT EXISTS "NodeSnapshot_userId_createdAt_idx" ON "NodeSnapshot" ("userId", "createdAt")`,

  `CREATE TABLE IF NOT EXISTS "BoardSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BoardSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "BoardSnapshot_userId_capturedAt_idx" ON "BoardSnapshot" ("userId", "capturedAt")`,
  `CREATE INDEX IF NOT EXISTS "BoardSnapshot_userId_schemaVersion_idx" ON "BoardSnapshot" ("userId", "schemaVersion")`,

  `CREATE TABLE IF NOT EXISTS "ExternalProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectType" TEXT NOT NULL DEFAULT 'ai_agent',
    "apiKey" TEXT NOT NULL,
    "apiKeyPrefix" TEXT NOT NULL,
    "webhookUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "agentMode" TEXT NOT NULL DEFAULT 'auto',
    "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "monthlyRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "lastTransactionAt" TIMESTAMP(3),
    "transactionsCount" INTEGER NOT NULL DEFAULT 0,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExternalProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ExternalProject_apiKey_key" ON "ExternalProject" ("apiKey")`,
  `CREATE INDEX IF NOT EXISTS "ExternalProject_userId_status_idx" ON "ExternalProject" ("userId", "status")`,
  `CREATE INDEX IF NOT EXISTS "ExternalProject_apiKey_idx" ON "ExternalProject" ("apiKey")`
];

let schemaReady: Promise<void> | null = null;

export async function ensureDatabaseSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      for (const statement of schemaStatements) {
        await prisma.$executeRawUnsafe(statement);
      }
    })();
  }
  return schemaReady;
}

export function isMissingTableError(error: unknown) {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: string }).code === 'P2021'
  );
}
