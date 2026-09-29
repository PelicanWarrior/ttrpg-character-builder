import { supabase } from './src/supabaseClient.js';

const campaignId = 2;
const arenaId = '193';

const npc = {
  Name: 'Tatooine Sand-Skitter',
  Race: null,
  Description: 'A small but aggressive creature (Minion or low Rival) lunges from a rocky crevice. Think a venomous lizard, dune stalker, or juvenile womp-rat sized predator. Soak 2-3, Wound Threshold 6-8, simple claws or bite (Damage 4-5, Crit 4, possibly a minor toxin or Knockdown).',
  Brawn: 2,
  Cunning: 2,
  Presence: 1,
  Agility: 3,
  Intellect: 1,
  Willpower: 2,
  Skills: null,
  Abilities: null,
  Equipment: null,
  CampaignID: campaignId,
  Part_of_Place: arenaId,
  Soak: 2,
  Wound: 8,
  Strain: 0,
  Force_Abilities: null,
  Force_Rating: 0,
};

const { data: existing, error: lookupError } = await supabase
  .from('SW_campaign_NPC')
  .select('id')
  .eq('CampaignID', campaignId)
  .eq('Name', npc.Name);
if (lookupError) throw lookupError;

let result;
if (existing?.length) {
  const { data, error } = await supabase
    .from('SW_campaign_NPC')
    .update(npc)
    .eq('id', existing[0].id)
    .select('id, Name, Race, Part_of_Place');
  if (error) throw error;
  result = { updated: data };
} else {
  const { data, error } = await supabase
    .from('SW_campaign_NPC')
    .insert([npc])
    .select('id, Name, Race, Part_of_Place');
  if (error) throw error;
  result = { inserted: data };
}

console.log(JSON.stringify(result, null, 2));
