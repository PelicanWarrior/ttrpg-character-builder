import { supabase } from './src/supabaseClient.js';

const requestedRaces = ['Human', 'Mirialan', 'Zabrak', 'Rodian', 'Duros'];
const { data, error } = await supabase
  .from('races')
  .select('id, name')
  .in('name', requestedRaces)
  .order('id');
if (error) throw error;

console.log(JSON.stringify(data, null, 2));
if (data.length !== requestedRaces.length) {
  throw new Error('One or more requested races are missing from the race catalog.');
}