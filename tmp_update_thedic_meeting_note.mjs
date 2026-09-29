import { supabase } from './src/supabaseClient.js';

const campaignId = 2;
const noteId = 208;

const description = `MEETING WITH THEDIC — BLACK SUN NEGOTIATION

Following the party's escape from the Jedi Temple, Thedic Fling arranged an immediate meeting with the group. The encounter took place in a secured location away from direct Imperial or Jedi surveillance.

THEDIC RETRIEVES THE COORDINATES

Thedic approached Eril and requested access to the coordinates recovered from the Jedi Temple's Astro Navigation archives. She explained that she needed to verify the information and report it to her contacts. Eril provided the coordinates to Thedic via his droid terminal.

Thedic did not explicitly state at this time that she was reporting directly to Darth Sidious; she maintained her cover as a mid-level Black Sun operative with access to valuable intelligence networks.

PAYMENT FOR JEDI TEMPLE INFILTRATION

Upon receiving the coordinates, Thedic distributed immediate payment for the successful completion of the Jedi Temple infiltration mission. This payment represented Black Sun's satisfaction with the operation and their confidence in the party's capabilities:

• Total Payment: 20,000 credits (5,000 credits per member × 4 members)
• Payment was conditional on the delivery of verified Kamino coordinates
• The payment demonstrated Black Sun's serious financial commitment and their recognition of the party's value

REPORT TO BLACK SUN LEADERSHIP

Thedic immediately transmitted the Kamino coordinates and a full briefing on the Jedi Temple infiltration to her superiors within the Black Sun organization. The report included:

• Confirmation that Kamino coordinates exist and have been successfully acquired
• Details on the party's infiltration methods and capabilities
• Assessment that the party is capable and available for further operations
• Recommendation for immediate engagement and partnership on Kamino reconnaissance

BLACK SUN'S RESPONSE — KAMINO RECONNAISSANCE MISSION

The Black Sun leadership reviewed the intelligence and authorized a follow-up operation. They commissioned the party to conduct a reconnaissance mission to Kamino with the following parameters:

MISSION OBJECTIVE:
Travel to Kamino and investigate the planet. The party is to gather any information that could be strategically valuable to the Black Sun and the party's own cause. This includes but is not limited to:
• Evidence of clone army operations or production facilities
• Records of Imperial or other governmental contracts
• Financial networks or command structures
• Security protocols and vulnerabilities
• Any Force-sensitive or unique individuals present on Kamino

MISSION TYPE: Reconnaissance (not acquisition or combat operation)

COMPENSATION:
• 2,000 credits per party member for successful completion of reconnaissance mission
• Total: 8,000 credits (assuming 4 active members)
• Payment contingent on delivery of actionable intelligence

MISSION BRIEFING:
Thedic explained that this was a critical opportunity. The coordinates have strategic value, and Black Sun wants to understand what exists on Kamino before committing to larger operations. The party's proven ability to infiltrate and gather intelligence makes them ideal for this mission.

EVENING CONTACT — ARRANGEMENT FOR FORMAL MEETING

Later that evening, Thedic contacted Eril directly via secure communication channel (video call). She explained that the Black Sun leadership wished to conduct a formal meeting with the entire party to discuss the Kamino operation in greater detail and establish operational protocols.

Key details of her proposal:

• The meeting would be conducted via video conference for security reasons
• Attendees would include Thedic, at least one representative from Black Sun leadership, and the full party
• The purpose would be to finalize mission parameters, timeline, supply needs, and expected outcomes for the Kamino reconnaissance
• The meeting could take place that night or the following morning, depending on the party's availability

Thedic emphasized that this was a significant opportunity and that the Black Sun viewed the party as valuable partners rather than subordinates. She urged Eril to gather the group and confirm their participation.

IMPLICATIONS & UNKNOWNS

From Thedic's Perspective:
• She has successfully leveraged the Jedi Temple coordinates to advance both Black Sun's interests and her own standing with Darth Sidious
• The party's proven capability has validated her recommendation to her handlers
• She remains positioned to monitor the party's activities and report to both the Black Sun and Sidious
• The Kamino reconnaissance mission will provide additional intelligence for her reports

For the Party:
• They have received 20,000 credits for the Jedi Temple infiltration and are positioned to earn an additional 8,000 credits from the Kamino mission
• Accepting the Kamino mission creates a financial relationship with a major criminal organization and establishes ongoing obligations
• The video conference meeting will formalize their relationship with the Black Sun and set expectations for the reconnaissance operation
• They remain unaware that Thedic is simultaneously reporting to Darth Sidious and that a Hutt squad has already been dispatched to Kamino by Sidious
• The Hutt squad's presence on Kamino creates an unknown variable that may intersect with the party's reconnaissance mission`;

const { data, error } = await supabase
  .from('SW_campaign_notes')
  .update({ Description: description })
  .eq('id', noteId)
  .select('id, Place_Name, Part_of_Place');

if (error) throw error;

console.log(JSON.stringify({ updated: data }, null, 2));
