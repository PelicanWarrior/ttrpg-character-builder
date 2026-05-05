BEGIN;

-- Update Jabba: move Part_of_Place already correct (117), update description to reflect Nal Hutta
UPDATE public."SW_campaign_NPC"
SET "Description" = 'Jabba Desilijic Tiure — the most powerful Hutt crime lord in the Outer Rim and current head of the Hutt Cartel. He holds court on Nal Hutta, the ancestral Hutt homeworld, where he governs the Cartel''s grand strategy and presides over the kajidic councils. He controls vast smuggling networks, spice operations, and bounty contracting across the Outer Rim. He is ancient by most species'' standards, massively obese even for a Hutt, and utterly without mercy for those who fail or betray him. He does not negotiate from weakness and he does not forgive debts — he collects them, one way or another. He is currently directing the Cartel''s low-grade war with Black Sun over control of Outer Rim smuggling routes, a conflict he views as a minor irritation he will eventually resolve through attrition. Jabba''s stats are sourced from the FFG Edge of the Empire RPG (Nemesis tier).'
WHERE "id" = 72;

-- Gardulla Besadii the Elder (female) - Tatooine - Race 22
INSERT INTO public."SW_campaign_NPC"
  ("Name", "Race", "Description",
   "Brawn", "Agility", "Intellect", "Cunning", "Willpower", "Presence",
   "Soak", "Wound", "Strain",
   "Skills", "Abilities", "Equipment",
   "CampaignID", "Part_of_Place")
VALUES (
  'Gardulla the Hutt',
  22,
  'Gardulla Besadii the Elder — a female Hutt crime lord and Grand Hutt Council member, operating primarily from Tatooine. One of the most established Hutt powers on the desert world, Gardulla built her empire through slave trading, gambling rings, and podrace fixing. She is known to have owned several notable slaves over the years, losing them through careless wagers. She carries herself with an air of aristocratic entitlement that masks a viciously calculating mind. On the Council she represents the Besadii kajidic and frequently clashes with Jabba''s Desilijic faction, though she is careful to never let rivalry become outright war. She has deep-rooted Tatooine operations and views the planet as her personal domain, tolerating Jabba''s interests there with barely concealed irritation.',
  3, 1, 3, 3, 3, 3,
  5, 18, 14,
  'Negotiation, Negotiation, Negotiation, Deception, Deception, Deception, Coercion, Coercion, Underworld, Underworld, Underworld, Streetwise, Streetwise, Cool, Cool, Perception, Perception',
  'Hutt Resilience (immune to Force mind-affecting abilities),Slave Broker (when making Negotiation checks involving contracts, labour, or property transactions add automatic Success),Entrenched (Gardulla''s Tatooine operations are so embedded that all checks to gather information about her activities on Tatooine upgrade the difficulty once)',
  'Bodyguard retinue, Luxury dais, Comlink network',
  2, 117
);

-- Ziro Desilijic Tiure (male) - Coruscant Underworld - Race 22
INSERT INTO public."SW_campaign_NPC"
  ("Name", "Race", "Description",
   "Brawn", "Agility", "Intellect", "Cunning", "Willpower", "Presence",
   "Soak", "Wound", "Strain",
   "Skills", "Abilities", "Equipment",
   "CampaignID", "Part_of_Place")
VALUES (
  'Ziro the Hutt',
  22,
  'Ziro Desilijic Tiure — a male Hutt and Council member who operates out of the Coruscant underworld, an unusual posting for a Hutt that speaks to both his ambition and his vanity. Ziro cuts a distinctive figure even among Hutts — tattooed, flamboyant, and possessed of an extravagant personal style at odds with the grim business he conducts. He speaks Basic fluently, which he considers sophisticated; most other Hutts consider it an affectation. He controls smuggling pipelines running through the lower levels of Coruscant and maintains contacts within Senate circles that the other Council members find invaluable. He is not as physically dangerous as other Council members but is arguably the most politically connected, and therefore the most treacherous. He has a gift for knowing what people want to hear and an equally sharp talent for betrayal.',
  2, 1, 3, 4, 2, 4,
  4, 16, 14,
  'Charm, Charm, Charm, Charm, Deception, Deception, Deception, Deception, Negotiation, Negotiation, Negotiation, Coercion, Coercion, Cool, Cool, Cool, Underworld, Underworld, Streetwise, Streetwise',
  'Hutt Resilience (immune to Force mind-affecting abilities),Senate Contacts (once per session may obtain political information or call in a Senate-level favour as an out-of-scene action),Smooth Betrayer (when Ziro breaks an agreement or betrays an ally, he may make a Deception check — success means the target does not realise he was the cause until the end of the scene)',
  'Personal guards, Encrypted datapad with Senate contacts, Luxury apartments on Coruscant Level 1313',
  2, 117
);

