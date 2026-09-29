import { supabase } from './src/supabaseClient.js';

const { data: abilities, error: abilitiesError } = await supabase
  .from('SW_abilities')
  .select('id, ability, description')
  .order('id');
if (abilitiesError) throw abilitiesError;

const { data: skills, error: skillsError } = await supabase
  .from('skills')
  .select('id, skill, stat, type')
  .in('skill', ['Melee', 'Leadership', 'Coercion', 'Discipline', 'Survival', 'Vigilance', 'Resilience', 'Perception']);
if (skillsError) throw skillsError;

const skillIds = skills.map((skill) => skill.id);
const { data: weapons, error: weaponsError } = await supabase
  .from('SW_equipment')
  .select('id, name, skill, range, damage, critical, special, description')
  .in('skill', skillIds)
  .order('id');
if (weaponsError) throw weaponsError;

console.log(JSON.stringify({ abilities, skills, weapons }, null, 2));
