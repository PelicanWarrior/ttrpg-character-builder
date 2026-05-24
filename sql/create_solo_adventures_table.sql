BEGIN;

-- Create Solo_Adventures table
CREATE TABLE IF NOT EXISTS "Solo_Adventures" (
  id BIGSERIAL PRIMARY KEY,
  ttrpg_id BIGINT NOT NULL REFERENCES "TTRPGs"(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES "user"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS solo_adventures_ttrpg_id_idx ON "Solo_Adventures"(ttrpg_id);
CREATE INDEX IF NOT EXISTS solo_adventures_user_id_idx ON "Solo_Adventures"(user_id);
CREATE INDEX IF NOT EXISTS solo_adventures_ttrpg_user_idx ON "Solo_Adventures"(ttrpg_id, user_id);

-- Enable RLS
ALTER TABLE "Solo_Adventures" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "solo_adventures_all" ON "Solo_Adventures";
DROP POLICY IF EXISTS "solo_adventures_select_own" ON "Solo_Adventures";
DROP POLICY IF EXISTS "solo_adventures_insert_own" ON "Solo_Adventures";
DROP POLICY IF EXISTS "solo_adventures_update_own" ON "Solo_Adventures";
DROP POLICY IF EXISTS "solo_adventures_delete_own" ON "Solo_Adventures";

-- App code applies the row-level filter by user_id and ttrpg_id.
CREATE POLICY "solo_adventures_all" ON "Solo_Adventures"
  FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

COMMIT;
