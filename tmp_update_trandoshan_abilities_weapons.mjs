import { supabase } from './src/supabaseClient.js';

const campaignId = 2;
const weaponDefinitions = [
  {
    name: "Drok's Mechanical Hookarm",
    skill: 3,
    damage: 2,
    critical: 5,
    range: 'Engaged',
    special: 'Ensnare 1',
  },
];

const npcDefinitions = [
  {
    Name: 'Drok Hookarm',
    Abilities: 'Knockdown,Natural Brawler',
    Equipment: "Drok's Mechanical Hookarm,Vibro-Axe",
  },
  {
    Name: 'Sszek Yellowmark',
    Abilities: 'Heightened Senses,Natural Outdoorsman,Quick Strike',
    Equipment: 'Blaster Pistol,Vibro Knife',
  },
  {
    Name: "Vek'thar Pale-Eye",
    Abilities: "Sniper's Eye,True Aim,Lethal Blows",
    Equipment: 'Cycler Rifle,Heavy Blaster Pistol',
  },
];

const requestedAbilities = [...new Set(npcDefinitions.flatMap((npc) => npc.Abilities.split(',')))];
const { data: catalogAbilities, error: abilityError } = await supabase
  .from('SW_abilities')
  .select('ability')
  .in('ability', requestedAbilities);
if (abilityError) throw abilityError;
const catalogAbilityNames = new Set((catalogAbilities ?? []).map((entry) => entry.ability));
const missingAbilities = requestedAbilities.filter((ability) => !catalogAbilityNames.has(ability));
if (missingAbilities.length) throw new Error(`Missing catalog abilities: ${missingAbilities.join(', ')}`);

const requestedEquipment = [
  ...npcDefinitions.flatMap((npc) => npc.Equipment.split(',')),
  ...weaponDefinitions.map((weapon) => weapon.name),
];
const { data: catalogEquipment, error: equipmentError } = await supabase
  .from('SW_equipment')
  .select('name')
  .in('name', [...new Set(requestedEquipment)]);
if (equipmentError) throw equipmentError;
const catalogEquipmentNames = new Set((catalogEquipment ?? []).map((entry) => entry.name));
const missingExistingEquipment = ['Vibro-Axe', 'Blaster Pistol', 'Vibro Knife', 'Cycler Rifle', 'Heavy Blaster Pistol']
  .filter((name) => !catalogEquipmentNames.has(name));
if (missingExistingEquipment.length) {
  throw new Error(`Missing catalog weapons: ${missingExistingEquipment.join(', ')}`);
}

for (const weapon of weaponDefinitions) {
  if (catalogEquipmentNames.has(weapon.name)) {
    const { error } = await supabase.from('SW_equipment').update(weapon).eq('name', weapon.name);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('SW_equipment').insert([weapon]);
    if (error) throw error;
  }
}

const { data: existingNpcs, error: npcLookupError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name')
  .eq('CampaignID', campaignId)
  .in('Name', npcDefinitions.map((npc) => npc.Name));
if (npcLookupError) throw npcLookupError;
if (existingNpcs?.length !== npcDefinitions.length) {
  throw new Error(`Expected ${npcDefinitions.length} NPCs, found ${existingNpcs?.length ?? 0}.`);
}

const npcIds = new Map(existingNpcs.map((npc) => [npc.Name, npc.id]));
const updatedNpcs = [];
for (const definition of npcDefinitions) {
  const { data, error } = await supabase
    .from('SW_campaign_NPC')
    .update({ Abilities: definition.Abilities, Equipment: definition.Equipment })
    .eq('id', npcIds.get(definition.Name))
    .select('id, Name, Abilities, Equipment, Skills, Part_of_Place');
  if (error) throw error;
  updatedNpcs.push(...(data ?? []));
}

console.log(JSON.stringify({
  abilities: requestedAbilities,
  customWeapon: weaponDefinitions,
  npcs: updatedNpcs,
}, null, 2));