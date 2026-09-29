import { supabase } from './src/supabaseClient.js';

const { data: notes, error: notesError } = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name, Description, Part_of_Place')
  .ilike('Place_Name', '%Iron Ring Arena%');
if (notesError) throw notesError;

const { data: npcs, error: npcsError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Race, Description, Skills, Abilities, Equipment, Part_of_Place, CampaignID')
  .eq('CampaignID', 2)
  .order('id');
if (npcsError) throw npcsError;

const { data: abilities, error: abilitiesError } = await supabase
  .from('SW_abilities')
  .select('id, ability, activation, description')
  .order('id');
if (abilitiesError) throw abilitiesError;

const { data: skills, error: skillsError } = await supabase
  .from('skills')
  .select('id, skill, stat, type')
  .order('id');
if (skillsError) throw skillsError;

console.log(JSON.stringify({ notes, npcs, abilities, skills }, null, 2));
