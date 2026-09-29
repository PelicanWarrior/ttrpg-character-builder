import { supabase } from './src/supabaseClient.js';

const npcIds = [107, 108, 109, 110, 111, 112, 113];
const { data: npcs, error: npcsError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Abilities, Part_of_Place')
  .in('id', npcIds)
  .order('id');
if (npcsError) throw npcsError;

const abilityNames = [...new Set(npcs.flatMap((npc) => npc.Abilities.split(',').map((ability) => ability.trim())))];
const { data: abilities, error: abilitiesError } = await supabase
  .from('SW_abilities')
  .select('ability')
  .in('ability', abilityNames);
if (abilitiesError) throw abilitiesError;

if (npcs.length !== npcIds.length) throw new Error('One or more Zero Dawn NPCs could not be found.');
if (abilities.length !== abilityNames.length) throw new Error('One or more assigned abilities are missing from the database.');
if (npcs.some((npc) => !npc.Abilities || npc.Abilities.trim() === '')) throw new Error('An NPC has no abilities.');

console.log(JSON.stringify({ npcs, catalogAbilityCount: abilities.length }, null, 2));
