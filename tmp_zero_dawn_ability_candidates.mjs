import { supabase } from './src/supabaseClient.js';

const { data, error } = await supabase
  .from('SW_abilities')
  .select('id, ability, activation, description')
  .order('id');
if (error) throw error;

const candidates = data.filter((entry) =>
  /command|leader|mechanic|systems|diagnos|pilot|driver|computer|slice|stealth|deception|negotiat|perception|vigilance|coordination|cool|discipline|resilience|athletic|streetwise|skulduggery|charm|race|vehicle|tech|tuner|focus|presence|dodge|natural|master|expert|savvy|quick|fast|rapid/i.test(`${entry.ability} ${entry.description}`)
);
console.log(JSON.stringify(candidates, null, 2));
