import { supabase } from './src/supabaseClient.js';

const note = {
  Place_Name: '7th August 2026',
  CampaignID: 2,
  Part_of_Place: '51',
  Order: 1,
  Description: `The party travelled to the Uscru District on Coruscant, entering one of the city's crowded mid-levels where corporate traffic, underworld business, and neon-lit nightlife all overlap. With the district's service lanes and sky-bridges humming around them, they made their way to The Split Sabacc for a drink and a little relief before the next stage of their mission.

The evening at The Split Sabacc quickly became more eventful than planned. The party joined the gambling tables, won some money, and became involved in the sort of shenanigans that are almost inevitable in an underworld gambling den. Whether they made new contacts, attracted unwanted attention, or simply left with more credits than they arrived with remains part of the night's story, but they certainly did not pass through Uscru unnoticed.

The following morning, the party met with Thedic Fling. She went over the plan for infiltrating the Jedi Temple and recovering the coordinates for Kamino. The coordinates are believed to be held on the fifth floor, inside the temple's Stellar Astrogation archives room. The mission is not simply a matter of reaching the building: the party must get inside, pass through several layers of security, and reach a restricted area without revealing why they are there.

Thedic outlined several possible approaches:

• Temple tour: A public tour normally reaches the third floor. The party could join the tour, remain inconspicuous, and then find a way to continue upward toward the fifth floor.

• Ventilation ducts: Ventilation routes run throughout the temple and may provide a less visible route through the complex. The passages are likely cramped, difficult to navigate, and may contain maintenance systems or security measures of their own.

• Cleaning droids: Thedic pointed out that the Jedi use droids to clean and maintain parts of the temple. This may offer an opportunity to disguise equipment, hide within a service area, or use the temple's maintenance routines to move through restricted sections.

Thedic also warned them that Temple Guards are present throughout the complex. These guards are trained to notice suspicious behaviour, unexpected movement, and anyone who cannot give a convincing reason for being in a particular part of the temple. The party will need to be careful about their clothing, their cover story, and how they react if questioned.

Before beginning the mission, the party decided to acquire Jedi garments from a nearby black-market dealer. The garments may help them pass at a distance, but they are not a perfect disguise. Anyone who examines them closely could notice inconsistencies in the cut, markings, or quality, and the clothing will not hide the party's unfamiliarity with temple procedures.

Because IG-07 still had the hidden holocron inside him, the party decided that it was too dangerous to take the artifact into the Jedi Temple. IG-07 was unable to conceal it properly, so Lowrick took responsibility for hiding it aboard the ship. When Lowrick touched the holocron, he experienced an alarming vision. The nature of the vision is still unclear, but it left the party with the uneasy sense that the holocron may be more aware of them than they would like.

After securing the holocron, the party took IG-07 to a nearby droid-cleaning shop. The cleaning was intended to remove dirt, residue, and evidence of their recent travels before the infiltration. It also gave them a final opportunity to inspect IG-07 and make sure that nothing obvious remained to connect him to the Sith technology or the events that brought them to Coruscant.

The party now has the information, clothing, and possible routes they need. The Jedi Temple awaits, the Kamino coordinates are somewhere on the fifth floor, and Thedic's advice has given them several ways in. The remaining question is whether they are truly ready for the mission — or whether the temple, Thedic's hidden agenda, or the holocron's influence will expose them before they reach the archives.`,
};

const { data: existing, error: existingError } = await supabase
  .from('SW_campaign_notes')
  .select('id')
  .eq('CampaignID', note.CampaignID)
  .eq('Place_Name', note.Place_Name);

if (existingError) throw existingError;

if (existing?.length) {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .update({ Description: note.Description, Part_of_Place: note.Part_of_Place, Order: note.Order })
    .eq('id', existing[0].id)
    .select('id, Place_Name, Part_of_Place');
  if (error) throw error;
  console.log(JSON.stringify({ updated: data }, null, 2));
} else {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .insert([note])
    .select('id, Place_Name, Part_of_Place');
  if (error) throw error;
  console.log(JSON.stringify({ inserted: data }, null, 2));
}
