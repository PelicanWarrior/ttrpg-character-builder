import { supabase } from './src/supabaseClient.js';

const { data: notes, error: notesError } = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name, Part_of_Place')
  .eq('CampaignID', 2)
  .ilike('Place_Name', '%Zero Dawn Speedworks%');
if (notesError) throw notesError;

const parentIds = notes.map((note) => String(note.id));
const { data: npcs, error: npcsError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Race, Description, Skills, Abilities, Equipment, Part_of_Place, CampaignID')
  .eq('CampaignID', 2)
  .order('id');
if (npcsError) throw npcsError;

const linkedNpcs = npcs.filter((npc) =>
  String(npc.Part_of_Place ?? '').split(',').some((id) => parentIds.includes(id.trim()))
);

const { data: abilities, error: abilitiesError } = await supabase
  .from('SW_abilities')
  .select('id, ability, activation, description')
  .order('id');
if (abilitiesError) throw abilitiesError;

console.log(JSON.stringify({ notes, linkedNpcs, abilities }, null, 2));
