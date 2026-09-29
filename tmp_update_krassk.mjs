import { supabase } from './src/supabaseClient.js';

const npcId = 51;
const abilities = 'Grit,Lethal Blows,Toughened,Knockdown,Feral Strength';
const equipment = 'Skullsplitter Vibro-Axe,Duur’kaj Vibroblade,Ancestral Vibro-Spear';

const { data, error } = await supabase
  .from('SW_campaign_NPC')
  .update({ Abilities: abilities, Equipment: equipment })
  .eq('id', npcId)
  .select('id, Name, Skills, Abilities, Equipment');

if (error) throw error;
console.log(JSON.stringify({ updated: data }, null, 2));
