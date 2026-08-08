import { supabase } from './src/supabaseClient.js';

const { data: note, error: fetchErr } = await supabase
  .from('SW_campaign_notes')
  .select('id, Description')
  .eq('id', 199)
  .single();
if (fetchErr) throw fetchErr;

const addition = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POT SHARING (MULTIPLE WINNERS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When multiple players win on the same roll, the total pot is divided into two pools based on bet type:

  EXACT POOL (75% of total pot)
  Distributed equally among all players who bet the correct colour AND number.
  If no player holds an exact bet, the house retains this 75%.

  PARTIAL POOL (25% of total pot)
  Distributed equally among all players who bet only the correct number OR only the correct colour.
  If no player holds a partial bet, the house retains this 25%.

Example — pot of 1,000 credits:
  Exact pool = 750 credits, split between exact winners.
  Partial pool = 250 credits, split between number-only and colour-only winners.

Note: A player can only win one pool per roll. An exact bet winner does not also collect from the partial pool, even though their colour and number are technically correct.`;

const { error: updateErr } = await supabase
  .from('SW_campaign_notes')
  .update({ Description: note.Description + addition })
  .eq('id', 199);
if (updateErr) throw updateErr;

console.log('Spinwheel note 199 updated successfully.');
