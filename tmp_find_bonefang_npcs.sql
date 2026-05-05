WITH pack AS (
  SELECT id
  FROM public."SW_campaign_notes"
  WHERE "Place_Name" = 'Bonefang Pursuit Pack'
  ORDER BY id
  LIMIT 1
), child_notes AS (
  SELECT n.id, n."Place_Name"
  FROM public."SW_campaign_notes" n
  JOIN pack p ON n."Part_of_Place"::text = p.id::text
), npc_links AS (
  SELECT cn.id AS note_id, cn."Place_Name" AS note_name, npc.id AS npc_id, npc."Name"
  FROM child_notes cn
  LEFT JOIN public."SW_campaign_NPC" npc
    ON npc."Part_of_Place"::text = cn.id::text
)
SELECT * FROM npc_links ORDER BY note_id, npc_id;

SELECT id, "Name", "Race", "Description", "Brawn", "Agility", "Intellect", "Cunning", "Willpower", "Presence", "Skills", "Abilities", "Equipment"
FROM public."SW_campaign_NPC"
WHERE "Name" ILIKE '%Bonefang%' OR "Part_of_Place"::text IN (
  SELECT n.id::text
  FROM public."SW_campaign_notes" n
  WHERE n."Part_of_Place"::text = (
    SELECT id::text
    FROM public."SW_campaign_notes"
    WHERE "Place_Name" = 'Bonefang Pursuit Pack'
    ORDER BY id
    LIMIT 1
  )
)
ORDER BY id;
