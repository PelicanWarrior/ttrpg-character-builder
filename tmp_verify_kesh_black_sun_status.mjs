import { supabase } from './src/supabaseClient.js';

const { data: npc, error: npcError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Description')
  .eq('CampaignID', 2)
  .eq('Name', 'Kesh Ral')
  .single();
if (npcError) throw npcError;

const { data: notes, error: notesError } = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name, Description')
  .eq('CampaignID', 2)
  .in('id', [195, 202, 217]);
if (notesError) throw notesError;

const statusTerms = ['seized by the Black Sun', 'tortured to obtain information'];
const results = [
  { title: `NPC: ${npc.Name}`, description: npc.Description },
  ...(notes ?? []).map((note) => ({ title: note.Place_Name, description: note.Description })),
].map(({ title, description }) => ({
  title,
  hasStatus: statusTerms.every((term) => description.includes(term)),
  shopClosed: title !== 'Blackline Chop Shop' || description.includes('The shop is closed.'),
}));

console.log(JSON.stringify(results, null, 2));
if (results.length !== 4 || results.some((result) => !result.hasStatus || !result.shopClosed)) {
  throw new Error('Kesh status verification failed.');
}