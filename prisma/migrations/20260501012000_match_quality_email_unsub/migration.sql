-- Add Phase-1 columns: hidden companies, email digest opt-out, content-hash dedup
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "hidden_companies"     TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "email_digest_enabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "unsubscribe_token"    TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_unsubscribe_token_key"
  ON "users"("unsubscribe_token");

ALTER TABLE "jobs"
  ADD COLUMN IF NOT EXISTS "content_hash" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "jobs_content_hash_key"
  ON "jobs"("content_hash");
