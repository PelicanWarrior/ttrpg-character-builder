SELECT
  id,
  "Place_Name",
  CASE
    WHEN position('Ability Checks (optional):' in "Description") > 0 THEN
      substring(
        "Description"
        FROM greatest(1, position('Ability Checks (optional):' in "Description") - 80)
        FOR 1300
      )
    ELSE 'Ability Checks section not found.'
  END AS description_section
FROM public."SW_campaign_notes"
WHERE id = 110;
