SELECT id, "Name", "Part_of_Place", "Race", "Brawn", "Agility", "Intellect", "Cunning", "Willpower", "Presence", "Skills", "Abilities", "Equipment"
FROM public."SW_campaign_NPC"
WHERE "Part_of_Place"::text = '84' OR "Name" ILIKE '%Bonefang%'
ORDER BY id;
