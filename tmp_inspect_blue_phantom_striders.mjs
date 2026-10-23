import { supabase } from './src/supabaseClient.js';

const campaignId = 2;
const { data: notes, error: notesError } = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name, Description, Part_of_Place, Order, CampaignID')
  .eq('CampaignID', campaignId)
  .or('Place_Name.ilike.%Uscru Racing Circuit%,Place_Name.ilike.%Blue Phantom Striders%')
  .order('id');
if (notesError) throw notesError;

const { data: npcs, error: npcsError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Race, Description, Brawn, Agility, Intellect, Cunning, Willpower, Presence, Skills, Abilities, Equipment, CampaignID, Part_of_Place')
  .eq('CampaignID', campaignId)
  .order('id');
if (npcsError) throw npcsError;
const parentIds = new Set((notes ?? []).map((note) => String(note.id)));
const linkedNpcs = (npcs ?? []).filter((npc) =>
  String(npc.Part_of_Place ?? '').split(',').some((id) => parentIds.has(id.trim()))
);

const { data: allRaces, error: racesError } = await supabase
  .from('races')
  .select('id, name')
  .order('id');
if (racesError) throw racesError;
const raceNames = ['Human', "Twi'lek", 'Duros', 'Bothan', 'Sullustan'];
const races = allRaces.filter((race) => raceNames.includes(race.name));

const { data: allAbilities, error: abilitiesError } = await supabase
  .from('SW_abilities')
  .select('id, ability, activation, description')
  .order('id');
if (abilitiesError) throw abilitiesError;
const abilities = allAbilities.filter((ability) =>
  ['Master Driver', 'Natural Driver', 'Skilled Mechanic', 'Natural Tinkerer', 'Gearhead', 'Known Schematic', 'Natural Leader', 'Natural Negotiator', "Nobody's Fool 1"].includes(ability.ability)
);

const { data: allSkills, error: skillsError } = await supabase
  .from('skills')
  .select('id, skill, stat')
  .order('id');
if (skillsError) throw skillsError;
const skillNames = ['Piloting-Planetary', 'Mechanics', 'Computers', 'Perception', 'Cool', 'Coordination', 'Negotiation', 'Leadership', 'Deception', 'Skulduggery', 'Survival'];
const skills = allSkills.filter((skill) => skillNames.includes(skill.skill));

console.log(JSON.stringify({ notes, linkedNpcs, races, abilities, skills }, null, 2));