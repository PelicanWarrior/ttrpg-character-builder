import { supabase } from './src/supabaseClient.js';

const campaignId = 2;

// Abilities needed — check catalog first
const abilitiesToAdd = [
  {
    ability: 'Card Sharp',
    activation: 'Passive',
    description: 'Adds a Boost die to all Cool and Deception checks made during gambling or card games. May re-roll one die on a Gambling check once per session.',
  },
  {
    ability: 'Hard to Read',
    activation: 'Passive',
    description: 'Opponents suffer a Setback die on Charm, Coercion, or Deception checks made against this character to determine their intentions or mood.',
  },
];

// Equipment needed
const equipmentToAdd = [
  {
    name: 'Flask of Corellian Whiskey',
    range: null,
    damage: null,
    critical: null,
    skill: null,
    special: 'Social prop; GM may grant a Boost die to Charm checks when used appropriately.',
  },
];

// Check and insert missing abilities
const { data: existingAbilities } = await supabase
  .from('SW_abilities').select('ability')
  .in('ability', abilitiesToAdd.map((a) => a.ability));
const existingAbilityNames = new Set((existingAbilities || []).map((a) => a.ability));
const newAbilities = abilitiesToAdd.filter((a) => !existingAbilityNames.has(a.ability));
if (newAbilities.length > 0) {
  const { error } = await supabase.from('SW_abilities').insert(newAbilities);
  if (error) throw error;
}

// Check and insert missing equipment
const { data: existingEquipment } = await supabase
  .from('SW_equipment').select('name')
  .in('name', equipmentToAdd.map((e) => e.name));
const existingEquipmentNames = new Set((existingEquipment || []).map((e) => e.name));
const newEquipment = equipmentToAdd.filter((e) => !existingEquipmentNames.has(e.name));
if (newEquipment.length > 0) {
  const { error } = await supabase.from('SW_equipment').insert(newEquipment);
  if (error) throw error;
}

const npcs = [
  {
    Name: 'Sable Drenn',
    Description: 'Human female, mid-30s. A professional sabacc circuit player who drifts between the Uscru dens on a weekly rotation. She is calm to the point of being unsettling, never raises her voice, and always appears to be watching something a few seconds ahead of everyone else. She earns her living at the table and supplements it by selling what she overhears. She is not violent, but she is never without options.',
    Race: 4,
    Brawn: 2, Agility: 2, Intellect: 3, Cunning: 4, Willpower: 3, Presence: 3,
    Soak: 2, Wound: 12, Strain: 13, Force_Rating: 0,
    Skills: 'Cool,Cool,Cool,Deception,Deception,Deception,Perception,Perception,Perception,Skulduggery,Skulduggery,Streetwise,Streetwise',
    Abilities: 'Card Sharp,Hard to Read,Confidence,Composed',
    Equipment: 'Concealed Hold-Out Blaster,Heavy Clothes',
    Force_Abilities: '', PictureID: null, CampaignID: campaignId, Part_of_Place: '167',
  },
  {
    Name: 'Pek Jarrow',
    Description: 'Human male, mid-50s. A former long-haul smuggler who retired to the Uscru tables after one too many close calls on the shipping lanes. He looks like a man who drinks too much and remembers too little, but this is a careful performance. He is sharp, well-connected, and has a gift for putting people at ease right before he takes everything they came in with. He plays Kessel Sabacc like a man who invented it.',
    Race: 4,
    Brawn: 3, Agility: 2, Intellect: 2, Cunning: 3, Willpower: 3, Presence: 3,
    Soak: 3, Wound: 14, Strain: 12, Force_Rating: 0,
    Skills: 'Cool,Cool,Charm,Charm,Charm,Deception,Deception,Streetwise,Streetwise,Streetwise,Underworld,Underworld',
    Abilities: 'Black Market Contacts,Bought Info,Confidence,Convincing Demenor',
    Equipment: 'Holdout Blaster,Heavy Clothes,Flask of Corellian Whiskey',
    Force_Abilities: '', PictureID: null, CampaignID: campaignId, Part_of_Place: '167',
  },
];

// Insert NPCs
const { data: existingNpcs } = await supabase
  .from('SW_campaign_NPC').select('Name')
  .eq('CampaignID', campaignId)
  .in('Name', npcs.map((n) => n.Name));
const existingNpcNames = new Set((existingNpcs || []).map((n) => n.Name));
const newNpcs = npcs.filter((n) => !existingNpcNames.has(n.Name));

let inserted = [];
if (newNpcs.length > 0) {
  const { data, error } = await supabase.from('SW_campaign_NPC').insert(newNpcs).select('id, Name, Part_of_Place');
  if (error) throw error;
  inserted = data || [];
}

console.log(JSON.stringify({
  abilitiesInserted: newAbilities.map((a) => a.ability),
  equipmentInserted: newEquipment.map((e) => e.name),
  npcs: inserted,
}, null, 2));
