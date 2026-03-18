-- Add a text column to store the manually-edited timeline for each campaign.
-- Run this once in your Supabase SQL editor.
ALTER TABLE "DND_campaign" ADD COLUMN IF NOT EXISTS timeline text;
