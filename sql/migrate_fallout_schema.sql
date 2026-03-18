-- Fallout system schema for character creator + overview

DO $$
BEGIN
  -- Preserve existing Fallout data by renaming legacy table names in place.
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'F_player_characters'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Fa_player_characters'
  ) THEN
    ALTER TABLE "F_player_characters" RENAME TO "Fa_player_characters";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'FL_races'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Fa_races'
  ) THEN
    ALTER TABLE "FL_races" RENAME TO "Fa_races";
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Fa_races" (
  "id" BIGSERIAL PRIMARY KEY,
  "race_name" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "special_bonus" JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS "Fa_player_characters" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_number" BIGINT,
  "name" TEXT NOT NULL,
  "race" TEXT,
  "level" INTEGER NOT NULL DEFAULT 1 CHECK ("level" >= 1),
  "exp" INTEGER NOT NULL DEFAULT 0 CHECK ("exp" >= 0),
  "special" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "skills" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "tag_skills" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "backstory" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "Fa_player_characters"
  ADD COLUMN IF NOT EXISTS "backstory" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE c.conname = 'f_player_characters_user_fk'
      AND t.relname = 'Fa_player_characters'
  ) THEN
    ALTER TABLE "Fa_player_characters"
      RENAME CONSTRAINT f_player_characters_user_fk TO fa_player_characters_user_fk;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'user'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'fa_player_characters_user_fk'
    ) THEN
      ALTER TABLE "Fa_player_characters"
        ADD CONSTRAINT fa_player_characters_user_fk
        FOREIGN KEY ("user_number") REFERENCES "user" ("id") ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.idx_f_player_characters_user') IS NOT NULL
    AND to_regclass('public.idx_fa_player_characters_user') IS NULL THEN
    ALTER INDEX idx_f_player_characters_user RENAME TO idx_fa_player_characters_user;
  END IF;

  IF to_regclass('public.idx_f_player_characters_name') IS NOT NULL
    AND to_regclass('public.idx_fa_player_characters_name') IS NULL THEN
    ALTER INDEX idx_f_player_characters_name RENAME TO idx_fa_player_characters_name;
  END IF;

  IF to_regclass('public.idx_f_player_characters_race') IS NOT NULL
    AND to_regclass('public.idx_fa_player_characters_race') IS NULL THEN
    ALTER INDEX idx_f_player_characters_race RENAME TO idx_fa_player_characters_race;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_fa_player_characters_user ON "Fa_player_characters" ("user_number");
CREATE INDEX IF NOT EXISTS idx_fa_player_characters_name ON "Fa_player_characters" ("name");
CREATE INDEX IF NOT EXISTS idx_fa_player_characters_race ON "Fa_player_characters" ("race");

INSERT INTO "Fa_races" ("race_name", "description") VALUES
  ('Human', 'Flexible and adaptable wasteland survivors.'),
  ('Ghoul', 'Radiation-scarred survivors with unique resilience.'),
  ('Super Mutant', 'Massive, durable, and physically powerful mutants.'),
  ('Mister Handy', 'Utility robot chassis with mechanical specialization.')
ON CONFLICT ("race_name") DO NOTHING;

-- =====================================================
-- Fallout Campaign tables
-- =====================================================

CREATE TABLE IF NOT EXISTS "Fa_campaign" (
  "id"            BIGSERIAL PRIMARY KEY,
  "Name"          TEXT NOT NULL,
  "description"   TEXT,
  "playerID"      BIGINT,
  "campaign_code" TEXT UNIQUE,
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fa_campaign_player ON "Fa_campaign" ("playerID");

-- Add campaign_joined FK column to player characters
ALTER TABLE "Fa_player_characters"
  ADD COLUMN IF NOT EXISTS "campaign_joined" BIGINT REFERENCES "Fa_campaign" ("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_fa_player_characters_campaign ON "Fa_player_characters" ("campaign_joined");

CREATE TABLE IF NOT EXISTS "Fa_campaign_NPC" (
  "id"          BIGSERIAL PRIMARY KEY,
  "campaignID"  BIGINT REFERENCES "Fa_campaign" ("id") ON DELETE CASCADE,
  "Name"        TEXT NOT NULL,
  "Description" TEXT,
  "race"        TEXT,
  "special"     JSONB NOT NULL DEFAULT '{}'::jsonb,
  "skills"      JSONB NOT NULL DEFAULT '{}'::jsonb,
  "PicturePath" TEXT
);

CREATE INDEX IF NOT EXISTS idx_fa_campaign_npc_campaign ON "Fa_campaign_NPC" ("campaignID");

CREATE TABLE IF NOT EXISTS "Fa_campaign_log" (
  "id"         BIGSERIAL PRIMARY KEY,
  "campaignID" BIGINT REFERENCES "Fa_campaign" ("id") ON DELETE CASCADE,
  "Log"        TEXT,
  "Log_number" INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_fa_campaign_log_campaign ON "Fa_campaign_log" ("campaignID");
