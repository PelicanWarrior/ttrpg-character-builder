-- Adds RaceLook to DND races and creates DND sub races support.
-- Safe to run multiple times.

BEGIN;

ALTER TABLE IF EXISTS "DND_Races"
  ADD COLUMN IF NOT EXISTS "RaceLook" TEXT;

CREATE TABLE IF NOT EXISTS "DND_SubRaces" (
  "id" BIGSERIAL PRIMARY KEY,
  "SubRaceName" TEXT NOT NULL,
  "Description" TEXT,
  "Race" BIGINT NOT NULL REFERENCES "DND_Races"("id") ON DELETE CASCADE,
  "DNDMod" TEXT,
  "Traits" TEXT,
  "AbilityBonusRules" JSONB,
  "AbilityBonus_Str" INTEGER,
  "AbilityBonus_Dex" INTEGER,
  "AbilityBonus_Con" INTEGER,
  "AbilityBonus_Int" INTEGER,
  "AbilityBonus_Wis" INTEGER,
  "AbilityBonus_Cha" INTEGER
);

CREATE INDEX IF NOT EXISTS "idx_dnd_subraces_name"
  ON "DND_SubRaces"("SubRaceName");

CREATE INDEX IF NOT EXISTS "idx_dnd_subraces_race"
  ON "DND_SubRaces"("Race");

UPDATE "DND_SubRaces" sub
SET "DNDMod" = race."DNDMod"
FROM "DND_Races" race
WHERE race."id" = sub."Race"
  AND (
    sub."DNDMod" IS NULL
    OR btrim(sub."DNDMod") = ''
  );

COMMIT;
