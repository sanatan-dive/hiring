-- Phase B1 — application reminders + vector index

ALTER TABLE "applications"
  ADD COLUMN IF NOT EXISTS "last_reminder_at" TIMESTAMP(3);

-- IVFFlat index on jobs.embedding for fast cosine similarity at scale.
-- Without this, vector search tablescans past ~10K jobs.
-- Skipped if pgvector ivfflat isn't available (e.g. Neon free tier on
-- specific Postgres versions); harmless to retry later.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'jobs_embedding_idx'
  ) THEN
    BEGIN
      EXECUTE 'CREATE INDEX jobs_embedding_idx ON jobs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped IVFFlat index: %', SQLERRM;
    END;
  END IF;
END$$;
