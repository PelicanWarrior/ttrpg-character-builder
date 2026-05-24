BEGIN;

ALTER TABLE "Solo_Adventures" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Solo_Adventure_Pages" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Solo_Adventure_Choices" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Solo_Adventure_Choice_Skill_Checks" DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "solo_adventures_all" ON "Solo_Adventures";
DROP POLICY IF EXISTS "solo_adventure_pages_all" ON "Solo_Adventure_Pages";
DROP POLICY IF EXISTS "solo_adventure_choices_all" ON "Solo_Adventure_Choices";
DROP POLICY IF EXISTS "solo_adventure_choice_checks_all" ON "Solo_Adventure_Choice_Skill_Checks";

COMMIT;
