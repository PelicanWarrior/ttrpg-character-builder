import { supabase } from './src/supabaseClient.js';

const campaignId = 2;
const parentPlaceId = '166';

const noteDefinitions = [
  {
    Place_Name: 'Vey Salvage & Repair',
    Description: 'A legitimate repair yard tucked into an Uscru service lane, where mechanics, cargo handlers, and small ship operators bring in damaged engines, hull plating, and electrical systems. The front counter is spotless, the manifests are meticulous, and the owners insist that every part is documented, inspected, and sold with a receipt. Beneath the respectable image, the yard also quietly handles off-book repairs for people who want their ships fixed without drawing attention. The place is useful for honest work, but also for anyone who wants to learn which clients are desperate, wealthy, or careless.',
    Part_of_Place: parentPlaceId,
    Order: 1,
    CampaignID: campaignId,
  },
  {
    Place_Name: 'Blackline Chop Shop',
    Description: 'A grimy, half-hidden workshop in the lower service tunnels of Uscru where stolen ship components, cut blaster parts, and illicit tech are stripped, repainted, and resold. The owners keep the place looking like a dead-end salvage yard, but the rear bays hold hidden workstations, forged manifests, and crates of goods with their serials scrubbed away. It is the kind of place where a pilot can sell a stolen engine, a gang can fence a blaster core, or a desperate crew can buy a replacement part without asking too many questions.',
    Part_of_Place: parentPlaceId,
    Order: 2,
    CampaignID: campaignId,
  },
];

const existingNotes = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name')
  .eq('CampaignID', campaignId)
  .in('Place_Name', noteDefinitions.map((note) => note.Place_Name));

if (existingNotes.error) throw existingNotes.error;

const existingNames = new Set((existingNotes.data || []).map((note) => note.Place_Name));
const notesToInsert = noteDefinitions.filter((note) => !existingNames.has(note.Place_Name));

let insertedNotes = [];
if (notesToInsert.length > 0) {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .insert(notesToInsert)
    .select('id, Place_Name');
  if (error) throw error;
  insertedNotes = data || [];
}

const allNotes = [...(existingNotes.data || []), ...insertedNotes];
const noteMap = Object.fromEntries(allNotes.map((note) => [note.Place_Name, note.id]));

const npcDefinitions = [
  {
    Name: 'Mera Vey',
    Description: 'Owner of Vey Salvage & Repair, a practical and careful human businesswoman who keeps a respectable front and a surprisingly wide network of shipwright contacts. She is legally cautious but not naive, and she knows which customers are honest, which are desperate, and which are likely to vanish with a half-paid invoice. She can be a source of legitimate work, but she is also willing to quietly pass along information if the price is right.',
    Brawn: 2,
    Cunning: 3,
    Presence: 2,
    Agility: 2,
    Intellect: 3,
    Willpower: 3,
    Skills: 'Mechanics,Negotiation,Perception',
    Abilities: 'Practical,Patient',
    Equipment: 'Toolbelt,Dataslate,Heavy blaster pistol',
    CampaignID: campaignId,
    Part_of_Place: String(noteMap['Vey Salvage & Repair']),
    Force_Rating: 0,
    Soak: 2,
    Wound: 11,
    Strain: 12,
    PictureID: null,
    Force_Abilities: '',
  },
  {
    Name: 'Kesh Ral',
    Description: 'The broker who runs the rear operations of Blackline Chop Shop, a sharp-tongued, hard-eyed human fixer with a talent for turning stolen tech into usable assets. He keeps his face calm and his voice reasonable, but he has a habit of smiling when someone lies to him. He knows how to move parts, hide serials, and identify which job is worth the risk. He is not a brute, but he is absolutely someone to be wary of when dealing in contraband.',
    Brawn: 2,
    Cunning: 4,
    Presence: 2,
    Agility: 3,
    Intellect: 3,
    Willpower: 2,
    Skills: 'Skulduggery,Streetwise,Underworld',
    Abilities: 'Fast Talk,Resourceful',
    Equipment: 'Holdout blaster,Encrypted datapad,Patchwork jacket',
    CampaignID: campaignId,
    Part_of_Place: String(noteMap['Blackline Chop Shop']),
    Force_Rating: 0,
    Soak: 2,
    Wound: 10,
    Strain: 11,
    PictureID: null,
    Force_Abilities: '',
  },
];

const existingNpcs = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name')
  .eq('CampaignID', campaignId)
  .in('Name', npcDefinitions.map((npc) => npc.Name));

if (existingNpcs.error) throw existingNpcs.error;

const existingNpcNames = new Set((existingNpcs.data || []).map((npc) => npc.Name));
const npcsToInsert = npcDefinitions.filter((npc) => !existingNpcNames.has(npc.Name));

let insertedNpcs = [];
if (npcsToInsert.length > 0) {
  const { data, error } = await supabase
    .from('SW_campaign_NPC')
    .insert(npcsToInsert)
    .select('id, Name, Part_of_Place');
  if (error) throw error;
  insertedNpcs = data || [];
}

const allNpcs = [...(existingNpcs.data || []), ...insertedNpcs];
console.log(JSON.stringify({ notes: allNotes, npcs: allNpcs }, null, 2));
