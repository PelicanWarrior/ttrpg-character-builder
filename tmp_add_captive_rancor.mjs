import { supabase } from './src/supabaseClient.js';

const campaignId = 2;

const npc = {
  Name: 'Captive Rancor',
  Description: 'A captive rancor held for arena spectacle. Silhouette 3. Weapon: Massive Rending Claws (Brawl, Short range, Damage 15, Critical 3, Knockdown, Sunder).',
  Race: null,
  Brawn: 6,
  Agility: 2,
  Intellect: 1,
  Cunning: 3,
  Willpower: 3,
  Presence: 1,
  Soak: 12,
  Wound: 40,
  Strain: 15,
  Force_Rating: 0,
  Skills: 'Brawl,Brawl,Perception,Perception,Survival,Survival,Survival,Vigilance,Vigilance',
  Abilities: 'Silhouette 3,Sweep Attack',
  Equipment: 'Massive Rending Claws',
  Force_Abilities: '',
  PictureID: null,
  CampaignID: campaignId,
  Part_of_Place: '196',
};

const { data: existing } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name')
  .eq('CampaignID', campaignId)
  .eq('Name', npc.Name);

if (existing && existing.length > 0) {
  console.log('Already exists:', JSON.stringify(existing));
} else {
  const { data, error } = await supabase
    .from('SW_campaign_NPC')
    .insert([npc])
    .select('id, Name, Part_of_Place');
  if (error) throw error;
  console.log(JSON.stringify(data, null, 2));
}
