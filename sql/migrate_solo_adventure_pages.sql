BEGIN;

-- Add a first-page pointer to Solo_Adventures (nullable until pages exist).
ALTER TABLE "Solo_Adventures"
  ADD COLUMN IF NOT EXISTS first_page_id BIGINT;

-- Adventure pages (each page is a story segment).
CREATE TABLE IF NOT EXISTS "Solo_Adventure_Pages" (
  id BIGSERIAL PRIMARY KEY,
  adventure_id BIGINT NOT NULL REFERENCES "Solo_Adventures"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  page_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Choices from a page to another page.
CREATE TABLE IF NOT EXISTS "Solo_Adventure_Choices" (
  id BIGSERIAL PRIMARY KEY,
  page_id BIGINT NOT NULL REFERENCES "Solo_Adventure_Pages"(id) ON DELETE CASCADE,
  choice_text TEXT NOT NULL,
  next_page_id BIGINT REFERENCES "Solo_Adventure_Pages"(id) ON DELETE SET NULL,
  choice_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional one-to-many skill checks for each choice.
CREATE TABLE IF NOT EXISTS "Solo_Adventure_Choice_Skill_Checks" (
  id BIGSERIAL PRIMARY KEY,
  choice_id BIGINT NOT NULL REFERENCES "Solo_Adventure_Choices"(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  difficulty TEXT,
  success_text TEXT,
  failure_text TEXT,
  check_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add FK after pages table exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Solo_Adventures_first_page_id_fkey'
  ) THEN
    ALTER TABLE "Solo_Adventures"
      ADD CONSTRAINT "Solo_Adventures_first_page_id_fkey"
      FOREIGN KEY (first_page_id)
      REFERENCES "Solo_Adventure_Pages"(id)
      ON DELETE SET NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS solo_adventure_pages_adventure_idx
  ON "Solo_Adventure_Pages"(adventure_id);
CREATE INDEX IF NOT EXISTS solo_adventure_pages_order_idx
  ON "Solo_Adventure_Pages"(adventure_id, page_order);

CREATE INDEX IF NOT EXISTS solo_adventure_choices_page_idx
  ON "Solo_Adventure_Choices"(page_id);
CREATE INDEX IF NOT EXISTS solo_adventure_choices_next_page_idx
  ON "Solo_Adventure_Choices"(next_page_id);
CREATE INDEX IF NOT EXISTS solo_adventure_choices_order_idx
  ON "Solo_Adventure_Choices"(page_id, choice_order);

CREATE INDEX IF NOT EXISTS solo_adventure_choice_checks_choice_idx
  ON "Solo_Adventure_Choice_Skill_Checks"(choice_id);
CREATE INDEX IF NOT EXISTS solo_adventure_choice_checks_order_idx
  ON "Solo_Adventure_Choice_Skill_Checks"(choice_id, check_order);

ALTER TABLE "Solo_Adventures" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Solo_Adventure_Pages" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Solo_Adventure_Choices" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Solo_Adventure_Choice_Skill_Checks" DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "solo_adventures_all" ON "Solo_Adventures";
DROP POLICY IF EXISTS "solo_adventure_pages_all" ON "Solo_Adventure_Pages";
DROP POLICY IF EXISTS "solo_adventure_choices_all" ON "Solo_Adventure_Choices";
DROP POLICY IF EXISTS "solo_adventure_choice_checks_all" ON "Solo_Adventure_Choice_Skill_Checks";

COMMIT;
