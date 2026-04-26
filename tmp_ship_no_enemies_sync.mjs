import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oyqfyjfkqzvatdddngbp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWZ5amZrcXp2YXRkZGRuZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ0MTcsImV4cCI6MjA3MjcyMDQxN30.1HsQNoFT7VHu1-rFAEOhDRlXYq3SyxhnHcP2whWIVhU'
);

const CAMPAIGN_ID = 2;

async function updateDescription(id, replacements) {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .select('id, Place_Name, Description')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Fetch note ${id} failed: ${error.message}`);

  let text = data.Description || '';
  for (const [from, to] of replacements) {
    text = text.replace(from, to);
  }

  const { error: updateError } = await supabase
    .from('SW_campaign_notes')
    .update({ Description: text })
    .eq('id', id);

  if (updateError) throw new Error(`Update note ${id} failed: ${updateError.message}`);
  console.log(`Updated note ${id}: ${data.Place_Name}`);
}

async function main() {
  await updateDescription(100, [
    ['Enemies: 2-3 Malachor Ashclaw broodlings nesting in ship warmth pockets (light encounter).', 'Hazard: Harmonic surges and unstable plating create environmental pressure in this corridor.'],
    ['Encounter Goal: Survive and clear the route, not wipeout for loot.', 'Goal: Stabilize the route and move through without major system strain.'],
    ['Twist: Stray blaster fire can destabilize ceiling plating and add environmental strain.', 'Twist: Stray blaster fire can destabilize ceiling plating and add environmental strain.']
  ]);

  await updateDescription(104, [
    ['Boss: Malachor Ashclaw Queen (single elite enemy), awakened by vibration and reactor pulse when override begins.', 'Objective Pressure: Reactor surges and command-lock feedback spike when override begins.'],
    ['Boss Behavior: Slow, high soak, area pressure from tail sweeps, vulnerable after lunge and roar recovery windows.', 'System Behavior: Pulsed feedback, panel arcs, and lockout cycles punish mistakes but can be managed.'],
    ['Win Condition: Defeat or disable boss long enough to complete launch corridor override.', 'Win Condition: Complete launch corridor override while stabilizing bridge systems.']
  ]);

  const npcTargets = [
    { id: 61, name: 'Malachor Ashclaw Broodling' },
    { id: 62, name: 'Malachor Ashclaw Queen' },
  ];

  for (const npc of npcTargets) {
    const { error } = await supabase
      .from('SW_campaign_NPC')
      .update({ Part_of_Place: '85' })
      .eq('id', npc.id)
      .eq('CampaignID', CAMPAIGN_ID)
      .eq('Name', npc.name);

    if (error) throw new Error(`Update NPC ${npc.id} failed: ${error.message}`);
    console.log(`Updated NPC ${npc.id}: ${npc.name} -> Part_of_Place=85`);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
