SELECT "id", "Name", "CampaignID", "Part_of_Place", LEFT(COALESCE("Description", ''), 120) AS description_preview
FROM public."SW_campaign_NPC"
WHERE "Name" IN ('Heled Intraj', 'Jusa Kovves', 'Enjazzi Ezil')
ORDER BY "id";
