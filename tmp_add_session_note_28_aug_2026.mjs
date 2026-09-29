import { supabase } from './src/supabaseClient.js';

const campaignId = 2;
const myNotesId = '51';

const description = `Before the Jedi Temple mission, several developments occurred that would set the stage for the infiltration.

Eril spoke privately with his sister Thedic to catch up after their time apart. During the conversation, Eril revealed something that had been troubling Nix: she had been experiencing a recurring nightmare in which a Dathomirian — a figure bearing the appearance of Darth Maul — was systematically killing her husband. The dream was vivid and distressing, and Eril shared this with Thedic, perhaps seeking guidance or confirmation that it meant nothing. Whether Thedic took this information at face value or recognized its significance remains unclear.

In a separate encounter, Nix and Tol met a superfan of Tol's racing reputation. The fan was enthusiastic about Tol's exploits and, impressed by his presence, asked him to race for their team in an upcoming competition. This was an unexpected opportunity, and it suggested that Tol's name still carried weight in racing circles despite his years away from the sport.

A fighting tournament was also announced to take place in a couple of days time, adding to the backdrop of activity in the Uscru District.

JEDI TEMPLE INFILTRATION

The party's mission to infiltrate the Jedi Temple and retrieve the Kamino coordinates began with mixed results across multiple infiltration routes.

IG-07, the droid, attempted to gain access by presenting himself as a maintenance unit. He was successful in being recruited by the janitors, but the Temple Guards fitted him with a restraining bolt and a tracking device. This limited his mobility and alerted the Jedi to his presence, though the bolt was later expertly removed by Eril.

Vapan and Tol proceeded with the public tour, with Vapan adopting a convincing performance as a mentally handicapped visitor to avoid suspicion. Vapan managed to advance further than expected, reaching the 5th floor before being challenged by a Temple Guard. In a moment of desperation — or inspiration — Vapan deliberately lost control of his bladder to cause a distraction. The resulting chaos and the Guard's disgust at the situation provided the opening Vapan needed. With this distraction in place, IG-07 was able to slip onto the 5th floor undetected. However, Tol was unable to progress past the 3rd floor and became stranded on that level, unable to advance further without drawing attention.

Lowrick and Eril took the more direct route through the ventilation ducts. The passage was narrow and difficult to navigate, requiring careful movement and timing, but they managed to make their way successfully to the 5th floor. Their progress was slower than hoped, but the ducts proved more reliable than the public routes.

Nix, wearing stolen Jedi robes and carrying herself with calculated confidence, attempted to bluff her way through the Temple's restricted areas. She succeeded in reaching the 5th floor and made her way into the Stellar Astrogation archives room. Her Jedi disguise held up long enough for her to access the restricted data terminals.

Once inside the archives, Nix began searching for the Kamino coordinates. The records were extensive and deliberately obfuscated, and Nix could not immediately locate the planet in the database. Eril, who had by then arrived via the ventilation ducts, assisted in the search. Together, they navigated the encrypted records and found the Kamino coordinates hidden within a restricted subsection of the archives.

Escape from the Temple required each party member to leave independently to avoid drawing further attention. They moved separately through different routes, retracing their paths and exiting through various points in the Temple structure. The party regrouped on the ground floor, having successfully avoided being captured or identified as a coordinated team.

Back at ground level, Eril immediately set to work removing the restraining bolt and the tracking device from IG-07. His mechanical expertise made quick work of the bonds, and the droid was freed before they departed the Temple grounds.

The party then made their way back to the Uscru District on Coruscant, returning to familiar territory with the Kamino coordinates in hand and the Temple infiltration complete. What the Jedi will make of their infiltration — if they discover it at all — remains to be seen.`;

const { data: existing, error: lookupError } = await supabase
  .from('SW_campaign_notes')
  .select('id')
  .eq('CampaignID', campaignId)
  .eq('Place_Name', '28th August 2026');
if (lookupError) throw lookupError;

let result;
if (existing?.length) {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .update({ Description: description, Part_of_Place: myNotesId })
    .eq('id', existing[0].id)
    .select('id, Place_Name, Part_of_Place');
  if (error) throw error;
  result = { updated: data };
} else {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .insert([{
      Place_Name: '28th August 2026',
      Description: description,
      Part_of_Place: myNotesId,
      CampaignID: campaignId,
      Order: 1,
    }])
    .select('id, Place_Name, Part_of_Place');
  if (error) throw error;
  result = { inserted: data };
}

console.log(JSON.stringify(result, null, 2));
