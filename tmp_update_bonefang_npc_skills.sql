BEGIN;

-- Krassk Ironjaw (pack commander / intimidation frontline)
UPDATE public."SW_campaign_NPC"
SET "Skills" = 'Melee, Melee, Melee, Leadership, Leadership, Leadership, Coercion, Coercion, Coercion, Discipline, Discipline, Survival, Survival, Vigilance, Vigilance, Resilience, Resilience, Perception, Perception'
WHERE "id" = 51;

-- Vek''thar Pale-Eye (stalker marksman / scout)
UPDATE public."SW_campaign_NPC"
SET "Skills" = 'Stealth, Stealth, Stealth, Stealth, Perception, Perception, Perception, Perception, Survival, Survival, Survival, Ranged-Heavy, Ranged-Heavy, Ranged-Heavy, Skulduggery, Skulduggery, Vigilance, Vigilance, Coordination, Coordination'
WHERE "id" = 52;

-- Drok Hookarm (breacher bruiser)
UPDATE public."SW_campaign_NPC"
SET "Skills" = 'Brawl, Brawl, Brawl, Brawl, Melee, Melee, Melee, Athletics, Athletics, Athletics, Resilience, Resilience, Resilience, Coercion, Coercion, Vigilance, Vigilance, Discipline, Discipline'
WHERE "id" = 53;

-- Sszek Yellowmark (trail setter / ambush specialist)
UPDATE public."SW_campaign_NPC"
SET "Skills" = 'Stealth, Stealth, Stealth, Stealth, Survival, Survival, Survival, Perception, Perception, Perception, Skulduggery, Skulduggery, Skulduggery, Deception, Deception, Coordination, Coordination, Vigilance, Vigilance, Streetwise, Streetwise'
WHERE "id" = 54;

COMMIT;

SELECT "id", "Name", "Skills"
FROM public."SW_campaign_NPC"
WHERE "id" IN (51, 52, 53, 54)
ORDER BY "id";