-- Arok the Hutt (male) - Nar Shaddaa - Race 22
INSERT INTO public."SW_campaign_NPC"
  ("Name", "Race", "Description",
   "Brawn", "Agility", "Intellect", "Cunning", "Willpower", "Presence",
   "Soak", "Wound", "Strain",
   "Skills", "Abilities", "Equipment",
   "CampaignID", "Part_of_Place")
VALUES (
  'Arok the Hutt',
  22,
  'Arok — a male Hutt and Grand Hutt Council member who controls the Nar Shaddaa operations of the Cartel. Nar Shaddaa, the Smuggler''s Moon, is the single most important transit hub for black market goods in the Outer Rim, and Arok''s control of it makes him indispensable to the Council even if he lacks Jabba''s personal power or Ziro''s political connections. He is blunt and traditional by Hutt standards — he distrusts the political maneuvering of Ziro and the independent ambitions of Gardulla, and he is straightforwardly loyal to the Cartel''s collective interests as long as those interests align with his. He views the war with Black Sun as a business problem to be solved with overwhelming force and resents the slow, strategic approach favoured by Jabba. He runs Nar Shaddaa through a network of gang lieutenants and docking authority bribes, and almost nothing moves through the moon without his cut.',
  3, 1, 2, 3, 3, 3,
  5, 17, 13,
  'Coercion, Coercion, Coercion, Negotiation, Negotiation, Leadership, Leadership, Underworld, Underworld, Underworld, Cool, Cool, Vigilance, Vigilance, Streetwise, Streetwise, Perception',
  'Hutt Resilience (immune to Force mind-affecting abilities),Transit Lord (all smuggling, cargo, and docking checks on Nar Shaddaa automatically fail unless Arok has been paid — or paid off),Council Loyalist (Arok adds Boost to all checks made to resist manipulation or coercion from other Hutt Council members)',
  'Gang lieutenant entourage, Docking authority network on Nar Shaddaa, Personal security detail',
  2, 117
);

-- Update Hutt Cartel note to name all 5 Council members
UPDATE public."SW_campaign_notes"
SET "Description" =
'The Hutt Cartel is one of the most powerful and ancient criminal organisations in the galaxy, operating primarily across the Outer Rim and Hutt Space. Unlike Black Sun — which functions as a structured hierarchical syndicate — the Hutt Cartel is a loose confederacy of Hutt crime lords, each controlling their own territory, enterprises, and enforcers, with only nominal allegiance to the Grand Hutt Council on Nal Hutta.

The Cartel''s influence stretches across smuggling, spice trafficking, slavery, gambling, bounty contracting, and protection rackets. In the Outer Rim where Republic law barely reaches, the Hutts do not merely exist alongside legitimate authority — they replace it. On worlds like Tatooine and Ryloth, the Hutts are the law.

The Cartel is currently engaged in a low-grade war with Black Sun over control of key smuggling routes and spice distribution networks in the Outer Rim. Neither side has moved to open full conflict, but murders, hijackings, and disappearances have been escalating.

--- THE GRAND HUTT COUNCIL ---

The Cartel is nominally governed by the Grand Hutt Council on Nal Hutta, composed of the most powerful Hutt kajidics (clan-families). In practice, strong individual Hutts operate with near-total autonomy as long as they maintain their tribute and do not embarrass the Council.

JABBA DESILIJIC TIURE (Jabba the Hutt) — Nal Hutta
Head of the Hutt Cartel and the most feared Hutt crime lord of the era. Jabba has relocated to Nal Hutta to govern the Cartel''s grand strategy directly. See NPC entry.

ZORBA DESILIJIC TIURE (Zorba the Hutt) — Ryloth
A Hutt crime lord of the Desilijic kajidic. Currently operating out of Ryloth, controlling significant spice and contraband interests. The party first encountered Zorba in Episode I. See NPC entry.

GARDULLA BESADII THE ELDER (Gardulla the Hutt) — Tatooine
A female Hutt and Council member from the Besadii kajidic. Controls slave trading, gambling, and podrace operations on Tatooine. A long-standing rival of the Desilijic family. See NPC entry.

ZIRO DESILIJIC TIURE (Ziro the Hutt) — Coruscant Underworld
A flamboyant male Hutt who unusually operates from the Coruscant underworld. Speaks Basic fluently, maintains Senate contacts, and is the Council''s most politically connected — and most treacherous — member. See NPC entry.

AROK THE HUTT (Arok) — Nar Shaddaa
A blunt, traditional male Hutt who controls Nar Shaddaa, the Smuggler''s Moon. His grip on the galaxy''s most important black market transit hub makes him indispensable to the Council. See NPC entry.'
WHERE "id" = 117;

COMMIT;

SELECT id, "Name", "Brawn", "Agility", "Intellect", "Cunning", "Willpower", "Presence", "Soak", "Wound", "Strain"
FROM public."SW_campaign_NPC"
WHERE "Part_of_Place"::text = '117'
ORDER BY id;
