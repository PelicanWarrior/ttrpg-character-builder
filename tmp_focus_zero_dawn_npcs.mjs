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
  .select('id, Name, Race, Description, Skills, Abilities, Equipment, Part_of_Place')
  .eq('CampaignID', 2)
  .order('id');
if (npcsError) throw npcsError;

const linkedNpcs = npcs.filter((npc) =>
  String(npc.Part_of_Place ?? '').split(',').some((id) => parentIds.includes(id.trim()))
);

const requestedAbilities = [...new Set(linkedNpcs.flatMap((npc) =>
  String(npc.Abilities ?? '').split(',').map((ability) => ability.trim()).filter(Boolean)
))];
const { data: abilities, error: abilitiesError } = await supabase
  .from('SW_abilities')
  .select('id, ability, activation, description')
  .in('ability', requestedAbilities);
if (abilitiesError && abilitiesError.code !== 'PGRST100') throw abilitiesError;

console.log(JSON.stringify({ notes, linkedNpcs, requestedAbilities, matchedAbilities: abilities ?? [] }, null, 2));
