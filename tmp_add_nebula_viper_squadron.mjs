import { supabase } from './src/supabaseClient.js';

const campaignId = 2;
const teamName = 'Nebula Viper Squadron';
const npcDefinitions = [
  {
    Name: 'Nira Pell',
    Race: 10,
    Description: 'Female Nautolan lead racer for the Nebula Viper Squadron. Nira is a smooth, instinctive pilot who uses long tentacles to sense shifts in air currents and vibration around her speeder. She favors controlled acceleration and clean lines, but can spring into an unexpected overtake when rivals leave an opening. She wears a green-and-white racing jumpsuit and a custom helmet fitted around her head-tails.',
    Brawn: 2,
    Agility: 4,
    Intellect: 2,
    Cunning: 3,
    Willpower: 2,
    Presence: 3,
    Skills: 'Piloting-Planetary,Piloting-Planetary,Piloting-Planetary,Cool,Cool,Coordination,Coordination,Vigilance',
    Abilities: 'Master Driver,Natural Driver',
    Equipment: 'Green-and-white racing jumpsuit, custom sealed helmet, grip gloves, pit commlink',
    Soak: 2,
    Wound: 12,
    Strain: 12,
    Force_Rating: 0,
    Force_Abilities: '',
    PictureID: null,
  },
  {
    Name: 'Jhee Toran',
    Race: 32,
    Description: 'Harch chief mechanic for the Nebula Viper Squadron. Jhee uses several dexterous arms to work on multiple parts of a speeder at once, coordinating fine adjustments while monitoring the team\'s diagnostic readouts. Patient, meticulous, and hard to distract, Jhee specializes in chassis geometry and race-day repairs. Jhee wears a green-and-white mechanic jumpsuit with a compact tool harness.',
    Brawn: 2,
    Agility: 3,
    Intellect: 4,
    Cunning: 3,
    Willpower: 2,
    Presence: 2,
    Skills: 'Mechanics,Mechanics,Mechanics,Computers,Computers,Coordination,Perception,Piloting-Planetary',
    Abilities: 'Gearhead,Known Schematic',
    Equipment: 'Green-and-white mechanic jumpsuit, multi-arm tool harness, diagnostic scanner, calibration kit',
    Soak: 2,
    Wound: 12,
    Strain: 12,
    Force_Rating: 0,
    Force_Abilities: '',
    PictureID: null,
  },
  {
    Name: 'Merrik Sol',
    Race: 9,
    Description: 'Mon Calamari powertrain mechanic for the Nebula Viper Squadron. Merrik listens closely to engine pitch and repulsor rhythm, catching small performance changes before they show up in the telemetry. Resourceful and steady in the pit, Merrik can improvise repairs from a limited parts bin without compromising the speeder\'s safety. Merrik wears a green-and-white mechanic jumpsuit, insulated gloves, and a headset linked to the telemetry station.',
    Brawn: 2,
    Agility: 2,
    Intellect: 4,
    Cunning: 3,
    Willpower: 3,
    Presence: 2,
    Skills: 'Mechanics,Mechanics,Computers,Perception,Perception,Coordination,Negotiation',
    Abilities: 'Natural Tinkerer,Skilled Mechanic',
    Equipment: 'Green-and-white mechanic jumpsuit, insulated gloves, vibration sensor, pit telemetry headset',
    Soak: 2,
    Wound: 12,
    Strain: 13,
    Force_Rating: 0,
    Force_Abilities: '',
    PictureID: null,
  },
  {
    Name: 'Olan Vur',
    Race: 25,
    Description: 'Ithorian owner and team principal of the Nebula Viper Squadron. Olan is a calm, deliberate negotiator who built the team around disciplined pit work, dependable equipment, and a willingness to give promising racers a fair chance. Olan is protective of the crew and prefers a clean, credible result over a reckless shortcut. At the circuit, Olan wears a tailored green-and-white team jumpsuit and keeps sponsor terms and race schedules on a wrist datapad.',
    Brawn: 2,
    Agility: 1,
    Intellect: 3,
    Cunning: 3,
    Willpower: 3,
    Presence: 4,
    Skills: 'Negotiation,Negotiation,Leadership,Leadership,Cool,Deception,Perception,Vigilance',
    Abilities: 'Natural Leader,Natural Negotiator',
    Equipment: 'Tailored green-and-white team jumpsuit, sponsor portfolio, wrist datapad, team commlink',
    Soak: 2,
    Wound: 12,
    Strain: 13,
    Force_Rating: 0,
    Force_Abilities: '',
    PictureID: null,
  },
];

