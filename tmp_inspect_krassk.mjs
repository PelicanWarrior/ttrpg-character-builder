import { supabase } from './src/supabaseClient.js';

const { data: npcs, error: npcError } = await supabase
  .from('SW_campaign_NPC')
  .select('*')
  .ilike('Name', 'Krassk Ironjaw');
if (npcError) throw npcError;

const { data: abilities, error: abilitiesError } = await supabase
  .from('SW_abilities')
  .select('*')
  .order('id');
if (abilitiesError) throw abilitiesError;

const { data: equipment, error: equipmentError } = await supabase
  .from('SW_equipment')
  .select('*')
  .order('id');
if (equipmentError) throw equipmentError;

console.log(JSON.stringify({ npcs, abilities, equipment }, null, 2));
