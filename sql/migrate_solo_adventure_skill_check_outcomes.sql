-- Adds skill-check branching columns for Solo Adventure choices.
-- Safe to run multiple times.

ALTER TABLE "Solo_Adventure_Choices"
  ADD COLUMN IF NOT EXISTS "Check_Enabled" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "Check_Skill" text,
  ADD COLUMN IF NOT EXISTS "Check_Difficulty" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "Check_Success_Next_Node_ID" bigint,
  ADD COLUMN IF NOT EXISTS "Check_Failure_Next_Node_ID" bigint,
  ADD COLUMN IF NOT EXISTS "Check_Advantage_Next_Node_ID" bigint,
  ADD COLUMN IF NOT EXISTS "Check_Disadvantage_Next_Node_ID" bigint;

-- Backfill existing check choices so success path defaults to current Next_Node_ID.
UPDATE "Solo_Adventure_Choices"
SET "Check_Success_Next_Node_ID" = "Next_Node_ID"
WHERE "Check_Enabled" = true
  AND "Check_Success_Next_Node_ID" IS NULL
  AND "Next_Node_ID" IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'solo_adventure_choices_check_success_next_node_fk'
  ) THEN
    ALTER TABLE "Solo_Adventure_Choices"
      ADD CONSTRAINT solo_adventure_choices_check_success_next_node_fk
      FOREIGN KEY ("Check_Success_Next_Node_ID")
      REFERENCES "Solo_Adventure_Nodes"("id")
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'solo_adventure_choices_check_failure_next_node_fk'
  ) THEN
    ALTER TABLE "Solo_Adventure_Choices"
      ADD CONSTRAINT solo_adventure_choices_check_failure_next_node_fk
      FOREIGN KEY ("Check_Failure_Next_Node_ID")
      REFERENCES "Solo_Adventure_Nodes"("id")
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'solo_adventure_choices_check_advantage_next_node_fk'
  ) THEN
    ALTER TABLE "Solo_Adventure_Choices"
      ADD CONSTRAINT solo_adventure_choices_check_advantage_next_node_fk
      FOREIGN KEY ("Check_Advantage_Next_Node_ID")
      REFERENCES "Solo_Adventure_Nodes"("id")
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'solo_adventure_choices_check_disadvantage_next_node_fk'
  ) THEN
    ALTER TABLE "Solo_Adventure_Choices"
      ADD CONSTRAINT solo_adventure_choices_check_disadvantage_next_node_fk
      FOREIGN KEY ("Check_Disadvantage_Next_Node_ID")
      REFERENCES "Solo_Adventure_Nodes"("id")
      ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE "Solo_Adventure_Choices"
  DROP CONSTRAINT IF EXISTS solo_adventure_choices_check_difficulty_nonnegative;

ALTER TABLE "Solo_Adventure_Choices"
  ADD CONSTRAINT solo_adventure_choices_check_difficulty_nonnegative
  CHECK ("Check_Difficulty" >= 0);

CREATE INDEX IF NOT EXISTS idx_solo_adventure_choices_check_failure_next_node
  ON "Solo_Adventure_Choices"("Check_Failure_Next_Node_ID");

CREATE INDEX IF NOT EXISTS idx_solo_adventure_choices_check_success_next_node
  ON "Solo_Adventure_Choices"("Check_Success_Next_Node_ID");

CREATE INDEX IF NOT EXISTS idx_solo_adventure_choices_check_advantage_next_node
  ON "Solo_Adventure_Choices"("Check_Advantage_Next_Node_ID");

CREATE INDEX IF NOT EXISTS idx_solo_adventure_choices_check_disadvantage_next_node
  ON "Solo_Adventure_Choices"("Check_Disadvantage_Next_Node_ID");
