import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oyqfyjfkqzvatdddngbp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWZ5amZrcXp2YXRkZGRuZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ0MTcsImV4cCI6MjA3MjcyMDQxN30.1HsQNoFT7VHu1-rFAEOhDRlXYq3SyxhnHcP2whWIVhU'
);

const CAMPAIGN_ID = 2;

const hookBlock = `

Holocron Plot Hook (Selected: 3 + 5)
Core premise: IG-07 was built as a courier unit for a concealed Sith holocron, and this ship still recognizes that courier protocol.
Next arc premise: the holocron points to a second hidden Sith manufacturing/archive site (a forge-node) that contains mission data and advanced salvage.
Activation condition: the holocron remains inert unless a Force-sensitive being is nearby. Nix or Rapa within short range of IG-07 can trigger resonance.

Trigger Rule (GM):
- Passive state: no Force-sensitive nearby -> no signal, no map, no voiceprint.
- Active state: Force-sensitive nearby -> holocron emits heat pulse, red seam-light through IG-07 chest plate, and opens one encrypted route fragment.
- Suggested reveal location: R8 during override start (strongest dramatic timing), with optional early foreshadow in R9.

Destination Reveal (for next session):
- Designation: Archive-Forge Node KHAR-VOSS.
- Directive: "Courier Unit IG-07. Delivery incomplete. Proceed to KHAR-VOSS."
- Reward promise: factory schematics, interceptor-grade components, and missing command keys for deeper ship/facility access.`;

const r8Block = `

Holocron Trigger:
If Nix or Rapa is present/nearby, IG-07's chest holocron resonates with the bridge and outputs the KHAR-VOSS route fragment.`;

const r9Block = `

Optional Foreshadow:
A reliquary spindle bears the same courier glyph found in IG-07 internal diagnostics; it remains inert until a Force-sensitive enters the chamber.`;

const ig07Block = `

Holocron Activation Protocol:
The holocron remains inert unless a Force-sensitive is nearby. If Nix or Rapa comes within short range, IG-07 registers an unclassified heat spike and red seam-light through his chest plate.

Courier Directive Fragment (unlocked at Ghost Bridge R8):
"Courier Unit IG-07. Delivery incomplete. Proceed to Archive-Forge Node KHAR-VOSS."

GM Use:
This is the primary transition hook to the next destination.`;

function appendIfMissing(text, marker, block) {
  if (!text) return block.trim();
  return text.includes(marker) ? text : `${text}${block}`;
}

function addPartOfPlace(existing, parentId) {
  const tokens = String(existing ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const set = new Set(tokens);
  set.add(String(parentId));

  const ordered = Array.from(set).sort((a, b) => Number(a) - Number(b));
  return ordered.join(',');
}

async function updateNoteDescription(noteId, marker, block) {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .select('id, Place_Name, Description')
    .eq('id', noteId)
    .eq('CampaignID', CAMPAIGN_ID)
    .single();

  if (error) throw new Error(`Fetch note ${noteId} failed: ${error.message}`);

  const updated = appendIfMissing(data.Description || '', marker, block);

  const { error: updateError } = await supabase
    .from('SW_campaign_notes')
    .update({ Description: updated })
    .eq('id', noteId);

  if (updateError) throw new Error(`Update note ${noteId} failed: ${updateError.message}`);
  console.log(`Updated note ${noteId}: ${data.Place_Name}`);
}

async function updateIG07() {
  const { data, error } = await supabase
    .from('SW_campaign_NPC')
    .select('id, Name, Description, Part_of_Place')
    .eq('id', 63)
    .eq('CampaignID', CAMPAIGN_ID)
    .single();

  if (error) throw new Error(`Fetch IG-07 failed: ${error.message}`);

  const updatedDescription = appendIfMissing(
    data.Description || '',
    'Holocron Activation Protocol:',
    ig07Block
  );

  const updatedPartOfPlace = addPartOfPlace(data.Part_of_Place, 96);

  const { error: updateError } = await supabase
    .from('SW_campaign_NPC')
    .update({
      Description: updatedDescription,
      Part_of_Place: updatedPartOfPlace,
    })
    .eq('id', 63);

  if (updateError) throw new Error(`Update IG-07 failed: ${updateError.message}`);
  console.log(`Updated IG-07 (id=63), Part_of_Place=${updatedPartOfPlace}`);
}

async function main() {
  await updateNoteDescription(96, 'Holocron Plot Hook (Selected: 3 + 5)', hookBlock);
  await updateNoteDescription(104, 'Holocron Trigger:', r8Block);
  await updateNoteDescription(105, 'Optional Foreshadow:', r9Block);
  await updateIG07();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
