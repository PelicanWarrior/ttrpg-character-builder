import { supabase } from './src/supabaseClient.js';

const campaignId = 2;
const arenaNoteId = '193';
const name = 'Vekko Vox';

const npc = {
  Name: name,
  Race: 44,
  Description: `Male Pau'an arena announcer with a tall, gaunt frame, pale grey skin, deep-set eyes, and an astonishingly powerful voice. Vekko Vox treats every match like the climax of a galactic sporting epic. He bounds along the arena balcony, punctuates introductions with theatrical pauses, invents outrageous titles for every fighter, and can whip a tired crowd into a frenzy with a single shouted challenge. Beneath the relentless energy, he is observant and commercially sharp, remembering which spectators place large bets and which fighters draw the biggest reactions.`,
  Brawn: 2,
  Cunning: 3,
  Presence: 4,
  Agility: 2,
  Intellect: 2,
  Willpower: 3,
  Skills: 'Charm, Charm, Charm, Coercion, Coercion, Leadership, Leadership, Leadership, Cool, Cool, Perception, Perception, Vigilance, Vigilance, Deception',
  Abilities: 'Commanding Presence,Natural Leader,Master Leader,Voice of Resonance',
  Equipment: null,
  CampaignID: campaignId,
  Part_of_Place: arenaNoteId,
  Soak: 2,
  Wound: 12,
  Strain: 13,
  PictureID: null,
  Force_Abilities: null,
  Force_Rating: 0,
};

const { data: existing, error: lookupError } = await supabase
  .from('SW_campaign_NPC')
  .select('id')
  .eq('CampaignID', campaignId)
  .eq('Name', name);
if (lookupError) throw lookupError;

let result;
if (existing?.length) {
  const { data, error } = await supabase
    .from('SW_campaign_NPC')
    .update(npc)
    .eq('id', existing[0].id)
    .select('id, Name, Race, Skills, Abilities, Part_of_Place');
  if (error) throw error;
  result = { updated: data };
} else {
  const { data, error } = await supabase
    .from('SW_campaign_NPC')
    .insert([npc])
    .select('id, Name, Race, Skills, Abilities, Part_of_Place');
  if (error) throw error;
  result = { inserted: data };
}

console.log(JSON.stringify(result, null, 2));
