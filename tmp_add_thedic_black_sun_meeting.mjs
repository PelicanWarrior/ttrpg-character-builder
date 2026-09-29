import { supabase } from './src/supabaseClient.js';

const campaignId = 2;
const sessionNoteParentId = '206'; // 28th August 2026 session

const description = `MEETING WITH THEDIC — BLACK SUN NEGOTIATION

Following the party's escape from the Jedi Temple, Thedic Fling arranged an immediate meeting with the group. The encounter took place in a secured location away from direct Imperial or Jedi surveillance.

THEDIC RETRIEVES THE COORDINATES

Thedic approached Eril and requested access to the coordinates recovered from the Jedi Temple's Astro Navigation archives. She explained that she needed to verify the information and report it to her contacts. Eril provided the coordinates to Thedic via his droid terminal.

Thedic did not explicitly state at this time that she was reporting directly to Darth Sidious; she maintained her cover as a mid-level Black Sun operative with access to valuable intelligence networks.

REPORT TO BLACK SUN LEADERSHIP

Thedic immediately transmitted the Kamino coordinates and a full briefing on the Jedi Temple infiltration to her superiors within the Black Sun organization. The report included:

• Confirmation that Kamino coordinates exist and have been successfully acquired
• Details on the party's infiltration methods and capabilities
• Assessment that the party is capable and available for further operations
• Recommendation for immediate engagement and partnership

BLACK SUN'S RESPONSE & OFFER

The Black Sun leadership reviewed the intelligence and decided to invest in the party's continued operations. They authorized Thedic to present the following offer:

• Black Sun will fund and support a Kamino investigation mission
• The party's findings and any recovered assets will be split: party retains primary findings, Black Sun retains secondary assets or information
• Initial payment: 5,000 credits to each of four party members, for a total of 20,000 credits
• This payment is provided as a goodwill advance and demonstrates Black Sun's serious interest in partnership

Thedic communicated this decision to the party and distributed the credits. She explained that this was a sign of good faith and an investment in their future cooperation.

EVENING CONTACT — ARRANGEMENT FOR FORMAL MEETING

Later that evening, Thedic contacted Eril directly via secure communication channel (video call). She explained that the Black Sun leadership wished to conduct a formal meeting with the entire party to discuss the Kamino operation in greater detail.

Key details of her proposal:

• The meeting would be conducted via video conference for security reasons
• Attendees would include Thedic, at least one representative from Black Sun leadership, and the full party
• The purpose would be to negotiate operational parameters, timeline, budget, and expected outcomes
• The meeting could take place that night or the following morning, depending on the party's availability

Thedic emphasized that this was a significant opportunity and that the Black Sun viewed the party as valuable partners rather than subordinates. She urged Eril to gather the group and confirm their participation.

IMPLICATIONS & UNKNOWNS

From Thedic's Perspective:
• She has successfully leveraged the Jedi Temple coordinates to advance both Black Sun's interests and her own standing with Darth Sidious
• The party's proven capability has validated her recommendation to her handlers
• She remains positioned to monitor the party's activities and report to both the Black Sun and Sidious

For the Party:
• The 20,000 credit payment provides immediate resources but also creates a financial relationship with a major criminal organization
• Accepting Black Sun's offer may close off other opportunities or create obligations
• The video conference meeting will establish the terms of their relationship with the criminal underworld
• They remain unaware that Thedic is simultaneously reporting to Darth Sidious and that a Hutt squad has already been dispatched to Kamino`;

const { data: existing, error: lookupError } = await supabase
  .from('SW_campaign_notes')
  .select('id')
  .eq('CampaignID', campaignId)
  .eq('Place_Name', 'Meeting with Thedic — Black Sun Negotiation');
if (lookupError) throw lookupError;

let result;
if (existing?.length) {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .update({ Description: description, Part_of_Place: sessionNoteParentId })
    .eq('id', existing[0].id)
    .select('id, Place_Name, Part_of_Place');
  if (error) throw error;
  result = { updated: data };
} else {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .insert([{
      Place_Name: 'Meeting with Thedic — Black Sun Negotiation',
      Description: description,
      Part_of_Place: sessionNoteParentId,
      CampaignID: campaignId,
      Order: 1,
    }])
    .select('id, Place_Name, Part_of_Place');
  if (error) throw error;
  result = { inserted: data };
}

console.log(JSON.stringify(result, null, 2));
