import { supabase } from './src/supabaseClient.js';

const campaignId = 2;

const abilitiesToAdd = [
  {
    ability: 'Stunning Blow',
    activation: 'Active (Incidental)',
    description: 'May inflict damage as Strain instead of Wounds; does not ignore Soak.',
  },
  {
    ability: 'Camouflaged (Snow)',
    activation: 'Passive',
    description: 'When in snowy environments, add a Boost die to all Stealth checks.',
  },
  {
    ability: 'Suited to the Cold',
    activation: 'Passive',
    description: 'Immune to the effects of freezing and cold environments.',
  },
];

const equipmentToAdd = [
  {
    name: 'Claws',
    skill: 3, // Brawl
    damage: 8,
    critical: 3,
    range: 'Engaged',
    special: 'Pierce 3, Vicious 2',
  },
];

// Insert missing abilities
const { data: existingAbilities } = await supabase
  .from('SW_abilities')
  .select('ability')
  .in('ability', abilitiesToAdd.map((a) => a.ability));

const existingAbilityNames = new Set((existingAbilities || []).map((a) => a.ability));
const newAbilities = abilitiesToAdd.filter((a) => !existingAbilityNames.has(a.ability));
if (newAbilities.length > 0) {
  const { error } = await supabase.from('SW_abilities').insert(newAbilities);
  if (error) throw error;
}

// Insert missing equipment
const { data: existingEquipment } = await supabase
  .from('SW_equipment')
  .select('name')
  .in('name', equipmentToAdd.map((e) => e.name));

const existingEquipmentNames = new Set((existingEquipment || []).map((e) => e.name));
const newEquipment = equipmentToAdd.filter((e) => !existingEquipmentNames.has(e.name));
if (newEquipment.length > 0) {
  const { error } = await supabase.from('SW_equipment').insert(newEquipment);
  if (error) throw error;
}

// Insert the NPC
const npc = {
  Name: 'Wampa',
  Description: 'A large predatory creature native to the ice plains of Hoth. Rival-tier threat. Camouflages in snow and is immune to freezing cold.',
  Race: null,
  Brawn: 5,
  Agility: 2,
  Intellect: 1,
  Cunning: 3,
  Willpower: 1,
  Presence: 1,
  Soak: 6,
  Wound: 20,
  Strain: 0,
  Force_Rating: 0,
  Skills: 'Brawl,Brawl,Brawl,Resilience,Resilience,Resilience,Stealth,Stealth,Stealth,Survival,Survival,Survival',
  Abilities: 'Stunning Blow,Camouflaged (Snow),Suited to the Cold',
  Equipment: 'Claws',
  Force_Abilities: '',
  PictureID: null,
  CampaignID: campaignId,
  Part_of_Place: '196',
};

const { data: existingNpc } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name')
  .eq('CampaignID', campaignId)
  .eq('Name', npc.Name);

if (existingNpc && existingNpc.length > 0) {
  console.log('Already exists:', JSON.stringify(existingNpc));
} else {
  const { data, error } = await supabase
    .from('SW_campaign_NPC')
    .insert([npc])
    .select('id, Name, Part_of_Place');
  if (error) throw error;
  console.log(JSON.stringify({
    abilitiesInserted: newAbilities.map((a) => a.ability),
    equipmentInserted: newEquipment.map((e) => e.name),
    npc: data,
  }, null, 2));
}
