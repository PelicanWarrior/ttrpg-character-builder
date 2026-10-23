import { supabase } from './src/supabaseClient.js';

const { data: notes, error: notesError } = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name, Description, Part_of_Place, CampaignID')
  .ilike('Place_Name', '%Tipoca City%');
if (notesError) throw notesError;

const noteIds = new Set((notes ?? []).map((note) => String(note.id)));
const { data: npcs, error: npcsError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Race, Description, Skills, Abilities, Equipment, Part_of_Place, CampaignID')
  .eq('CampaignID', 2)
  .order('id');
if (npcsError) throw npcsError;
const linkedNpcs = (npcs ?? []).filter((npc) =>
  String(npc.Part_of_Place ?? '').split(',').some((id) => noteIds.has(id.trim()))
);

const { data: races, error: racesError } = await supabase
  .from('races')
  .select('id, name')
  .ilike('name', '%Kamino%');
if (racesError) throw racesError;

const { data: allSkills, error: skillsError } = await supabase
  .from('skills')
  .select('id, skill, stat');
if (skillsError) throw skillsError;
const skills = allSkills.filter((entry) =>
  /knowledge|education|outer rim|negotiation|perception|computers|cool|vigilance/i.test(entry.skill)
);

const { data: abilities, error: abilitiesError } = await supabase
  .from('SW_abilities')
  .select('id, ability, activation')
  .in('ability', ["Nobody's Fool 1", 'Heightened Senses', 'Natural Leader', 'Known Schematic']);
if (abilitiesError) throw abilitiesError;

console.log(JSON.stringify({ notes, linkedNpcs, races, skills, abilities }, null, 2));