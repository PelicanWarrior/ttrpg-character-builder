import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oyqfyjfkqzvatdddngbp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWZ5amZrcXp2YXRkZGRuZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ0MTcsImV4cCI6MjA3MjcyMDQxN30.1HsQNoFT7VHu1-rFAEOhDRlXYq3SyxhnHcP2whWIVhU'
);

// Parse defence string "F/P/S/A" (e.g. "2/-/-/1") into individual fields
function parseDefence(d) {
  if (!d) return { defence_fore: null, defence_port: null, defence_starboard: null, defence_aft: null };
  const parts = d.split('/');
  const parse = (v) => (v === '-' || v == null ? null : parseInt(v, 10));
  return {
    defence_fore: parse(parts[0]),
    defence_port: parse(parts[1]),
    defence_starboard: parse(parts[2]),
    defence_aft: parse(parts[3]),
  };
}

// Parse handling: "+2" -> 2, "-1" -> -1, "0" -> 0
function parseHandling(h) {
  if (h == null) return null;
  return parseInt(h.toString().replace('+', ''), 10);
}

// Raw ship data from https://star-wars-rpg-ffg.fandom.com/wiki/Category:Starships
// Columns: name, class, silhouette, speed, handling, defence, armor, hull_trauma_threshold, system_strain_threshold, restricted, price_credits, rarity
// Skipping: H-60 Tempest Heavy Bomber (already in DB)
const rawShips = [
  // STARFIGHTERS
  ['A-7 Hunter Interceptor', 'Starfighter', 3, 5, '+2', '0/-/-/0', 2, 6, 7, false, 80000, 6],
  ['A-type Stiletto', 'Starfighter', 3, 4, '0', '1/-/-/1', 2, 10, 12, false, 90000, 7],
  ['A/SF-01 B-wing Heavy Fast Attack Starfighter', 'Starfighter', 3, 4, '-1', '2/-/-/1', 3, 15, 6, false, 150000, 6],
  ['Alpha-3 Nimbus-class V-wing Starfighter', 'Starfighter', 3, 4, '+2', '1/-/-/0', 2, 10, 8, true, 120000, 7],
  ['BTS-A2 "H-Wing" Long-Range Strike Starfighter', 'Starfighter', 3, 3, '-2', '2/-/-/1', 4, 15, 12, false, 225000, 6],
  ['CL-1c Lancet Interceptor', 'Starfighter', 3, 5, '+1', '1/-/-/0', 2, 6, 8, false, 55000, 5],
  ['CloakShape Fighter', 'Starfighter', 3, 4, '0', '0/-/-/0', 3, 10, 8, false, 38000, 4],
  ['Cutlass-9 Patrol Fighter', 'Starfighter', 3, 3, '0', '1/-/-/1', 2, 8, 8, false, 40000, 4],
  ['E-7 E-Wing Multi-Role Starfighter', 'Starfighter', 3, 5, '+1', '1/-/-/1', 3, 14, 8, false, 160000, 8],
  ['Eta-2 Actis-class Light Interceptor', 'Starfighter', 3, 6, '+2', '0/-/-/0', 2, 10, 8, true, 290000, 8],
  ['HH-87 Starhopper Starfighter', 'Starfighter', 3, 4, '+1', '1/-/-/0', 4, 10, 8, false, 50000, 4],
  ['HH-87 Starhopper', 'Starfighter', 3, 4, '0', '1/-/-/0', 4, 9, 8, false, 90000, 6],
  ['HLAF-500 Starfighter', 'Starfighter', 3, 4, '+1', '1/-/-/1', 2, 8, 8, false, 70000, 5],
  ['Kihraxz Light Starfighter', 'Starfighter', 3, 4, '0', '1/-/-/0', 2, 10, 6, false, 65000, 6],
  ['Kihraxz Light Starfighter (vaskai modification)', 'Starfighter', 3, 4, '+1', '1/-/-/1', 3, 10, 6, false, 110000, 7],
  ['M12-L Kimogila Heavy Starfighter', 'Starfighter', 4, 4, '-1', '2/-/-/0', 3, 16, 14, false, 150000, 5],
  ['M3-A Scyk Interceptor', 'Starfighter', 3, 5, '+2', '1/-/-/0', 2, 6, 8, false, 55000, 4],
  ['R-41 Starchaser', 'Starfighter', 3, 4, '0', '1/-/-/0', 2, 6, 8, false, 55000, 7],
  ['R-60 "T-wing" Interceptor', 'Starfighter', 3, 6, '-1', '1/-/-/0', 2, 8, 7, false, 95000, 7],
  ['StarViper-class Attack Platform', 'Starfighter', 3, 4, '+1', '2/-/-/2', 2, 14, 7, false, 160000, 7],
  ['T-65B X-wing Multi-role Starfighter', 'Starfighter', 3, 5, '+1', '1/-/-/1', 3, 10, 10, false, 120000, 5],
  ['Tallanx-class Stealth Fighter', 'Starfighter', 3, 5, '+2', '1/-/-/1', 1, 10, 6, true, 120000, 9],
  ['TIE Advanced v1', 'Starfighter', 3, 5, '+2', '1/-/-/1', 3, 6, 8, true, 150000, 6],
  ['TIE Advanced x1', 'Starfighter', 3, 6, '+3', '1/-/-/1', 3, 8, 10, true, 180000, 8],
  ['TIE/ag "Aggressor" Starfighter', 'Starfighter', 3, 4, '+1', '0/-/-/0', 3, 10, 8, true, 75000, 9],
  ['TIE/ca "Punisher" Starfighter', 'Starfighter', 3, 4, '-2', '1/-/-/1', 3, 18, 12, true, 253000, 7],
  ['TIE/it Interdictor Starfighter', 'Starfighter', 3, 4, '-2', '1/-/-/1', 3, 18, 12, true, 253000, 7],
  ['TIE/in Interceptor', 'Starfighter', 3, 6, '+3', '0/-/-/0', 2, 6, 10, true, 75000, 5],
  ['TIE/ln Starfighter', 'Starfighter', 3, 5, '+3', '0/-/-/0', 2, 6, 8, true, 50000, 4],
  ['TIE/sa Tactical Bomber', 'Starfighter', 3, 4, '0', '0/-/-/0', 3, 9, 8, true, 110000, 5],
  ['TIE/sk "Striker" Multi-role Fighter', 'Starfighter', 3, 6, '+3', '1/-/-/0', 2, 7, 9, true, 50000, 6],
  ['V-19 Torrent', 'Starfighter', 3, 4, '+2', '0/-/-/0', 3, 10, 9, false, 75000, 4],
  ['V-19b Dart Personal Flyer', 'Starfighter', 3, 4, '0', '1/-/-/1', 3, 14, 8, false, 60000, 7],
  ['Vulture-class Droid Starfighter', 'Starfighter', 3, 5, '+2', '0/-/-/0', 2, 8, 6, false, 40000, 5],
  ['Z-95-AF4 Headhunter', 'Starfighter', 3, 4, '+1', '1/-/-/0', 3, 9, 8, false, 55000, 4],
  ['Z-95-AF4-H "Heavy-95" Multi-Role Starfighter', 'Starfighter', 3, 4, '0', '2/-/-/0', 3, 12, 8, false, 85000, 5],
  ['Z-TIE', 'Starfighter', 3, 4, '-2', '1/-/-/0', 2, 9, 7, false, null, null],

  // SHUTTLES
  ['AO-2 Cometstrike-class Orbital Assault Pod', 'Shuttle', 4, 2, '-5', '0/-/-/0', 5, 12, 6, false, 30000, 5],
  ['Coneship', 'Shuttle', 3, 1, '-5', '0/-/-/0', 1, 8, 3, false, 5000, 8],
  ['Curich-class Shuttle', 'Shuttle', 5, 3, '0', '1/1/1/1', 3, 38, 18, true, 130000, 5],
  ['Delta-class T-3c Shuttle', 'Shuttle', 4, 3, '0', '2/-/-/1', 4, 30, 20, true, 160000, 6],
  ['Escape Pod', 'Shuttle', 2, 3, '-1', '0/-/-/0', 1, 6, 10, false, 5000, 7],
  ['Eta-class Shuttle', 'Shuttle', 4, 3, '0', '2/-/-/1', 3, 17, 12, false, 100000, 6],
  ['Life Boat', 'Shuttle', 3, 3, '-2', '0/-/-/0', 2, 12, 15, false, 15000, 7],
  ['Nu-class Transport', 'Shuttle', 4, 3, '0', '2/-/-/1', 3, 30, 12, false, 85000, 5],
  ['Sentinel-class Landing Craft', 'Shuttle', 4, 3, '-1', '2/-/-/2', 5, 25, 15, true, 240000, 7],
  ['Sheathipede-class Shuttle', 'Shuttle', 4, 3, '+1', '1/-/-/1', 4, 25, 15, false, 120000, 6],
  ['Shuttle Pod', 'Shuttle', 2, 4, '0', '0/-/-/0', 1, 4, 6, true, 15000, 6],
  ['T-6 Shuttle', 'Shuttle', 4, 3, '+1', '1/-/-/0', 3, 25, 15, false, 100000, 7],
  ['VCX-series Auxiliary Starfighter', 'Shuttle', 3, 4, '0', '1/-/-/0', 2, 12, 10, false, 22000, 6],
  ['Zeta-class Heavy Cargo Shuttle', 'Shuttle', 4, 2, '-3', '2/-/-/2', 4, 35, 20, true, 95000, 7],

  // PATROL BOATS / GUNBOATS
  ['Conqueror-class Assault Ship', 'Patrol Boat', 4, 3, '0', '2/-/-/2', 4, 20, 14, false, 100500, 9],
  ['Firespray System Patrol Craft', 'Patrol Boat', 4, 4, '0', '1/-/-/1', 4, 15, 12, false, 80000, 4],
  ['G-1A Heavy Starfighter', 'Patrol Boat', 3, 4, '-1', '2/-/-/1', 3, 14, 12, false, 130000, 7],
  ['M22-T Krayt Gunship', 'Patrol Boat', 4, 4, '-1', '2/-/-/2', 4, 24, 18, false, 185000, 6],
  ['PB-950 Patrol Boat', 'Patrol Boat', 5, 3, '-2', '2/1/1/1', 4, 34, 22, false, 150000, 5],
  ['PPB Pocket Patrol Boat', 'Patrol Boat', 3, 4, '0', '1/-/-/1', 2, 10, 7, false, 70000, 5],
  ['Regulator-class Patrol Vessel', 'Patrol Boat', 4, 4, '0', '2/-/-/1', 3, 18, 14, false, 110000, 6],
  ['SS-54 Light Assault Gunship', 'Patrol Boat', 3, 3, '+1', '1/-/-/0', 2, 18, 14, false, 110000, 6],
  ['YQ-400 Monitor-class System Patrol Ship', 'Patrol Boat', 4, 3, '0', '1/-/-/1', 2, 28, 30, false, 200000, 8],

  // FREIGHTERS
  ['Action IV Bulk Freighter', 'Freighter', 5, 2, '-2', '1/1/1/0', 2, 35, 18, false, 150000, 4],
  ['Action VI Bulk Transport', 'Freighter', 5, 2, '-3', '2/1/1/1', 2, 40, 20, false, 200000, 5],
  ['Armos Modular Transport', 'Freighter', 6, 2, '-2', '2/1/1/1', 4, 65, 45, false, 780000, 8],
  ['Aurore-class Freighter', 'Freighter', 5, 2, '-3', '2/2/2/1', 2, 50, 36, false, 240000, 6],
  ['GR-75 Medium Transport', 'Freighter', 5, 3, '-3', '1/1/1/1', 3, 20, 18, false, 180000, 4],
  ['GX1 Short Hauler', 'Freighter', 4, 2, '-2', '1/-/-/1', 2, 24, 15, false, 85000, 5],
  ['Gymsnor-3 Light Freighter', 'Freighter', 4, 3, '-3', '1/-/-/1', 1, 26, 14, false, 80000, 6],
  ['HT-2200 Medium Freighter', 'Freighter', 5, 2, '-2', '1/1/1/0', 5, 35, 14, false, 140000, 5],
  ['HWK-1000 Light Freighter', 'Freighter', 4, 5, '+1', '1/-/-/1', 3, 18, 15, true, 120000, 10],
  ['HWK-290 Light Freighter', 'Freighter', 3, 4, '+1', '1/-/-/1', 2, 18, 18, false, 70000, 7],
  ['ILH-KK Citadel-class Light Freighter', 'Freighter', 4, 3, '-1', '2/-/-/1', 4, 30, 16, false, 200000, 6],
  ['Kazellis-class Light Freighter', 'Freighter', 4, 4, '0', '1/-/-/0', 3, 20, 15, false, 70000, 8],
  ['KST-100 Kestrel Light Executive Transport', 'Freighter', 3, 4, '+1', '1/-/-/1', 2, 25, 20, false, 120000, 7],
  ['Lancer-class Pursuit Craft', 'Freighter', 4, 5, '-2', '1/-/-/0', 2, 20, 10, false, 120000, 8],
  ['LH75 Specialty Live-Haul Freighter', 'Freighter', 5, 3, '-3', '1/1/1/1', 4, 32, 14, false, 126000, 5],
  ['MC-18 Light Freighter', 'Freighter', 4, 3, '0', '2/-/-/1', 3, 22, 16, false, 140000, 6],
  ['Mobquet Medium Transport', 'Freighter', 5, 1, '-4', '1/1/1/1', 3, 40, 28, false, 275000, 5],
  ['ND-47 Stalwart Bulk Freighter', 'Freighter', 5, 2, '-2', '2/2/2/2', 5, 35, 15, false, 70000, 6],
  ['Space Master Medium Transport', 'Freighter', 5, 2, '-4', '1/1/1/1', 2, 25, 25, false, 150000, 4],
  ['Star Galleon Armed Transport', 'Freighter', 6, 1, '-2', '2/2/2/2', 5, 85, 18, true, 1500000, 7],
  ['Starlight-class Light Freighter', 'Freighter', 4, 3, '-1', '1/-/-/1', 3, 20, 16, false, 69995, 5],
  ['Starwind Pleasure Yacht', 'Freighter', 5, 3, '-2', '2/1/1/1', 3, 25, 20, false, 210000, 6],
  ['TL-1200 Transport', 'Freighter', 5, 3, '-3', '1/1/1/1', 3, 26, 15, false, 170000, 6],
  ['Temple-class Heavy Freighter', 'Freighter', 6, 1, '-3', '2/1/1/1', 3, 75, 24, false, 950000, 6],
  ['TL-18b Medium Transport', 'Freighter', 4, 3, '-1', '2/1/1/0', 4, 22, 16, false, 157000, 7],
  ['VCX-100 Light Freighter', 'Freighter', 5, 3, '-3', '1/1/1/1', 3, 32, 28, false, 155000, 8],
  ['Wander-class Jump Freighter', 'Freighter', 3, 3, '0', '1/-/-/1', 2, 17, 17, false, 65000, 6],
  ['Wayfarer-class Medium Freighter', 'Freighter', 5, 3, '-2', '1/1/1/2', 4, 32, 20, false, 120000, 5],
  ['Xiytiar-class Heavy Transport', 'Freighter', 5, 2, '-3', '1/1/1/1', 2, 35, 20, false, 200000, 5],
  ['YG-4210 Light Freighter', 'Freighter', 4, 2, '-2', '2/-/-/1', 3, 30, 10, false, 85000, 7],
  ['YG-4400 Light Freighter', 'Freighter', 4, 4, '-1', '1/-/-/2', 3, 21, 14, false, 110000, 5],
  ['YKL-37R Nova Courier', 'Freighter', 4, 3, '0', '1/-/-/1', 3, 24, 18, false, 130000, 6],
  ['YT-1000 Light Freighter', 'Freighter', 4, 3, '-1', '1/-/-/1', 2, 20, 14, false, 75000, 5],
  ['YT-1200 Light Freighter', 'Freighter', 4, 2, '-1', '1/-/-/1', 3, 19, 11, false, 90000, 5],
  ['YT-1210 Light Freighter', 'Freighter', 4, 4, '-1', '1/-/-/1', 2, 20, 12, false, 120000, 5],
  ['YT-1250 Light Freighter', 'Freighter', 4, 4, '-1', '1/-/-/1', 3, 20, 12, false, 130000, 5],
  ['YT-1300 Light Freighter', 'Freighter', 4, 3, '-1', '1/-/-/1', 3, 22, 15, false, 100000, 4],
  ['YT-1760 Small Transport', 'Freighter', 4, 4, '+1', '1/-/-/0', 1, 17, 15, false, 80000, 5],
  ['YT-2000 Light Freighter', 'Freighter', 4, 3, '0', '1/-/-/1', 3, 24, 14, false, 120000, 5],
  ['YT-2400 Light Freighter', 'Freighter', 4, 3, '0', '1/-/-/1', 4, 25, 18, false, 130000, 5],
  ['YV-560 Light Freighter', 'Freighter', 4, 3, '0', '1/-/-/1', 3, 20, 20, false, 120000, 7],
  ['YV-666 Light Freighter', 'Freighter', 4, 3, '-2', '2/-/-/1', 3, 30, 12, false, 132000, 6],
  ['YV-929 Light Freighter', 'Freighter', 4, 3, '-1', '2/-/-/1', 4, 23, 15, false, 380000, 6],
  ['YZ-775 Medium Transport', 'Freighter', 5, 2, '-3', '1/1/1/1', 4, 34, 25, false, 500000, 3],
  ['ZH-25 Questor Light Freighter', 'Freighter', 4, 3, '-1', '1/-/-/1', 3, 30, 20, false, 115000, 6],

  // OTHER TRANSPORTS
  ['Ainik-class Scientific Survey Vessel', 'Transport', 4, 3, '0', '2/-/-/1', 2, 22, 10, false, 120000, 7],
  ['Alidade-class Long-Range Survey Ship', 'Transport', 5, 2, '-1', '2/1/1/1', 3, 35, 30, false, 150000, 6],
  ['Baudo-class Star Yacht', 'Transport', 4, 4, '+1', '1/-/-/1', 1, 26, 10, false, 250000, 9],
  ['CSS-1 Corellian Star Shuttle', 'Transport', 5, 3, '-2', '2/2/2/1', 4, 30, 22, false, 325000, 6],
  ['Deep Space Recovery Vessel L-2783', 'Transport', 5, 2, '-4', '2/1/1/1', 4, 55, 35, false, 6500000, 6],
  ['H-type Nubian Yacht', 'Transport', 4, 5, '+1', '2/-/-/2', 3, 30, 20, false, 800000, 7],
  ['Indulgent-class Luxury Starliner', 'Transport', 7, 1, '-1', '2/1/1/2', 2, 85, 40, false, 25500000, 7],
  ['Ithorian Herd Ship', 'Transport', 9, 2, '-2', '3/3/3/3', 9, 150, 80, false, 600000000, 9],
  ['J-type Diplomatic Barge', 'Transport', 5, 4, '+1', '2/1/1/2', 3, 36, 18, false, 1000000, 7],
  ['J-type Star Skiff', 'Transport', 4, 4, '-1', '2/-/-/2', 4, 28, 18, false, 260000, 7],
  ['Jadthu-class Landing Ship', 'Transport', 5, 3, '-3', '1/1/1/0', 5, 30, 15, false, 200000, 5],
  ['Jedi Sojourner', 'Transport', 4, 4, '+1', '2/-/-/2', 3, 24, 14, false, 120000, 8],
  ['Kalevalan Star Yacht', 'Transport', 5, 2, '-4', '1/2/2/1', 4, 38, 24, false, 850000, 8],
  ['Kaminoan Observation Ship', 'Transport', 6, 2, '-2', '0/0/0/0', 2, 50, 25, false, 750000, 7],
  ['Legate-class Courier', 'Transport', 4, 4, '0', '1/-/-/1', 2, 18, 13, false, 65000, 6],
  ['Luxury 3000 Space Yacht', 'Transport', 4, 3, '0', '1/-/-/1', 1, 30, 12, false, 120000, 6],
  ['Luxurious-class Yacht', 'Transport', 4, 4, '+1', '1/-/-/1', 1, 25, 22, false, 210000, 6],
  ['Minstrel-class Space Yacht', 'Transport', 5, 3, '-1', '2/1/1/2', 6, 45, 28, false, 1750000, 7],
  ['Pathfinder Scout Ship', 'Transport', 4, 4, '+1', '1/-/-/1', 2, 16, 10, false, 45000, 6],
  ['Punworcca 116-class Interstellar Sloop', 'Transport', 3, 3, '-3', '2/-/-/2', 1, 20, 15, false, 240000, 9],
  ['Q-Signal Messenger Drone', 'Transport', 2, 0, '0', '0/-/-/0', 2, 15, 10, false, 12000, 5],
  ['S-type Racing Sloop', 'Transport', 3, 6, '+1', '1/-/-/0', 1, 11, 15, false, 160000, 7],
  ['Seltiss-2 Caravel', 'Transport', 4, 3, '-1', '2/1/1/2', 4, 30, 18, false, 550000, 6],
  ['UT-60D U-wing Troop Transport', 'Transport', 4, 4, '+1', '2/-/-/1', 2, 20, 18, false, 65000, 6],
  ['WUD-500 Star Yacht', 'Transport', 4, 4, '-1', '1/-/-/1', 1, 18, 14, false, 98500, 6],
  ['Y164 Slave Transport', 'Transport', 5, 3, '-2', '1/1/1/1', 4, 35, 20, false, 245000, 6],
  ['YT Dart', 'Transport', 3, 2, '0', '0/-/-/0', 2, 10, 8, false, 9000, 5],

  // CAPITAL SHIPS
  ['CR90 Corvette', 'Capital Ship', 5, 3, '-1', '2/1/1/2', 5, 50, 25, false, 1200000, 5],
  ['CR92a Assassin-class Corvette', 'Capital Ship', 5, 3, '-1', '2/2/2/1', 5, 55, 25, true, 2500000, 6],
  ['Cybershop Ship', 'Capital Ship', 5, 3, '-2', '2/1/1/2', 5, 50, 25, false, 1300000, 7],
  ['Hammerhead Corvette', 'Capital Ship', 5, 3, '-1', '3/1/1/1', 4, 50, 25, false, 1000000, 8],
  ['Marauder-class Assault Corvette', 'Capital Ship', 5, 3, '0', '2/1/1/1', 5, 65, 35, true, 3000000, 5],
  ['Assault Frigate Mark II', 'Capital Ship', 7, 3, '-1', '4/3/3/2', 5, 84, 42, false, 12250000, 6],
  ['EF76 Nebulon-B Frigate', 'Capital Ship', 6, 3, '-1', '2/2/2/2', 6, 71, 40, true, 8500000, 7],
  ['Imperial System Patrol Craft', 'Capital Ship', 5, 3, '-1', '2/2/2/1', 6, 45, 20, true, 4000000, 5],
  ['IR-3F-class Light Frigate', 'Capital Ship', 5, 4, '-1', '2/2/2/2', 3, 40, 35, false, 1000000, 6],
  ['Lancer-class Frigate', 'Capital Ship', 5, 2, '-1', '2/1/1/1', 5, 52, 34, true, 4760000, 7],
  ['MC30c Frigate', 'Capital Ship', 6, 4, '0', '3/2/2/2', 5, 74, 42, true, 9500000, 6],
  ['Acclamator-class Planetary Assault Ship', 'Capital Ship', 7, 2, '-1', '3/2/2/2', 6, 80, 65, true, 110000000, 8],
  ['C-ROC Gozanti-class Light Cruiser', 'Capital Ship', 5, 3, '-3', '2/2/2/1', 5, 55, 40, false, 190000, 8],
  ['Cantwell-class Arrestor Cruiser', 'Capital Ship', 7, 2, '-2', '2/2/2/1', 4, 66, 40, false, 2200000, 8],
  ['Consular-class Light Cruiser', 'Capital Ship', 5, 3, '-2', '2/1/1/0', 4, 46, 24, false, 3000000, 5],
  ['Consular-class Light Cruiser (Charger c70 Combat Refit)', 'Capital Ship', 5, 3, '-2', '2/1/1/1', 5, 46, 24, false, 3000000, 5],
  ['Consular-class Light Assault Cruiser', 'Capital Ship', 5, 3, '-2', '2/1/1/1', 5, 46, 24, false, 3400000, 5],
  ['Gozanti-class Armed Transport', 'Capital Ship', 5, 2, '-3', '2/2/2/1', 5, 50, 36, false, 200000, 6],
  ['Keldabe-class Battleship', 'Capital Ship', 7, 3, '-1', '2/2/2/2', 8, 100, 60, true, 200000000, 8],
  ['MC40a Light Cruiser', 'Capital Ship', 6, 2, '-1', '3/2/2/3', 6, 92, 56, true, 15500000, 6],
  ['MC75 Star Cruiser', 'Capital Ship', 8, 3, '-2', '4/3/3/4', 8, 130, 80, false, 88000000, 8],
  ['MC80 Liberty Type Heavy Star Cruiser', 'Capital Ship', 8, 2, '-2', '3/4/4/3', 9, 140, 80, false, 104000000, 7],
  ['MC80a Home One Type Heavy Star Cruiser', 'Capital Ship', 9, 2, '-2', '4/4/4/4', 10, 155, 90, false, 112000000, 8],
  ['Gladiator-class Star Destroyer', 'Capital Ship', 7, 3, '-2', '3/2/2/1', 7, 90, 35, true, 34000000, 7],
  ['Onager-class Star Destroyer', 'Capital Ship', 8, 3, '-2', '4/2/2/1', 7, 100, 45, false, 376500000, 8],
  ['Pelta-class Frigate', 'Capital Ship', 6, 3, '0', '2/2/2/1', 4, 65, 55, true, 7250000, 6],
  ['Neutron Star-class Bulk Cruiser', 'Capital Ship', 7, 1, '-3', '2/2/2/1', 6, 80, 50, false, 2800000, 4],
  ['Neutron Star-class Bulk Cruiser (carrier conversion)', 'Capital Ship', 7, 1, '-3', '2/2/2/1', 6, 80, 50, false, 2871000, 4],
  ['Starhawk-class Battleship', 'Capital Ship', 9, 2, '-3', '3/4/4/2', 10, 175, 55, true, 60000000, 8],
  ['Subjugator-class Heavy Cruiser', 'Capital Ship', 9, 2, '-3', '3/3/3/3', 12, 210, 150, true, 875500000, 9],
  ['Kossak-class Frigate', 'Capital Ship', 6, 3, '-2', '2/2/2/1', 6, 75, 45, false, 8300000, 7],
  ['Venator-class Star Destroyer', 'Capital Ship', 8, 2, '-3', '2/2/2/2', 8, 115, 55, true, 59000000, 7],
  ['Vigil-class Corvette', 'Capital Ship', 5, 3, '-1', '2/2/2/1', 5, 55, 35, true, 3500000, 5],
  ['Vindicator-class Heavy Cruiser', 'Capital Ship', 7, 3, '-1', '3/2/2/2', 6, 85, 55, true, 10400000, 8],

  // STATIONS
  ['DS-1 Death Star', 'Station', 20, 1, '-5', '0/-/-/0', 20, 1000, 800, false, null, null],
  ['DS-2 Death Star (under construction)', 'Station', 21, 0, null, '0/-/-/0', 20, 800, 450, false, null, null],
  ['FireStar II-class Orbital Defense Station', 'Station', 7, 0, '-4', '2/2/2/2', 8, 110, 70, true, 8500000, 8],
  ['Golan I Space Defense Platform', 'Station', 8, 0, null, '2/2/2/2', 6, 300, 150, true, 26000000, 9],
  ['Harbor-class Mobile Space Dock', 'Station', 7, 2, '-3', '2/2/2/2', 6, 100, 75, false, 38000000, 9],
  ['Haven-class Mobile Space Dock', 'Station', 7, 2, '-3', '2/2/2/2', 6, 100, 75, false, 38000000, 9],
  ['Mk IX Orbital Maintenance Depot', 'Station', 8, 0, '-4', '2/2/2/2', 4, 250, 200, false, 22000000, 7],

  // LEGENDARY (named/unique ships)
  ['Ark Angel', 'Freighter', 5, 3, '-3', '2/1/1/2', 3, 36, 30, true, 525000, 10],
  ['Blockade Bandit', 'Freighter', 5, 2, '-2', '2/1/1/2', 5, 50, 15, false, 700000, 5],
  ['Booster BX', 'Freighter', 4, 5, '+1', '1/-/-/1', 2, 22, 20, false, 225000, 9],
  ['Broken Horn', 'Freighter', 5, 4, '-1', '3/2/2/3', 3, 38, 22, false, 450000, 6],
  ['Deep Dark', 'Freighter', 4, 3, '0', '1/-/-/1', 4, 25, 18, true, 120000, 5],
  ['Dikutruni', 'Starfighter', 3, 4, '+1', '1/-/-/1', 4, 25, 15, true, 135000, 6],
  ['End of Days', 'Capital Ship', 7, 3, '-1', '2/2/2/2', 8, 100, 60, true, 200000000, 8],
  ['Fereallis, Modified Suwantek TL-1200 Transport', 'Freighter', 5, 3, '-3', '1/1/1/1', 3, 23, 16, false, 120400, 6],
  ['Flatline and Brilliance', 'Capital Ship', 5, 3, '-1', '3/2/2/2', 2, 40, 20, false, 300000, 7],
  ['Ghost', 'Freighter', 5, 3, '-2', '2/1/1/2', 5, 32, 30, false, 155000, 10],
  ['Han Solo\'s Millenium Falcon', 'Freighter', 4, 5, '+1', '2/-/-/2', 5, 30, 15, true, 425000, 10],
  ['Hound\'s Tooth', 'Freighter', 4, 3, '-2', '3/-/-/2', 4, 34, 16, true, 415000, 10],
  ['Icarii-7', 'Capital Ship', 6, 2, '-2', '2/2/2/2', 7, 70, 50, false, 9900000, 4],
  ['Lando Calrissian\'s Millenium Falcon', 'Freighter', 4, 4, '+1', '2/-/-/1', 4, 26, 22, false, 265000, 10],
  ['Lando Calrissian\'s YT Dart', 'Transport', 3, 3, '0', '0/-/-/0', 2, 12, 8, false, 16000, 5],
  ['Mist Hunter', 'Patrol Boat', 3, 4, '0', '2/-/-/1', 4, 15, 11, false, 162900, 10],
  ['Modified CloakShape Starfighter', 'Starfighter', 3, 4, '0', '0/-/-/0', 3, 10, 8, false, 38000, 4],
  ['Nightflyer', 'Freighter', 4, 3, '+1', '2/-/-/1', 4, 25, 18, false, 160000, 5],
  ['Phantom', 'Shuttle', 3, 4, '0', '1/-/-/1', 3, 12, 10, false, 22000, 6],
  ['Phantom II', 'Shuttle', 4, 3, '0', '1/-/-/1', 4, 14, 13, false, 114000, 7],
  ['Phoenix Home', 'Capital Ship', 6, 3, '0', '3/2/2/1', 4, 65, 55, true, 7265000, 9],
  ['Renegade\'s Blood', 'Capital Ship', 5, 4, '0', '2/1/1/1', 5, 46, 23, false, 3400000, 5],
  ['Sabine\'s TIE Fighter', 'Starfighter', 3, 5, '+3', '0/-/-/0', 2, 6, 8, true, 60000, 4],
  ['Savrip', 'Capital Ship', 5, 3, '0', '1/1/1/1', 5, 65, 35, true, null, 5],
  ['Shadow Caster', 'Freighter', 4, 5, '+1', '1/-/-/1', 3, 20, 22, false, 155000, 6],
  ['Shadow Raptor', 'Capital Ship', 6, 3, '+1', '2/2/2/2', 6, 71, 40, true, 8500000, 7],
  ['Shen\'s Yacht, The Venture', 'Transport', 4, 3, '+2', '1/-/-/0', 3, 20, 20, false, 185000, 5],
  ['Slave I', 'Patrol Boat', 4, 4, '0', '2/-/-/2', 4, 18, 14, false, 125650, 10],
  ['Tam Blackstar\'s TIE Hunter', 'Starfighter', 3, 6, '+3', '1/-/-/1', 1, 6, 10, true, 100000, 7],
];

