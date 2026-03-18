-- Marvel Multiverse RPG system schema for character creator + overview

CREATE TABLE IF NOT EXISTS "MM_player_characters" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_number" BIGINT,
  "name" TEXT NOT NULL,
  "hero_name" TEXT,
  "rank" INTEGER NOT NULL DEFAULT 1 CHECK ("rank" >= 1),
  "origin" TEXT,
  "archetype" TEXT,
  "occupation" TEXT,
  "team" TEXT,
  "marvel_stats" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "health" INTEGER NOT NULL DEFAULT 30 CHECK ("health" >= 0),
  "focus" INTEGER NOT NULL DEFAULT 10 CHECK ("focus" >= 0),
  "karma" INTEGER NOT NULL DEFAULT 1 CHECK ("karma" >= 0),
  "power_sets" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "powers" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "traits" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "backstory" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "MM_player_characters"
  ADD COLUMN IF NOT EXISTS "user_number" BIGINT,
  ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL DEFAULT 'Unnamed Hero',
  ADD COLUMN IF NOT EXISTS "hero_name" TEXT,
  ADD COLUMN IF NOT EXISTS "rank" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "origin" TEXT,
  ADD COLUMN IF NOT EXISTS "archetype" TEXT,
  ADD COLUMN IF NOT EXISTS "occupation" TEXT,
  ADD COLUMN IF NOT EXISTS "team" TEXT,
  ADD COLUMN IF NOT EXISTS "marvel_stats" JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "health" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS "focus" INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS "karma" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "power_sets" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "powers" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "traits" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "backstory" TEXT,
  ADD COLUMN IF NOT EXISTS "notes" TEXT,
  ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'user'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'mm_player_characters_user_fk'
    ) THEN
      ALTER TABLE "MM_player_characters"
        ADD CONSTRAINT mm_player_characters_user_fk
        FOREIGN KEY ("user_number") REFERENCES "user" ("id") ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mm_player_characters_user ON "MM_player_characters" ("user_number");
CREATE INDEX IF NOT EXISTS idx_mm_player_characters_name ON "MM_player_characters" ("name");
CREATE INDEX IF NOT EXISTS idx_mm_player_characters_rank ON "MM_player_characters" ("rank");

CREATE TABLE IF NOT EXISTS "MM_powers" (
  "id" BIGSERIAL PRIMARY KEY,
  "power_name" TEXT NOT NULL,
  "power_set" TEXT NOT NULL,
  "rank_min" INTEGER NOT NULL DEFAULT 1 CHECK ("rank_min" >= 1),
  "prerequisites" TEXT,
  "action_type" TEXT,
  "trigger" TEXT,
  "duration_text" TEXT,
  "focus_cost" INTEGER,
  "effect" TEXT,
  "source_page" INTEGER,
  "is_official" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_by_user" BIGINT,
  "description" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT mm_powers_unique_set_name UNIQUE ("power_set", "power_name")
);

ALTER TABLE "MM_powers"
  ADD COLUMN IF NOT EXISTS "prerequisites" TEXT,
  ADD COLUMN IF NOT EXISTS "action_type" TEXT,
  ADD COLUMN IF NOT EXISTS "trigger" TEXT,
  ADD COLUMN IF NOT EXISTS "duration_text" TEXT,
  ADD COLUMN IF NOT EXISTS "focus_cost" INTEGER,
  ADD COLUMN IF NOT EXISTS "effect" TEXT,
  ADD COLUMN IF NOT EXISTS "source_page" INTEGER,
  ADD COLUMN IF NOT EXISTS "is_official" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "created_by_user" BIGINT;

CREATE INDEX IF NOT EXISTS idx_mm_powers_set ON "MM_powers" ("power_set");
CREATE INDEX IF NOT EXISTS idx_mm_powers_rank_min ON "MM_powers" ("rank_min");
CREATE INDEX IF NOT EXISTS idx_mm_powers_official ON "MM_powers" ("is_official");
CREATE INDEX IF NOT EXISTS idx_mm_powers_name ON "MM_powers" ("power_name");

