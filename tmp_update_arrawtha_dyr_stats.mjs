import { supabase } from './src/supabaseClient.js';

const campaignId = 2;
const npcName = 'Arrawtha-dyr';
const abilityNames = ['Knockdown', 'Heightened Senses'];
const skillNames = ['Brawl', 'Athletics', 'Perception', 'Survival', 'Vigilance'];
const attack = {
  name: 'Arrawtha-dyr Antlers',
  skill: 3,
  damage: 1,
  critical: 5,
  range: 'Engaged',
  special: '',
};

const { data: npc, error: npcError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, CampaignID, Part_of_Place')
  .eq('CampaignID', campaignId)
  .eq('Name', npcName)
  .single();
if (npcError) throw npcError;

const { data: abilities, error: abilitiesError } = await supabase
  .from('SW_abilities')
  .select('ability')
  .in('ability', abilityNames);
if (abilitiesError) throw abilitiesError;
if (abilities.length !== abilityNames.length) throw new Error('A selected ability is missing from the catalog.');

const { data: skills, error: skillsError } = await supabase
  .from('skills')
  .select('skill')
  .in('skill', skillNames);
if (skillsError) throw skillsError;
if (skills.length !== skillNames.length) throw new Error('A selected skill is missing from the catalog.');

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
  Description: 'A low-threat forest creature native to Kashyyyk, notable for its many-pronged antlers. It is alert but not especially strong, and usually avoids confrontation. If cornered, it lowers its head to drive an attacker back, then tries to escape.',
  Brawn: 2,
  Agility: 2,
  Intellect: 1,
  Cunning: 2,
  Willpower: 2,
  Presence: 1,
  Soak: 2,
  Wound: 8,
  Strain: 0,
  Skills: 'Brawl,Athletics,Perception,Survival,Vigilance',
  Abilities: abilityNames.join(','),
  Equipment: attack.name,
};

const { data: updatedNpc, error: updateError } = await supabase
  .from('SW_campaign_NPC')
  .update(updates)
  .eq('id', npc.id)
  .select('id, Name, Brawn, Agility, Intellect, Cunning, Willpower, Presence, Soak, Wound, Strain, Skills, Abilities, Equipment, CampaignID, Part_of_Place');
if (updateError) throw updateError;

console.log(JSON.stringify({ equipment: attack, npc: updatedNpc }, null, 2));