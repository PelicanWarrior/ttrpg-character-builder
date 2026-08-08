import { supabase } from './src/supabaseClient.js';

const abilitiesToAdd = [
  {
    ability: 'Silhouette 3',
    activation: 'Passive',
    description: 'The difficulty of an attack made against a character 2 silhouettes larger than the attacker is decreased by 1. The difficulty of an attack made against a character 2 or more silhouettes smaller than the attacker is increased by 1.',
  },
  {
    ability: 'Sweep Attack',
    activation: 'Active (Incidental)',
    description: 'The creature can spend one Advantage on a successful Brawl check to hit the target as well as anyone engaged with the target.',
  },
];

const equipmentToAdd = [
  {
    name: 'Massive Rending Claws',
    skill: 3, // Brawl
    damage: 15,
    critical: 3,
    range: 'Engaged',
    special: 'Knockdown, Sunder',
  },
];

// Check existing abilities
const { data: existingAbilities, error: abErr } = await supabase
  .from('SW_abilities')
  .select('ability')
  .in('ability', abilitiesToAdd.map((a) => a.ability));
if (abErr) throw abErr;

const existingAbilityNames = new Set((existingAbilities || []).map((a) => a.ability));
const newAbilities = abilitiesToAdd.filter((a) => !existingAbilityNames.has(a.ability));

let insertedAbilities = [];
if (newAbilities.length > 0) {
  const { data, error } = await supabase.from('SW_abilities').insert(newAbilities).select('ability');
  if (error) throw error;
  insertedAbilities = data || [];
}

// Check existing equipment
const { data: existingEquipment, error: eqErr } = await supabase
  .from('SW_equipment')
  .select('name')
  .in('name', equipmentToAdd.map((e) => e.name));
if (eqErr) throw eqErr;

const existingEquipmentNames = new Set((existingEquipment || []).map((e) => e.name));
const newEquipment = equipmentToAdd.filter((e) => !existingEquipmentNames.has(e.name));

let insertedEquipment = [];
if (newEquipment.length > 0) {
  const { data, error } = await supabase.from('SW_equipment').insert(newEquipment).select('name');
  if (error) throw error;
  insertedEquipment = data || [];
}

console.log(JSON.stringify({
  abilities: { alreadyExisted: [...existingAbilityNames], inserted: insertedAbilities.map((a) => a.ability) },
  equipment: { alreadyExisted: [...existingEquipmentNames], inserted: insertedEquipment.map((e) => e.name) },
}, null, 2));
