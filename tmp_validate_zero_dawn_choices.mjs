import { supabase } from './src/supabaseClient.js';

const choices = [
  'Skilled Mechanic', 'Known Schematic', 'Heightened Senses',
  'Command Presence', 'Master Leader', 'Natural Leader',
  'Known Programming', 'Discredit', "Nobody's Fool 1",
  'Master Driver', 'Grit'
];

const { data, error } = await supabase
  .from('SW_abilities')
  .select('id, ability, activation, description')
  .in('ability', choices);
if (error) throw error;

console.log(JSON.stringify({ requested: choices, matched: data }, null, 2));
