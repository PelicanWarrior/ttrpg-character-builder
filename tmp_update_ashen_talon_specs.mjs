import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oyqfyjfkqzvatdddngbp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWZ5amZrcXp2YXRkZGRuZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ0MTcsImV4cCI6MjA3MjcyMDQxN30.1HsQNoFT7VHu1-rFAEOhDRlXYq3SyxhnHcP2whWIVhU'
);

const { data: rows, error: fetchError } = await supabase
  .from('SW_campaign_notes')
  .select('id, Description')
  .eq('Place_Name', 'The Ashen Talon (Interceptor)')
  .eq('Part_of_Place', 103)
  .order('id', { ascending: false })
  .limit(1);

if (fetchError) {
  console.error('Fetch error:', fetchError.message);
  process.exit(1);
}

if (!rows || rows.length === 0) {
  console.error('Could not find The Ashen Talon child note under R7 (Part_of_Place=103).');
  process.exit(1);
}

const row = rows[0];
let description = row.Description || '';

description = description.replace(
  /Crew:\s+.*$/m,
  'Crew:             1 pilot + up to 2 gunners (turret stations)'
);

description = description.replace(
  /Passengers:\s+.*$/m,
  'Passengers:       10'
);

if (!description.includes('Dorsal Twin Laser Turret') && !description.includes('Ventral Twin Laser Turret')) {
  description = description.replace(
    '\n--- SPECIAL ABILITIES ---',
    `\nDorsal Twin Laser Turret\n  Skill: Gunnery | Damage: 5 | Critical: 3 | Range: Close\n  Qualities: Accurate 1, Linked 1, Fire Arc All\n  Current Status: ONLINE\n\nVentral Twin Laser Turret\n  Skill: Gunnery | Damage: 5 | Critical: 3 | Range: Close\n  Qualities: Accurate 1, Linked 1, Fire Arc All\n  Current Status: ONLINE\n\n--- SPECIAL ABILITIES ---`
  );
}

description = description.replace(
  /Weapons:.*$/m,
  'Weapons: Laser cannons offline; dorsal and ventral twin laser turrets online; torpedo launcher armed (2 loaded, 2 reserve)'
);

const { error: updateError } = await supabase
  .from('SW_campaign_notes')
  .update({ Description: description })
  .eq('id', row.id);

if (updateError) {
  console.error('Update error:', updateError.message);
  process.exit(1);
}

console.log(`Updated The Ashen Talon (id=${row.id}) with 2 turrets and passenger cap 10.`);
