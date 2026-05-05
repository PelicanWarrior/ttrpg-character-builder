SELECT id, "CampaignID", "Place_Name"
FROM public."SW_campaign_notes"
WHERE "CampaignID" = 2
  AND "Place_Name" ILIKE 'R8%'
ORDER BY id;
