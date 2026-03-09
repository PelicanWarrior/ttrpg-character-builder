-- Optional cleanup migration for existing databases.
-- Removes subclass columns no longer used by the admin UI.

BEGIN;

ALTER TABLE "DND_Subclasses"
  DROP COLUMN IF EXISTS "PointsName",
  DROP COLUMN IF EXISTS "ExtraLevelFields";

ALTER TABLE "DND_Subclass_Levels"
  DROP COLUMN IF EXISTS "ProfBonus",
  DROP COLUMN IF EXISTS "Cantrips",
  DROP COLUMN IF EXISTS "SpellsKnown",
  DROP COLUMN IF EXISTS "Points",
  DROP COLUMN IF EXISTS "ExtraValues";

COMMIT;
