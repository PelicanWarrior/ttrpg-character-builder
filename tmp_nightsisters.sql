SELECT id, "Place_Name", "Part_of_Place", "CampaignID", LEFT("Description", 100) as desc_preview
FROM public."SW_campaign_notes"
WHERE "Place_Name" ILIKE '%Heled%'
   OR "Place_Name" ILIKE '%Jusa%'
   OR "Place_Name" ILIKE '%Enjazzi%'
   OR "Place_Name" ILIKE '%Carthinia%'
ORDER BY id;
