BEGIN;

-- 1. Update Hutt Cartel note (id=117) with background
UPDATE public."SW_campaign_notes"
SET "Description" = 'The Hutt Cartel is one of the most powerful and ancient criminal organisations in the galaxy, operating primarily across the Outer Rim and Hutt Space. Unlike Black Sun — which functions as a structured hierarchical syndicate — the Hutt Cartel is a loose confederacy of Hutt crime lords, each controlling their own territory, enterprises, and enforcers, with only nominal allegiance to the Grand Hutt Council on Nal Hutta.

The Cartel''s influence stretches across smuggling, spice trafficking, slavery, gambling, bounty contracting, and protection rackets. In the Outer Rim where Republic law barely reaches, the Hutts do not merely exist alongside legitimate authority — they replace it. On worlds like Tatooine and Ryloth, the Hutts are the law.

The Cartel is currently engaged in a low-grade war with Black Sun over control of key smuggling routes and spice distribution networks in the Outer Rim. Neither side has moved to open full conflict, but murders, hijackings, and disappearances have been escalating.

THE GRAND HUTT COUNCIL:
The Cartel is nominally governed by the Grand Hutt Council on Nal Hutta, composed of the most powerful Hutt kajidics (clan-families). In practice, strong individual Hutts operate with near-total autonomy as long as they maintain their tribute and do not embarrass the Council.

JABBA DESILIJIC TIURE (Jabba the Hutt):
The most feared and powerful Hutt crime lord of the era. Based on Tatooine from his palace in the Dune Sea. See NPC entry.

ZORBA DESILIJIC TIURE (Zorba the Hutt):
Jabba''s father and the patriarch of the Desilijic kajidic. Currently operating out of Ryloth. The party first encountered Zorba in Episode I — each member had fallen into debt with him, and he contracted them for the mission that began their careers. See NPC entry.'
WHERE "id" = 117;

-- 2. Create Jabba the Hutt as NPC
-- Published stats from FFG Edge of the Empire (No Disintegrations / core materials)
-- Nemesis tier: Brawn 3, Agility 1, Intellect 3, Cunning 4, Willpower 4, Presence 4
INSERT INTO public."SW_campaign_NPC"
  ("Name", "Race", "Description",
   "Brawn", "Agility", "Intellect", "Cunning", "Willpower", "Presence",
   "Soak", "Wound", "Strain",
   "Skills", "Abilities", "Equipment",
   "CampaignID", "Part_of_Place")
VALUES (
  'Jabba the Hutt',
  22,
  'Jabba Desilijic Tiure — the most powerful Hutt crime lord in the Outer Rim. He holds court in his fortified palace in the Dune Sea on Tatooine, surrounded by enforcers, bounty hunters, entertainers, and sycophants. Jabba controls vast smuggling networks, spice operations, and bounty contracting across the Outer Rim. He is ancient by most species'' standards, massively obese even for a Hutt, and utterly without mercy for those who fail or betray him. He does not negotiate from weakness and he does not forgive debts — he collects them, one way or another. He is currently at war with Black Sun over control of Outer Rim smuggling routes, a conflict he views as a minor irritation he will eventually resolve through attrition. Jabba''s published stats are sourced from the FFG Edge of the Empire RPG (Nemesis tier).',
  3, 1, 3, 4, 4, 4,
  6, 22, 20,
  'Coercion, Coercion, Coercion, Coercion, Negotiation, Negotiation, Negotiation, Negotiation, Deception, Deception, Deception, Perception, Perception, Perception, Underworld, Underworld, Underworld, Underworld, Leadership, Leadership, Leadership, Cool, Cool, Cool, Streetwise, Streetwise',
  'Hutt Resilience (Hutts are immune to Force mind-affecting abilities; a Force-user attempting to use a mind trick or compel on Jabba must make a Hard Discipline check or the power automatically fails),Crime Lord (once per session Jabba may call in a favour — summoning a bounty hunter, deploying a gang of enforcers, or placing a price on a target''s head as an out-of-scene action),Bloated Bulk (Jabba cannot be moved by physical force short of heavy machinery; grapple and knockback effects automatically fail),Notorious (all Coercion and Negotiation checks made by Jabba or on his behalf upgrade the dice pool once; all Charm checks made against him downgrade once)',
  'Guards and enforcers (always accompanied by at least 4 Gamorrean guards and a protocol droid), Throne Dais',
  2, 117
);

-- 3. Create Zorba the Hutt as NPC
-- Zorba is Jabba''s father, older and less physically imposing but deeply cunning
-- Rival-tier: Brawn 2, Agility 1, Intellect 3, Cunning 4, Willpower 3, Presence 3
INSERT INTO public."SW_campaign_NPC"
  ("Name", "Race", "Description",
   "Brawn", "Agility", "Intellect", "Cunning", "Willpower", "Presence",
   "Soak", "Wound", "Strain",
   "Skills", "Abilities", "Equipment",
   "CampaignID", "Part_of_Place")
VALUES (
  'Zorba the Hutt',
  22,
  'Zorba Desilijic Tiure — the patriarch of the Desilijic kajidic and father of Jabba the Hutt. An ancient and calculating Hutt who operates primarily out of Ryloth, where he controls significant spice and contraband interests. Unlike his more theatrically brutal son, Zorba prefers leverage over spectacle — he finds it more efficient to own people through debt than to threaten them with death. The party first encountered Zorba at the start of their careers in Episode I: each member had fallen into debt with him, and he summoned them to Ryloth via his protocol droid TC-7 to offer them a way to clear what they owed. His jobs are never simple and the terms always favour him. Zorba is older and less physically imposing than Jabba but no less dangerous — he has survived long enough to outlive rivals, empires, and most of the people who ever thought they had bested him.',
  2, 1, 3, 4, 3, 3,
  5, 18, 16,
  'Coercion, Coercion, Coercion, Negotiation, Negotiation, Negotiation, Negotiation, Deception, Deception, Deception, Perception, Perception, Underworld, Underworld, Underworld, Leadership, Leadership, Cool, Cool, Cool, Streetwise, Streetwise',
  'Hutt Resilience (immune to Force mind-affecting abilities),Debt Collector (Zorba always knows the precise value of what he is owed; when making a Negotiation check in a debt or contract context he adds automatic Advantage equal to his Cunning),Long Memory (Zorba never forgets a betrayal — any character who has previously failed or cheated him adds a Setback die to all social checks made directly to him)',
  'TC-7 (protocol droid attendant), Personal Bodyguard detail, Comlink encrypted',
  2, 22
);

COMMIT;

SELECT id, "Name", "Brawn", "Agility", "Intellect", "Cunning", "Willpower", "Presence", "Soak", "Wound", "Strain", "Part_of_Place"
FROM public."SW_campaign_NPC"
WHERE "Name" IN ('Jabba the Hutt', 'Zorba the Hutt')
ORDER BY id;
