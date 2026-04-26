import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oyqfyjfkqzvatdddngbp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWZ5amZrcXp2YXRkZGRuZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ0MTcsImV4cCI6MjA3MjcyMDQxN30.1HsQNoFT7VHu1-rFAEOhDRlXYq3SyxhnHcP2whWIVhU'
);

const CAMPAIGN_ID = 2;
const PARENT_ID = 96; // The Ashen Testament note id

const rooms = [
  {
    Place_Name: 'R1 - Surface Scar Entrance',
    Order: 1,
    Description: `The "door" is a long fracture hidden in black glass and wind-packed ash. The hull edge is almost fused into the terrain, and the opening only becomes visible when lightning-like static ripples across the stone. Wind noise here masks other sounds, making this room excellent for paranoia and misdirection.

Read-Aloud: "You stand on a dead slope of obsidian and ash where the storm chews at your armor and fills your mouth with metal. At first there is no entrance, only broken rock, then a hard seam catches the light and you realize the mountain is not a mountain at all. Something vast is buried under you, and the crack ahead is its mouth."

Challenge: Spot safe approach path before ash gust closes visibility.

Exits:
- R2 Collapsed Access Throat (two-way)`,
  },
  {
    Place_Name: 'R2 - Collapsed Access Throat',
    Order: 2,
    Description: `This corridor descends at an angle through twisted bulkhead braces, collapsed decking, and razor-edged glass splinters. Every movement sends dust drifting down from above. The space feels unstable but passable, and there are clear signs that one person forced a route through recently.

Read-Aloud: "The passage narrows into a slanted tunnel of broken plating and bent ribs of metal. Your boots scrape over ash, cables, and old fragments that ring like glass when kicked. Somewhere above, debris shifts with a grinding moan, and the whole throat of the ship feels one bad step away from caving in."

Challenge: Clear or climb safely without losing gear.

Exits:
- R1 Surface Scar Entrance (two-way)
- R3 Pressure Lock Vestibule (two-way)`,
  },
  {
    Place_Name: 'R3 - Pressure Lock Vestibule',
    Order: 3,
    Description: `A circular lock chamber with dead consoles, manual pressure wheels, and fogged indicator strips. In a recessed maintenance alcove lies IG-07, powered down but intact, partially buried under a thermal tarp and tools. This is the narrative handoff where Vapan gets IG-07 online before the first fight.

Read-Aloud: "The next chamber is round and silent, a pressure lock with dead screens and cracked status lights. Frost rims the seams of the inner door. In a side alcove, under a torn maintenance cover, you find a familiar droid frame slumped against the wall. IG-07 is here, dark and motionless, as if the ship itself set him aside and forgot him."

Story Beat: IG-07 comes online here, allowing both PCs to face the first encounter together.
Challenge: Repressurize enough to access main interior and reactivate IG-07 before opening the route to R4.

Exits:
- R2 Collapsed Access Throat (two-way)
- R4 Hall of Resonant Ribs (two-way)
- R8 Ghost Bridge Override (one-way IN — emergency return corridor)
- R10 Emergency Vent Ladder (two-way, Locked)`,
  },
  {
    Place_Name: 'R4 - Hall of Resonant Ribs [Combat Encounter 1]',
    Order: 4,
    Description: `A huge vaulted corridor framed by rib-like supports, with slight gravity drift and low harmonic vibration. The acoustics are strange; footsteps echo before they happen. Heat pockets in the walls house the first scavenger predators. Keep the encounter quick and mobile.

Read-Aloud: "The corridor opens into a vast ribbed hall, each arch rising into shadow like the bones of something enormous. The air hums through the metal, and the floor seems to tug at your balance in tiny, nauseating pulses. As your lights sweep the walls, movement answers from warm cracks in the plating."

Enemies: 2-3 scavenger predators nesting in ship warmth pockets (light encounter).
Encounter Goal: Survive and clear the route, not wipeout for loot.
Twist: Stray blaster fire can destabilize ceiling plating and add environmental strain.

Exits:
- R3 Pressure Lock Vestibule (two-way)
- R5 Vapan's Forward Work Camp (two-way)
- R9 Sealed Reliquary Side Chamber (two-way, Locked)`,
  },
  {
    Place_Name: "R5 - Vapan's Forward Work Camp",
    Order: 5,
    Description: `A practical staging area built from scavenged crates, tarp walls, and portable lamps. Tool kits are laid out in disciplined rows, datapads display wiring sketches, and several labeled parts are prepped for the interceptor. This room is the safe pause and planning beat.

Read-Aloud: "This chamber feels almost civilized compared to the rest of the wreck. Lamps throw steady white light over tarps, stacked crates, and neatly arranged tool trays. Someone has made a working camp here, all clean lines and hard choices, with half-repaired components waiting for the next pair of hands."

Roleplay/Utility: Regroup, patch wounds, and use the IG-07 diagnostic station to tune him after reboot before deciding speed vs safety.

Exits:
- R4 Hall of Resonant Ribs (two-way)
- R6 Reactor Feed Crypt (two-way)`,
  },
  {
    Place_Name: 'R6 - Reactor Feed Crypt',
    Order: 6,
    Description: `Tall, claustrophobic engineering shaft lined with brittle conduits and dormant feed columns. Red warning glyphs pulse dimly across cracked housings. Power can be rerouted here, but every error has consequences in heat, strain, and unstable feedback.

Read-Aloud: "You enter a vertical chamber crowded with conduit towers and severed feed lines that disappear into darkness above and below. Faint red symbols crawl over damaged casings like embers under ash. The place smells of burned insulation and old heat, and every cable looks one touch away from arcing."

Challenge: Route stable power to gantry without triggering feedback.

Exits:
- R5 Vapan's Forward Work Camp (two-way)
- R7 Interceptor Gantry Vault (two-way)
- R10 Emergency Vent Ladder (one-way IN — drop only, no climb back)`,
  },
  {
    Place_Name: 'R7 - Interceptor Gantry Vault',
    Order: 7,
    Description: `A deep hangar shaft with the interceptor suspended in a magnetic cradle. Service arms, clamp housings, and temporary repair scaffolds surround the craft. This room should feel like payoff: the objective is real, close, and still dangerous to activate.

Read-Aloud: "The vault falls away beneath your feet, and there it is: a knife-shaped interceptor hanging in a web of clamps and field emitters. Pale armor catches the light in cold bands while exposed internals glow faintly through opened panels. It looks ready to fly and ready to kill, depending on who finishes the repairs first."

Objective: Final prep and clamp release sequence before override room.

Exits:
- R6 Reactor Feed Crypt (two-way)
- R8 Ghost Bridge Override (two-way)`,
  },
  {
    Place_Name: 'R8 - Ghost Bridge Override [Boss]',
    Order: 8,
    Description: `Command chamber built like a ritual dais: layered control rings, fractured holo-projectors, and a central override spine. When the override sequence starts, the Sith security warden construct reactivates. This is the final pressure room: boss plus objective completion.

Read-Aloud: "The bridge is less a cockpit than a shrine, all stepped platforms and dead control halos circling a central spine of black metal. Red light pulses through cracks in the deck like a heartbeat. As you begin the override, a heavy shape unfolds from a recess near the dais, and old war protocols wake with it."

Boss: Sith security warden construct (single elite enemy) reactivates when override begins.
Boss Behavior: Slow, high soak, punishes clustered positions, vulnerable during recharge windows.
Win Condition: Defeat or disable boss long enough to complete launch corridor override.

Exits:
- R7 Interceptor Gantry Vault (two-way)
- R3 Pressure Lock Vestibule (one-way OUT — emergency return corridor)`,
  },
  {
    Place_Name: 'R9 - Sealed Reliquary Side Chamber [Optional]',
    Order: 9,
    Description: `A compact vault space with relic plinths, broken cases, and sealed drawers. Most valuables are long gone, but one or two useful pieces remain if the players take time to search. Good for optional lore drops or a technical bonus before the boss.

Read-Aloud: "Beyond the sealed door is a smaller chamber lined with narrow plinths and cracked display housings. Dust lies thick across everything, broken only by a few drag marks and the shine of one intact case. The room feels untouched and watched at the same time, like it is waiting to see what you think is worth taking."

Reward ideas: rare part, old nav fragment, temporary stealth modifier for interceptor.

Exits:
- R4 Hall of Resonant Ribs (two-way, Locked)`,
  },
  {
    Place_Name: 'R10 - Emergency Vent Ladder [Optional Shortcut]',
    Order: 10,
    Description: `A maintenance shaft with ladder rungs, narrow crawl sections, and a final one-way drop to lower engineering. Loud, cramped, and stressful, but effective for players who want speed. Trade safety for momentum.

Read-Aloud: "A service hatch opens into a thin vertical shaft barely wide enough for your shoulders. Metal rungs vanish into dark, and every movement sends hollow clangs through the ship. Far below, a loose grate hangs open over a drop that leads deeper, faster, and with no easy way back."

Tradeoff: Faster route, higher risk of strain and equipment damage.

Exits:
- R3 Pressure Lock Vestibule (two-way, Locked)
- R6 Reactor Feed Crypt (one-way OUT — drop only, no climb back)`,
  },
];

async function insertRooms() {
  console.log(`Inserting ${rooms.length} rooms into SW_campaign_notes...`);

  for (const room of rooms) {
    const { data, error } = await supabase
      .from('SW_campaign_notes')
      .insert({
        Place_Name: room.Place_Name,
        Order: room.Order,
        Part_of_Place: PARENT_ID,
        CampaignID: CAMPAIGN_ID,
        Description: room.Description,
      })
      .select('id, Place_Name')
      .single();

    if (error) {
      console.error(`ERROR inserting "${room.Place_Name}":`, error.message);
    } else {
      console.log(`  ✓ id=${data.id}  ${data.Place_Name}`);
    }
  }

  console.log('\nDone.');
}

insertRooms();
