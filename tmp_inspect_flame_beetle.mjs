import { supabase } from './src/supabaseClient.js';

const { data: npcs, error: npcError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Race, Description, Brawn, Agility, Intellect, Cunning, Willpower, Presence, Soak, Wound, Strain, Skills, Abilities, Equipment, CampaignID, Part_of_Place')
  .ilike('Name', '%flame beetle%');
if (npcError) throw npcError;

const { data: abilities, error: abilitiesError } = await supabase
  .from('SW_abilities')
  .select('id, ability, activation, description')
  .order('id');
if (abilitiesError) throw abilitiesError;
const relevantAbilities = abilities.filter((entry) =>
  /fire|flame|combust|explod|chemical|death|proximity|burn/i.test(`${entry.ability} ${entry.description}`)
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
const equipment = allEquipment.filter((entry) => /beetle|fire|flame|chemical|mandible/i.test(entry.name));

console.log(JSON.stringify({ npcs, relevantAbilities, skills, equipment }, null, 2));