import { supabase } from './src/supabaseClient.js';

const campaignId = 2;
const campaignIdeasId = '108';

const description = `THEDIC FLING — SIDIOUS'S UNWITTING AGENT

Thedic Fling is a high-ranking operative who reports directly to Darth Sidious, though she does not know his true identity. She believes she works for a powerful Imperial official with far-reaching resources and connections. She is unaware that her handler is the architect of the Jedi Order's destruction and the rise of the Empire.

HER MISSION & OPERATIONAL PARAMETERS

Thedic's primary objective is to maintain surveillance on the party and provide intelligence about their activities, capabilities, and connections. She has been embedded as a seemingly sympathetic contact who can offer guidance, resources, and legitimate-sounding cover stories for their operations. Her cover is that of an independent operative with access to Imperial and underworld networks.

WHAT THEDIC KNOWS (As of 28th August 2026)

• The party is operating on Coruscant and has been gathering intelligence on Jedi locations and security protocols
• The party has attempted an infiltration of the Jedi Temple and recovered coordinates to the planet Kamino
• The party consists of: Eril Fling (her brother), Nix (a Dathomirian woman with Force sensitivity), Tol (a racing pilot), Vapan (unknown species, tactical capability), Lowrick (unknown species), and IG-07 (a protocol/maintenance droid)
• Eril Fling is her brother and has been away from his family for four years; his family is the Fling clan, currently living aboard the sandcrawler Dunebreaker
• The Fling family is under Hutt Cartel control and forced to manufacture and repair droid components as indentured labour
• Nix has been experiencing vivid nightmares in which a Dathomirian (Darth Maul in appearance) systematically kills her husband; this information was shared with Thedic by Eril during their personal conversation
• The party successfully infiltrated the Jedi Temple on or around 28th August 2026 with mixed results:
  - IG-07 was recruited by Temple janitors but equipped with a restraining bolt and tracker (later removed by Eril)
  - Vapan reached the 5th floor via the tour route using psychological manipulation
  - Tol became stranded on the 3rd floor
  - Lowrick and Eril successfully navigated the ventilation ducts to the 5th floor
  - Nix, disguised in Jedi robes, reached the Stellar Astrogation archives and retrieved Kamino coordinates with Eril's assistance
  - All party members escaped independently and regrouped

INTELLIGENCE TO REPORT TO HANDLER

Thedic will inform her handler that:

• The party is sophisticated and capable of coordinated infiltration operations
• They have acquired Kamino coordinates, suggesting they are seeking clone army-related intelligence
• Nix possesses Force sensitivity (evidenced by her Jedi robe infiltration success) and has been experiencing visions related to Sith or Dark Side entities
• The party includes droid assets (IG-07) and multiple species with diverse skill sets
• Eril Fling's family connections provide a vulnerability: the family's dependence on the Hutts could be leveraged for blackmail or recruitment

POTENTIAL COMPLICATIONS & UNKNOWNS

• If Thedic discovers that Nix's nightmare vision specifically resembled Darth Maul, she may begin to suspect the true nature of her own handlers and the larger conspiracy
• Eril's loyalty to his family versus his loyalty to the party remains unclear
• The party's next objective following the Kamino retrieval is not yet known
• Thedic is unaware of the extent of Nix's Force sensitivity or whether the party includes other Force users

PERSONAL TENSIONS

Thedic genuinely cares about her brother despite her operational role. The personal meeting with Eril created emotional conflict: she expressed real concern about his safety and the family's wellbeing. This creates a potential point of leverage or, conversely, a point where her loyalty to her handler might be questioned if she discovers Sidious's true agenda.

Her bitterness toward the Hutt Cartel is genuine, and she may harbor resentment if she learns that her handler is aligned with forces that perpetuate such exploitation.

NEXT ACTIONS

Thedic will:
• Report all acquired intelligence to her handler at the next scheduled contact
• Continue to offer assistance to the party as a means of maintaining access and gathering further intelligence
• Monitor the party's movements and associations
• Assess whether any party members might be recruited or turned
• Report on Nix's Force sensitivity and any further manifestations of her Dathomirian connection`;

const { data: existing, error: lookupError } = await supabase
  .from('SW_campaign_notes')
  .select('id')
  .eq('CampaignID', campaignId)
  .eq('Place_Name', 'Thedic Fling');
if (lookupError) throw lookupError;

let result;
if (existing?.length) {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .update({ Description: description, Part_of_Place: campaignIdeasId })
    .eq('id', existing[0].id)
    .select('id, Place_Name, Part_of_Place');
  if (error) throw error;
  result = { updated: data };
} else {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .insert([{
      Place_Name: 'Thedic Fling',
      Description: description,
      Part_of_Place: campaignIdeasId,
      CampaignID: campaignId,
      Order: 0,
    }])
    .select('id, Place_Name, Part_of_Place');
  if (error) throw error;
  result = { inserted: data };
}

console.log(JSON.stringify(result, null, 2));
