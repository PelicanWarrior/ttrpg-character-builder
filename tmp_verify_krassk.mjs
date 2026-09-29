import { supabase } from './src/supabaseClient.js';

const abilityNames = ['Grit', 'Lethal Blows', 'Toughened', 'Knockdown', 'Feral Strength'];
const weaponNames = ['Skullsplitter Vibro-Axe', 'Duur’kaj Vibroblade', 'Ancestral Vibro-Spear'];

const { data: abilities, error: abilitiesError } = await supabase
  .from('SW_abilities')
  .select('id, ability')
  .in('ability', abilityNames);
if (abilitiesError) throw abilitiesError;

const { data: weapons, error: weaponsError } = await supabase
  .from('SW_equipment')
  .select('id, name, skill')
  .in('name', weaponNames);
if (weaponsError) throw weaponsError;

const { data: melee, error: meleeError } = await supabase
  .from('skills')
  .select('id, skill')
  .eq('skill', 'Melee')
  .single();
if (meleeError) throw meleeError;

if (abilities.length !== abilityNames.length) throw new Error('One or more abilities are missing from the catalog.');
if (weapons.length !== weaponNames.length) throw new Error('One or more weapons are missing from the catalog.');
if (weapons.some((weapon) => weapon.skill !== melee.id)) throw new Error('One or more weapons are not Melee weapons.');

console.log(JSON.stringify({ abilities, weapons, meleeSkill: melee }, null, 2));
