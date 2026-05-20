BEGIN;

DROP POLICY IF EXISTS sw_solo_adventures_select_public ON "Solo_Adventures";
DROP POLICY IF EXISTS sw_solo_adventure_nodes_select_public ON "Solo_Adventure_Nodes";
DROP POLICY IF EXISTS sw_solo_adventure_choices_select_public ON "Solo_Adventure_Choices";
DROP POLICY IF EXISTS sw_solo_adventure_runs_rw_public ON "Solo_Adventure_Runs";

DROP TABLE IF EXISTS "Solo_Adventure_Runs" CASCADE;
DROP TABLE IF EXISTS "Solo_Adventure_Choices" CASCADE;
DROP TABLE IF EXISTS "Solo_Adventure_Nodes" CASCADE;
DROP TABLE IF EXISTS "Solo_Adventures" CASCADE;

ALTER TABLE "Admin_Control"
  DROP COLUMN IF EXISTS "SoloAdventures";

COMMIT;