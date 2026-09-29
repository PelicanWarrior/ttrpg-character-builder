import { supabase } from './src/supabaseClient.js';

const campaignId = 2;
const sponsorName = 'Aurek Vector Dynamics';
const redlineNoteName = 'Redline Racers';
const beatParagraph = `${sponsorName}, a high-performance speeder manufacturer seeking an exclusive Coruscant racing-team partner, is backing the next Uscru event. The winning team will receive 50,000 credits, and Tol's share from Zero Dawn Speedworks will be 3,000 credits. Redline Racers believes the contract is theirs if Zero Dawn is removed from contention. In the previous race, Redline's engineers deliberately sabotaged Zero Dawn's lead racer's speeder by tampering with its repulsor stabilizer, making the resulting crash look like an accident and leaving the driver unable to race for several weeks. After learning that Tol is taking the vacant seat, Redline will approach him privately and offer 5,000 credits to throw the race.`;

const npcDefinitions = [
  {
    Name: 'Bren Dasko',
    Race: 4,
    Description: 'The injured lead racer of Zero Dawn Speedworks, known for clean lines, patient racecraft, and a habit of talking through every turn before driving it. Bren was taken out in a previous race when a sabotaged repulsor stabilizer failed at speed. The crash was made to look like an accident, and Bren is still recovering from serious injuries that prevent racing for several weeks. Frustrated by being sidelined, Bren is determined to help Tol learn the team speeder and may remember an unusual shudder just before the crash.',
    Brawn: 2,
    Agility: 4,
    Intellect: 2,
    Cunning: 3,
    Willpower: 3,
    Presence: 2,
    Skills: 'Piloting-Planetary,Piloting-Planetary,Piloting-Planetary,Cool,Coordination,Perception,Vigilance',
    Abilities: 'Master Driver,Quick Strike',
    Equipment: 'Zero Dawn orange-and-white flight suit, cracked racing helmet, telemetry glove, team commlink',
    CampaignID: campaignId,
    Part_of_Place: null,
    Force_Rating: 0,
    Soak: 2,
    Wound: 13,
    Strain: 12,
    PictureID: null,
    Force_Abilities: '',
  },
  {
    Name: 'Sella Vorn',
    Race: 29,
    Description: 'Owner and team principal of Redline Racers, a polished, ambitious racing outfit that treats every circuit as a business acquisition. Sella is composed in public, ruthless in negotiations, and convinced that Aurek Vector Dynamics should choose Redline as its exclusive Coruscant partner. She sees Zero Dawn Speedworks as the last obstacle to that deal and is prepared to use money, pressure, or deniable interference to remove it. Sella is the likely source of Redline\'s 5,000-credit offer to Tol.',
    Brawn: 2,
    Agility: 2,
    Intellect: 3,
    Cunning: 4,
    Willpower: 3,
    Presence: 4,
    Skills: 'Negotiation,Negotiation,Leadership,Deception,Deception,Perception,Cool,Streetwise',
    Abilities: 'Natural Leader,Nobody\'s Fool 1',
    Equipment: 'Red-and-black tailored team jacket, encrypted datapad, sponsor portfolio, private comlink',
    CampaignID: campaignId,
    Part_of_Place: null,
    Force_Rating: 0,
    Soak: 2,
    Wound: 12,
    Strain: 13,
    PictureID: null,
    Force_Abilities: '',
  },
  {
    Name: 'Rix Talvar',
    Race: 17,
    Description: 'Redline Racers\' celebrated lead pilot: fearless, camera-ready, and skilled at making aggressive race lines look effortless. Rix is the public face of Redline\'s bid for Aurek Vector Dynamics sponsorship and expects to beat Tol on the track. He knows the previous Zero Dawn crash benefited his team, but how much he knows about the sabotage is unclear; he may be complicit, or merely enjoying an advantage he did not ask questions about.',
    Brawn: 2,
    Agility: 4,
    Intellect: 2,
    Cunning: 3,
    Willpower: 3,
    Presence: 3,
    Skills: 'Piloting-Planetary,Piloting-Planetary,Piloting-Planetary,Cool,Cool,Coordination,Perception,Deception',
    Abilities: 'Master Driver,Quick Strike,Grit',
    Equipment: 'Redline crimson-and-black racing suit, mirrored helmet, custom grip gloves, sponsor-marked commlink',
    CampaignID: campaignId,
    Part_of_Place: null,
    Force_Rating: 0,
    Soak: 2,
    Wound: 13,
    Strain: 13,
    PictureID: null,
    Force_Abilities: '',
  },
  {
    Name: 'Tavi Korr',
    Race: 12,
    Description: 'Redline Racers\' systems engineer, responsible for repulsor controls, telemetry masking, and last-minute vehicle modifications. Tavi is brilliant, guarded, and meticulous about leaving clean diagnostic records. Tavi carried out the hidden repulsor-stabilizer tampering that caused Zero Dawn\'s lead racer to crash, then disguised the failure as ordinary component fatigue. A careful inspection of Redline\'s logs or a confrontation about the specific stabilizer model could expose the lie.',
    Brawn: 2,
    Agility: 2,
    Intellect: 4,
    Cunning: 4,
    Willpower: 3,
    Presence: 2,
    Skills: 'Mechanics,Mechanics,Computers,Computers,Skulduggery,Deception,Perception',
    Abilities: 'Skilled Mechanic,Known Schematic,Heightened Senses',
    Equipment: 'Redline engineer coveralls, diagnostic slicer, micro-welder, sealed component case',
    CampaignID: campaignId,
    Part_of_Place: null,
    Force_Rating: 0,
    Soak: 2,
    Wound: 11,
    Strain: 13,
    PictureID: null,
    Force_Abilities: '',
  },
  {
    Name: 'Nemi Orr',
    Race: 15,
    Description: 'Female Twi\'lek chassis and powerplant engineer for Redline Racers, responsible for tuning thrust balance and keeping the team\'s speeders inside their performance limits. Nemi is practical, proud of the team\'s engineering, and wary of Sella Vorn\'s pressure to win at any cost. She did not know the exact purpose of Tavi Korr\'s off-book stabilizer work, but noticed that the service log for the previous Zero Dawn crash was altered. She could become a reluctant witness if given credible evidence and a reason to trust Tol.',
    Brawn: 2,
    Agility: 3,
    Intellect: 4,
    Cunning: 3,
    Willpower: 3,
    Presence: 2,
    Skills: 'Mechanics,Mechanics,Computers,Perception,Discipline,Negotiation',
    Abilities: 'Skilled Mechanic,Known Schematic,Grit',
    Equipment: 'Redline pit coveralls, repulsor calibration tool, grease-marked service slate, insulated gloves',
    CampaignID: campaignId,
    Part_of_Place: null,
    Force_Rating: 0,
    Soak: 2,
    Wound: 12,
    Strain: 12,
    PictureID: null,
    Force_Abilities: '',
  },
];

