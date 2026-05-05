-- Find Hutt Cartel note
SELECT id, "Place_Name", "Part_of_Place", "CampaignID", "Description"
FROM public."SW_campaign_notes"
WHERE "Place_Name" ILIKE '%Hutt%' AND "CampaignID" = 2;

-- Find Zorba mentions in notes
SELECT id, "Place_Name", "Part_of_Place", left("Description", 300) AS desc
FROM public."SW_campaign_notes"
WHERE "Description" ILIKE '%Zorba%' AND "CampaignID" = 2
ORDER BY id;

-- Check if Jabba or Zorba already exist as NPCs
SELECT id, "Name", "Part_of_Place" FROM public."SW_campaign_NPC"
WHERE "Name" ILIKE '%Jabba%' OR "Name" ILIKE '%Zorba%';
