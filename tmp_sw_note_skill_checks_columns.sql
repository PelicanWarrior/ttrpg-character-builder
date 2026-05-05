SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name ILIKE 'sw_note_skill_checks'
ORDER BY table_name, ordinal_position;
