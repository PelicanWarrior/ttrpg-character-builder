import { supabase } from './src/supabaseClient.js';

const { data: npcs, error: npcError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Race, Description, Brawn, Agility, Intellect, Cunning, Willpower, Presence, Soak, Wound, Strain, Skills, Abilities, Equipment, CampaignID, Part_of_Place')
  .ilike('Name', "%Ditzi A'suk%");
if (npcError) throw npcError;

const { data: notes, error: noteError } = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name, Part_of_Place, CampaignID')
  .ilike('Place_Name', '%Uscru Racing Circuit%');
if (noteError) throw noteError;

const abilityNames = ['Natural Charmer', 'Natural Negotiator', 'Nobody\'s Fool 1', 'Natural Leader', 'Heightened Senses'];
const { data: abilities, error: abilityError } = await supabase
  .from('SW_abilities')
  .select('id, ability, activation, description')
  .in('ability', abilityNames);
if (abilityError) throw abilityError;

const skillNames = ['Charm', 'Cool', 'Deception', 'Perception', 'Negotiation', 'Streetwise', 'Vigilance', 'Leadership'];
const { data: skills, error: skillError } = await supabase
  .from('skills')
  .select('id, skill, stat')
  .in('skill', skillNames);
if (skillError) throw skillError;

console.log(JSON.stringify({ npcs, notes, abilities, skills }, null, 2));