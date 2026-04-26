import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oyqfyjfkqzvatdddngbp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWZ5amZrcXp2YXRkZGRuZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ0MTcsImV4cCI6MjA3MjcyMDQxN30.1HsQNoFT7VHu1-rFAEOhDRlXYq3SyxhnHcP2whWIVhU'
);

const newName = 'R5 - Droid Maintenance Bay';

const newDescription = `Former servicing station for the ship's maintenance droid pool. Droid berths, wall-mounted tool arrays, and a central diagnostic cradle still holding partial power.

GM Description:
A low-ceilinged bay fitted with droid berths running along both walls and a central diagnostic cradle. The cradle still draws partial power from an independent cell — enough to run a full systems calibration. Whoever crewed this ship did not travel without mechanical support; the berths held at least a dozen units. Most are empty now, stripped or inert. The cradle remains, and it responds when IG-07 is placed in it.

Read-Aloud:
"The room is low and close, lined on both sides with empty droid berths, their clamps hanging open like hands that dropped what they held. At the centre, a diagnostic cradle pulses with a dull amber glow. The rest of the ship is dark. This is not. Something in here is still waiting to be useful."

Roleplay/Utility: Place IG-07 in the diagnostic cradle for a full post-reboot calibration — improves his repair and combat actions for the rest of the session. Also a safe pause to treat wounds before the reactor push.

Exits: West → R4 (resonant hall); East → R6 (reactor crypt).`;

const { error } = await supabase
  .from('SW_campaign_notes')
  .update({ Place_Name: newName, Description: newDescription })
  .eq('id', 101);

if (error) {
  console.error('Error:', error.message);
} else {
  console.log('Updated id=101 to Droid Maintenance Bay.');
}
