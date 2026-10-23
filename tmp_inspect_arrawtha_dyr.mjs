import { supabase } from './src/supabaseClient.js';

const { data: npcs, error: npcError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Race, Description, Brawn, Agility, Intellect, Cunning, Willpower, Presence, Soak, Wound, Strain, Skills, Abilities, Equipment, CampaignID, Part_of_Place')
  .eq('Name', 'Arrawtha-dyr');
if (npcError) throw npcError;

const { data: abilities, error: abilitiesError } = await supabase
  .from('SW_abilities')
  .select('id, ability, activation, description')
  .order('id');
if (abilitiesError) throw abilitiesError;
const relevantAbilities = abilities.filter((entry) =>
  /^(Feral Strength|Quick Strike|Heightened Senses|Adversary 1|Knockdown|Silhouette 1|Natural Brawler)$/i.test(entry.ability)
);

const { data: skills, error: skillsError } = await supabase
  .from('skills')
  .select('id, skill, stat')
  .in('skill', ['Brawl', 'Athletics', 'Coordination', 'Perception', 'Resilience', 'Stealth', 'Survival', 'Vigilance']);
if (skillsError) throw skillsError;

const { data: allEquipment, error: equipmentError } = await supabase
  .from('SW_equipment')
  .select('id, name, skill, damage, critical, range, special');
if (equipmentError) throw equipmentError;
const equipment = allEquipment.filter((entry) => /horn|antler|gore/i.test(entry.name));

console.log(JSON.stringify({ npcs, relevantAbilities, skills, equipment }, null, 2));