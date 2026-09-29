import { supabase } from './src/supabaseClient.js';

const { data: notes, error: notesError } = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name, Description, Part_of_Place, Order, CampaignID')
  .eq('CampaignID', 2)
  .or('Place_Name.ilike.%Uscru Racing Circuit%,Place_Name.ilike.%Story Beat%,Place_Name.ilike.%Zero Dawn Speedworks%')
  .order('id');
if (notesError) throw notesError;

const matchingIds = new Set((notes ?? []).map((note) => String(note.id)));
const { data: npcs, error: npcsError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Description, Brawn, Agility, Intellect, Cunning, Willpower, Presence, Skills, Abilities, Equipment, Soak, Wound, Strain, CampaignID, Part_of_Place')
  .eq('CampaignID', 2)
  .order('id');
if (npcsError) throw npcsError;

const linkedNpcs = (npcs ?? []).filter((npc) =>
  String(npc.Part_of_Place ?? '').split(',').some((id) => matchingIds.has(id.trim()))
);

console.log(JSON.stringify({ notes, linkedNpcs }, null, 2));