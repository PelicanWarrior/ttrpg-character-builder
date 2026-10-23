import { supabase } from './src/supabaseClient.js';

const campaignId = 2;
const names = ['Nira Pell', 'Jhee Toran', 'Merrik Sol', 'Olan Vur'];
const { data: notes, error: notesError } = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name, Part_of_Place')
  .eq('CampaignID', campaignId)
  .in('Place_Name', ['Uscru Racing Circuit', 'Nebula Viper Squadron']);
if (notesError) throw notesError;
const teamNote = (notes ?? []).find((note) => note.Place_Name === 'Nebula Viper Squadron');
const circuit = (notes ?? []).find((note) => note.Place_Name === 'Uscru Racing Circuit');
if (!teamNote || !circuit || teamNote.Part_of_Place !== String(circuit.id)) {
  throw new Error('Nebula Viper team note is not linked to Uscru Racing Circuit.');
}

const { data: npcs, error: npcError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Race, Skills, Abilities, Equipment, Part_of_Place')
  .eq('CampaignID', campaignId)
  .in('Name', names)
  .order('id');
if (npcError) throw npcError;
if (npcs?.length !== names.length || npcs.some((npc) => npc.Part_of_Place !== String(teamNote.id))) {
  throw new Error('NPC count or team-note link verification failed.');
}

console.log(JSON.stringify({
  circuit: { id: circuit.id, name: circuit.Place_Name },
  teamNote: { id: teamNote.id, name: teamNote.Place_Name, parent: teamNote.Part_of_Place },
  npcs: npcs.map(({ id, Name, Race, Abilities, Equipment, Part_of_Place }) => ({ id, Name, Race, Abilities, Equipment, Part_of_Place })),
}, null, 2));