-- Persist per-character race ability choice selections.
-- This stores the player's selected stats for race choice bonus rules.

BEGIN;

ALTER TABLE "DND_player_character"
  ADD COLUMN IF NOT EXISTS "RaceAbilityChoices" JSONB;

COMMIT;
