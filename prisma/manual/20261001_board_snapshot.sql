-- Manual local migration for Memory 4D.
-- Apply only in local/staging when the BoardSnapshot table does not exist.

CREATE TABLE "BoardSnapshot" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "schemaVersion" INTEGER NOT NULL DEFAULT 1,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BoardSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BoardSnapshot_userId_capturedAt_idx" ON "BoardSnapshot"("userId", "capturedAt");
CREATE INDEX "BoardSnapshot_userId_schemaVersion_idx" ON "BoardSnapshot"("userId", "schemaVersion");

ALTER TABLE "BoardSnapshot"
  ADD CONSTRAINT "BoardSnapshot_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
