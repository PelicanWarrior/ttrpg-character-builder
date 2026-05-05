SELECT id, "Name", "Description", "Abilities", "Skills", "Equipment", "Brawn", "Agility", "Intellect", "Cunning", "Willpower", "Presence"
FROM public."SW_campaign_NPC"
WHERE "CampaignID" = 2 AND ("Name" ILIKE '%nix%' OR "Name" ILIKE '%nyx%')
ORDER BY id;
