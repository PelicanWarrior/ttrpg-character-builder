SELECT id, "Place_Name", "Part_of_Place"
FROM public."SW_campaign_notes"
WHERE "Part_of_Place"::text = '84'
ORDER BY id;
