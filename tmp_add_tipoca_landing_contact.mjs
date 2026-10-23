import { supabase } from './src/supabaseClient.js';

const campaignId = 2;
const name = 'Liac Pru';
const previousName = 'Sael Venn';

const { data: city, error: cityError } = await supabase
  .from('SW_campaign_notes')
  .select('id')
  .eq('CampaignID', campaignId)
  .eq('Place_Name', 'Tipoca City')
  .single();
if (cityError) throw cityError;

const npc = {
  Name: name,
  Race: 55,
  Description: 'Kaminoan landing-strip liaison for Tipoca City. Liac Pru meets arriving travelers with quiet formality, confirms their flight details, and offers to guide them through the city\'s arrival procedures. Tall and pale, with a long neck, dark eyes, and an immaculate white uniform, Liac is observant and difficult to fluster. Liac asks precise questions about the party\'s purpose on Kamino but does not assume they are hostile. Their knowledge of landing schedules, access protocols, and local routes can help the party begin its reconnaissance mission.',
  Brawn: 2,
  Agility: 2,
  Intellect: 4,
  Cunning: 3,
  Willpower: 3,
  Presence: 3,
  Skills: 'Negotiation,Negotiation,Computers,Computers,Perception,Vigilance,Outer Rim,Cool',
  Abilities: "Heightened Senses,Nobody's Fool 1,Known Schematic",
  Equipment: 'Immaculate white landing-official uniform, Tipoca City access credentials, scheduling datapad, long-range comlink',
  CampaignID: campaignId,
  Part_of_Place: String(city.id),
  Force_Rating: 0,
  Soak: 2,
  Wound: 12,
  Strain: 13,
  PictureID: null,
  Force_Abilities: '',
};

const { data: existing, error: existingError } = await supabase
  .from('SW_campaign_NPC')
  .select('id')
  .eq('CampaignID', campaignId)
  .in('Name', [name, previousName]);
if (existingError) throw existingError;

const query = existing?.length
  ? supabase.from('SW_campaign_NPC').update(npc).eq('id', existing[0].id)
  : supabase.from('SW_campaign_NPC').insert([npc]);
const { data, error } = await query
  .select('id, Name, Race, Description, Skills, Abilities, Part_of_Place');
if (error) throw error;

console.log(JSON.stringify(existing?.length ? { updated: data } : { inserted: data }, null, 2));