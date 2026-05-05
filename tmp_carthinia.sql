SELECT id, "Place_Name", "CampaignID", "Part_of_Place"
FROM public."SW_campaign_notes"
WHERE "Place_Name" ILIKE '%Carthinia%';
