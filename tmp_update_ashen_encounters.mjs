import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oyqfyjfkqzvatdddngbp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWZ5amZrcXp2YXRkZGRuZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ0MTcsImV4cCI6MjA3MjcyMDQxN30.1HsQNoFT7VHu1-rFAEOhDRlXYq3SyxhnHcP2whWIVhU'
);

const CAMPAIGN_ID = 2;
const SHIP_NOTE_ID = 96;
const SPECIES_NOTE_NAME = 'Malachor Ashclaw (Species Profile)';

const speciesDescription = `Species: Malachor Ashclaw
Type: Native Malachor V apex scavenger

Overview:
Malachor Ashclaws are low-slung, six-limbed carrion hunters adapted to volcanic glass fields and deep ash vents. They are not Force creatures, but long exposure to dark side saturated environments has made them unnaturally aggressive and difficult to startle. They nest in warm machinery cavities, reactor housings, and vent tunnels where they can ambush by vibration.

Behavior:
- Pack phase: 2-3 broodlings test prey and drive targets into unstable terrain.
- Queen phase: A larger brood-mother defends nesting core and responds to loud harmonic vibration.
- Trigger: Reactor hum changes, doors cycling, and concentrated blaster fire draw them.

Encounter Use in The Ashen Testament:
- R4: 2-3 broodlings (light encounter).
- R8: Ashclaw Queen (boss encounter).

GM Notes:
- Keep broodlings mobile and opportunistic.
- Give the queen one heavy area attack and one recovery vulnerability window.`;

async function updateRoomDescription(id, replacers) {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .select('id, Place_Name, Description')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed fetching room ${id}: ${error.message}`);

  let updated = data.Description || '';
  for (const [from, to] of replacers) {
    updated = updated.replace(from, to);
  }

  const { error: updateError } = await supabase
    .from('SW_campaign_notes')
    .update({ Description: updated })
    .eq('id', id);

  if (updateError) throw new Error(`Failed updating room ${id}: ${updateError.message}`);
  console.log(`Updated room ${id}: ${data.Place_Name}`);
}

async function ensureSpeciesNote() {
  const { data: existing, error } = await supabase
    .from('SW_campaign_notes')
    .select('id, Place_Name')
    .eq('CampaignID', CAMPAIGN_ID)
    .eq('Part_of_Place', SHIP_NOTE_ID)
    .eq('Place_Name', SPECIES_NOTE_NAME)
    .maybeSingle();

  if (error) throw new Error(`Failed species note lookup: ${error.message}`);

  if (existing) {
    const { error: updateError } = await supabase
      .from('SW_campaign_notes')
      .update({ Description: speciesDescription })
      .eq('id', existing.id);

    if (updateError) throw new Error(`Failed updating species note: ${updateError.message}`);
    console.log(`Updated species note ${existing.id}: ${existing.Place_Name}`);
    return;
  }

  const { data: inserted, error: insertError } = await supabase
    .from('SW_campaign_notes')
    .insert({
      Place_Name: SPECIES_NOTE_NAME,
      Order: 11,
      Part_of_Place: SHIP_NOTE_ID,
      CampaignID: CAMPAIGN_ID,
      Description: speciesDescription,
    })
    .select('id, Place_Name')
    .single();

  if (insertError) throw new Error(`Failed inserting species note: ${insertError.message}`);
  console.log(`Inserted species note ${inserted.id}: ${inserted.Place_Name}`);
}

async function main() {
  await ensureSpeciesNote();

  await updateRoomDescription(100, [
    ['Enemies: 2-3 scavenger predators nesting in ship warmth pockets (light encounter).', 'Enemies: 2-3 Malachor Ashclaw broodlings nesting in ship warmth pockets (light encounter).'],
    ['Keep the encounter quick and mobile.', 'Keep the encounter quick and mobile.'],
  ]);

  await updateRoomDescription(104, [
    ['Boss: Sith security warden construct (single elite enemy) reactivates when override begins.', 'Boss: Malachor Ashclaw Queen (single elite enemy), awakened by vibration and reactor pulse when override begins.'],
    ['Boss Behavior: Slow, high soak, punishes clustered positions, vulnerable during recharge windows.', 'Boss Behavior: Slow, high soak, area pressure from tail sweeps, vulnerable after lunge and roar recovery windows.'],
  ]);

  console.log('Done.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