// Build insert records
const ships = rawShips.map(([name, shipClass, silhouette, speed, handling, defence, armor, hull_trauma_threshold, system_strain_threshold, restricted, price_credits, rarity]) => {
  const def = parseDefence(defence);
  return {
    name,
    class: shipClass,
    silhouette,
    speed,
    handling: handling != null ? parseHandling(handling) : null,
    armor,
    hull_trauma_threshold,
    system_strain_threshold,
    defence_fore: def.defence_fore,
    defence_port: def.defence_port,
    defence_starboard: def.defence_starboard,
    defence_aft: def.defence_aft,
    price_credits,
    rarity,
    source: restricted ? 'Star Wars RPG FFG Wiki (Restricted)' : 'Star Wars RPG FFG Wiki',
  };
});

console.log(`Prepared ${ships.length} ships. Checking existing records...`);

// Fetch all existing ship names to avoid duplicates
const { data: existingShips, error: fetchError } = await supabase
  .from('SW_ships')
  .select('name');

if (fetchError) {
  console.error('Failed to fetch existing ships:', fetchError.message);
  process.exit(1);
}

const existingNames = new Set((existingShips || []).map((s) => s.name));
console.log(`Found ${existingNames.size} existing ships in DB.`);

const newShips = ships.filter((s) => !existingNames.has(s.name));
const skippedCount = ships.length - newShips.length;
console.log(`Skipping ${skippedCount} already-existing ships. Inserting ${newShips.length} new ships...`);

if (newShips.length === 0) {
  console.log('Nothing to insert. All ships already exist.');
  process.exit(0);
}

// Insert in batches of 50 to avoid request size limits
const BATCH_SIZE = 50;
let inserted = 0;

for (let i = 0; i < newShips.length; i += BATCH_SIZE) {
  const batch = newShips.slice(i, i + BATCH_SIZE);
  const { error } = await supabase.from('SW_ships').insert(batch);

  if (error) {
    console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
    console.error('Details:', JSON.stringify(error, null, 2));
    process.exit(1);
  }

  inserted += batch.length;
  console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: inserted ${batch.length} ships (total inserted: ${inserted})`);
}

console.log(`\nDone! Inserted ${inserted} new ships.`);
console.log(`Skipped ${skippedCount} ships already in DB.`);
console.log('Note: H-60 Tempest Heavy Bomber was not included (already in DB).');
console.log('Note: The wiki lists 373 ships total; this script covers ~148 ships with stats from the category tables.');
console.log('Individual ship pages can be visited for remaining ships or additional stats (complement, weapons, hyperdrive, etc.).');
