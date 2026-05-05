BEGIN;

-- 1) Find parent note candidates
WITH parent_matches AS (
  SELECT id, "Place_Name", "CampaignID"
  FROM public."SW_campaign_notes"
  WHERE LOWER("Place_Name") IN (
    LOWER('NARRARIVE EPISODE II'),
    LOWER('NARRATIVE EPISODE II')
  )
)
SELECT id, "Place_Name", "CampaignID"
FROM parent_matches
ORDER BY "CampaignID", id;

-- 2-6) Insert child note under selected parent and return inserted row
WITH chosen_parent AS (
  SELECT id, "CampaignID", "Place_Name"
  FROM public."SW_campaign_notes"
  WHERE LOWER("Place_Name") IN (
    LOWER('NARRARIVE EPISODE II'),
    LOWER('NARRATIVE EPISODE II')
  )
  ORDER BY
    CASE
      WHEN LOWER("Place_Name") = LOWER('NARRATIVE EPISODE II') THEN 1
      WHEN LOWER("Place_Name") = LOWER('NARRARIVE EPISODE II') THEN 2
      ELSE 3
    END,
    id
  LIMIT 1
),
next_order AS (
  SELECT COALESCE(MAX(n."Order"), 0) + 1 AS next_order
  FROM public."SW_campaign_notes" n
  WHERE n."Part_of_Place" = (SELECT cp.id::text FROM chosen_parent cp)
    AND n."CampaignID" = (SELECT cp."CampaignID" FROM chosen_parent cp)
),
inserted AS (
  INSERT INTO public."SW_campaign_notes"
    ("Place_Name", "Description", "Part_of_Place", "CampaignID", "Order")
  SELECT
    'Holocron Vision - The Shards of Jedha',
    $$The force-sensitive character feels a sudden pulse from IG-07's chassis as the hidden Sith holocron awakens. The room falls silent. Sound drains away. Their vision fractures into a sequence of burning images:

1) A broken moon hanging low over a desert horizon.
2) A canyon city carved in pale stone, crowded with pilgrims and weathered prayer towers.
3) Crystal caverns lit by cold blue-white light beneath ancient ruins.
4) A circular sinkhole-temple marked by black glass and collapsed statues.
5) A star map that keeps redrawing one point while a whisper repeats: "Find where faith was mined into fire."

The vision ends with the holocron projecting a fragmented coordinate string and a glyph that can be matched to old Republic navigation archives.

Planet Solution: Jedha.

How Players Solve It:
- The group must investigate the clues and identify the planet from the five images.
- This can be done through in-world research, old star charts, library terminals, or asking NPC scholars.
- Once they identify Jedha, the party can begin searching for the specific ruin indicated by the sinkhole-temple symbol.

Suggested Check (optional):
- Skill: Knowledge (Lore) or Knowledge (Outer Rim)
- Difficulty: 3
- Success: They identify Jedha and narrow the target region to old kyber excavation zones.
- Advantage: They also uncover a surviving pilgrimage route that avoids Imperial patrol lanes.
- Threat: Their searches create a traceable signal in archived traffic nets.
- Triumph: They identify the exact ruin complex tied to pre-Empire kyber vaults.
- Despair: A rival faction (or Imperial remnant listener) notices the same pattern and starts moving first.

GM Use:
This note transitions the campaign off Malachor V and points the crew toward a planet-hunt arc. Keep Darth Nihilus references limited to prior discoveries; this vision should focus on destination mystery, not additional identity reveals.$$,
    cp.id::text,
    cp."CampaignID",
    no.next_order
  FROM chosen_parent cp
  CROSS JOIN next_order no
  RETURNING id, "Place_Name", "Part_of_Place", "CampaignID"
)
SELECT id, "Place_Name", "Part_of_Place", "CampaignID"
FROM inserted;

COMMIT;
