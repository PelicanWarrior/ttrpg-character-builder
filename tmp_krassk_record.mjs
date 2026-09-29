import { supabase } from './src/supabaseClient.js';

const { data, error } = await supabase
  .from('SW_campaign_NPC')
  .select('*')
  .eq('id', 51)
  .single();
if (error) throw error;
console.log(JSON.stringify(data, null, 2));
