import { supabase } from './src/supabaseClient.js';

const campaignId = 2;
const npcName = "Ditzi A'suk";
const skillNames = ['Charm', 'Charm', 'Cool', 'Negotiation', 'Streetwise', 'Vigilance'];
const uniqueSkillNames = [...new Set(skillNames)];
const abilityNames = ['Natural Charmer', 'Natural Negotiator', 'Heightened Senses'];

const { data: npc, error: npcError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name')
  .eq('CampaignID', campaignId)
  .eq('Name', npcName)
  .single();
if (npcError) throw npcError;

const { data: skills, error: skillsError } = await supabase
  .from('skills')
  .select('skill')
  .in('skill', uniqueSkillNames);
if (skillsError) throw skillsError;
if (skills.length !== uniqueSkillNames.length) throw new Error('A selected skill is missing from the catalog.');

const { data: abilities, error: abilitiesError } = await supabase
  .from('SW_abilities')
  .select('ability')
  .in('ability', abilityNames);
if (abilitiesError) throw abilitiesError;
if (abilities.length !== abilityNames.length) throw new Error('A selected ability is missing from the catalog.');

const { data, error } = await supabase
  .from('SW_campaign_NPC')
  .update({ Skills: skillNames.join(','), Abilities: abilityNames.join(',') })
  .eq('id', npc.id)
  .select('id, Name, Skills, Abilities, Part_of_Place');
if (error) throw error;

console.log(JSON.stringify({ updated: data }, null, 2));