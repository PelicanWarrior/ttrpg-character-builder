import { supabase } from './src/supabaseClient.js';

const campaignId = 2;
const teamName = 'Blue Phantom Striders';
const expectedNpcNames = ['Veya Noll', 'Tovan Rell', 'Kell Vos', 'Dalo Venn'];

const { data: notes, error: noteError } = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name, Part_of_Place, Description')
  .eq('CampaignID', campaignId)
  .eq('Place_Name', teamName);
if (noteError) throw noteError;
if (notes?.length !== 1) throw new Error(`Expected one team note, found ${notes?.length ?? 0}.`);
const teamNote = notes[0];
if (teamNote.Part_of_Place !== '184') throw new Error('Team note is not linked to Uscru Racing Circuit.');

const { data: npcs, error: npcError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Race, Abilities, Skills, Equipment, Part_of_Place')
  .eq('CampaignID', campaignId)
  .eq('Part_of_Place', String(teamNote.id))
  .order('Name');
if (npcError) throw npcError;
const actualNpcNames = (npcs ?? []).map((npc) => npc.Name).sort();
if (JSON.stringify(actualNpcNames) !== JSON.stringify([...expectedNpcNames].sort())) {
  throw new Error(`Unexpected linked NPCs: ${actualNpcNames.join(', ')}`);
}

console.log(JSON.stringify({
  note: { id: teamNote.id, Place_Name: teamNote.Place_Name, Part_of_Place: teamNote.Part_of_Place },
  npcs: npcs.map(({ id, Name, Race, Abilities, Equipment, Part_of_Place }) => ({ id, Name, Race, Abilities, Equipment, Part_of_Place })),
}, null, 2));