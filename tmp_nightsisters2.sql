SELECT id, "Place_Name", "Part_of_Place", "CampaignID", LEFT("Description", 100) as desc_preview
FROM public."SW_campaign_notes"
WHERE "Part_of_Place" = '111'
   OR "Part_of_Place"::text = '111'
ORDER BY id;
