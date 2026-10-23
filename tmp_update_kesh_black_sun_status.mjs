import { supabase } from './src/supabaseClient.js';

const campaignId = 2;
const statusText = 'Kesh Ral has been seized by the Black Sun and is being tortured to obtain information. What he has revealed, if anything, and what happens to him remain unknown.';
const noteUpdates = [
  {
    id: 195,
    title: 'Blackline Chop Shop',
    text: `CURRENT STATUS\nThe shop is closed. ${statusText}`,
  },
  {
    id: 202,
    title: "Kesh Ral's Ord Mantell Run",
    text: `CURRENT STATUS\n${statusText}`,
  },
  {
    id: 217,
    title: '4th September 2026',
    text: `After the meeting, Kesh Ral was seized by the Black Sun. He is being tortured to obtain information; what he has revealed, if anything, and what happens to him remain unknown.`,
  },
];

const { data: npc, error: npcLookupError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Description')
  .eq('CampaignID', campaignId)
  .eq('Name', 'Kesh Ral')
  .single();
if (npcLookupError) throw npcLookupError;

const { data: notes, error: notesError } = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name, Description')
  .eq('CampaignID', campaignId)
  .in('id', noteUpdates.map((note) => note.id));
if (notesError) throw notesError;

for (const target of noteUpdates) {
  const note = (notes ?? []).find((entry) => entry.id === target.id && entry.Place_Name === target.title);
  if (!note) throw new Error(`Could not find expected note ${target.title} (${target.id}).`);
  if (note.Description?.includes(target.text)) continue;
  const description = `${(note.Description ?? '').trim()}\n\n${target.text}`;
  const { error } = await supabase
    .from('SW_campaign_notes')
    .update({ Description: description })
    .eq('id', note.id);
  if (error) throw error;
}

const npcStatus = `Current Status: ${statusText}`;
if (!npc.Description?.includes(npcStatus)) {
  const { error } = await supabase
    .from('SW_campaign_NPC')
    .update({ Description: `${(npc.Description ?? '').trim()}\n\n${npcStatus}` })
    .eq('id', npc.id);
  if (error) throw error;
}

console.log(JSON.stringify({
  npc: { id: npc.id, Name: npc.Name },
  notes: noteUpdates.map(({ id, title }) => ({ id, title })),
  status: statusText,
}, null, 2));