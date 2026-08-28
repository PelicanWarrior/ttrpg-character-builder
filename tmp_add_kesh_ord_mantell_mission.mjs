import { supabase } from './src/supabaseClient.js';

const campaignId = 2;
const campaignIdeasId = '108';
const keshId = 134;
const missionTitle = "Kesh Ral's Ord Mantell Run";

const missionDescription = `After the Jedi Temple mission, Kesh Ral accosts Nix and Tol in the Uscru District. He has been watching them since the incident at the Blackline Chop Shop, when Nix used the Force to move the security cameras while Tol was with her. Kesh's local contacts have since assembled a rough profile on both of them.

What Kesh has learned:

• Tol was involved in the deaths of many innocent people during an earlier operation. Kesh does not yet know the full story, but he knows enough to make the information dangerous. The details can be expanded later.

• The Black Sun has been looking for Nix. Kesh does not know exactly why, but he knows that her name has appeared in Black Sun inquiries and that their interest is more than casual.

• The pair recently carried out a job inside the Jedi Temple. Kesh does not know what they stole, recovered, or were searching for, but their temple disguises, unusual movements, and the questions reaching his network make the conclusion obvious.

Kesh is not employed by Black Sun or the Hutt Cartel. He is an independent broker who delivers information, cargo, and opportunities for whoever pays him. He has no loyalty beyond his own survival and the value of a completed contract.

THE OFFER

Kesh gives Nix and Tol a choice: he can keep quiet about the camera incident, their backgrounds, and the Jedi Temple job, but silence has a price. They must transport a small shipment of contraband to Ord Mantell and deliver it to a Hutt-backed contact operating through the planet's freight and swoop-racing networks.

THE CARGO

The shipment is deliberately mixed so that it looks like ordinary underworld freight:

• Scrubbed ship transponder components and replacement identity plates.
• Encrypted comm relays capable of linking Hutt safehouses and convoy crews.
• Compact weapons parts and power cells concealed inside legitimate racing-equipment crates.
• A sealed data cylinder containing route schedules, warehouse access codes, and names of local suppliers willing to work for the Hutts.

Kesh claims the shipment is only contraband. In reality, the data cylinder is the important part. It contains enough logistical information for the Hutts to establish a reliable supply and protection network on Ord Mantell, allowing them to challenge Black Sun control of the planet's criminal infrastructure. The weapons parts will equip the first local security crews, while the comm relays will let the Hutt contact coordinate protection, collection, and retaliation.

MISSION OBJECTIVE

The party must take the cargo from Coruscant to Ord Mantell, avoid Republic customs and Black Sun attention, and deliver it intact to Kesh's Hutt contact. They are not being asked to conquer the planet. They are helping the Hutts turn an existing presence into a claim of control.

COMPLICATIONS

• Black Sun is already watching Ord Mantell's freight lanes and may identify the shipment as a Hutt move.
• A Republic inspection team receives a partial cargo manifest and wants to search the vessel.
• The Hutt contact may demand that the party complete one additional delivery before accepting the full shipment.
• The data cylinder contains evidence that a local Black Sun operator has been selling access codes to both sides.
• Kesh has withheld one detail: another crew has been sent to intercept the cargo if the party refuses or delays.

POSSIBLE OUTCOMES

SUCCESS: The shipment reaches the Hutt contact. Hutt influence expands across the Ord Mantell freight network, and Black Sun loses access to key routes and suppliers. Kesh keeps his word and remains silent.

PARTIAL SUCCESS: The cargo arrives, but the data cylinder or weapons components are lost. The Hutts gain a foothold, but Black Sun retains enough infrastructure to retaliate.

FAILURE: Black Sun captures the shipment or traces it back to Kesh. He denies involvement, disappears from Uscru, and may sell the party's identities to the highest bidder.

BETRAYAL OPTION: The party can sell the shipment to Black Sun, warn the local operators on Ord Mantell, or keep the data cylinder for themselves. Any of these choices turns Kesh from a useful blackmailer into a future enemy or reluctant ally.

The mission gives the party a chance to erase one immediate problem while quietly altering the balance of the Hutt–Black Sun war. Kesh's warning is simple: he does not care who owns Ord Mantell, only who pays him to move the pieces.`;

const keshDescription = `An independent Chiss fixer who runs the rear operations of Blackline Chop Shop in the Uscru District. After Nix used the Force to move his security cameras while Tol was present, Kesh investigated them through his local contacts. He learned that Tol was connected to a past incident involving many innocent deaths, that Black Sun was looking for Nix, and that the pair had recently carried out an unknown job inside the Jedi Temple.

Kesh does not work for Black Sun or the Hutt Cartel. He delivers information, cargo, and opportunities for whoever pays him. After the temple mission, he confronts Nix and Tol and offers to keep quiet in exchange for a contraband run to an independent Hutt contact on Ord Mantell. His loyalty is to his own survival and the value of a completed deal.`;

const { data: existingNote, error: noteLookupError } = await supabase
  .from('SW_campaign_notes')
  .select('id')
  .eq('CampaignID', campaignId)
  .eq('Place_Name', missionTitle);
if (noteLookupError) throw noteLookupError;

let noteResult;
if (existingNote?.length) {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .update({ Description: missionDescription, Part_of_Place: campaignIdeasId })
    .eq('id', existingNote[0].id)
    .select('id, Place_Name, Part_of_Place');
  if (error) throw error;
  noteResult = { updated: data };
} else {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .insert([{
      Place_Name: missionTitle,
      Description: missionDescription,
      Part_of_Place: campaignIdeasId,
      CampaignID: campaignId,
      Order: 1,
    }])
    .select('id, Place_Name, Part_of_Place');
  if (error) throw error;
  noteResult = { inserted: data };
}

const { data: keshResult, error: keshError } = await supabase
  .from('SW_campaign_NPC')
  .update({ Description: keshDescription })
  .eq('id', keshId)
  .select('id, Name, Description, Part_of_Place');
if (keshError) throw keshError;

console.log(JSON.stringify({ mission: noteResult, kesh: keshResult }, null, 2));