const { data: notes, error: notesError } = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name, Description, Part_of_Place, Order')
  .eq('CampaignID', campaignId)
  .in('Place_Name', ['Uscru Racing Circuit', 'Story Beat', 'Zero Dawn Speedworks', redlineNoteName]);
if (notesError) throw notesError;

const getUniqueNote = (name) => {
  const matches = (notes ?? []).filter((note) => note.Place_Name === name);
  if (matches.length !== 1) throw new Error(`Expected exactly one ${name} note; found ${matches.length}`);
  return matches[0];
};

const circuit = getUniqueNote('Uscru Racing Circuit');
const storyBeat = getUniqueNote('Story Beat');
const zeroDawn = getUniqueNote('Zero Dawn Speedworks');
const redlineExisting = (notes ?? []).find((note) => note.Place_Name === redlineNoteName);

const teamDescription = zeroDawn.Description.replace(
  'Current Situation: Their primary driver was injured before first heat, placing the team at immediate risk of forfeiting unless a replacement pilot can be secured.',
  'Current Situation: Their primary driver was deliberately taken out in a previous race when Redline Racers sabotaged the speeder\'s repulsor stabilizer and made the failure look accidental. The injured racer cannot compete for several weeks, leaving the team at risk of forfeiting unless a replacement pilot can be secured.'
);
if (teamDescription === zeroDawn.Description && !zeroDawn.Description.includes('Redline Racers sabotaged')) {
  throw new Error('Could not find the expected Zero Dawn current-situation text to update.');
}

