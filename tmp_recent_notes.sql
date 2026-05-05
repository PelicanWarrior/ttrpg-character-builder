SELECT id, "Place_Name", "Part_of_Place", "CampaignID"
FROM public."SW_campaign_notes"
WHERE "CampaignID" = 2 AND id > 110
ORDER BY id;
