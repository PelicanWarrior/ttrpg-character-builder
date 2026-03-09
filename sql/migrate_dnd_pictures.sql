-- Adds DND picture mappings for race + class combinations.
-- PictureID maps to files in public/F_Pictures:
--   Picture <PictureID>.png
--   Picture <PictureID> Face.png
-- Safe to run multiple times.

BEGIN;

CREATE TABLE IF NOT EXISTS "DND_Pictures" (
  "id" BIGSERIAL PRIMARY KEY,
  "PictureID" INTEGER NOT NULL,
  "Class" BIGINT NOT NULL REFERENCES "DND_Classes"("id") ON DELETE CASCADE,
  "Race" BIGINT NOT NULL REFERENCES "DND_Races"("id") ON DELETE CASCADE,
  "DNDMod" TEXT,
  CONSTRAINT "dnd_pictures_pictureid_positive" CHECK ("PictureID" > 0),
  CONSTRAINT "dnd_pictures_class_race_unique" UNIQUE ("Class", "Race")
);

CREATE INDEX IF NOT EXISTS "idx_dnd_pictures_class"
  ON "DND_Pictures"("Class");

CREATE INDEX IF NOT EXISTS "idx_dnd_pictures_race"
  ON "DND_Pictures"("Race");

CREATE INDEX IF NOT EXISTS "idx_dnd_pictures_dndmod"
  ON "DND_Pictures"("DNDMod");

UPDATE "DND_Pictures" pic
SET "DNDMod" = COALESCE(cls."DNDMod", race."DNDMod")
FROM "DND_Classes" cls,
     "DND_Races" race
WHERE cls."id" = pic."Class"
  AND race."id" = pic."Race"
  AND (
    pic."DNDMod" IS NULL
    OR btrim(pic."DNDMod") = ''
  );

COMMIT;
