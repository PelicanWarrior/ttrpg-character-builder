SELECT column_name
FROM information_schema.columns
WHERE table_schema='public' AND table_name='SW_note_skill_checks'
ORDER BY ordinal_position;
