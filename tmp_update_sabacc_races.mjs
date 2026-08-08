import { supabase } from './src/supabaseClient.js';

const updates = [
  { id: 139, Race: 36 }, // Sable Drenn → Chiss
  { id: 140, Race: 26 }, // Pek Jarrow → Sullustan
];

for (const u of updates) {
  const { error } = await supabase.from('SW_campaign_NPC').update({ Race: u.Race }).eq('id', u.id);
  if (error) throw error;
}

const { data, error } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Race, races(name)')
  .in('id', [139, 140]);
if (error) throw error;
console.log(JSON.stringify(data, null, 2));
