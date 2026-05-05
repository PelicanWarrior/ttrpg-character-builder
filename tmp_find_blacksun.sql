SELECT id, "Place_Name", "Part_of_Place", "CampaignID", "Description"
FROM public."SW_campaign_notes"
WHERE "Place_Name" ILIKE '%Black Sun%' AND "CampaignID" = 2;
