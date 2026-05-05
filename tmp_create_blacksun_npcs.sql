BEGIN;

-- 1. Akdii Dravoo - Female Rodian (Race 12) - Scout/Tracker
INSERT INTO public."SW_campaign_NPC"
  ("Name", "Race", "Description", "Brawn", "Agility", "Intellect", "Cunning", "Willpower", "Presence",
   "Soak", "Wound", "Strain", "Skills", "Abilities", "Equipment", "CampaignID", "Part_of_Place")
VALUES (
  'Akdii Dravoo',
  12,
  'A sharp-eyed female Rodian who serves as a tracker and advance scout for this Black Sun cell. Akdii is calculating and rarely speaks unless she has something worth saying. She was the one who first identified Nix as a person of interest to Black Sun, and has been watching her movements ever since. She is fiercely loyal to the cell but harbours personal ambitions — she believes Black Sun''s war with the Hutts is a distraction and that the real credits lie in Force-sensitive acquisition. She carries a modified long-range blaster that she built herself, and her snout-mounted sensor goggles give her tracking capability few beings can match.',
  2, 4, 2, 3, 2, 2,
  3, 12, 10,
  'Stealth, Stealth, Stealth, Perception, Perception, Perception, Ranged-Light, Ranged-Light, Ranged-Light, Survival, Survival, Vigilance, Vigilance, Skulduggery, Skulduggery',
  'Heightened Senses (add Boost die to all Perception and Vigilance checks),Natural Hunter (may reroll one die on Survival checks to track a target),Low-Light Vision (ignores penalties for dim or dark environments)',
  'Modified Long-Range Blaster Pistol, Sensor Goggles, Lightweight Body Glove (+1 Soak)',
  2, 82
);

-- 2. Ked Kenleoc - Male Trandoshan (Race 13) - Enforcer/Muscle
INSERT INTO public."SW_campaign_NPC"
  ("Name", "Race", "Description", "Brawn", "Agility", "Intellect", "Cunning", "Willpower", "Presence",
   "Soak", "Wound", "Strain", "Skills", "Abilities", "Equipment", "CampaignID", "Part_of_Place")
VALUES (
  'Ked Kenleoc',
  13,
  'A brutal male Trandoshan who acts as the cell''s primary enforcer and debt collector. Ked is a creature of simple motivations — he follows Bebs, breaks what she tells him to break, and earns enough to fund his hunts. He has a score-hunting fixation and keeps a tally of his kills etched into the leather wrapping of his vibro-axe. He was directly involved in the threats made against Nix''s husband, and was likely the one who delivered the warning that set events in motion. Ked is not particularly bright but is extraordinarily difficult to put down — he has survived injuries that should have killed him and wears those scars like armour.',
  4, 2, 2, 2, 3, 1,
  6, 18, 12,
  'Brawl, Brawl, Brawl, Brawl, Melee, Melee, Melee, Resilience, Resilience, Resilience, Coercion, Coercion, Vigilance, Vigilance, Athletics, Athletics',
  'Trandoshan Regeneration (at the end of each encounter, remove one Minor or Moderate critical injury if not Incapacitated),Terrifying Presence (once per encounter, may attempt a Coercion check as a manoeuvre to cause Strain equal to successes),Thick Scales (natural Soak bonus already included in stat)',
  'Vibro-Axe, Heavy Blaster Pistol, Trandoshan Armoured Vest (+1 Soak)',
  2, 82
);

-- 3. Ears Stenk - Male Weequay (Race 19) - Pirate Lieutenant
INSERT INTO public."SW_campaign_NPC"
  ("Name", "Race", "Description", "Brawn", "Agility", "Intellect", "Cunning", "Willpower", "Presence",
   "Soak", "Wound", "Strain", "Skills", "Abilities", "Equipment", "CampaignID", "Part_of_Place")
VALUES (
  'Ears Stenk',
  19,
  'A weathered male Weequay who serves as the cell''s lieutenant and logistician. His nickname, "Ears," comes from his uncanny ability to be in the right cantina at the right time and walk away knowing things he shouldn''t. He is the cell''s information broker and operations coordinator — he handles safe houses, movement of goods, and keeps the cell''s contacts across the Outer Rim paid and quiet. Ears has worked for Black Sun for two decades and has no illusions about what the organisation is. He has survived this long through careful observation and a willingness to cut losses. He knows where the bodies are buried — literally, in some cases. He views Nix as an asset that walked away from the organisation, and that is a problem that needs resolution.',
  3, 3, 2, 3, 3, 2,
  5, 14, 13,
  'Melee, Melee, Ranged-Heavy, Ranged-Heavy, Streetwise, Streetwise, Streetwise, Underworld, Underworld, Underworld, Vigilance, Vigilance, Perception, Perception, Cool, Cool, Negotiation',
  'Pirate''s Instinct (add Boost die to Streetwise and Underworld checks in criminal or black market contexts),Situational Awareness (allies within short range may use Ears''s Perception result instead of their own for Initiative)',
  'Blaster Carbine, Combat Knife, Encrypted Comlink, Light Armour Vest (+1 Soak)',
  2, 82
);

-- 4. Bebs Witreess - Female Falleen (Race 51) - Cell Leader / Manipulator
INSERT INTO public."SW_campaign_NPC"
  ("Name", "Race", "Description", "Brawn", "Agility", "Intellect", "Cunning", "Willpower", "Presence",
   "Soak", "Wound", "Strain", "Skills", "Abilities", "Equipment", "CampaignID", "Part_of_Place")
VALUES (
  'Bebs Witreess',
  51,
  'The undisputed leader of this Black Sun cell, Bebs is a female Falleen of cold intelligence and practised charm. She rose through Black Sun''s ranks not through violence — though she is not incapable of it — but through an almost supernatural ability to understand what people want and use it against them. She targeted Nix''s husband as leverage to bring Nix back into the fold, calculating that a Force-sensitive asset running loose in the Outer Rim was too valuable to abandon. Bebs does not take betrayal personally — she takes it professionally. To her, Nix''s disappearance is an outstanding account, and she is the sort of woman who always collects. She wears immaculate clothing regardless of environment and carries a slender holdout blaster she has never needed to use in front of anyone twice.',
  2, 2, 3, 4, 3, 4,
  4, 12, 15,
  'Charm, Charm, Charm, Charm, Deception, Deception, Deception, Deception, Coercion, Coercion, Coercion, Negotiation, Negotiation, Negotiation, Perception, Perception, Cool, Cool, Cool, Leadership, Leadership',
  'Falleen Pheromones (once per encounter, upgrade Charm or Coercion check twice; affected target adds Setback to checks to resist her influence for the remainder of the scene),Silver Tongue (when Bebs fails a social check she may spend Advantage to remove a Setback from her next social check instead),Command Presence (allies within medium range add Boost to Discipline checks)',
  'Holdout Blaster, Concealed Vibroknife, Expensive Tailored Clothing (social encounters only — counts as light armour 1)',
  2, 82
);

COMMIT;

SELECT id, "Name", "Brawn", "Agility", "Intellect", "Cunning", "Willpower", "Presence", "Soak", "Wound", "Strain"
FROM public."SW_campaign_NPC"
WHERE "Part_of_Place"::text = '82' AND "CampaignID" = 2
ORDER BY id;
