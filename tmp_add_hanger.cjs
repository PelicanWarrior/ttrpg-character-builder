const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

(async () => {
  // Find Pantora note
  const { data: pantoraNotes, error: pantorErr } = await supabase
    .from('SW_campaign_notes')
    .select('id, title, parent_note_id')
    .eq('title', 'Pantora')
    .eq('campaign_id', 2);
  
  if (pantorErr) {
    console.error('Error finding Pantora:', pantorErr);
    return;
  }
  
  console.log('Pantora notes:', pantoraNotes);
  
  if (pantoraNotes.length > 0) {
    const pantora_id = pantoraNotes[0].id;
    console.log('Pantora ID:', pantora_id);
    
    // Create Ro Station note
    const { data: roStation, error: roErr } = await supabase
      .from('SW_campaign_notes')
      .insert({
        campaign_id: 2,
        title: 'Ro Station',
        parent_note_id: pantora_id,
        content: 'Space station location'
      })
      .select();
    
    if (roErr) {
      console.error('Error creating Ro Station:', roErr);
      return;
    }
    
    console.log('Ro Station created:', roStation[0].id);
    
    // Create Kelnan's Hanger note
    const hangerDescription = `**Nyx's Family Repair Hangar - Ro Station**

**Overall Layout:**
A compact L-shaped complex carved into the station's inner ring with one large open-top ship hangar. Main structure is roughly 80 meters long and 40 meters wide; hangar extends another 60m x 50m with retractable force-field ceiling plates and full open-top access. The structure has corroded durasteel walls patched with mismatched plates, and the floor is a cracked composite mesh stained with decades of coolant and engine grease.

**Ship Hangar (Main Bay - North Side, 60m x 50m x 25m tall):**
- Massive open-top chamber with retractable energy shield ceiling (can be sealed in emergencies)
- Arched internal support beams spanning the width
- Docking clamps and stabilizer arms mounted at 3-meter intervals along walls
- One active ship-lift platform (center floor, rated for mid-sized freighters)
- Heavy overhead gantry crane system (partially functional)
- Mooring rings and tether points throughout
- Floor painted with faded directional markings and parking grids
- **Entry:** Open roof access (ships fly in/out directly)
- **Internal Exits:** South passage connects to main workshop bay

**Main Workshop Bay (South of Ship Hangar, 50m x 35m x 8m tall):**
- Support operations for ships in hangar above
- Two ground-level lift platforms (non-functional, rusted)
- Scattered workbenches, tool racks, and parts bins along walls
- Partial scaffolding remains from old ship work
- One active wall-mounted hoist system
- Large bay doors facing the docking ring (sealed, but can be manually opened)
- **Exits:** North (ship hangar), North passage (storage), West passage (offices), South bay doors (docking ring), East maintenance tunnel

**Storage Room (Northeast, 20m x 12m):**
- Shelved inventory of replacement parts, fuel cells, patch kits
- Stacked supply crates (good for cover)
- Spare tool lockers along one wall
- Small window overlooking the main bay
- **Exits:** South to main workshop bay, East narrow corridor to offices

**Admin Office (West, 12m x 10m):**
- Cluttered desk with old datapads and ledgers
- Filing cabinets (locked, contains customer records and manifests)
- Wall-mounted holoscreen (flickering, rarely works)
- Personal effects: worn furniture, a framed family photo on desk
- Window overlooking workshop bay
- **Exits:** East to workshop bay, North to break room

**Break Room (Northwest, 8m x 8m):**
- Aging refresher station, small kitchenette with broken cooler
- Old table and two chairs
- Tired wall signage: "Safety First" (ironic)
- **Exits:** South to admin office, East to storage

**Maintenance Tunnel (East from workshop bay, narrow 2m wide x 6m tall):**
- Runs behind the wall workstations
- Contains exposed conduit, power lines, coolant pipes overhead
- Cramped, poor lighting; prone to dripping fluid
- **Exits:** West (workshop bay), North/South branch forks

**South Bay Doors (Heavy Manual System):**
- Dual 6m-wide doors opening to the Ro Station docking ring
- Emergency manual release (near admin office)
- Opens onto a busy transit corridor with vendor stalls and traffic
- **Outside:** Ro Station's commercial docking ring, constant foot traffic, automated cargo shuttles

**East Emergency Exit (Maintenance Tunnel Extension):**
- Narrow 1.5m-wide corridor behind equipment
- Leads to station ventilation access and secondary service hallway
- **Outside:** Station maintenance corridors, less trafficked but monitored

**Atmospheric Details:**
- Lighting: Flickering overhead strips; ship hangar has natural station-ring light; some sections dark unless lights manually activated
- Sound: Constant hum of life support, occasional groans of station's metal frame, wind noise through open hangar when bay doors cycle
- Hazards: Oil slicks, exposed electrical conduit, unstable scaffolding, open roof (falling objects from above)
- Cover: Workbenches, tool racks, support beams in hangar, stacked parts crates, lift platforms, gantry crane framework

**Tactical Considerations:**
- Open hangar allows air/space combat
- Multiple exits for escape or flanking
- Vertical interest from gantry systems and docking infrastructure
- Support beams provide cover in hangar
- Tight passages in workshop area`;
    
    const { data: hanger, error: hangerErr } = await supabase
      .from('SW_campaign_notes')
      .insert({
        campaign_id: 2,
        title: "Kelnan's Hanger",
        parent_note_id: roStation[0].id,
        content: hangerDescription
      })
      .select();
    
    if (hangerErr) {
      console.error('Error creating Kelnan\'s Hanger:', hangerErr);
      return;
    }
    
    console.log('Kelnan\'s Hanger created:', hanger[0].id);
    console.log('Success! Notes added.');
  }
})();
