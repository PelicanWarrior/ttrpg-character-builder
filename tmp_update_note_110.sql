WITH vals AS (
  SELECT
    $$Suggested Check (optional):
- Skill: Knowledge (Lore) or Knowledge (Outer Rim)
- Difficulty: 3
- Success: They identify Jedha and narrow the target region to old kyber excavation zones.
- Advantage: They also uncover a surviving pilgrimage route that avoids Imperial patrol lanes.
- Threat: Their searches create a traceable signal in archived traffic nets.
- Triumph: They identify the exact ruin complex tied to pre-Empire kyber vaults.
- Despair: A rival faction (or Imperial remnant listener) notices the same pattern and starts moving first.$$::text AS old_block,
    $$Ability Checks (optional):

1) Knowledge (Lore) Check
- Difficulty: 3
- Success: They identify Jedha as the world tied to kyber pilgrimages and ancient Force sects.
- Advantage: They also connect the sinkhole-temple image to pre-Empire guardian records, narrowing the search area.
- Threat: Their research is incomplete, adding false leads that cost time.
- Triumph: They pinpoint the exact ruin complex linked to sealed kyber vault routes.
- Despair: A rival Force cult intercepts the same historical query trail and mobilizes first.

2) Knowledge (Outer Rim) Check
- Difficulty: 3
- Success: They chart a viable route to Jedha and identify current safe approach vectors.
- Advantage: They find a low-traffic pilgrimage corridor that avoids major patrol lanes.
- Threat: Their nav data is stale, forcing a risky detour on arrival.
- Triumph: They uncover a hidden smuggler hop that cuts travel time and avoids Imperial scanners.
- Despair: Their route request flags a monitoring net, alerting hostile observers to their destination.$$::text AS new_block,
    $$Suggested Check (optional):$$::text AS start_marker,
    $$- Despair: A rival faction (or Imperial remnant listener) notices the same pattern and starts moving first.$$::text AS end_marker
),
exact_update AS (
  UPDATE public."SW_campaign_notes" n
  SET "Description" = replace(n."Description", v.old_block, v.new_block)
  FROM vals v
  WHERE n.id = 110
    AND position(v.old_block in n."Description") > 0
  RETURNING n.id
),
fallback_update AS (
  UPDATE public."SW_campaign_notes" n
  SET "Description" =
    substr(n."Description", 1, position(v.start_marker in n."Description") - 1)
    || v.new_block
    || substr(
      n."Description",
      position(v.end_marker in n."Description") + char_length(v.end_marker)
    )
  FROM vals v
  WHERE n.id = 110
    AND NOT EXISTS (SELECT 1 FROM exact_update)
    AND position(v.start_marker in n."Description") > 0
    AND position(v.end_marker in n."Description") >= position(v.start_marker in n."Description")
  RETURNING n.id
)
SELECT
  n.id,
  n."Place_Name",
  substring(
    n."Description"
    FROM greatest(1, position('Ability Checks (optional):' in n."Description") - 120)
    FOR 1400
  ) AS description_section,
  CASE
    WHEN EXISTS (SELECT 1 FROM exact_update) THEN 'exact_replace'
    WHEN EXISTS (SELECT 1 FROM fallback_update) THEN 'fallback_overwrite'
    ELSE 'no_change'
  END AS update_mode
FROM public."SW_campaign_notes" n
WHERE n.id = 110;
