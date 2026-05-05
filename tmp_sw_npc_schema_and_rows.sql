SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'SW_campaign_NPC'
ORDER BY ordinal_position;

SELECT "id", "Name", "CampaignID", "location", LEFT(COALESCE("Description", ''), 200) AS description_preview
FROM public."SW_campaign_NPC"
WHERE "Name" IN ('Heled Intraj', 'Jusa Kovves', 'Enjazzi Ezil')
ORDER BY "id";
