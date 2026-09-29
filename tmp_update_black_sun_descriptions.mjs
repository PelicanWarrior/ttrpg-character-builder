import { supabase } from './src/supabaseClient.js';

const noteId = 209;

const { data: current, error: readError } = await supabase
  .from('SW_campaign_notes')
  .select('Description')
  .eq('id', noteId)
  .single();
if (readError) throw readError;

const oldBlock = `BLACK SUN ATTENDEES:

• Ziton Moj — Senior strategist and decision-maker
• Hodi Staalt — Operations coordinator
• Zorn Aboc — Intelligence division representative
• Nelond Chorni — Financial officer and contract specialist
• Twoz Jials — Lead operative handler
• Bebs Witress — Tactical advisor (positioned behind Twoz during the call)
• Enjazzi Ezil — External liaison and secondary decision authority`;

const newBlock = `BLACK SUN ATTENDEES:

• Ziton Moj — Senior strategist and decision-maker. Male Twi'lek with pale blue skin, sharp angular features, and a calm, calculating demeanour.
• Hodi Staalt — Operations coordinator. Male Human, middle-aged, close-cropped grey hair, a scarred jaw, speaks in clipped military tones.
• Zorn Aboc — Intelligence division representative. Male Zabrak, dark red skin with black facial tattoos, watches more than he speaks.
• Nelond Chorni — Financial officer and contract specialist. Female Human, sharply dressed, silver-streaked dark hair, precise and businesslike.
• Twoz Jials — Lead operative handler. Male Devaronian, dark grey skin, curved horns, a wolfish grin that rarely reaches his eyes.
• Bebs Witress — Tactical advisor (positioned behind Twoz during the call). Female Rodian, mottled green skin, remains largely silent but visibly attentive.
• Enjazzi Ezil — External liaison and secondary decision authority. Female Chagrian, blue-skinned with head tresses, poised and diplomatic in tone.`;

if (!current.Description.includes(oldBlock)) {
  throw new Error('Old block not found in current description; aborting to avoid corrupting note.');
}

const updatedDescription = current.Description.replace(oldBlock, newBlock);

const { data, error } = await supabase
  .from('SW_campaign_notes')
  .update({ Description: updatedDescription })
  .eq('id', noteId)
  .select('id, Place_Name');

if (error) throw error;

console.log(JSON.stringify({ updated: data }, null, 2));
