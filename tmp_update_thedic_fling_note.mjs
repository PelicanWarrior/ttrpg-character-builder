import { supabase } from './src/supabaseClient.js';

const campaignId = 2;
const thedicNoteId = 207;

const description = `THEDIC FLING — DARTH SIDIOUS'S AGENT & BLACK SUN OPERATIVE

Thedic Fling is a Force-sensitive operative (Force Rating 2) who serves a dual role: she reports to Darth Sidious, a Sith Lord working to bring balance to the galaxy, and maintains her cover as a mid-level operative for the Black Sun criminal organization. She knows Sidious's true identity and his Sith lineage, and she believes in his vision for galactic restructuring.

HER OPERATIONAL STRUCTURE

Thedic operates across two intelligence networks:

PRIMARY HANDLER: Darth Sidious (Sith Lord)
• Knows his true identity and Sith nature
• Believes in his ideology and vision for balance
• Reports directly on Force-sensitive individuals and threats
• Receives strategic direction on long-term objectives

SECONDARY HANDLER: Black Sun Organization
• Maintains cover as a legitimate criminal operative
• Reports on business opportunities, intelligence, and assets
• Receives tactical direction on immediate operations and revenue opportunities

WHAT THEDIC KNOWS

Operational Intelligence:
• The party is sophisticated and capable of coordinated infiltration operations
• They have acquired Kamino coordinates from the Jedi Temple, suggesting they are seeking clone army-related intelligence
• The party consists of: Eril Fling (her brother), Nix (Dathomirian, Force-sensitive), Tol (racing pilot), Vapan (tactical operative), Lowrick, and IG-07 (droid)
• Eril Fling is her brother; his family is under Hutt Cartel control
• The party successfully infiltrated the Jedi Temple on 28th August 2026

Force-Related Intelligence:
• Nix is Force-sensitive and has been experiencing vivid nightmares in which a Dathomirian Sith (Darth Maul) systematically kills her husband
• This vision is significant: it suggests either genuine premonition, connection to Sith entities, or potential Force manipulation
• Nix successfully infiltrated the Jedi Temple using stolen robes, demonstrating either exceptional luck or Force assistance

Personal/Family Intelligence:
• The Fling family (Eril's parents and relatives) live aboard the sandcrawler Dunebreaker
• The family is under Hutt Cartel control and forced to manufacture and repair droid components
• This relationship provides leverage over Eril

IMMEDIATE ACTIONS & REPORTING

REPORT 1: To Darth Sidious & Darth Maul (After Jedi Temple Infiltration)

Thedic will inform Sidious and Maul of Nix's recurring vision:
• A Force-sensitive woman (Dathomirian) is experiencing visions of Maul killing her husband
• The visions are consistent and distressing; whether they are premonition, memory, or manipulation is unclear
• The party accessed the Jedi Temple and retrieved restricted coordinates (Kamino)

Sidious's Response:
• Recommends that Thedic remain close to the party and monitor Nix's Force development
• Suggests that Nix may be a valuable asset or a threat that requires observation
• Indicates that the Kamino coordinates are strategically important
• Implies that other actors (the Hutts, the Black Sun) may also be interested in Kamino

REPORT 2: To Black Sun Handler (Evening Meeting)

Thedic reports to the Black Sun that:
• The party has acquired Kamino coordinates from the Jedi Temple
• Kamino is a strategic location with potential intelligence value
• The party may be willing to travel to Kamino to investigate further

Black Sun's Response:
• Arranges a meeting with the party that same evening (28th August 2026)
• Proposes a business opportunity: Black Sun will fund/support a Kamino investigation in exchange for a share of any intelligence or assets discovered
• Tests the party's loyalty and capability through negotiation

REPORT 3: To Darth Sidious (Secured Channel)

Thedic obtains the Kamino coordinates directly from Eril (leveraging their sibling relationship and family concerns) and reports them to Sidious:
• Provides exact coordinates to Kamino
• Confirms that the party has access to and knowledge of the location
• Reports on party composition and capabilities for infiltration/investigation

Sidious's Actions:
• Passes the Kamino coordinates to a contact within the Hutt Cartel organization
• The Hutt contact dispatches their own squad to Kamino to investigate and secure any clone army-related assets or intelligence
• This creates a competing interest: the Hutts now have their own operation on Kamino, independent of the party's knowledge
• Sidious continues to use Thedic as a monitor on the party while a Hutt team operates in parallel

THE COORDINATION TRAP

Thedic is now positioned at the intersection of three competing objectives:

1. Sidious's long-term strategic interests (monitoring Force users, acquiring clone technology, advancing the Sith agenda)
2. Black Sun's immediate criminal interests (profiting from Kamino intelligence)
3. The party's presumed goals (investigating Kamino for their own reasons)

This creates operational complications:
• If the party learns that the Hutts have a team on Kamino, they may suspect Thedic's involvement
• If the Black Sun meeting reveals information that the party doesn't trust, they may cut Thedic out
• Thedic's genuine affection for her brother Eril may conflict with her loyalty to Sidious
• The Hutt squad's presence on Kamino could endanger the party (depending on their allegiances) or provide unexpected assistance

THEDIC'S PERSONAL POSITION

Force Sensitivity & Alignment:
• Thedic is Force-sensitive (Force Rating 2) and believes in Sidious's vision
• She has been trained or guided by Sidious in subtle uses of the Force for manipulation, deception, and persuasion
• Her Force sensitivity enhances her effectiveness as an operative but also deepens her ideological alignment with the Sith

Emotional Vulnerabilities:
• Her brother Eril is now directly involved in activities that intersect with both Sidious's agenda and the Hutt's interests
• She cares genuinely about Eril and their family's wellbeing, but may not hesitate to use this relationship for intelligence gathering
• If she discovers that her actions directly endanger Eril, she may experience operational conflict

KNOWLEDGE OF DARTH MAUL

Thedic knows that Darth Maul is a Sith apprentice/operative under Sidious. She is aware of:
• His role in Sidious's organization
• His capabilities and ruthlessness
• His connection to Dathomiri and potential interest in Force-sensitive Dathomirians
• The significance of Nix's vision mentioning a Dathomirian Sith figure

NEXT STEPS & UNKNOWNS

Known Actions:
• Evening meeting with the party (via Black Sun) to discuss Kamino investigation
• Obtaining Kamino coordinates from Eril for Sidious's use
• Continued monitoring of Nix's Force sensitivity and visions
• Maintaining cover as Black Sun operative and sympathetic family contact

Potential Developments:
• The Hutt squad's arrival on Kamino may be before, during, or after the party's investigation
• The party's relationship with the Hutts and Black Sun will determine how these parallel operations interact
• Nix may develop stronger Force abilities or receive further visions
• Sidious may eventually request that Thedic move into a more active operational role (beyond surveillance)`;

const { data, error } = await supabase
  .from('SW_campaign_notes')
  .update({ Description: description })
  .eq('id', thedicNoteId)
  .select('id, Place_Name, Part_of_Place');

if (error) throw error;

console.log(JSON.stringify({ updated: data }, null, 2));
