import { supabase } from './src/supabaseClient.js';

const abilityNames = ['Grit', 'Toughened', 'Durable', 'Knockdown', 'Lethal Blows', 'Feral Strength', 'Frenzied Attack', 'Adversary'];
const { data: abilities, error: abilitiesError } = await supabase
  .from('SW_abilities')
  .select('id, ability, activation, description')
  .in('ability', abilityNames);
if (abilitiesError) throw abilitiesError;

const { data: meleeSkill, error: skillError } = await supabase
  .from('skills')
  .select('id, skill, stat')
  .eq('skill', 'Melee')
  .single();
if (skillError) throw skillError;

const { data: weapons, error: weaponsError } = await supabase
  .from('SW_equipment')
  .select('id, name, skill, range, damage, critical, special, description')
  .eq('skill', meleeSkill.id)
  .order('id');
if (weaponsError) throw weaponsError;

console.log(JSON.stringify({ meleeSkill, abilities, weapons }, null, 2));
