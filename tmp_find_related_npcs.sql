SELECT id, "Name", "Part_of_Place", "Race", "Description", "Brawn", "Agility", "Intellect", "Cunning", "Willpower", "Presence", "Skills", "Abilities", "Equipment"
FROM public."SW_campaign_NPC"
WHERE "CampaignID" = 2
  AND ("Name" ILIKE '%IG%'
    OR "Name" ILIKE '%Eril%'
    OR "Name" ILIKE '%Nix%'
    OR "Name" ILIKE '%Tol%'
    OR "Name" ILIKE '%Vapan%'
    OR "Name" ILIKE '%Lowrrick%')
ORDER BY id;
