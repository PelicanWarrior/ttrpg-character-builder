SELECT id, "Place_Name", "Part_of_Place", "CampaignID"
FROM public."SW_campaign_notes"
WHERE "Place_Name" ILIKE '%Bonefang%'
ORDER BY id;
