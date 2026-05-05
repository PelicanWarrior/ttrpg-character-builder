BEGIN;

-- Create new child note for The Grand Hutt Council under The Hutt Cartel (117)
INSERT INTO public."SW_campaign_notes"
  ("Place_Name", "Part_of_Place", "CampaignID", "Description")
VALUES (
  'The Grand Hutt Council',
  117,
  2,
  'The Grand Hutt Council is the de facto ruling body of the Hutt species and the highest authority in all of Hutt-controlled space. The council is composed of the most influential and high-profile Hutt leaders; its members are responsible for the day-to-day affairs of Hutt Space. Despite a pretense of legitimacy, its kleptocratic government reflects the corrupt nature of its enterprises, being prone to instability as Hutt families engage in endless shadow wars against their rivals.

When dealing with a foreign power, the Council elects one of their own to act as Head of State. Each member operates with near-total autonomy as long as they maintain their tribute and do not embarrass the Council.

--- CURRENT MEMBERS ---

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
);

-- Strip the Council section from The Hutt Cartel note (117), keeping only the overview
UPDATE public."SW_campaign_notes"
SET "Description" =
'The Hutt Cartel is one of the most powerful and ancient criminal organisations in the galaxy, operating primarily across the Outer Rim and Hutt Space. Unlike Black Sun — which functions as a structured hierarchical syndicate — the Hutt Cartel is a loose confederacy of Hutt crime lords, each controlling their own territory, enterprises, and enforcers, with only nominal allegiance to the Grand Hutt Council on Nal Hutta.

The Cartel''s influence stretches across smuggling, spice trafficking, slavery, gambling, bounty contracting, and protection rackets. In the Outer Rim where Republic law barely reaches, the Hutts do not merely exist alongside legitimate authority — they replace it. On worlds like Tatooine and Ryloth, the Hutts are the law.

The Cartel is currently engaged in a low-grade war with Black Sun over control of key smuggling routes and spice distribution networks in the Outer Rim. Neither side has moved to open full conflict, but murders, hijackings, and disappearances have been escalating.'
WHERE "id" = 117;

COMMIT;

SELECT id, "Place_Name", "Part_of_Place" FROM public."SW_campaign_notes"
WHERE "id" = 117 OR "Part_of_Place"::text = '117'
ORDER BY id;
