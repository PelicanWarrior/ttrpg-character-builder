import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oyqfyjfkqzvatdddngbp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWZ5amZrcXp2YXRkZGRuZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ0MTcsImV4cCI6MjA3MjcyMDQxN30.1HsQNoFT7VHu1-rFAEOhDRlXYq3SyxhnHcP2whWIVhU'
);

const newDescription = `Dead control bank, manual override wheels, partial atmosphere restore, and an emergency maintenance alcove where IG-07 is found offline.

GM Description:
A circular lock chamber with dead consoles, manual pressure wheels, and fogged indicator strips. In a recessed maintenance alcove lies IG-07, powered down but intact, partially buried under a thermal tarp and tools.

IG-07 Reboot Condition: When IG-07 comes back online he starts with 1 Wound and 1 Strain. Cold start after extended dormancy — his core systems are running but his chassis registers minor structural stress and his motivator is drawing unevenly. He is fully functional and combat-ready, but not at full health. Direct the players to the Droid Maintenance Bay (R5) to clear both before the reactor section.

Read-Aloud:
"The next chamber is round and silent, a pressure lock with dead screens and cracked status lights. Frost rims the seams of the inner door. In a side alcove, under a torn maintenance cover, you find a familiar droid frame slumped against the wall. IG-07 is here, dark and motionless, as if the ship itself set him aside and forgot him. When power reaches him, his photoreceptors flicker once — amber, then red, then a steadier orange — and a long dormant voice cuts through the static: systems nominal. Damage detected."

Challenge: Repressurize enough to access main interior and reactivate IG-07 before opening the route to R4.
Story Beat: IG-07 comes online here, allowing both PCs to face the first encounter together.

Exits: West → R2 (access throat); East → R4 (resonant hall); South → R10 [Locked] (vent shaft); West (one-way arrival only from R8 emergency return corridor).`;

const { error } = await supabase
  .from('SW_campaign_notes')
  .update({ Description: newDescription })
  .eq('id', 99);

if (error) {
  console.error('Error:', error.message);
} else {
  console.log('Updated id=99 (R3 Pressure Lock Vestibule).');
}
