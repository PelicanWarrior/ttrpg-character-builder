-- 1) note id for place name like R8% in campaign 2
SELECT id, "CampaignID", "Place_Name"
FROM public."SW_campaign_notes"
WHERE "CampaignID" = 2
  AND "Place_Name" ILIKE 'R8%'
ORDER BY id;

-- 2) columns for SW_note_skill_checks from information_schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name ILIKE 'sw_note_skill_checks'
ORDER BY ordinal_position;

-- 3) existing skill check rows for that note id set
SELECT sc.*
FROM public."SW_note_skill_checks" sc
JOIN public."SW_campaign_notes" n ON n.id = sc.note_id
WHERE n."CampaignID" = 2
  AND n."Place_Name" ILIKE 'R8%'
ORDER BY sc.check_name, sc.outcome;