let beatDescription = storyBeat.Description ?? '';
if (!beatDescription.includes(`${sponsorName}, a high-performance speeder manufacturer`)) {
  beatDescription = `${beatDescription.trim()}\n\n${beatParagraph}`;
}

const updatedNotes = [];
for (const [id, values] of [
  [storyBeat.id, { Description: beatDescription }],
  [zeroDawn.id, { Description: teamDescription }],
]) {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .update(values)
    .eq('id', id)
    .select('id, Place_Name');
  if (error) throw error;
  updatedNotes.push(...(data ?? []));
}

let redlineNote;
if (redlineExisting) {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .update({
      Description: 'Redline Racers is a sleek, aggressively managed racing company competing in the Uscru underground circuit. Led by Sella Vorn, its crimson-and-black team is courting Aurek Vector Dynamics for an exclusive Coruscant sponsorship. Redline considers Zero Dawn Speedworks the main threat to that deal and has already sabotaged Zero Dawn\'s lead racer, disguising the resulting crash as an accident. Its public image is precision engineering and disciplined racecraft; privately, the team is willing to manipulate the competition to secure its future.',
      Part_of_Place: String(circuit.id),
      CampaignID: campaignId,
    })
    .eq('id', redlineExisting.id)
    .select('id, Place_Name, Part_of_Place');
  if (error) throw error;
  redlineNote = data?.[0];
} else {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .insert([{
      Place_Name: redlineNoteName,
      Description: 'Redline Racers is a sleek, aggressively managed racing company competing in the Uscru underground circuit. Led by Sella Vorn, its crimson-and-black team is courting Aurek Vector Dynamics for an exclusive Coruscant sponsorship. Redline considers Zero Dawn Speedworks the main threat to that deal and has already sabotaged Zero Dawn\'s lead racer, disguising the resulting crash as an accident. Its public image is precision engineering and disciplined racecraft; privately, the team is willing to manipulate the competition to secure its future.',
      Part_of_Place: String(circuit.id),
      Order: 1,
      CampaignID: campaignId,
    }])
    .select('id, Place_Name, Part_of_Place');
  if (error) throw error;
  redlineNote = data?.[0];
}
if (!redlineNote) throw new Error('Redline Racers note write returned no row.');

const npcNames = npcDefinitions.map((npc) => npc.Name);
const { data: existingNpcs, error: existingNpcsError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name')
  .eq('CampaignID', campaignId)
  .in('Name', npcNames);
if (existingNpcsError) throw existingNpcsError;

const existingByName = new Map((existingNpcs ?? []).map((npc) => [npc.Name, npc.id]));
const writtenNpcs = [];
for (const definition of npcDefinitions) {
  const npc = {
    ...definition,
    Part_of_Place: String(definition.Name === 'Bren Dasko' ? zeroDawn.id : redlineNote.id),
  };
  const existingId = existingByName.get(npc.Name);
  const query = existingId
    ? supabase.from('SW_campaign_NPC').update(npc).eq('id', existingId)
    : supabase.from('SW_campaign_NPC').insert([npc]);
  const { data, error } = await query.select('id, Name, Part_of_Place, Soak, Wound, Strain');
  if (error) throw error;
  writtenNpcs.push(...(data ?? []));
}

console.log(JSON.stringify({ updatedNotes, redlineNote, npcs: writtenNpcs }, null, 2));