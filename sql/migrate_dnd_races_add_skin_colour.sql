-- Adds optional skin colour options for DND races used by prompt generation.
ALTER TABLE IF EXISTS "DND_Races"
ADD COLUMN IF NOT EXISTS "SkinColour" text;
