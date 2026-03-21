-- Creates SW note skill checks table.
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS "SW_note_skill_checks" (
  "id" bigserial PRIMARY KEY,
  "note_id" bigint NOT NULL,
  "CampaignID" bigint NOT NULL,
  "check_name" text NOT NULL DEFAULT 'General',
  "skill_name" text,
  "difficulty" integer NOT NULL DEFAULT 0,
  "outcome" text NOT NULL,
  "effect" text NOT NULL,
  "order_index" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "SW_note_skill_checks"
  ADD COLUMN IF NOT EXISTS "check_name" text NOT NULL DEFAULT 'General';

ALTER TABLE "SW_note_skill_checks"
  ADD COLUMN IF NOT EXISTS "skill_name" text;

ALTER TABLE "SW_note_skill_checks"
  ADD COLUMN IF NOT EXISTS "difficulty" integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sw_note_skill_checks_note_id_fk'
  ) THEN
    ALTER TABLE "SW_note_skill_checks"
      ADD CONSTRAINT sw_note_skill_checks_note_id_fk
      FOREIGN KEY ("note_id")
      REFERENCES "SW_campaign_notes"("id")
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sw_note_skill_checks_campaign_id_fk'
  ) THEN
    ALTER TABLE "SW_note_skill_checks"
      ADD CONSTRAINT sw_note_skill_checks_campaign_id_fk
      FOREIGN KEY ("CampaignID")
      REFERENCES "SW_campaign"("id")
      ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sw_note_skill_checks_note_id
  ON "SW_note_skill_checks"("note_id");

CREATE INDEX IF NOT EXISTS idx_sw_note_skill_checks_campaign_id
  ON "SW_note_skill_checks"("CampaignID");

CREATE INDEX IF NOT EXISTS idx_sw_note_skill_checks_note_order
  ON "SW_note_skill_checks"("note_id", "order_index", "id");

CREATE INDEX IF NOT EXISTS idx_sw_note_skill_checks_note_name_order
  ON "SW_note_skill_checks"("note_id", "check_name", "order_index", "id");

ALTER TABLE "SW_note_skill_checks"
  DROP CONSTRAINT IF EXISTS sw_note_skill_checks_difficulty_range;

ALTER TABLE "SW_note_skill_checks"
  ADD CONSTRAINT sw_note_skill_checks_difficulty_range
  CHECK ("difficulty" >= 0 AND "difficulty" <= 5);
