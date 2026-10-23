import { supabase } from './src/supabaseClient.js';

const { data: notes, error: notesError } = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name, Part_of_Place')
  .eq('CampaignID', 2)
  .in('Place_Name', ['Uscru Racing Circuit', 'Nebula Viper Squadron']);
if (notesError) throw notesError;

const raceNames = ['Nautolan', 'Harch', 'Mon Calamari', 'Ithorian'];
const { data: races, error: raceError } = await supabase
  .from('races')
  .select('id, name')
  .in('name', raceNames);
if (raceError) throw raceError;

const abilityNames = ['Master Driver', 'Natural Driver', 'Gearhead', 'Known Schematic', 'Natural Tinkerer', 'Skilled Mechanic', 'Natural Leader', 'Natural Negotiator'];
const { data: abilities, error: abilityError } = await supabase
  .from('SW_abilities')
  .select('id, ability')
  .in('ability', abilityNames);
if (abilityError) throw abilityError;

const skillNames = ['Piloting-Planetary', 'Mechanics', 'Computers', 'Perception', 'Cool', 'Coordination', 'Negotiation', 'Leadership', 'Deception', 'Vigilance'];
const { data: skills, error: skillError } = await supabase
  .from('skills')
  .select('id, skill, stat')
  .in('skill', skillNames);
if (skillError) throw skillError;

console.log(JSON.stringify({ notes, races, abilities, skills }, null, 2));
if (races?.length !== raceNames.length || abilities?.length !== abilityNames.length || skills?.length !== skillNames.length) {
  throw new Error('A requested race, skill, or ability was not found in its catalog.');
}