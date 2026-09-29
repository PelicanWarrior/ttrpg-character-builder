import { supabase } from './src/supabaseClient.js';

const requestedSkills = [
  'Mechanics', 'Negotiation', 'Leadership', 'Computers', 'Perception',
  'Cool', 'Vigilance', 'Deception', 'Skulduggery', 'Streetwise',
  'Discipline', 'Coordination', 'Athletics',
];
const requestedAbilities = [
  'Master Driver', 'Skilled Mechanic', 'Known Schematic', 'Natural Leader',
  'Nobody\'s Fool 1', 'Grit', 'Heightened Senses', 'Quick Strike',
];

const { data: allSkills, error: skillsError } = await supabase
  .from('skills')
  .select('id, skill, stat');
if (skillsError) throw skillsError;
const skills = allSkills.filter((entry) =>
  requestedSkills.includes(entry.skill) || /pilot/i.test(entry.skill)
);

const { data: abilities, error: abilitiesError } = await supabase
  .from('SW_abilities')
  .select('id, ability, activation, description')
  .in('ability', requestedAbilities);
if (abilitiesError) throw abilitiesError;

console.log(JSON.stringify({ skills, abilities }, null, 2));