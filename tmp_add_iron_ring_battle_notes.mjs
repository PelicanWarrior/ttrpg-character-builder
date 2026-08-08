import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://oyqfyjfkqzvatdddngbp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWZ5amZrcXp2YXRkZGRuZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ0MTcsImV4cCI6MjA3MjcyMDQxN30.1HsQNoFT7VHu1-rFAEOhDRlXYq3SyxhnHcP2whWIVhU');
const campaignId = 2;
const parentNoteName = 'Iron Ring Arena';

const { data: parentRows, error: parentErr } = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name')
  .eq('CampaignID', campaignId)
  .ilike('Place_Name', parentNoteName);
if (parentErr) throw parentErr;
const parent = parentRows?.[0];
if (!parent) throw new Error('Parent note not found');

const noteDefinitions = [
  {
    Place_Name: 'Creature Battle',
    Description: 'A brutal spectacle in the Iron Ring Arena where combatants face off against a roster of creatures brought in for the night. The event is flexible: a single hero can fight one creature, or a full party can take on several at once, with the payout scaling to the number of monsters defeated. The arena favors crowd-pleasing brutality over elegance, and the crowd loves a fight where the danger rises with every additional beast entering the pit. Reward: 1,000 credits per creature defeated.',
    Part_of_Place: String(parent.id),
    Order: 1,
    CampaignID: campaignId,
  },
  {
    Place_Name: 'Team Battle',
    Description: 'A team-based arena bout in which the players or a hired crew fight against another mercenary team under the arena’s rules. These matches are usually staged as short, tactical engagements with strict timing and multiple rounds, and the crowd treats them like a serious contest rather than a simple brawl. The prize is a flat 10,000-credit payout for the winning team, making this one of the most lucrative events in the district. The arena can also host these fights as a way to settle grudges, prove loyalty, or establish a reputation.',
    Part_of_Place: String(parent.id),
    Order: 2,
    CampaignID: campaignId,
  },
];

const existingNotes = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name')
  .eq('CampaignID', campaignId)
  .in('Place_Name', noteDefinitions.map((note) => note.Place_Name));

if (existingNotes.error) throw existingNotes.error;

const existingNames = new Set((existingNotes.data || []).map((note) => note.Place_Name));
const notesToInsert = noteDefinitions.filter((note) => !existingNames.has(note.Place_Name));

let inserted = [];
if (notesToInsert.length > 0) {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .insert(notesToInsert)
    .select('id, Place_Name');
  if (error) throw error;
  inserted = data || [];
}

const all = [...(existingNotes.data || []), ...inserted];
console.log(JSON.stringify(all, null, 2));
