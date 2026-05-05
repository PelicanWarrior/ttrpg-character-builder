BEGIN;

INSERT INTO public."SW_campaign_NPC"
  ("Name", "Race", "Description", "Brawn", "Agility", "Intellect", "Cunning", "Willpower", "Presence",
   "Soak", "Wound", "Strain",
   "Skills", "Abilities", "Equipment",
   "CampaignID", "Part_of_Place")
VALUES (
  'IG-07',
  38, -- Droid
  'An IG-series combat and courier droid of late-Republic era Sith manufacture. Found deactivated and heavily damaged in the Droid Maintenance Bay aboard The Ashen Testament on Malachor V. His chassis bore severe physical damage and his memory banks were fragmented — he retained functional combat routines but had lost continuity of his personal history and mission logs. A hidden Sith holocron (glowing red cube) was concealed within his chest cavity, apparently shielded from detection by Sith geometric wards inscribed on his chassis frame. IG-07 is directly interfaced with the navicomputer of the Ashen Talon and can unlock its 5 encrypted Sith courier jump routes. He was fully repaired by the crew during the session of 28th April 2026.',
  3, -- Brawn
  3, -- Agility
  3, -- Intellect
  2, -- Cunning
  2, -- Willpower
  1, -- Presence
  5, -- Soak (Brawn 3 + armour 2)
  14, -- Wound threshold
  12, -- Strain threshold
  'Ranged-Heavy, Ranged-Heavy, Ranged-Heavy, Ranged-Light, Ranged-Light, Computers, Computers, Computers, Mechanics, Mechanics, Vigilance, Vigilance, Perception, Perception',
  'Droid (immune to toxins, vacuum, does not breathe),Sith Courier Protocol (interfaces with Ashen Talon navicomputer to unlock 5 encrypted jump routes),IG Combat Frame (does not suffer critical injuries from unarmed attacks),Encrypted Memory Core (memories fragmented — past history and mission briefings inaccessible without Memory Recovery skill check)',
  'Built-in Heavy Blaster Rifle (right arm), Built-in Blaster Pistol (left arm), Hidden Sith Holocron (chest cavity)',
  2, -- CampaignID
  101 -- R5 - Droid Maintenance Bay
);

COMMIT;

SELECT id, "Name", "Race", "Brawn", "Agility", "Intellect", "Cunning", "Willpower", "Presence", "Soak", "Wound", "Strain", left("Skills", 100) AS skills_preview
FROM public."SW_campaign_NPC"
WHERE "Name" = 'IG-07' AND "CampaignID" = 2;
