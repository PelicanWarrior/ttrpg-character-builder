SELECT id, "Place_Name", "Part_of_Place", "Order", LEFT("Description",100) as desc
FROM public."SW_campaign_notes"
WHERE "CampaignID" = 2
ORDER BY "Order" DESC
LIMIT 20;
