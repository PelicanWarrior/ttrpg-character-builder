import { supabase } from './src/supabaseClient.js';

const { data: npc, error: npcError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Race, Skills, Abilities, Part_of_Place')
  .eq('id', 142)
  .single();
if (npcError) throw npcError;

const { data: race, error: raceError } = await supabase
  .from('races')
  .select('id, name')
  .eq('id', npc.Race)
  .single();
if (raceError) throw raceError;

const abilityNames = npc.Abilities.split(',');
const { data: abilities, error: abilitiesError } = await supabase
  .from('SW_abilities')
  .select('ability')
  .in('ability', abilityNames);
if (abilitiesError) throw abilitiesError;
if (race.name !== "Pau'an") throw new Error(`Unexpected race: ${race.name}`);
if (abilities.length !== abilityNames.length) throw new Error('One or more assigned abilities are missing from the catalog.');

console.log(JSON.stringify({ npc, race, abilities }, null, 2));
