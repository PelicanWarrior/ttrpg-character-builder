BEGIN;

DELETE FROM public."SW_note_skill_checks"
WHERE note_id = 110
  AND check_name IN ('Identify Jedha Through Vision', 'Chart Safe Route to Jedha');

INSERT INTO public."SW_note_skill_checks" (note_id, "CampaignID", check_name, skill_name, difficulty, outcome, effect, order_index)
VALUES
  (110, 2, 'Identify Jedha Through Vision', 'Knowledge (Lore)', 3, 'Success', 'They identify Jedha as the world tied to kyber pilgrimages and ancient Force sects.', 1),
  (110, 2, 'Identify Jedha Through Vision', 'Knowledge (Lore)', 3, 'Failure', 'They cannot confidently identify the world from the vision alone and must gather more data before acting.', 2),
  (110, 2, 'Identify Jedha Through Vision', 'Knowledge (Lore)', 3, 'Advantage', 'They connect the sinkhole-temple image to pre-Empire guardian records, narrowing the search area.', 3),
  (110, 2, 'Identify Jedha Through Vision', 'Knowledge (Lore)', 3, 'Disadvantage', 'Their research includes contradictory references, adding false leads and wasted time.', 4),
  (110, 2, 'Identify Jedha Through Vision', 'Knowledge (Lore)', 3, 'Triumph', 'They pinpoint the exact ruin complex linked to sealed kyber vault routes.', 5),
  (110, 2, 'Identify Jedha Through Vision', 'Knowledge (Lore)', 3, 'Despair', 'A rival Force cult intercepts the same historical query trail and mobilizes first.', 6),
  (110, 2, 'Chart Safe Route to Jedha', 'Knowledge (Outer Rim)', 3, 'Success', 'They chart a viable route to Jedha and identify current safe approach vectors.', 1),
  (110, 2, 'Chart Safe Route to Jedha', 'Knowledge (Outer Rim)', 3, 'Failure', 'Their route solution is incomplete and leaves major hazards unresolved.', 2),
  (110, 2, 'Chart Safe Route to Jedha', 'Knowledge (Outer Rim)', 3, 'Advantage', 'They find a low-traffic pilgrimage corridor that avoids major patrol lanes.', 3),
  (110, 2, 'Chart Safe Route to Jedha', 'Knowledge (Outer Rim)', 3, 'Disadvantage', 'Their nav data is stale, forcing a risky detour on arrival.', 4),
  (110, 2, 'Chart Safe Route to Jedha', 'Knowledge (Outer Rim)', 3, 'Triumph', 'They uncover a hidden smuggler hop that cuts travel time and avoids Imperial scanners.', 5),
  (110, 2, 'Chart Safe Route to Jedha', 'Knowledge (Outer Rim)', 3, 'Despair', 'Their route request flags a monitoring net, alerting hostile observers to their destination.', 6);

COMMIT;

SELECT check_name, skill_name, difficulty, outcome, order_index
FROM public."SW_note_skill_checks"
WHERE note_id = 110
  AND check_name IN ('Identify Jedha Through Vision', 'Chart Safe Route to Jedha')
ORDER BY check_name, order_index;
