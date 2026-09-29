import { supabase } from './src/supabaseClient.js';

const { data: npcs, error: npcError } = await supabase
  .from('SW_campaign_NPC')
  .select('*')
  .ilike('Name', 'Krassk Ironjaw');
if (npcError) throw npcError;

const { data: skills, error: skillError } = await supabase
  .from('skills')
  .select('*')
  .order('id');
if (skillError) throw skillError;

const { data: equipment, error: equipmentError } = await supabase
  .from('SW_equipment')
  .select('id, name, skill, range, damage, critical, special, description')
  .not('skill', 'is', null)
  .order('id');
if (equipmentError) throw equipmentError;

console.log(JSON.stringify({ npcs, skills, weapons: equipment }, null, 2));
