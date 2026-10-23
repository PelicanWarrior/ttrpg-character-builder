import { supabase } from './src/supabaseClient.js';

const names = ['Drok Hookarm', 'Sszek Yellowmark', "Vek'thar Pale-Eye"];
const { data: npcs, error: npcError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Race, Description, Brawn, Agility, Intellect, Cunning, Willpower, Presence, Soak, Wound, Strain, Skills, Abilities, Equipment, CampaignID, Part_of_Place')
  .in('Name', names);
if (npcError) throw npcError;

const { data: abilities, error: abilitiesError } = await supabase
  .from('SW_abilities')
  .select('id, ability, activation, description')
  .order('id');
if (abilitiesError) throw abilitiesError;
const abilityChoices = [
  'Adversary 1', 'Quick Strike', 'Lethal Blows', 'True Aim', "Sniper's Eye",
  'Natural Commando', 'Feral Strength', 'Frenzied Attack', 'Natural Brawler',
  'Heightened Senses', 'Knockdown', 'Quick Draw', 'Grit', 'Natural Outdoorsman',
  'Hunter', 'Precise Aim', 'Fearsome', 'Brutal Blow',
];
const relevantAbilities = abilities.filter((entry) => abilityChoices.includes(entry.ability));

const { data: allEquipment, error: equipmentError } = await supabase
  .from('SW_equipment')
  .select('id, name, skill, damage, critical, range, special')
  .order('id');
if (equipmentError) throw equipmentError;
const equipment = allEquipment.filter((entry) =>
  /rifle|sniper|slugthrower|carbine|blaster pistol|vibro|knife|axe|hook|stun baton|shock gloves/i.test(entry.name)
);

const { data: weaponSkills, error: weaponSkillsError } = await supabase
  .from('skills')
  .select('id, skill, stat');
if (weaponSkillsError) throw weaponSkillsError;
const weaponSkillMap = new Map(weaponSkills.map((entry) => [entry.id, entry]));
const rangedEquipment = equipment.map((entry) => ({ ...entry, skillDetails: weaponSkillMap.get(entry.skill) }));

console.log(JSON.stringify({ npcs, relevantAbilities, rangedEquipment }, null, 2));