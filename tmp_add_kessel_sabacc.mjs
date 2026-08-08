import { supabase } from './src/supabaseClient.js';

const campaignId = 2;

const { data: parent, error: pErr } = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name')
  .eq('CampaignID', campaignId)
  .ilike('Place_Name', 'The Split Sabacc')
  .single();
if (pErr) throw pErr;

const description = `Kessel Sabacc is the house variant played at The Split Sabacc. It uses two physical decks of cards — one Yellow, one Red — with each card numbered 1 through 6. Each player always holds exactly one Yellow card and one Red card.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OBJECTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
End the round with the lowest hand value. Hand value is the difference between your two card numbers (always positive). A pair beats everything regardless of value.

Example hands:
• Yellow 5 + Red 6 → value 1 (|5−6|)
• Yellow 1 + Red 3 → value 2 (|1−3|)
• A value of 1 beats a value of 2.
• Yellow 4 + Red 4 → PAIR — beats all non-pair hands.

TIEBREAKER: If two players share the same value, the player with the lowest individual card numbers wins.
• Yellow 1 + Red 3 (value 2) beats Yellow 2 + Red 4 (value 2), because 1 < 2.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Each player rolls one Yellow die and one Red die. The result of each die is their starting card from that colour deck (1–6). Keep both cards face-down.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROUND STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Play proceeds clockwise. Each round has two phases:

PHASE 1 — BETTING
All players look at their own hand. Starting from the dealer's left, each player must:
  • RAISE — add chips to the pot to continue, or
  • FOLD — discard your hand and leave the round.
The round ends immediately if only one player remains.

PHASE 2 — THE PASS
Starting from the dealer's left, each active player takes one of the following actions:

  STICK — keep both your cards. Do nothing.

  SWAP — take one new card from the top of either the Yellow or Red deck. Discard the old card of that colour face-down.

  PASS — slide one of your cards (Yellow or Red) face-down toward the player on your left. You must immediately draw a replacement of the same colour from the deck.

    ↳ The receiving player may ACCEPT the passed card or DECLINE it.
       • ACCEPT: take the card and discard your card of that colour face-down.
       • DECLINE: the card is placed into the discard pile instead.

After every player has acted, a new Betting Phase begins. Repeat until the pot is settled or only one player remains.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SHOWDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When no player raises in a Betting Phase, all remaining players reveal their hands simultaneously. Calculate each hand value (|Yellow − Red|). Lowest value wins the pot. Pairs beat all other hands. Tiebreaker by lowest card numbers as above.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUICK REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Best hand: Pair (any matching cards)
Goal:      Lowest difference wins
Tiebreak:  Lowest raw card numbers win
Pass rule: Passed card must match colour; receiver may accept or decline`;

const { data: existing } = await supabase
  .from('SW_campaign_notes')
  .select('id')
  .eq('CampaignID', campaignId)
  .eq('Place_Name', 'Kessel Sabacc');

if (existing && existing.length > 0) {
  console.log('Already exists, id:', existing[0].id);
} else {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .insert([{ Place_Name: 'Kessel Sabacc', Description: description, Part_of_Place: String(parent.id), CampaignID: campaignId, Order: 1 }])
    .select('id, Place_Name, Part_of_Place');
  if (error) throw error;
  console.log(JSON.stringify(data, null, 2));
}
