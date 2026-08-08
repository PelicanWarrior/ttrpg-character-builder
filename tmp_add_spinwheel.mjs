import { supabase } from './src/supabaseClient.js';

const campaignId = 2;

const spinwheelDescription = `Spinwheel is the house game at The Split Sabacc — fast, simple, and quietly profitable for the establishment. It requires no skill to enter and no decisions once the bet is placed. This makes it popular with gamblers who are drunk, impatient, or already losing at the sabacc tables.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE WHEEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The wheel is divided into two colour bands — Blue and Red — each numbered 1 through 20. The house rolls three dice behind a screen:

  • 1 Blue d20 (numbered 1–20)
  • 1 Red d20 (numbered 1–20)
  • 1 d4 to determine which colour wins:
      1 or 2 → Blue wins
      3 or 4 → Red wins

The winning result is the colour the d4 selects combined with the number shown on that colour's d20. Example: d4 shows 3 (Red), Red d20 shows 14 → result is Red 14.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BETTING OPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Players place their chips in a marked zone before the dice are rolled. Three bet types are available:

  COLOUR + NUMBER (Exact)
  Bet on a specific colour and a specific number.
  Payout: 35:1 — the hardest call, the biggest return.

  NUMBER ONLY
  Bet on a number (1–20) regardless of colour.
  Payout: 9:1 — pays if your number comes up on either colour.

  COLOUR ONLY
  Bet on Blue or Red.
  Payout: 1:1 — roughly even odds given the d4.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE ROLL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The house operator rolls all three dice simultaneously behind the screen, announces the result, and pays out winning bets before collecting losing chips. No player input occurs after the bet is placed. The house does not cheat — it doesn't need to.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUICK REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Exact colour + number → 35:1
Number only           →  9:1
Colour only           →  1:1`;

// Abilities to add
const abilitiesToAdd = [
  {
    ability: 'Thousand-Yard Stare',
    activation: 'Passive',
    description: 'This character has seen it all and reacts to nothing. Immune to the Distracted or Rattled conditions caused by social encounters. All Charm, Coercion, or Deception checks to manipulate this character gain a Setback die.',
  },
  {
    ability: 'Spot the Cheat',
    activation: 'Active (Maneuver)',
    description: 'Once per round, may make a free Perception check (Average difficulty) to detect a player attempting to manipulate the game. On success, the character immediately knows the nature of the cheat.',
  },
];

// Check and insert missing abilities
const { data: existingAbilities } = await supabase
  .from('SW_abilities').select('ability')
  .in('ability', abilitiesToAdd.map((a) => a.ability));
const existingAbilityNames = new Set((existingAbilities || []).map((a) => a.ability));
const newAbilities = abilitiesToAdd.filter((a) => !existingAbilityNames.has(a.ability));
if (newAbilities.length > 0) {
  const { error } = await supabase.from('SW_abilities').insert(newAbilities);
  if (error) throw error;
}

// Insert Spinwheel note under The Split Sabacc (id 167)
const { data: existingNote } = await supabase
  .from('SW_campaign_notes').select('id')
  .eq('CampaignID', campaignId).eq('Place_Name', 'Spinwheel');

let noteId;
if (existingNote && existingNote.length > 0) {
  noteId = existingNote[0].id;
} else {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .insert([{ Place_Name: 'Spinwheel', Description: spinwheelDescription, Part_of_Place: '167', Order: 2, CampaignID: campaignId }])
    .select('id');
  if (error) throw error;
  noteId = data[0].id;
}

// Insert NPC — Duros (race 23), bored wheel operator
const npc = {
  Name: 'Vuul Desek',
  Description: 'A lean, grey-green Duros male who has operated the Spinwheel at The Split Sabacc for longer than anyone in the district can remember. He announces results in a flat monotone, pays out without expression, collects losses with the same absence of interest, and has not smiled within living memory. He is not cruel or hostile — he simply stopped caring about the outcome of other people\'s evenings a very long time ago. He notices everything. He reacts to nothing.',
  Race: 23, // Duros
  Brawn: 2, Agility: 2, Intellect: 3, Cunning: 3, Willpower: 4, Presence: 1,
  Soak: 2, Wound: 11, Strain: 14, Force_Rating: 0,
  Skills: 'Cool,Cool,Cool,Cool,Perception,Perception,Perception,Vigilance,Vigilance,Vigilance',
  Abilities: 'Thousand-Yard Stare,Spot the Cheat,Composed',
  Equipment: 'Holdout Blaster,Heavy Clothes',
  Force_Abilities: '', PictureID: null, CampaignID: campaignId, Part_of_Place: String(noteId),
};

const { data: existingNpc } = await supabase
  .from('SW_campaign_NPC').select('id')
  .eq('CampaignID', campaignId).eq('Name', npc.Name);

let insertedNpc = null;
if (!existingNpc || existingNpc.length === 0) {
  const { data, error } = await supabase.from('SW_campaign_NPC').insert([npc]).select('id, Name, Part_of_Place');
  if (error) throw error;
  insertedNpc = data[0];
}

console.log(JSON.stringify({
  abilitiesInserted: newAbilities.map((a) => a.ability),
  spinwheelNoteId: noteId,
  npc: insertedNpc || { already: 'exists' },
}, null, 2));
