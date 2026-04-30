-- Phase A: timezone-aware digest, slack delivery, streaks, referrals, watched companies

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "timezone"             TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS "slack_webhook_url"    TEXT,
  ADD COLUMN IF NOT EXISTS "last_active_at"       TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "daily_streak"         INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "longest_streak"       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "referral_code"        TEXT,
  ADD COLUMN IF NOT EXISTS "referred_by_user_id"  TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_referral_code_key" ON "users"("referral_code");

CREATE TABLE IF NOT EXISTS "watched_companies" (
  "id"               TEXT NOT NULL PRIMARY KEY,
  "userId"           TEXT NOT NULL,
  "name"             TEXT NOT NULL,
  "normalized"       TEXT NOT NULL,
  "careers_url"      TEXT,
  "last_checked_at"  TIMESTAMP(3),
  "last_job_ids"     TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "watched_companies_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "watched_companies_userId_normalized_key"
  ON "watched_companies"("userId", "normalized");

CREATE TABLE IF NOT EXISTS "referrals" (
  "id"                 TEXT NOT NULL PRIMARY KEY,
  "referrer_user_id"   TEXT NOT NULL,
  "referee_user_id"    TEXT,
  "referee_email"      TEXT,
  "status"             TEXT NOT NULL DEFAULT 'pending',
  "reward_granted"     BOOLEAN NOT NULL DEFAULT false,
  "signed_up_at"       TIMESTAMP(3),
  "upgraded_at"        TIMESTAMP(3),
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "referrals_referrer_user_id_fkey"
    FOREIGN KEY ("referrer_user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "referrals_referee_user_id_key" ON "referrals"("referee_user_id");
CREATE INDEX IF NOT EXISTS "referrals_referrer_user_id_idx" ON "referrals"("referrer_user_id");