-- Remove old placeholder seed rows from initial prototype migration.
DELETE FROM "MM_powers"
WHERE ("power_set", "power_name") IN (
  ('Battle Suit', 'Repulsor Blast'),
  ('Battle Suit', 'Suit Flight'),
  ('Battle Suit', 'Targeting AI'),
  ('Blades', 'Precision Strike'),
  ('Blades', 'Whirlwind Cut'),
  ('Blades', 'Deflecting Parry'),
  ('Cosmic Power', 'Cosmic Blast'),
  ('Cosmic Power', 'Energy Absorption'),
  ('Cosmic Power', 'Stellar Shift'),
  ('Elemental Control', 'Fire Burst'),
  ('Elemental Control', 'Ice Barrier'),
  ('Elemental Control', 'Lightning Arc'),
  ('Energy Control', 'Energy Beam'),
  ('Energy Control', 'Energy Shield'),
  ('Energy Control', 'Energy Pulse'),
  ('Genius', 'Analyze Weakness'),
  ('Genius', 'Improvised Gadget'),
  ('Genius', 'Tactical Plan'),
  ('Magic', 'Mystic Bolt'),
  ('Magic', 'Protective Ward'),
  ('Magic', 'Short Teleport'),
  ('Martial Arts', 'Combo Strike'),
  ('Martial Arts', 'Stunning Blow'),
  ('Martial Arts', 'Evasive Footwork'),
  ('Plasticity', 'Elastic Reach'),
  ('Plasticity', 'Elastic Slam'),
  ('Plasticity', 'Morph Defense'),
  ('Ranged Weapons', 'Aimed Shot'),
  ('Ranged Weapons', 'Rapid Fire'),
  ('Ranged Weapons', 'Ricochet Shot'),
  ('Shield Bearer', 'Shield Throw'),
  ('Shield Bearer', 'Shield Block'),
  ('Shield Bearer', 'Shield Rush'),
  ('Spider-Powers', 'Web Shot'),
  ('Spider-Powers', 'Wall-Crawl'),
  ('Spider-Powers', 'Spider-Sense'),
  ('Super-Speed', 'Speed Burst'),
  ('Super-Speed', 'Blur Defense'),
  ('Super-Speed', 'Rapid Strike'),
  ('Super-Strength', 'Mighty Punch'),
  ('Super-Strength', 'Ground Smash'),
  ('Super-Strength', 'Power Lift'),
  ('Telekinesis', 'Force Push'),
  ('Telekinesis', 'Levitate'),
  ('Telekinesis', 'Psychic Barrier'),
  ('Telepathy', 'Mind Link'),
  ('Telepathy', 'Mental Blast'),
  ('Telepathy', 'Suggestion'),
  ('Weather Control', 'Wind Gust'),
  ('Weather Control', 'Thunder Strike'),
  ('Weather Control', 'Storm Field')
);

INSERT INTO "MM_powers" (
  "power_set",
  "power_name",
  "rank_min",
  "prerequisites",
  "action_type",
  "trigger",
  "duration_text",
  "focus_cost",
  "effect",
  "description",
  "is_official"
) VALUES
  (
    'Super-Speed',
    'Blur',
    2,
    'Speed Run 2, Rank 2',
    'Standard or reaction',
    'The character is attacked.',
    '1 round',
    5,
    'Any attacks against the character have trouble.',
    'The character moves like a blur!',
    TRUE
  )
ON CONFLICT ("power_set", "power_name") DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'TTRPGs'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM "TTRPGs"
      WHERE UPPER(COALESCE("Initials", '')) = 'MM'
         OR LOWER(COALESCE("TTRPG_name", '')) IN ('marvel multiverse', 'marvel multiverse rpg')
    ) THEN
      INSERT INTO "TTRPGs" ("TTRPG_name", "Initials", "show", "DND_Mod", "Custom_System")
      VALUES ('Marvel Multiverse', 'MM', TRUE, FALSE, FALSE);
    END IF;
  END IF;
END $$;