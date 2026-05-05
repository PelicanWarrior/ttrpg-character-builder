-- All notes for Campaign 2 that relate to session events
SELECT id, "Place_Name", "Part_of_Place", "Description"
FROM public."SW_campaign_notes"
WHERE "CampaignID" = 2
  AND ("Place_Name" ILIKE '%Malachor%'
    OR "Place_Name" ILIKE '%Ashen%'
    OR "Place_Name" ILIKE '%IG%'
    OR "Place_Name" ILIKE '%Mustafar%'
    OR "Place_Name" ILIKE '%Nix%'
    OR "Place_Name" ILIKE '%Eril%'
    OR "Place_Name" ILIKE '%Tol%'
    OR "Place_Name" ILIKE '%Vapan%'
    OR "Place_Name" ILIKE '%Lowrrick%'
    OR "Place_Name" ILIKE '%Holocron%'
    OR "Place_Name" ILIKE '%Sith%'
    OR "Place_Name" ILIKE '%Interceptor%')
ORDER BY id;
