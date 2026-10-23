import { supabase } from './src/supabaseClient.js';

const campaignId = 2;
const npcName = 'Flame Beetle';
const ability = {
  ability: 'Volatile Chemical Combustion',
  activation: 'Passive',
  description: 'Once per encounter, when an enemy moves to Engaged range or when the beetle is incapacitated (whichever happens first), its volatile abdomen combusts. Each character within Engaged range, including allies, suffers 3 damage before soak. This effect has no attack roll and can trigger only once.',
};
const attack = {
  name: 'Flame Beetle Mandibles',
  skill: 3,
  damage: 1,
  critical: 5,
  range: 'Engaged',
  special: '',
};

const { data: npc, error: npcError } = await supabase
  .from('SW_campaign_NPC')
  .select('id')
  .eq('CampaignID', campaignId)
  .eq('Name', npcName)
  .single();
if (npcError) throw npcError;

const { data: existingAbility, error: abilityLookupError } = await supabase
  .from('SW_abilities')
  .select('id')
  .eq('ability', ability.ability);
if (abilityLookupError) throw abilityLookupError;
if (existingAbility?.length) {
  const { error } = await supabase
    .from('SW_abilities')
    .update({ activation: ability.activation, description: ability.description })
    .eq('id', existingAbility[0].id);
  if (error) throw error;
} else {
  const { error } = await supabase.from('SW_abilities').insert([ability]);
  if (error) throw error;
}

const { data: existingAttack, error: attackLookupError } = await supabase
  .from('SW_equipment')
  .select('name')
  .eq('name', attack.name);
if (attackLookupError) throw attackLookupError;
if (existingAttack?.length) {
  const { error } = await supabase
    .from('SW_equipment')
    .update(attack)
    .eq('name', attack.name);
  if (error) throw error;
} else {
  const { error } = await supabase.from('SW_equipment').insert([attack]);
  if (error) throw error;
}

const updates = {
  Brawn: 1,
  Agility: 2,
  Intellect: 1,
  Cunning: 2,
  Willpower: 1,
  Presence: 1,
  Soak: 1,
  Wound: 5,
  Strain: 0,
  Skills: 'Brawl,Coordination,Perception,Stealth,Survival',
  Abilities: ability.ability,
  Equipment: attack.name,
};

const { data: updatedNpc, error: updateError } = await supabase
  .from('SW_campaign_NPC')
  .update(updates)
  .eq('id', npc.id)
  .select('id, Name, Brawn, Agility, Intellect, Cunning, Willpower, Presence, Soak, Wound, Strain, Skills, Abilities, Equipment, CampaignID, Part_of_Place');
if (updateError) throw updateError;

console.log(JSON.stringify({ ability, attack, npc: updatedNpc }, null, 2));