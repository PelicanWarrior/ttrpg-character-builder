import { supabase } from './src/supabaseClient.js';

const { data: abilities, error: abilitiesError } = await supabase
  .from('SW_abilities')
  .select('*')
  .limit(5);
if (abilitiesError) throw abilitiesError;

const { data: equipment, error: equipmentError } = await supabase
  .from('SW_equipment')
  .select('*')
  .limit(5);
if (equipmentError) throw equipmentError;

console.log(JSON.stringify({ abilities, equipment }, null, 2));
