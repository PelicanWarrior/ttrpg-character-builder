BEGIN;

DELETE FROM public."SW_note_skill_checks"
WHERE note_id = 104
  AND "CampaignID" = 2
  AND check_name = 'Bridge Blackbox Logs';

INSERT INTO public."SW_note_skill_checks"
(note_id, "CampaignID", check_name, skill_name, difficulty, outcome, effect, order_index)
VALUES
(104, 2, 'Bridge Blackbox Logs', 'Computers', 3, 'Success', 'You recover partially corrupted bridge logs. Repeated references to "our Sith Lord" confirm the command crew watched their master die shortly before the crash. Final entries describe panic, emergency overrides, and a deliberate descent into Malachor''s surface to deny pursuers the relics aboard.', 1),
(104, 2, 'Bridge Blackbox Logs', 'Computers', 3, 'Triumph', 'Along with the standard logs, you decrypt a sealed command fragment naming the master directly: Darth Nihilus. The fragment identifies this vessel as part of his hidden war-fleet movements and confirms the crash happened during his final campaign period.', 2),
(104, 2, 'Bridge Blackbox Logs', 'Computers', 3, 'Despair', 'Most of the archive irreversibly degrades during access, destroying key historical records. Even so, one intact emergency packet survives: the bridge issued a last-order crash vector to preserve cargo and lock out outside boarding parties.', 3);

COMMIT;

SELECT note_id, check_name, skill_name, difficulty, outcome, effect, order_index
FROM public."SW_note_skill_checks"
WHERE note_id = 104
  AND "CampaignID" = 2
  AND check_name = 'Bridge Blackbox Logs'
ORDER BY order_index;
