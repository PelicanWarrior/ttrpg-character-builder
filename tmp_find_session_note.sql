SELECT id, "Place_Name", "Part_of_Place", "CampaignID", "Description"
FROM public."SW_campaign_notes"
WHERE "Place_Name" ILIKE '%28th April%' OR "Place_Name" ILIKE '%April 28%'
ORDER BY id;
