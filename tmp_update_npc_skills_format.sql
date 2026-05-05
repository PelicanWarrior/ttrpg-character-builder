BEGIN;

-- Heled Intraj (id=64): Athletics 2, Coordination 3, Melee 2, Perception 3, Ranged (Light) 3, Stealth 4, Survival 3
UPDATE public."SW_campaign_NPC"
SET "Skills" = 'Athletics, Athletics, Coordination, Coordination, Coordination, Melee, Melee, Perception, Perception, Perception, Ranged (Light), Ranged (Light), Ranged (Light), Stealth, Stealth, Stealth, Stealth, Survival, Survival, Survival'
WHERE "id" = 64;

-- Jusa Kovves (id=65): Athletics 3, Brawl 3, Coercion 2, Melee 4, Resilience 3, Vigilance 2
UPDATE public."SW_campaign_NPC"
SET "Skills" = 'Athletics, Athletics, Athletics, Brawl, Brawl, Brawl, Coercion, Coercion, Melee, Melee, Melee, Melee, Resilience, Resilience, Resilience, Vigilance, Vigilance'
WHERE "id" = 65;

-- Enjazzi Ezil (id=66): Coercion 3, Cool 3, Deception 3, Leadership 3, Melee 2, Perception 3, Survival 2, Vigilance 3
UPDATE public."SW_campaign_NPC"
SET "Skills" = 'Coercion, Coercion, Coercion, Cool, Cool, Cool, Deception, Deception, Deception, Leadership, Leadership, Leadership, Melee, Melee, Perception, Perception, Perception, Survival, Survival, Vigilance, Vigilance, Vigilance'
WHERE "id" = 66;

COMMIT;

SELECT "id", "Name", "Skills"
FROM public."SW_campaign_NPC"
WHERE "id" IN (64, 65, 66)
ORDER BY "id";
