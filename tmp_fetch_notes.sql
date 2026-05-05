SELECT "id", "Place_Name", "Part_of_Place", LEFT("Description", 80) AS description_preview
FROM public."SW_campaign_notes"
WHERE "CampaignID" = 2
ORDER BY "id";
