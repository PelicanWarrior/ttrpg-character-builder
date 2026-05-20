BEGIN;

-- Drop existing table and policies if they exist
DROP TABLE IF EXISTS "Solo_Adventures" CASCADE;

-- Create Solo_Adventures table with user_id
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

-- Allow all authenticated users to read and manage adventures
-- (Row filtering is handled by the application layer)
CREATE POLICY "solo_adventures_all" ON "Solo_Adventures"
  FOR ALL
  USING (TRUE);

COMMIT;
