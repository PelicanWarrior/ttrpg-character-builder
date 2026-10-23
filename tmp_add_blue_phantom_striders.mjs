import { supabase } from './src/supabaseClient.js';

const campaignId = 2;
const teamName = 'Blue Phantom Striders';
const npcDefinitions = [
  {
    Name: 'Veya Noll',
    Race: 4,
    Description: 'Female Human lead racer for the Blue Phantom Striders. Veya is cool under pressure and known for precise cornering, patient pacing, and a sudden burst of speed when other pilots overcommit. She wears the team\'s blue-and-black racing suit and keeps her helmet marked with a small phantom-strider emblem.',
    Brawn: 2,
    Agility: 4,
    Intellect: 2,
    Cunning: 3,
    Willpower: 2,
    Presence: 3,
    Skills: 'Piloting-Planetary,Piloting-Planetary,Piloting-Planetary,Cool,Cool,Coordination,Perception,Vigilance',
    Abilities: 'Master Driver,Natural Driver',
    Equipment: 'Blue-and-black racing jumpsuit, sealed helmet, grip gloves, pit commlink',
    Soak: 2,
    Wound: 12,
    Strain: 12,
    Force_Rating: 0,
    Force_Abilities: '',
    PictureID: null,
  },
  {
    Name: 'Tovan Rell',
    Race: 23,
    Description: 'Duros chief mechanic for the Blue Phantom Striders. Tovan specializes in repulsor tuning and chassis balance, preparing the speeder to stay stable through Uscru\'s vertical drops and narrow overpasses. Methodical and quietly competitive, he trusts clean diagnostics more than a driver\'s instinct. He works in a blue-and-black team jumpsuit with a compact tool harness.',
    Brawn: 2,
    Agility: 2,
    Intellect: 4,
    Cunning: 3,
    Willpower: 2,
    Presence: 2,
    Skills: 'Mechanics,Mechanics,Mechanics,Computers,Computers,Perception,Coordination,Piloting-Planetary',
    Abilities: 'Gearhead,Known Schematic',
    Equipment: 'Blue-and-black mechanic jumpsuit, repulsor diagnostic kit, calibration tools, service datapad',
    Soak: 2,
    Wound: 12,
    Strain: 12,
    Force_Rating: 0,
    Force_Abilities: '',
    PictureID: null,
  },
  {
    Name: 'Kell Vos',
    Race: 1,
    Description: 'Bothan mechanic and telemetry specialist for the Blue Phantom Striders. Kell monitors engine temperatures, race telemetry, and rival pit activity, then turns the data into practical setup changes. Curious and socially perceptive, Kell often notices when a competitor is hiding a mechanical problem. Kell wears a blue-and-black team jumpsuit with a telemetry harness and grease-marked gloves.',
    Brawn: 2,
    Agility: 3,
    Intellect: 3,
    Cunning: 4,
    Willpower: 2,
    Presence: 2,
    Skills: 'Mechanics,Mechanics,Computers,Computers,Perception,Perception,Skulduggery,Deception,Coordination',
    Abilities: 'Natural Tinkerer,Heightened Senses',
    Equipment: 'Blue-and-black mechanic jumpsuit, telemetry headset, portable slicer, compact tool roll',
    Soak: 2,
    Wound: 12,
    Strain: 12,
    Force_Rating: 0,
    Force_Abilities: '',
    PictureID: null,
  },
  {
    Name: 'Dalo Venn',
    Race: 26,
    Description: 'Sullustan owner and team principal of the Blue Phantom Striders. Dalo is an energetic negotiator who built the team around a small crew, careful spending, and a willingness to take calculated risks on overlooked racers. Dalo keeps a close eye on sponsors and race officials but protects the team from pressure to compromise its standards. At the circuit, Dalo wears a sharp blue-and-black team jumpsuit and carries a race schedule on a wrist datapad.',
    Brawn: 2,
    Agility: 2,
    Intellect: 3,
    Cunning: 3,
    Willpower: 3,
    Presence: 4,
    Skills: 'Negotiation,Negotiation,Negotiation,Leadership,Leadership,Cool,Cool,Deception,Perception,Streetwise',
    Abilities: 'Natural Leader,Natural Negotiator,Nobody\'s Fool 1',
    Equipment: 'Blue-and-black team jumpsuit, sponsor portfolio, wrist datapad, team commlink',
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
  Description: 'The Blue Phantom Striders are a lean, independently run racing team competing in the Uscru underground circuit. Their blue-and-black colors mark their speeders, pit equipment, and team jumpsuits. The Striders rely on disciplined driving, precise telemetry, and fast, well-practiced repairs rather than expensive machinery. Lead racer Veya Noll favors smooth lines through difficult turns, while the crew works together to adapt the speeder between heats. The team is ambitious but pragmatic, looking for strong results and a sponsor without compromising its crew.',
  Part_of_Place: String(circuit.id),
  Order: 2,
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
if (!teamNote) throw new Error('The Blue Phantom Striders note write returned no row.');

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