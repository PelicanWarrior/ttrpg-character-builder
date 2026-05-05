SELECT sc.*
FROM public."SW_note_skill_checks" sc
JOIN public."SW_campaign_notes" n ON n.id = sc.note_id
WHERE n."CampaignID" = 2
  AND n."Place_Name" ILIKE 'R8%'
ORDER BY sc.check_name, sc.outcome;
