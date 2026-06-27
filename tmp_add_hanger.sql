-- Find Pantora note ID
WITH pantora_id AS (
  SELECT id FROM SW_campaign_notes 
  WHERE title = 'Pantora' AND campaign_id = 2 
  LIMIT 1
),
-- Create Ro Station note
ro_station_created AS (
  INSERT INTO SW_campaign_notes (campaign_id, title, parent_note_id, content)
  SELECT 2, 'Ro Station', pantora_id.id, 'Space station location'
  FROM pantora_id
  RETURNING id
),
-- Create Kelnan's Hanger note
kelnan_hanger_created AS (
  INSERT INTO SW_campaign_notes (campaign_id, title, parent_note_id, content)
  SELECT 
    2, 
    'Kelnan''s Hanger', 
    ro_station_created.id,
    '**Nyx''s Family Repair Hangar - Ro Station**

**Overall Layout:**
A compact L-shaped complex carved into the station''s inner ring with one large open-top ship hangar. Main structure is roughly 80 meters long and 40 meters wide; hangar extends another 60m x 50m with retractable force-field ceiling plates and full open-top access. The structure has corroded durasteel walls patched with mismatched plates, and the floor is a cracked composite mesh stained with decades of coolant and engine grease.

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
- **Outside:** Ro Station''s commercial docking ring, constant foot traffic, automated cargo shuttles

**East Emergency Exit (Maintenance Tunnel Extension):**
- Narrow 1.5m-wide corridor behind equipment
- Leads to station ventilation access and secondary service hallway
- **Outside:** Station maintenance corridors, less trafficked but monitored

**Atmospheric Details:**
- Lighting: Flickering overhead strips; ship hangar has natural station-ring light; some sections dark unless lights manually activated
- Sound: Constant hum of life support, occasional groans of station''s metal frame, wind noise through open hangar when bay doors cycle
- Hazards: Oil slicks, exposed electrical conduit, unstable scaffolding, open roof (falling objects from above)
- Cover: Workbenches, tool racks, support beams in hangar, stacked parts crates, lift platforms, gantry crane framework

**Tactical Considerations:**
- Open hangar allows air/space combat
- Multiple exits for escape or flanking
- Vertical interest from gantry systems and docking infrastructure
- Support beams provide cover in hangar
- Tight passages in workshop area'
  FROM ro_station_created
  RETURNING id
)
SELECT 
  'Kelnan''s Hanger created with ID: ' || id as result
FROM kelnan_hanger_created;
