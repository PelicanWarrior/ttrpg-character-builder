import { supabase } from './src/supabaseClient.js';

const names = ['Ziton Moj', 'Hodi Staalt', 'Zorn Aboc', 'Nelond Chorni', 'Twoz Jials', 'Bebs Witress', 'Enjazzi Ezil'];

const { data, error } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Description, Part_of_Place')
  .in('Name', names);

if (error) throw error;

console.log(JSON.stringify(data, null, 2));
