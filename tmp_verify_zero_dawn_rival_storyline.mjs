import { supabase } from './src/supabaseClient.js';

const campaignId = 2;
const names = ['Story Beat', 'Zero Dawn Speedworks', 'Uscru Racing Circuit', 'Redline Racers'];
const { data: notes, error: notesError } = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name, Description, Part_of_Place')
  .eq('CampaignID', campaignId)
  .in('Place_Name', names);
if (notesError) throw notesError;

const npcNames = ['Bren Dasko', 'Sella Vorn', 'Rix Talvar', 'Tavi Korr', 'Nemi Orr'];
const { data: npcs, error: npcsError } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Race, Description, Skills, Abilities, Part_of_Place, Soak, Wound, Strain')
  .eq('CampaignID', campaignId)
  .in('Name', npcNames)
  .order('id');
if (npcsError) throw npcsError;

const raceIds = [...new Set((npcs ?? []).map((npc) => npc.Race).filter(Boolean))];
const { data: races, error: racesError } = await supabase
  .from('races')
  .select('id, name')
  .in('id', raceIds);
if (racesError) throw racesError;
const raceNames = new Map((races ?? []).map((race) => [race.id, race.name]));

const beat = (notes ?? []).find((note) => note.Place_Name === 'Story Beat');
const requiredBeatTerms = [
  'Aurek Vector Dynamics',
  'wins the league championship',
  'not part of the purse for this race',
  '50,000 credits',
  '3,000 credits',
  '5,000 credits',
  'repulsor stabilizer',
];
const missingBeatTerms = requiredBeatTerms.filter((term) => !beat?.Description?.includes(term));
const redlineNote = (notes ?? []).find((note) => note.Place_Name === 'Redline Racers');
const redlineDescriptionClear = redlineNote?.Description?.includes('separate sponsorship')
  && redlineNote.Description.includes('individual race');
const obsoleteWordingPresent = (notes ?? []).some((note) =>
  note.Description?.includes('is backing the next Uscru event')
  || note.Description?.includes('exclusive Coruscant sponsorship')
);
const result = {
  notes: (notes ?? []).map(({ id, Place_Name, Part_of_Place }) => ({ id, Place_Name, Part_of_Place })),
  storyBeatTermsPresent: requiredBeatTerms.filter((term) => beat?.Description?.includes(term)),
  missingBeatTerms,
  redlineDescriptionClear,
  obsoleteWordingPresent,
  redlineLeaders: (npcs ?? []).filter((npc) => ['Sella Vorn', 'Rix Talvar'].includes(npc.Name)).map(({ Name, Description }) => ({
    Name,
    mentionsLeagueSponsorship: Description.includes('league championship') && Description.includes('Aurek Vector Dynamics'),
  })),
  npcs: (npcs ?? []).map(({ id, Name, Race, Part_of_Place, Soak, Wound, Strain }) => ({ id, Name, Race: raceNames.get(Race), Part_of_Place, Soak, Wound, Strain })),
};
console.log(JSON.stringify(result, null, 2));
if (missingBeatTerms.length || !redlineDescriptionClear || obsoleteWordingPresent
  || result.redlineLeaders.length !== 2
  || result.redlineLeaders.some((leader) => !leader.mentionsLeagueSponsorship)
  || npcs?.length !== npcNames.length) {
  throw new Error('Storyline verification failed.');
}