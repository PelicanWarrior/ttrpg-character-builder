-- DND class progression custom fields (per-class and per-level)
-- Run this in Supabase SQL Editor.

BEGIN;

ALTER TABLE "DND_Classes"
  ADD COLUMN IF NOT EXISTS "ExtraLevelFields" JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE "DND_Class_Levels"
  ADD COLUMN IF NOT EXISTS "ExtraValues" JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMIT;
