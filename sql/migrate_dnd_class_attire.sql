-- Adds Attire field to DND classes.
-- Run this in Supabase SQL Editor.

BEGIN;

ALTER TABLE "DND_Classes"
  ADD COLUMN IF NOT EXISTS "Attire" TEXT;

COMMIT;
