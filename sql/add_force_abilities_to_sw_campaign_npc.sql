BEGIN;

ALTER TABLE public."SW_campaign_NPC"
  ADD COLUMN IF NOT EXISTS "Force_Abilities" text;

ALTER TABLE public."SW_campaign_NPC"
  ADD COLUMN IF NOT EXISTS "Force_Rating" integer DEFAULT 0;

UPDATE public."SW_campaign_NPC"
SET "Force_Rating" = 0
WHERE "Force_Rating" IS NULL;

COMMIT;
