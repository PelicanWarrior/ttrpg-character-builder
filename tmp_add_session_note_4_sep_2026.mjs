import { supabase } from './src/supabaseClient.js';

const campaignId = 2;
const title = '4th September 2026';
const description = `The party made it back to the Uscru District after retrieving the coordinates for Kamino from the Jedi Temple.

While in Uscru, Tol met Kesh Ral in a back alley. Kesh was the dealer who had sold them the Jedi clothes used for the Temple infiltration. He tried to blackmail Tol into making a cargo run to Ord Mantell, threatening to tell the authorities what he knew about Tol and Nyx infiltrating the Jedi Temple if Tol refused. Kesh then took matters into his own hands and loaded the cargo aboard the party's ship.

The party inspected the cargo and discovered data chips hidden inside. They later met with Thedic Fling and gave her the coordinates for Kamino. Thedic assigned them a new mission: travel to Kamino and conduct a reconnaissance operation. The party will receive 10,000 credits as a group if they return with information.

Tol told Thedic about Kesh's attempt to blackmail him into the Ord Mantell cargo run and promptly handed over the data chips.`;

const { data: parent, error: parentError } = await supabase
  .from('SW_campaign_notes')
  .select('id')
  .eq('CampaignID', campaignId)
  .eq('Place_Name', 'My Notes')
  .single();
if (parentError) throw parentError;

const { data: existing, error: lookupError } = await supabase
  .from('SW_campaign_notes')
  .select('id')
  .eq('CampaignID', campaignId)
  .eq('Place_Name', title);
if (lookupError) throw lookupError;

let result;
if (existing?.length) {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .update({ Description: description, Part_of_Place: String(parent.id) })
    .eq('id', existing[0].id)
    .select('id, Place_Name, Part_of_Place');
  if (error) throw error;
  result = { updated: data };
} else {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .insert([{
      Place_Name: title,
      Description: description,
      Part_of_Place: String(parent.id),
      CampaignID: campaignId,
      Order: 1,
    }])
    .select('id, Place_Name, Part_of_Place');
  if (error) throw error;
  result = { inserted: data };
}

console.log(JSON.stringify(result, null, 2));