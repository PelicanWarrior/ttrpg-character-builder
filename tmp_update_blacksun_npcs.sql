BEGIN;

-- Akdii Dravoo (id=68) - Cold-eyed Rodian sniper
UPDATE public."SW_campaign_NPC"
SET
  "Description" = 'A cold-eyed female Rodian sniper and Black Sun operative. Akdii was part of the crew secretly transporting crates of illegal weapons for pirate gangs aboard a Black Sun freighter when they docked at Kelnan''s Hangar on Pantora for emergency repairs. When Nix discovered the hidden cargo while crawling through the hull, blaster fire broke out. Akdii was one of the four operatives present when Nix''s father Kelnan was cut down. She was then sealed inside the hangar bay when Nix hot-wired their freighter and fled — stranded on Pantora with nothing. She is calculating, patient, and does not forgive being made to look foolish. She has been tracking Nix''s movements across the Outer Rim ever since. She views it as a hunt, and she finishes every hunt she starts.',
  "Skills" = 'Stealth, Stealth, Stealth, Perception, Perception, Perception, Perception, Ranged-Heavy, Ranged-Heavy, Ranged-Heavy, Ranged-Heavy, Survival, Survival, Vigilance, Vigilance, Skulduggery, Skulduggery',
  "Abilities" = 'Heightened Senses (add Boost die to all Perception and Vigilance checks),Sniper''s Eye (when making a ranged attack from long range or further, may remove one Setback die),Low-Light Vision (ignores penalties for dim or dark environments)'
WHERE "id" = 68;

-- Ked Kenleoc (id=69) - Hulking Trandoshan enforcer
UPDATE public."SW_campaign_NPC"
SET
  "Description" = 'A hulking male Trandoshan enforcer and Black Sun operative. Ked was aboard the Black Sun freighter at Kelnan''s Hangar on Pantora when Nix discovered their hidden cargo of illegal weapons. When the shooting started, Ked was the one who moved to neutralise Kelnan — and it was his presence that forced the old mechanic to step in front of his daughter. Ked was sealed in the hangar bay along with the rest of the crew when Nix stole their ship. He does not feel guilt — he keeps a tally of kills carved into his vibro-axe handle, and Kelnan is one of them. He wants Nix back under Black Sun control, but if that is not possible, he will settle for closing the account another way. Ked is a creature of direct violence and enormous endurance. He has survived things that should have killed him more than once.',
  "Skills" = 'Brawl, Brawl, Brawl, Brawl, Melee, Melee, Melee, Resilience, Resilience, Resilience, Coercion, Coercion, Coercion, Vigilance, Vigilance, Athletics, Athletics',
  "Abilities" = 'Trandoshan Regeneration (at the end of each encounter remove one Minor or Moderate critical injury if not Incapacitated),Terrifying Presence (once per encounter may attempt a Coercion check as a manoeuvre to cause Strain equal to successes),Thick Scales (natural Soak bonus already included in stat),Hunter''s Score (Ked tracks his kills — if he reduces an enemy to Incapacitated he gains a Boost die on all combat checks until end of encounter)'
WHERE "id" = 69;

-- Ears Stenk (id=70) - Scarred Weequay pirate
UPDATE public."SW_campaign_NPC"
SET
  "Description" = 'A scarred male Weequay pirate and Black Sun operative. Ears was a crew hand aboard the Black Sun freighter carrying illegal weapons when the ship put down at Kelnan''s Hangar on Pantora. He is a career criminal who has served pirate crews, smuggling outfits, and now Black Sun — moving from one employer to the next depending on who pays and who lets him cause trouble. He bears the scars of dozens of boarding actions across his leathery face and forearms. When Nix sealed the crew in the hangar and flew off with their freighter, Ears took it harder than most — that ship had a hold full of his personal cut from the weapons run. He is loud, dangerous, and not particularly patient. He follows Bebs'' lead but has his own score to settle.',
  "Skills" = 'Melee, Melee, Melee, Ranged-Heavy, Ranged-Heavy, Brawl, Brawl, Athletics, Athletics, Streetwise, Streetwise, Underworld, Underworld, Piloting-Space, Piloting-Space, Vigilance, Vigilance',
  "Abilities" = 'Pirate''s Grit (when suffering a hit that would cause a Critical Injury, may spend a Destiny Point to downgrade it one step),Boarding Instinct (add Boost die to all Melee checks when fighting in confined spaces such as corridors, ship interiors, or small rooms)'
WHERE "id" = 70;

-- Bebs Witreess (id=71) - Smooth-talking Falleen lieutenant (actual cell leader)
UPDATE public."SW_campaign_NPC"
SET
  "Description" = 'A smooth-talking female Falleen and Black Sun lieutenant — the undisputed leader of this cell. Bebs was the one who arranged the weapons shipment and selected the crew. When the job fell apart on Pantora — Nix discovering the cargo, the firefight, Kelnan''s death, and then their own freighter being stolen from under them while they were locked in a hangar bay — Bebs was humiliated. Not merely inconvenienced. She lost the shipment, lost the freighter, and had to explain all of it to her superiors. She rose back through the ranks by delivering results, and recovering Nix — a Force-sensitive asset who robbed and stranded her — is very much unfinished business. Bebs does not operate through rage. She operates through patience, leverage, and the Falleen gift of making people want to please her. She is the most dangerous member of the cell precisely because she is the most composed.',
  "Skills" = 'Charm, Charm, Charm, Charm, Deception, Deception, Deception, Deception, Coercion, Coercion, Coercion, Negotiation, Negotiation, Negotiation, Perception, Perception, Cool, Cool, Cool, Leadership, Leadership, Ranged-Light, Ranged-Light',
  "Abilities" = 'Falleen Pheromones (once per encounter upgrade Charm or Coercion check twice; affected target adds Setback to checks to resist her influence for the remainder of the scene),Silver Tongue (when Bebs fails a social check she may spend 2 Advantage to convert a Failure to a Success with no additional successes instead),Command Presence (allies within medium range add Boost to Discipline checks),Composed (Bebs does not suffer the Setback die from social checks caused by hostile environments or social pressure)'
WHERE "id" = 71;

COMMIT;

SELECT id, "Name", left("Description", 150) AS desc_preview, left("Abilities", 100) AS abilities_preview
FROM public."SW_campaign_NPC"
WHERE id IN (68, 69, 70, 71)
ORDER BY id;
