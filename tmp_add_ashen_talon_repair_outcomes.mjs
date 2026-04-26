import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oyqfyjfkqzvatdddngbp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWZ5amZrcXp2YXRkZGRuZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ0MTcsImV4cCI6MjA3MjcyMDQxN30.1HsQNoFT7VHu1-rFAEOhDRlXYq3SyxhnHcP2whWIVhU'
);

const { data: rows, error: fetchError } = await supabase
  .from('SW_campaign_notes')
  .select('id, Description')
  .eq('id', 109)
  .limit(1);

if (fetchError) {
  console.error('Fetch error:', fetchError.message);
  process.exit(1);
}

if (!rows || rows.length === 0) {
  console.error('Could not find The Ashen Talon note (id=109).');
  process.exit(1);
}

const existing = rows[0].Description || '';
const cleaned = existing.replace(/\n\n--- REPAIR CHECK OUTCOME RESULTS ---[\s\S]*$/, '').trimEnd();

const outcomes = String.raw`

--- REPAIR CHECK OUTCOME RESULTS ---
Use these after each repair roll. Apply core result first (Success/Failure), then symbols.

1) Repressurize Fuel Lines (Mechanics 2)
Success: Fuel lines hold pressure; thrust curve stabilizes.
Failure: Pressure leak persists; speed hard-capped at 2.
Advantage: Quick purge; remove 1 System Strain.
Disadvantage: Ventback flash; active mechanic suffers 1 Strain.
Triumph: Permanent reroute; gain +1 handling for next ship encounter.
Despair: Ignition flare; ship suffers 2 Hull Trauma.

2) Restore Primary Power Coupling to Thrusters (Mechanics 3)
Success: Thrusters pull full load; no high-speed strain tax.
Failure: Coupling unstable; speed 4+ inflicts 1 System Strain per round.
Advantage: Power efficiency up; recover 1 additional System Strain.
Disadvantage: Brownout during test; one nearby system goes offline until next check.
Triumph: Overclock tuned; first acceleration to max speed is free of strain.
Despair: Arc fault; suffer 3 System Strain immediately.

3) Clear Launch Corridor Magnetic Clamps (R8 override)
Success: Clamps release cleanly; launch lane clears.
Failure: One clamp sticks; requires a second control action in R8.
Advantage: Timing window opens; first Piloting check after launch gets 1 Boost.
Disadvantage: Violent release shock; all aboard suffer 1 Strain.
Triumph: Perfect release geometry; gain +1 defense (fore) for first combat round.
Despair: Clamp snaps and ricochets; ship suffers 2 Hull Trauma before launch.

4) Calibrate Navicomputer (Computers 2)
Success: Nav solution restored; encrypted routes readable.
Failure: Route index scrambled; Sith routes stay locked.
Advantage: Fast alignment; reduce next Astrogation difficulty by 1.
Disadvantage: Drift error; add 1 Setback to next Astrogation check.
Triumph: Hidden packet recovered; unlock one bonus waypoint or lore key.
Despair: Nav corruption; next jump is forced to emergency-safe vector.

5) Restore Cockpit Life Support (Mechanics 1)
Success: Atmosphere and scrubbers stable.
Failure: Life support partial; crew suffer 1 Strain per flight hour.
Advantage: Air mix optimized; first fatigue-related check gains 1 Boost.
Disadvantage: Irritant trace; pilot suffers 1 Strain at launch.
Triumph: Redundant loop recovered; ignore first life-support-related failure later.
Despair: Toxic spike; each aboard suffers 1 Wound (soak does not apply).

6) Repair Hull Stress Fractures (Mechanics 2)
Success: Plates sealed; restore 3 Hull Trauma.
Failure: Cracks remain; no Hull Trauma restored.
Advantage: Bracing improves; +1 defense (aft) until next major repair stop.
Disadvantage: Sealant waste; consume extra parts, future hull repair +1 difficulty once.
Triumph: Structural harmonics corrected; restore +2 extra Hull Trauma.
Despair: New microfracture chain; suffer 2 Hull Trauma.

7) Recalibrate Twin Laser Targeting Systems (Mechanics 2)
Success: Fixed forward lasers online.
Failure: Targeting desync; lasers remain offline.
Advantage: Tight grouping; first laser attack gains Accurate +1.
Disadvantage: Feed jitter; first laser shot this session adds 1 Setback.
Triumph: Fire-control tune; reduce laser Critical rating by 1 for one encounter.
Despair: Emitter burnout; laser system disabled until parts are replaced.

8) Restore Backup Hyperdrive (Mechanics 3)
Success: Backup class 12 operational.
Failure: Backup remains dead.
Advantage: Clean spool; next hyperdrive spool time reduced noticeably.
Disadvantage: Heat bleed; suffer 1 System Strain after each jump until serviced.
Triumph: Safer fallback; first emergency jump this arc upgrades pilot check once.
Despair: Containment fault; primary hyperdrive gains 1 Setback on next jump check.

9) Flush Coolant System (Mechanics 1)
Success: Thermal load normalized.
Failure: Hot running persists; speed 5 still auto-adds 1 System Strain in combat rounds.
Advantage: Cool reserve; ignore first heat-related strain trigger.
Disadvantage: Sludge spread; one random repair this session gains 1 Setback.
Triumph: Exceptional thermal efficiency; remove 2 System Strain now.
Despair: Coolant rupture; each active turret is offline until patched.

10) Repair Sensor Array (Computers 2)
Success: Sensor range returns to Medium.
Failure: Sensors remain Short range.
Advantage: Clean signal; first detection check gains 1 Boost.
Disadvantage: Ghost returns; first detection check gains 1 Setback.
Triumph: Deep scan profile restored; detect cloaked/hidden contact at one band farther once.
Despair: Sensor blackout pulse; no active scans possible for one scene.

11) Restore Resonance Dampeners (Mechanics 3)
Success: Dampeners active; Crimson Shadow Running unlocked.
Failure: Dampeners remain unstable; ability stays offline.
Advantage: Field smooth; crew ignore first dark-side-resonance strain event.
Disadvantage: Harmonic feedback; crew each suffer 1 Strain when engines ignite.
Triumph: Perfect null field; enemy detection attempts upgrade in your favor once.
Despair: Resonance inversion; ship broadcasts a trace signature for one scene.`;

const updatedDescription = cleaned + outcomes;

const { error: updateError } = await supabase
  .from('SW_campaign_notes')
  .update({ Description: updatedDescription })
  .eq('id', 109);

if (updateError) {
  console.error('Update error:', updateError.message);
  process.exit(1);
}

console.log('Updated The Ashen Talon (id=109) with full repair outcome results.');
