SELECT "id", "Place_Name", "Part_of_Place"
FROM public."SW_campaign_notes"
WHERE "Part_of_Place" = '111'
  AND "Place_Name" IN ('Heled Intraj', 'Jusa Kovves', 'Enjazzi Ezil')
ORDER BY "id";
