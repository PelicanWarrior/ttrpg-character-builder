import { supabase } from './src/supabaseClient.js';

const { data: npcs, error: npcError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Description, CampaignID, Part_of_Place')
  .eq('CampaignID', 2)
  .eq('Name', 'Kesh Ral');
if (npcError) throw npcError;

const { data: mentionedNotes, error: mentionedError } = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name, Description, Part_of_Place, CampaignID')
  .eq('CampaignID', 2)
  .ilike('Description', '%Kesh Ral%');
if (mentionedError) throw mentionedError;

const { data: shopNotes, error: shopError } = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name, Description, Part_of_Place, CampaignID')
  .eq('CampaignID', 2)
  .or('Place_Name.ilike.%Blackline Chop Shop%,Description.ilike.%Kesh Ral%');
if (shopError) throw shopError;

console.log(JSON.stringify({ npcs, mentionedNotes, shopNotes }, null, 2));