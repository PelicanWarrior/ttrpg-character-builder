import { supabase } from './src/supabaseClient.js';

const { data: notes, error } = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name, Description, Part_of_Place')
  .eq('CampaignID', 2)
  .in('id', [205, 206, 201, 51, 108])
  .order('id', { ascending: false });

if (error) throw error;

console.log(JSON.stringify(notes, null, 2));
