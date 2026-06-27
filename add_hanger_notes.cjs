const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read meta.env
const metaEnvPath = path.join(process.cwd(), 'meta.env');
const metaEnvContent = fs.readFileSync(metaEnvPath, 'utf8');

// Parse meta.env
const metaEnv = {};
metaEnvContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const key = trimmed.substring(0, idx).trim();
      const value = trimmed.substring(idx + 1).trim();
      metaEnv[key] = value;
    }
  }
});

console.log('Loaded environment variables');

// Create Supabase client
const supabase = createClient(
  metaEnv.VITE_SUPABASE_URL,
  metaEnv.VITE_SUPABASE_ANON_KEY
);

const hangerContent = "**Nyx's Family Repair Hangar - Ro Station**\n\n**Overall Layout:**\nA compact L-shaped complex carved into the station's inner ring with one large open-top ship hangar. Main structure is roughly 80 meters long and 40 meters wide; hangar extends another 60m x 50m with retractable force-field ceiling plates and full open-top access. The structure has corroded durasteel walls patched with mismatched plates, and the floor is a cracked composite mesh stained with decades of coolant and engine grease.\n\n**Ship Hangar (Main Bay - North Side, 60m x 50m x 25m tall):**\n- Massive open-top chamber with retractable energy shield ceiling (can be sealed in emergencies)\n- Arched internal support beams spanning the width\n- Docking clamps and stabilizer arms mounted at 3-meter intervals along walls\n- One active ship-lift platform (center floor, rated for mid-sized freighters)\n- Heavy overhead gantry crane system (partially functional)\n- Mooring rings and tether points throughout\n- Floor painted with faded directional markings and parking grids\n- **Entry:** Open roof access (ships fly in/out directly)\n- **Internal Exits:** South passage connects to main workshop bay\n\n**Main Workshop Bay (South of Ship Hangar, 50m x 35m x 8m tall):**\n- Support operations for ships in hangar above\n- Two ground-level lift platforms (non-functional, rusted)\n- Scattered workbenches, tool racks, and parts bins along walls\n- Partial scaffolding remains from old ship work\n- One active wall-mounted hoist system\n- Large bay doors facing the docking ring (sealed, but can be manually opened)\n- **Exits:** North (ship hangar), North passage (storage), West passage (offices), South bay doors (docking ring), East maintenance tunnel\n\n**Storage Room (Northeast, 20m x 12m):**\n- Shelved inventory of replacement parts, fuel cells, patch kits\n- Stacked supply crates (good for cover)\n- Spare tool lockers along one wall\n- Small window overlooking the main bay\n- **Exits:** South to main workshop bay, East narrow corridor to offices\n\n**Admin Office (West, 12m x 10m):**\n- Cluttered desk with old datapads and ledgers\n- Filing cabinets (locked, contains customer records and manifests)\n- Wall-mounted holoscreen (flickering, rarely works)\n- Personal effects: worn furniture, a framed family photo on desk\n- Window overlooking workshop bay\n- **Exits:** East to workshop bay, North to break room\n\n**Break Room (Northwest, 8m x 8m):**\n- Aging refresher station, small kitchenette with broken cooler\n- Old table and two chairs\n- Tired wall signage: \"Safety First\" (ironic)\n- **Exits:** South to admin office, East to storage\n\n**Maintenance Tunnel (East from workshop bay, narrow 2m wide x 6m tall):**\n- Runs behind the wall workstations\n- Contains exposed conduit, power lines, coolant pipes overhead\n- Cramped, poor lighting; prone to dripping fluid\n- **Exits:** West (workshop bay), North/South branch forks\n\n**South Bay Doors (Heavy Manual System):**\n- Dual 6m-wide doors opening to the Ro Station docking ring\n- Emergency manual release (near admin office)\n- Opens onto a busy transit corridor with vendor stalls and traffic\n- **Outside:** Ro Station's commercial docking ring, constant foot traffic, automated cargo shuttles\n\n**East Emergency Exit (Maintenance Tunnel Extension):**\n- Narrow 1.5m-wide corridor behind equipment\n- Leads to station ventilation access and secondary service hallway\n- **Outside:** Station maintenance corridors, less trafficked but monitored\n\n**Atmospheric Details:**\n- Lighting: Flickering overhead strips; ship hangar has natural station-ring light; some sections dark unless lights manually activated\n- Sound: Constant hum of life support, occasional groans of station's metal frame, wind noise through open hangar when bay doors cycle\n- Hazards: Oil slicks, exposed electrical conduit, unstable scaffolding, open roof (falling objects from above)\n- Cover: Workbenches, tool racks, support beams in hangar, stacked parts crates, lift platforms, gantry crane framework\n\n**Tactical Considerations:**\n- Open hangar allows air/space combat\n- Multiple exits for escape or flanking\n- Vertical interest from gantry systems and docking infrastructure\n- Support beams provide cover in hangar\n- Tight passages in workshop area";

(async () => {
  try {
    // Find Pantora note
    console.log('Finding Pantora note...');
    const { data: pantoraNotes, error: pantorErr } = await supabase
      .from('SW_campaign_notes')
      .select('id, Place_Name, Part_of_Place')
      .eq('Place_Name', 'Pantora')
      .eq('CampaignID', 2);
    
    if (pantorErr) {
      console.error('Error finding Pantora:', pantorErr);
      process.exit(1);
    }
    
    if (pantoraNotes.length === 0) {
      console.error('Pantora note not found');
      process.exit(1);
    }
    
    const pantora_id = pantoraNotes[0].id;
    console.log('Found Pantora with ID:', pantora_id);
    
    // Create Ro Station note
    console.log('Creating Ro Station note...');
    const { data: roStation, error: roErr } = await supabase
      .from('SW_campaign_notes')
      .insert({
        CampaignID: 2,
        Place_Name: 'Ro Station',
        Part_of_Place: String(pantora_id),
        Description: 'Space station location'
      })
      .select();
    
    if (roErr) {
      console.error('Error creating Ro Station:', roErr);
      process.exit(1);
    }
    
    const ro_station_id = roStation[0].id;
    console.log('Created Ro Station with ID:', ro_station_id);
    
    // Create Kelnan's Hanger note
    console.log('Creating Kelnan\'s Hanger note...');
    const { data: hanger, error: hangerErr } = await supabase
      .from('SW_campaign_notes')
      .insert({
        CampaignID: 2,
        Place_Name: 'Kelnan\'s Hanger',
        Part_of_Place: String(ro_station_id),
        Description: hangerContent
      })
      .select();
    
    if (hangerErr) {
      console.error('Error creating Kelnan\'s Hanger:', hangerErr);
      process.exit(1);
    }
    
    const hanger_id = hanger[0].id;
    console.log('Created Kelnan\'s Hanger with ID:', hanger_id);
    console.log('\nSuccess! Both notes have been added to the database.');
    
  } catch (err) {
    console.error('Unexpected error:', err.message);
    process.exit(1);
  }
})();
