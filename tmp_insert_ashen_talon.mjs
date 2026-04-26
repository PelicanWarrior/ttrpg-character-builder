import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oyqfyjfkqzvatdddngbp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWZ5amZrcXp2YXRkZGRuZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ0MTcsImV4cCI6MjA3MjcyMDQxN30.1HsQNoFT7VHu1-rFAEOhDRlXYq3SyxhnHcP2whWIVhU'
);

const description = `Ship Name: The Ashen Talon
Class: Sith Courier Interceptor (late Republic era)
Registry: Carried aboard The Ashen Testament. Personal craft, no public transponder record.

--- SHIP STATS ---
Silhouette:       3
Speed:            5
Handling:         +2
Defense:          Fore 1 / Aft 1
Armor:            3
Hull Trauma Threshold:    18
System Strain Threshold:  14
Hyperdrive:       Primary Class 2 / Backup Class 12
Navicomputer:     Yes — encrypted, 5 stored jumps (Sith courier routes, locked behind IG-07 interface)
Sensor Range:     Medium (when repaired; currently Short — see repair list)
Crew:             1 pilot
Passengers:       0
Encumbrance Capacity: 8
Consumables:      1 week

--- WEAPONS ---
Twin Linked Laser Cannons (fixed forward)
  Skill: Gunnery | Damage: 6 | Critical: 3 | Range: Close
  Qualities: Linked 1, Accurate 1
  Current Status: OFFLINE — targeting calibration required (see repair list)

Proton Torpedo Launcher (fixed forward)
  Skill: Gunnery | Damage: 8 | Critical: 2 | Range: Short
  Qualities: Blast 6, Breach 6, Guided 3, Limited Ammo 4, Slow-Firing 1
  Current Status: ARMED — 2 torpedoes loaded, 2 in reserve

--- SPECIAL ABILITIES ---
Sith Courier Protocol
  IG-07 can interface with the navicomputer directly (1 action, Computers Difficulty 2) to unlock the 5 stored jump routes. One of these routes leads to Archive-Forge Node KHAR-VOSS.

Resonance Dampeners
  The hull is inscribed with Sith geometric dampening wards. Crew aboard the Talon do not suffer environmental strain from dark side resonance while the ship is sealed.

Crimson Shadow Running (OFFLINE — requires resonance dampener repair)
  When running without transponder, all enemy attempts to detect or identify the vessel gain 2 Setback dice.

--- REQUIRED REPAIRS (must be completed to fly) ---
All five must be resolved before the Ashen Talon can launch. The R8 override (Ghost Bridge Override) handles item 3 automatically.

1. Repressurize Fuel Lines
   Skill: Mechanics | Difficulty: 2
   Failure: Thruster output capped at Speed 2 until corrected.

2. Restore Primary Power Coupling to Thrusters
   Skill: Mechanics | Difficulty: 3
   Failure: Ship cannot reach Speed 4+ without triggering 1 System Strain per round at high speed.

3. Clear Launch Corridor Magnetic Clamps [HANDLED BY R8 OVERRIDE]
   The Ghost Bridge Override sequence releases the magnetic clamps automatically.
   No separate check required — completing R8 resolves this.

4. Calibrate Navicomputer
   Skill: Computers | Difficulty: 2
   Failure: Hyperdrive can still jump, but the stored Sith routes are inaccessible until calibrated.

5. Restore Cockpit Life Support
   Skill: Mechanics | Difficulty: 1
   Failure: Crew suffers 1 Strain per hour of flight until resolved.

--- ADDITIONAL REPAIRS (optional — improve the ship) ---
These are not required to fly but improve capability or safety. Good use of downtime between sessions.

A. Repair Hull Stress Fractures
   Skill: Mechanics | Difficulty: 2
   Effect: Restore 3 Hull Trauma. Currently the Talon is sitting at Hull Trauma 5/18.

B. Recalibrate Twin Laser Targeting Systems
   Skill: Mechanics | Difficulty: 2
   Effect: Brings laser cannons back online. Until complete, laser cannons cannot be fired.

C. Restore Backup Hyperdrive
   Skill: Mechanics | Difficulty: 3
   Effect: Backup Class 12 is currently non-functional. If primary hyperdrive fails mid-jump, there is no fallback without this repair.

D. Flush Coolant System
   Skill: Mechanics | Difficulty: 1
   Effect: Prevents 1 automatic System Strain on any combat round where the ship reaches Speed 5.

E. Repair Sensor Array
   Skill: Computers | Difficulty: 2
   Effect: Upgrades sensor range from Short (current) back to Medium.

F. Restore Resonance Dampeners
   Skill: Mechanics | Difficulty: 3
   Effect: Unlocks the Crimson Shadow Running ability. Adds 2 Setback to all enemy detection/identification rolls.

--- CURRENT DAMAGE STATE ---
Hull Trauma: 5 (out of 18) — structurally safe to fly, not safe in a sustained fight
System Strain: 3 (out of 14) — fuel line and coupling issues contributing
Weapons: Laser cannons offline; torpedo launcher armed (2 loaded, 2 reserve)
Hyperdrive: Primary functional but not calibrated; backup non-functional`;

const { data, error } = await supabase
  .from('SW_campaign_notes')
  .insert({
    Place_Name: 'The Ashen Talon (Interceptor)',
    Part_of_Place: 103,
    CampaignID: 2,
    Order: 1,
    Description: description
  })
  .select('id');

if (error) {
  console.error('Error:', error.message);
} else {
  console.log('Inserted The Ashen Talon, id =', data[0].id);
}
