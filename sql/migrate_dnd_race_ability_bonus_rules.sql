-- Add flexible ability bonus rules for DND races.
-- This supports mixed models like fixed bonuses plus player-choice bonuses.

ALTER TABLE IF EXISTS "DND_Races"
  ADD COLUMN IF NOT EXISTS "AbilityBonusRules" jsonb;

-- Seed existing rows from legacy fixed bonus columns so current data is preserved.
UPDATE "DND_Races"
SET "AbilityBonusRules" = jsonb_build_object(
  'fixed', (
    SELECT COALESCE(jsonb_agg(item), '[]'::jsonb)
    FROM (
      SELECT jsonb_build_object('stat', 'STRENGTH', 'amount', "AbilityBonus_Str") AS item WHERE COALESCE("AbilityBonus_Str", 0) <> 0
      UNION ALL
      SELECT jsonb_build_object('stat', 'DEXTERITY', 'amount', "AbilityBonus_Dex") AS item WHERE COALESCE("AbilityBonus_Dex", 0) <> 0
      UNION ALL
      SELECT jsonb_build_object('stat', 'CONSTITUTION', 'amount', "AbilityBonus_Con") AS item WHERE COALESCE("AbilityBonus_Con", 0) <> 0
      UNION ALL
      SELECT jsonb_build_object('stat', 'INTELLIGENCE', 'amount', "AbilityBonus_Int") AS item WHERE COALESCE("AbilityBonus_Int", 0) <> 0
      UNION ALL
      SELECT jsonb_build_object('stat', 'WISDOM', 'amount', "AbilityBonus_Wis") AS item WHERE COALESCE("AbilityBonus_Wis", 0) <> 0
      UNION ALL
      SELECT jsonb_build_object('stat', 'CHARISMA', 'amount', "AbilityBonus_Cha") AS item WHERE COALESCE("AbilityBonus_Cha", 0) <> 0
    ) fixed_rows
  ),
  'choices', '[]'::jsonb
)
WHERE "AbilityBonusRules" IS NULL;
