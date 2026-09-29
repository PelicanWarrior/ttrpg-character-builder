-- Adds date-based ordering support to SW_campaign_notes.
-- Run this manually in the Supabase SQL Editor.

ALTER TABLE "SW_campaign_notes"
  ADD COLUMN IF NOT EXISTS "Note_Date" date,
  ADD COLUMN IF NOT EXISTS "Date_Order" boolean DEFAULT false;
