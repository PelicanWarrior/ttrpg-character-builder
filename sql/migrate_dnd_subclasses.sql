-- Creates subclass tables used by Settings.jsx DND Subclasses admin UI.
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS "DND_Subclasses" (
  "id" BIGSERIAL PRIMARY KEY,
  "SubclassName" TEXT NOT NULL,
  "Description" TEXT,
  "Class" BIGINT NOT NULL REFERENCES "DND_Classes"("id") ON DELETE CASCADE,
  "DNDMod" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_dnd_subclasses_class"
  ON "DND_Subclasses"("Class");

CREATE INDEX IF NOT EXISTS "idx_dnd_subclasses_name"
  ON "DND_Subclasses"("SubclassName");

CREATE TABLE IF NOT EXISTS "DND_Subclass_Levels" (
  "id" BIGSERIAL PRIMARY KEY,
  "Subclass" BIGINT NOT NULL REFERENCES "DND_Subclasses"("id") ON DELETE CASCADE,
  "Level" INTEGER NOT NULL,
  "Features" TEXT,
  UNIQUE ("Subclass", "Level")
);

CREATE INDEX IF NOT EXISTS "idx_dnd_subclass_levels_subclass"
  ON "DND_Subclass_Levels"("Subclass");
