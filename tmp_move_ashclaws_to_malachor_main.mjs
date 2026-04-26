import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oyqfyjfkqzvatdddngbp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWZ5amZrcXp2YXRkZGRuZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ0MTcsImV4cCI6MjA3MjcyMDQxN30.1HsQNoFT7VHu1-rFAEOhDRlXYq3SyxhnHcP2whWIVhU'
);

const CAMPAIGN_ID = 2;

function addCsvParent(existing, parentId) {
  const items = String(existing || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const set = new Set(items);
  set.add(String(parentId));
  return Array.from(set).sort((a, b) => Number(a) - Number(b)).join(',');
}

async function main() {
  const { data: malachor, error: malachorErr } = await supabase
    .from('SW_campaign_notes')
    .select('id, Place_Name')
    .eq('CampaignID', CAMPAIGN_ID)
    .ilike('Place_Name', 'Malachor V')
    .maybeSingle();

  if (malachorErr) {
    console.error('Failed to find Malachor V:', malachorErr.message);
    process.exit(1);
  }

  if (!malachor) {
    console.error('Malachor V main note not found in SW_campaign_notes for campaign 2.');
    process.exit(1);
  }

  console.log(`Malachor V note id=${malachor.id}`);

  const names = ['Malachor Ashclaw Broodling', 'Malachor Ashclaw Queen'];
  const { data: npcs, error: npcErr } = await supabase
    .from('SW_campaign_NPC')
    .select('id, Name, Part_of_Place')
    .eq('CampaignID', CAMPAIGN_ID)
    .in('Name', names)
    .order('id', { ascending: true });

  if (npcErr) {
    console.error('Failed to fetch Ashclaw NPCs:', npcErr.message);
    process.exit(1);
  }

  for (const npc of npcs || []) {
    const updatedPart = addCsvParent(npc.Part_of_Place, malachor.id);
    const { error: updateErr } = await supabase
      .from('SW_campaign_NPC')
      .update({ Part_of_Place: updatedPart })
      .eq('id', npc.id);

    if (updateErr) {
      console.error(`Failed to update ${npc.Name}:`, updateErr.message);
      process.exit(1);
    }

    console.log(`Updated ${npc.Name} (id=${npc.id}) Part_of_Place=${updatedPart}`);
  }

  console.log('Done.');
}

main();
