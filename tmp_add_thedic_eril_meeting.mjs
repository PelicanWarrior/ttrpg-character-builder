import { supabase } from './src/supabaseClient.js';

const campaignId = 2;
const sessionNoteId = '201';
const noteName = 'Thedic Meets Eril';

const description = `Thedic arranges a private meeting with her brother, Eril Fling, after the party's preparations in Coruscant. She has not seen him properly in four years. He has been away from home for so long that their parents, Chumu and the rest of the Fling family, have begun to fear that something has happened to him or that he no longer intends to return.

The meeting should begin with genuine warmth beneath the awkwardness. Thedic is relieved to see Eril alive, but the relief quickly gives way to worry and frustration. She asks why he has not returned home, what he has been doing all this time, and whether he has been safe. She wants to know about the people he has been working for, the places he has visited, and how he became involved with the crew.

She tells Eril that the family is still living aboard the sandcrawler Dunebreaker. Their parents are worried about him, and his absence has become a constant subject of conversation. The family has also been forced into producing and repairing droid parts for the Hutt Cartel. The work keeps them supplied and protected in the short term, but it is not truly voluntary. Hutt agents control the contracts, the materials, and the prices, leaving the Fling family with little choice but to keep working.

Thedic speaks bitterly about the arrangement. She resents the Hutts for treating her family as a source of labour and replacement parts, and she is angry that the family has been left to endure it while Eril has been gone. Her bitterness should feel personal rather than political: she is not delivering a speech about the Hutt Cartel, she is trying to make her brother understand what his absence has cost the people at home.

Possible questions from Thedic:

• Why have you stayed away for four years?
• What have you been doing all this time?
• Who are you working for now?
• Are you in trouble, or are you keeping away because you want to?
• Do you still think about going home?
• Did you know what was happening to the family while you were away?
• Have you brought danger back with you?

Thedic should appear worried about Eril throughout the conversation. She may touch his arm, examine his equipment, or study him for signs that he is injured, frightened, or hiding something. If he tries to deflect the questions with jokes or vague answers, she becomes more direct. If he opens up, her anger softens, but she still presses him to acknowledge that four years is a long time to leave their parents waiting.

GM-ONLY CONCERN

Thedic's concern is sincere, but it is not her only concern. Because she is currently playing both sides, she is secretly trying to determine whether Eril is involved in the party's activities, the Jedi Temple operation, or any information connected to the Kamino lead. She worries that her brother may know more than he is admitting, or that he may have become involved with something that could expose her double dealings.

She carefully watches his reactions whenever the conversation turns toward the party, the Jedi Temple, Black Sun, the Hutts, or unusual technology. She does not directly accuse him. Instead, she asks apparently caring questions and uses family memories to encourage him to lower his guard. If Eril reveals anything useful, Thedic intends to weigh whether it is valuable enough to pass to one of her contacts.

Thedic is caught between two fears: that Eril has become involved in something dangerous, and that he may already know enough to threaten the position she has built between Black Sun and the Hutts. Her affection for him is real, but so is her instinct to gather information before the meeting ends.

The scene should leave Eril with the impression that Thedic wants her brother home. The deeper truth is more complicated: she wants him safe, she wants to know what he has been doing, and she needs to establish whether he is a liability before he discovers how many sides she is actually playing.`;

const { data: existing, error: lookupError } = await supabase
  .from('SW_campaign_notes')
  .select('id')
  .eq('CampaignID', campaignId)
  .eq('Place_Name', noteName);
if (lookupError) throw lookupError;

let result;
if (existing?.length) {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .update({ Description: description, Part_of_Place: sessionNoteId, Order: 2 })
    .eq('id', existing[0].id)
    .select('id, Place_Name, Part_of_Place');
  if (error) throw error;
  result = { updated: data };
} else {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .insert([{
      Place_Name: noteName,
      Description: description,
      Part_of_Place: sessionNoteId,
      CampaignID: campaignId,
      Order: 2,
    }])
    .select('id, Place_Name, Part_of_Place');
  if (error) throw error;
  result = { inserted: data };
}

console.log(JSON.stringify(result, null, 2));
