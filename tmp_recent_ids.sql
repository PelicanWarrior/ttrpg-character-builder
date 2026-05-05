SELECT id, "Place_Name", "Part_of_Place", "CampaignID", LEFT("Description", 200) as desc
FROM public."SW_campaign_notes"
WHERE id >= 108
ORDER BY id;
