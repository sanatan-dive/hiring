CREATE TABLE IF NOT EXISTS "email_events" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "resend_id"    TEXT NOT NULL,
  "user_email"   TEXT NOT NULL,
  "event_type"   TEXT NOT NULL,
  "campaign"     TEXT,
  "metadata"     JSONB,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "email_events_user_email_idx" ON "email_events"("user_email");
CREATE INDEX IF NOT EXISTS "email_events_campaign_idx" ON "email_events"("campaign");
