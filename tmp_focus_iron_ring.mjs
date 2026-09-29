import { supabase } from './src/supabaseClient.js';

const { data: notes, error: notesError } = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name, Description, Part_of_Place')
  .ilike('Place_Name', '%Iron Ring Arena%');
if (notesError) throw notesError;

const parentIds = notes.map((note) => String(note.id));
const { data: npcs, error: npcsError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Race, Description, Skills, Abilities, Equipment, Part_of_Place, CampaignID')
  .eq('CampaignID', 2)
  .order('id');
if (npcsError) throw npcsError;

const nearbyNpcs = npcs.filter((npc) =>
  String(npc.Part_of_Place ?? '').split(',').some((id) => parentIds.includes(id.trim()))
);

const { data: abilities, error: abilitiesError } = await supabase
  .from('SW_abilities')
  .select('id, ability, activation, description')
  .order('id');
if (abilitiesError) throw abilitiesError;

const wantedAbilities = abilities.filter((entry) =>
  /command|presence|inspir|rhetoric|leader|confidence|perform|voice|taunt|intimid|charm|crowd|notorious|swagger|loud|announc/i.test(`${entry.ability} ${entry.description}`)
);

console.log(JSON.stringify({ notes, nearbyNpcs, wantedAbilities }, null, 2));
