-- Adds subclass persistence support for DND character creator.
-- Safe to run multiple times.

BEGIN;

ALTER TABLE "DND_player_character"
  ADD COLUMN IF NOT EXISTS "Subclass" BIGINT;

DO $$
BEGIN
  IF to_regclass('public."DND_Subclasses"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'dnd_player_character_subclass_fk'
     )
  THEN
    ALTER TABLE "DND_player_character"
      ADD CONSTRAINT dnd_player_character_subclass_fk
      FOREIGN KEY ("Subclass") REFERENCES "DND_Subclasses"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dnd_player_character_subclass
  ON "DND_player_character" ("Subclass");

COMMIT;
