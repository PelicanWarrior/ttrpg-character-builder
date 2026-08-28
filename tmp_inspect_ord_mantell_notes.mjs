import { supabase } from './src/supabaseClient.js';

const { data: notes, error: notesError } = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name, Description, Part_of_Place, CampaignID')
  .eq('CampaignID', 2)
  .or('Place_Name.ilike.%Ord Mantell%,Description.ilike.%Ord Mantell%,Description.ilike.%Hutt%,Description.ilike.%Black Sun%,Description.ilike.%contraband%');
if (notesError) throw notesError;

const { data: kesh, error: keshError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Description, Part_of_Place, CampaignID')
  .eq('id', 134)
  .single();
if (keshError) throw keshError;

console.log(JSON.stringify({ notes, kesh }, null, 2));
