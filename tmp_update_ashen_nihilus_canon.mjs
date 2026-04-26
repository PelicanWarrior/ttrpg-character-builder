import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oyqfyjfkqzvatdddngbp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWZ5amZrcXp2YXRkZGRuZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ0MTcsImV4cCI6MjA3MjcyMDQxN30.1HsQNoFT7VHu1-rFAEOhDRlXYq3SyxhnHcP2whWIVhU'
);

const NOTE_ID = 96;
const CAMPAIGN_ID = 2;

const canonBlock = `

Canon Update: Darth Nihilus Origin
- The Ashen Testament is Darth Nihilus's old personal vessel.
- Nihilus intentionally crashed on Malachor V when he knew death was imminent.
- Before death, he concealed a Sith holocron inside IG-07 as a delayed lure for Force-sensitive users.
- The holocron only activates when a Force-sensitive is nearby (e.g., Nix or Rapa).
- Activation reveals temple clues across the galaxy, granting power while drawing the user deeper into the dark side.
- Endgame: the final temple is Nihilus's main temple, where he attempts possession or offers corrupting power.`;

const { data, error } = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name, Description')
  .eq('id', NOTE_ID)
  .eq('CampaignID', CAMPAIGN_ID)
  .single();

if (error) {
  console.error(`Fetch failed: ${error.message}`);
  process.exit(1);
}

const existing = data.Description || '';
const marker = 'Canon Update: Darth Nihilus Origin';
const updatedDescription = existing.includes(marker) ? existing : `${existing}${canonBlock}`;

const { error: updateError } = await supabase
  .from('SW_campaign_notes')
  .update({ Description: updatedDescription })
  .eq('id', NOTE_ID);

if (updateError) {
  console.error(`Update failed: ${updateError.message}`);
  process.exit(1);
}

console.log(`Updated note ${NOTE_ID}: ${data.Place_Name}`);
