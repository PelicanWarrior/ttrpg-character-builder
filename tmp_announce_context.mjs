import { supabase } from './src/supabaseClient.js';

const { data: notes, error: notesError } = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name, Part_of_Place')
  .ilike('Place_Name', '%Iron Ring Arena%');
if (notesError) throw notesError;

const parentIds = notes.map((note) => String(note.id));
const { data: npcs, error: npcsError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Race, Part_of_Place')
  .eq('CampaignID', 2)
  .order('id');
if (npcsError) throw npcsError;

const nearbyNpcs = npcs.filter((npc) => String(npc.Part_of_Place ?? '').split(',').some((id) => parentIds.includes(id.trim())));

const { data: races, error: racesError } = await supabase.from('races').select('*').order('id');
if (racesError) throw racesError;

const { data: abilities, error: abilitiesError } = await supabase
  .from('SW_abilities')
  .select('id, ability, activation, description')
  .in('ability', ['Commanding Presence', 'Natural Leader', 'Master Leader', 'Voice of Resonance', 'Notorious', 'Calming Presence', 'Terrifying Presence', 'Grit']);
if (abilitiesError) throw abilitiesError;

console.log(JSON.stringify({ notes, nearbyNpcs, races, abilities }, null, 2));
