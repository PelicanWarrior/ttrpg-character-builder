import { supabase } from './src/supabaseClient.js';

const { data: npc, error: npcError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Race, Description, Part_of_Place, CampaignID')
  .eq('CampaignID', 2)
  .eq('Name', 'Nemi Orr')
  .single();
if (npcError) throw npcError;

const { data: races, error: racesError } = await supabase
  .from('races')
  .select('id, name')
  .ilike('name', '%twi%lek%');
if (racesError) throw racesError;

console.log(JSON.stringify({ npc, races }, null, 2));