const { data: circuit, error: circuitError } = await supabase
  .from('SW_campaign_notes')
  .select('id')
  .eq('CampaignID', campaignId)
  .eq('Place_Name', 'Uscru Racing Circuit')
  .single();
if (circuitError) throw circuitError;

const { data: existingNotes, error: noteLookupError } = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name')
  .eq('CampaignID', campaignId)
  .eq('Place_Name', teamName);
if (noteLookupError) throw noteLookupError;
if (existingNotes?.length > 1) throw new Error(`Multiple ${teamName} notes already exist.`);

const noteValues = {
  Place_Name: teamName,
  Description: 'The Nebula Viper Squadron is a racing team competing in the Uscru underground circuit. Its speeders, pit equipment, and jumpsuits carry a green-and-white livery. The Squadron emphasizes smooth, consistent driving, careful powertrain tuning, and coordinated pit work. Its female lead racer, Nira Pell, is known for reading the track and choosing her moments rather than forcing every pass. The crew is ambitious, professional, and focused on earning a reputation through clean, reliable performances.',
  Part_of_Place: String(circuit.id),
  Order: 4,
  CampaignID: campaignId,
};

let teamNote;
if (existingNotes?.length) {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .update(noteValues)
    .eq('id', existingNotes[0].id)
    .select('id, Place_Name, Part_of_Place');
  if (error) throw error;
  teamNote = data?.[0];
} else {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .insert([noteValues])
    .select('id, Place_Name, Part_of_Place');
  if (error) throw error;
  teamNote = data?.[0];
}
if (!teamNote) throw new Error('Nebula Viper Squadron note write returned no row.');

const raceIds = [...new Set(npcDefinitions.map((npc) => npc.Race))];
const { data: races, error: raceError } = await supabase
  .from('races')
  .select('id')
  .in('id', raceIds);
if (raceError) throw raceError;
if (races.length !== raceIds.length) throw new Error('A selected NPC race is missing from the race catalog.');

const abilityNames = [...new Set(npcDefinitions.flatMap((npc) => npc.Abilities.split(',')))];
const { data: abilities, error: abilityError } = await supabase
  .from('SW_abilities')
  .select('ability')
  .in('ability', abilityNames);
if (abilityError) throw abilityError;
const matchedAbilities = new Set((abilities ?? []).map((entry) => entry.ability));
const missingAbilities = abilityNames.filter((ability) => !matchedAbilities.has(ability));
if (missingAbilities.length) throw new Error(`Missing abilities: ${missingAbilities.join(', ')}`);

const skillNames = [...new Set(npcDefinitions.flatMap((npc) => npc.Skills.split(',')))];
const { data: skills, error: skillError } = await supabase
  .from('skills')
  .select('skill')
  .in('skill', skillNames);
if (skillError) throw skillError;
const matchedSkills = new Set((skills ?? []).map((entry) => entry.skill));
const missingSkills = skillNames.filter((skill) => !matchedSkills.has(skill));
if (missingSkills.length) throw new Error(`Missing skills: ${missingSkills.join(', ')}`);

const { data: existingNpcs, error: npcLookupError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name')
  .eq('CampaignID', campaignId)
  .in('Name', npcDefinitions.map((npc) => npc.Name));
if (npcLookupError) throw npcLookupError;
const existingByName = new Map((existingNpcs ?? []).map((npc) => [npc.Name, npc.id]));

const savedNpcs = [];
for (const definition of npcDefinitions) {
  const npc = { ...definition, CampaignID: campaignId, Part_of_Place: String(teamNote.id) };
  const existingId = existingByName.get(npc.Name);
  const query = existingId
    ? supabase.from('SW_campaign_NPC').update(npc).eq('id', existingId)
    : supabase.from('SW_campaign_NPC').insert([npc]);
  const { data, error } = await query
    .select('id, Name, Race, Skills, Abilities, Equipment, Part_of_Place');
  if (error) throw error;
  savedNpcs.push(...(data ?? []));
}

console.log(JSON.stringify({ teamNote, npcs: savedNpcs }, null, 2));