import { supabase } from './src/supabaseClient.js';

const campaignId = 2;

const abilitiesToAdd = [
  {
    ability: 'Silhouette 2',
    activation: 'Passive',
    description: 'The difficulty of an attack made against a character 2 silhouettes larger than the attacker is decreased by 1. The difficulty of an attack made against a character 2 or more silhouettes smaller than the attacker is increased by 1.',
  },
  {
    ability: 'Chitinous Hide',
    activation: 'Passive',
    description: 'Natural armoured chitin plating adds +1 melee defence.',
  },
  {
    ability: 'Venomous Bite',
    activation: 'Active (Incidental)',
    description: 'On a hit with a Brawl check, spend 2 Advantage to inflict Poisoned: target suffers 2 strain at the start of each of their turns until they receive a successful Daunting Medicine check or antidote.',
  },
  {
    ability: 'Lamprey Grip',
    activation: 'Active (Incidental)',
    description: 'On a Triumph when hitting with a Brawl check, the creature locks its maw around the target (Ensnare 3 effect). The target must pass a Hard Athletics check to break free.',
  },
  {
    ability: 'Burrower',
    activation: 'Passive',
    description: 'Treats loose terrain (sand, soil, ducts) as normal terrain rather than difficult terrain. Gains a Boost die on Stealth checks while travelling underground.',
  },
  {
    ability: 'Pack Feeder',
    activation: 'Passive',
    description: 'When an allied K\'lor\'slug has already hit the same target this round, this creature adds a Boost die to its Brawl check against that target.',
  },
  {
    ability: 'Venomous Bite (Lesser)',
    activation: 'Active (Incidental)',
    description: 'On a hit with a Brawl check, spend 1 Advantage to inflict a minor venom: target suffers 2 strain per round until treated with an Average Medicine check.',
  },
  {
    ability: 'Skittering Rush',
    activation: 'Active (Maneuver)',
    description: 'Once per encounter, the creature may move two range bands toward a target as a single maneuver instead of one.',
  },
];

// Brawl skill ID is 3
const equipmentToAdd = [
  { name: 'Circular Maw',         skill: 3, damage: 9, critical: 3, range: 'Engaged', special: 'Vicious 2, Ensnare 2' },
  { name: 'Rending Leg Blades',   skill: 3, damage: 6, critical: 4, range: 'Engaged', special: 'Pierce 2' },
  { name: "K'lor'slug Bite",      skill: 3, damage: 5, critical: 4, range: 'Engaged', special: 'Vicious 1' },
];

const npcs = [
  {
    Name: "Greater K'lor'slug",
    Description: "A large serpentine predator native to Noe'ha'on, propelled by many blade-edged legs and armed with a circular lamprey-like maw. Nemesis-tier threat. Venomous and capable of gripping targets in its maw.",
    Race: null,
    Brawn: 5, Agility: 2, Intellect: 1, Cunning: 3, Willpower: 3, Presence: 1,
    Soak: 6, Wound: 30, Strain: 16, Force_Rating: 0,
    Skills: 'Brawl,Brawl,Brawl,Perception,Perception,Resilience,Resilience,Resilience,Survival,Survival,Vigilance,Vigilance',
    Abilities: 'Silhouette 2,Chitinous Hide,Venomous Bite,Lamprey Grip,Burrower',
    Equipment: 'Circular Maw,Rending Leg Blades',
    Force_Abilities: '', PictureID: null, CampaignID: campaignId, Part_of_Place: '196',
  },
  {
    Name: "Lesser K'lor'slug",
    Description: "A smaller, faster variant of the K'lor'slug, known as Broodlings or Foragers. Rival-tier threat. Hunts in packs and uses venom to wear down prey.",
    Race: null,
    Brawn: 3, Agility: 3, Intellect: 1, Cunning: 2, Willpower: 2, Presence: 1,
    Soak: 3, Wound: 12, Strain: 0, Force_Rating: 0,
    Skills: 'Brawl,Brawl,Stealth,Stealth,Survival,Survival,Vigilance',
    Abilities: 'Pack Feeder,Venomous Bite (Lesser),Burrower,Skittering Rush',
    Equipment: "K'lor'slug Bite",
    Force_Abilities: '', PictureID: null, CampaignID: campaignId, Part_of_Place: '196',
  },
];

// Insert missing abilities
const { data: existingAbilities } = await supabase
  .from('SW_abilities').select('ability')
  .in('ability', abilitiesToAdd.map((a) => a.ability));
const existingAbilityNames = new Set((existingAbilities || []).map((a) => a.ability));
const newAbilities = abilitiesToAdd.filter((a) => !existingAbilityNames.has(a.ability));
if (newAbilities.length > 0) {
  const { error } = await supabase.from('SW_abilities').insert(newAbilities);
  if (error) throw error;
}

// Insert missing equipment
const { data: existingEquipment } = await supabase
  .from('SW_equipment').select('name')
  .in('name', equipmentToAdd.map((e) => e.name));
const existingEquipmentNames = new Set((existingEquipment || []).map((e) => e.name));
const newEquipment = equipmentToAdd.filter((e) => !existingEquipmentNames.has(e.name));
if (newEquipment.length > 0) {
  const { error } = await supabase.from('SW_equipment').insert(newEquipment);
  if (error) throw error;
}

// Insert NPCs (skip if already present)
const { data: existingNpcs } = await supabase
  .from('SW_campaign_NPC').select('Name')
  .eq('CampaignID', campaignId)
  .in('Name', npcs.map((n) => n.Name));
const existingNpcNames = new Set((existingNpcs || []).map((n) => n.Name));
const newNpcs = npcs.filter((n) => !existingNpcNames.has(n.Name));

let insertedNpcs = [];
if (newNpcs.length > 0) {
  const { data, error } = await supabase.from('SW_campaign_NPC').insert(newNpcs).select('id, Name, Part_of_Place');
  if (error) throw error;
  insertedNpcs = data || [];
}

console.log(JSON.stringify({
  abilitiesInserted: newAbilities.map((a) => a.ability),
  equipmentInserted: newEquipment.map((e) => e.name),
  npcs: insertedNpcs,
}, null, 2));
