SELECT id, name FROM public."races" WHERE name ILIKE '%rodian%' OR name ILIKE '%trandoshan%' OR name ILIKE '%weequay%' OR name ILIKE '%falleen%' ORDER BY id;
-- Also find Nyx player character for backstory context
SELECT id, "Name", "Part_of_Place", "CampaignID", "Description", "Abilities" FROM public."SW_campaign_NPC" WHERE "Name" ILIKE '%nix%' OR "Name" ILIKE '%nyx%' AND "CampaignID" = 2 ORDER BY id;
