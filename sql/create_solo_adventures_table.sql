BEGIN;

-- Create Solo_Adventures table
CREATE TABLE IF NOT EXISTS "Solo_Adventures" (
  id BIGSERIAL PRIMARY KEY,
  ttrpg_id BIGINT NOT NULL REFERENCES "TTRPGs"(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
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

-- Allow users to view their own solo adventures
CREATE POLICY "solo_adventures_select_own" ON "Solo_Adventures"
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own solo adventures
CREATE POLICY "solo_adventures_insert_own" ON "Solo_Adventures"
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own solo adventures
CREATE POLICY "solo_adventures_update_own" ON "Solo_Adventures"
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own solo adventures
CREATE POLICY "solo_adventures_delete_own" ON "Solo_Adventures"
  FOR DELETE
  USING (auth.uid() = user_id);

COMMIT;
