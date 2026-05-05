BEGIN;

-- Insert 9 Nightsister equipment items
INSERT INTO public."SW_equipment" (name, skill, range, damage, critical, special, soak, defence_melee, defence_range)
VALUES
  -- Heled's gear
  ('Nightsister Recurve Bow',          25,   'Medium',  5, 3, 'Accurate 1',              NULL, NULL, NULL),
  ('Bone-Handled Hunting Knife',       18,   'Engaged', 4, 3, 'Vicious 1',               NULL, NULL, NULL),
  ('Light Bone-Plate Armour',          NULL, NULL,      NULL, NULL, NULL,                1,    0,    0),
  -- Jusa's gear
  ('Ancestral Vibro-Spear',            18,   'Engaged', 8, 2, 'Pierce 2, Defensive 1',   NULL, NULL, NULL),
  ('Bone-Knuckle Guards',              3,    'Engaged', 6, 4, NULL,                      NULL, NULL, NULL),
  ('Clan-Hardened Leather Armour',     NULL, NULL,      NULL, NULL, NULL,                2,    0,    0),
  -- Enjazzi's gear
  ('Ceremonial Ritual Blade (non-magical)', 18, 'Engaged', 5, 2, 'Accurate 1, Vicious 1', NULL, NULL, NULL),
  ('Hunting Sidearm',                  25,   'Short',   5, 4, NULL,                      NULL, NULL, NULL),
  ('Clan Sigil Armour',                NULL, NULL,      NULL, NULL, NULL,                1,    1,    1);

-- Update NPC Equipment fields to names only
UPDATE public."SW_campaign_NPC"
SET "Equipment" = 'Nightsister Recurve Bow, Bone-Handled Hunting Knife, Light Bone-Plate Armour'
WHERE "id" = 64;

UPDATE public."SW_campaign_NPC"
SET "Equipment" = 'Ancestral Vibro-Spear, Bone-Knuckle Guards, Clan-Hardened Leather Armour'
WHERE "id" = 65;

UPDATE public."SW_campaign_NPC"
SET "Equipment" = 'Ceremonial Ritual Blade (non-magical), Hunting Sidearm, Clan Sigil Armour'
WHERE "id" = 66;

COMMIT;

-- Verify
SELECT e.id, e.name FROM public."SW_equipment" e
WHERE e.name IN (
  'Nightsister Recurve Bow','Bone-Handled Hunting Knife','Light Bone-Plate Armour',
  'Ancestral Vibro-Spear','Bone-Knuckle Guards','Clan-Hardened Leather Armour',
  'Ceremonial Ritual Blade (non-magical)','Hunting Sidearm','Clan Sigil Armour'
)
ORDER BY e.id;

SELECT "id", "Name", "Equipment" FROM public."SW_campaign_NPC" WHERE "id" IN (64, 65, 66) ORDER BY "id";
