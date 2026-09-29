import { supabase } from './src/supabaseClient.js';

const campaignId = 2;

// First, check if NARRATIVE EPISODE II exists
const { data: episodeCheck, error: episodeError } = await supabase
  .from('SW_campaign_notes')
  .select('id')
  .eq('CampaignID', campaignId)
  .eq('Place_Name', 'NARRATIVE EPISODE II');

if (episodeError) throw episodeError;

let episodeId;
if (episodeCheck?.length) {
  episodeId = episodeCheck[0].id;
} else {
  // Create NARRATIVE EPISODE II if it doesn't exist
  const { data: newEpisode, error: createError } = await supabase
    .from('SW_campaign_notes')
    .insert([{
      Place_Name: 'NARRATIVE EPISODE II',
      Description: 'Campaign Episode II narrative and related missions',
      Part_of_Place: '0',
      CampaignID: campaignId,
      Order: 0,
    }])
    .select('id');
  if (createError) throw createError;
  episodeId = newEpisode[0].id;
}

// Now create the meeting note
const description = `FORMAL BLACK SUN MEETING — KAMINO RECONNAISSANCE OPERATION

A secure video conference was arranged between the party and senior leadership of the Black Sun criminal organization. All participants were connected via encrypted channel with multiple security protocols in place.

BLACK SUN ATTENDEES:

• Ziton Moj — Senior strategist and decision-maker. Male Twi'lek with pale blue skin, sharp angular features, and a calm, calculating demeanour.
• Hodi Staalt — Operations coordinator. Male Human, middle-aged, close-cropped grey hair, a scarred jaw, speaks in clipped military tones.
• Zorn Aboc — Intelligence division representative. Male Zabrak, dark red skin with black facial tattoos, watches more than he speaks.
• Nelond Chorni — Financial officer and contract specialist. Female Human, sharply dressed, silver-streaked dark hair, precise and businesslike.
• Twoz Jials — Lead operative handler. Male Devaronian, dark grey skin, curved horns, a wolfish grin that rarely reaches his eyes.
• Bebs Witress — Tactical advisor (positioned behind Twoz during the call). Female Rodian, mottled green skin, remains largely silent but visibly attentive.
• Enjazzi Ezil — External liaison and secondary decision authority. Female Chagrian, blue-skinned with head tresses, poised and diplomatic in tone.

PARTY ATTENDEES:
• All active party members
• Thedic Fling (representing Black Sun liaison)

MEETING PURPOSE & TONE

The Black Sun leadership opened the meeting by expressing genuine admiration for the party's successful infiltration of the Jedi Temple. They emphasized several key achievements:

• The party managed to infiltrate one of the most secure facilities in the galaxy without being caught or identified
• They successfully located and retrieved the Kamino coordinates despite high security and complex internal architecture
• They escaped cleanly without triggering alarms or drawing sustained Imperial attention
• They demonstrated coordination, problem-solving, and adaptability under pressure

These accomplishments impressed the Black Sun strategists, who view competence as the primary metric of partnership. The leadership indicated that the party has proven itself worthy of significant operations and greater trust.

MISSION BRIEFING — KAMINO RECONNAISSANCE

Following the commendation, the Black Sun formally assigned the Kamino reconnaissance mission with the following parameters:

OBJECTIVE:
Travel to Kamino and conduct a reconnaissance investigation of the planet. The party's mission is to gather intelligence on the state of the clone army production and any related facilities or operations on Kamino. Specific intelligence targets include:

• Operational status of cloning facilities
• Production capacity and current output levels
• Command structure and leadership on Kamino
• Security protocols and military presence
• Any evidence of corruption, decay, or inefficiency in clone operations
• Financial or logistical networks supporting the operation
• Presence of Force-sensitive individuals or unique assets

MISSION CLASSIFICATION:
• Type: Reconnaissance (intelligence gathering, observation, non-combat)
• This is a covert operation
• No other organizations, governments, or individuals are aware of this mission
• The party operates independently and reports solely to Thedic Fling
• The party is to assume they are the only outside force investigating Kamino

OPERATIONAL SECURITY:
• The party is instructed to maintain absolute discretion regarding this mission
• No communication with Imperial authorities, Jedi, Hutt Cartel, or rival criminal organizations
• All findings are to be reported to Thedic Fling via secure channel
• The Black Sun will provide resources and support for the infiltration and escape if needed

COMPENSATION:
• Payment: 2,000 credits per party member upon successful retrieval and delivery of actionable intelligence
• Total: 8,000 credits (assuming 4 active members)
• Payment will be transferred to secure accounts once Thedic confirms receipt of the intelligence report

STRATEGIC IMPORTANCE

The Black Sun leadership emphasized that Kamino represents a critical intelligence opportunity. The existence of a clone army is strategically significant, and understanding its current state, capabilities, and vulnerabilities could provide leverage in future negotiations with multiple factions. The party's success could position the Black Sun as a major player in galactic intelligence networks.

UNKNOWNS & COMPLICATIONS

The party remains unaware that:

• Darth Sidious has also transmitted the Kamino coordinates to the Hutt Cartel
• A Hutt Cartel strike squad has already been dispatched to Kamino to investigate and potentially secure clone-related assets
• Thedic is simultaneously reporting this mission to Darth Sidious and Darth Maul
• The Hutt presence on Kamino creates a potential conflict or complication during the party's reconnaissance
• Multiple factions are now converging on Kamino with competing interests`;

const { data: existing, error: lookupError } = await supabase
  .from('SW_campaign_notes')
  .select('id')
  .eq('CampaignID', campaignId)
  .eq('Place_Name', 'Formal Black Sun Meeting — Kamino Reconnaissance');
if (lookupError) throw lookupError;

let result;
if (existing?.length) {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .update({ Description: description, Part_of_Place: episodeId.toString() })
    .eq('id', existing[0].id)
    .select('id, Place_Name, Part_of_Place');
  if (error) throw error;
  result = { updated: data };
} else {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .insert([{
      Place_Name: 'Formal Black Sun Meeting — Kamino Reconnaissance',
      Description: description,
      Part_of_Place: episodeId.toString(),
      CampaignID: campaignId,
      Order: 0,
    }])
    .select('id, Place_Name, Part_of_Place');
  if (error) throw error;
  result = { inserted: data };
}

console.log(JSON.stringify({ episodeId, ...result }, null, 2));
