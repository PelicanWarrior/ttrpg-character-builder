import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oyqfyjfkqzvatdddngbp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWZ5amZrcXp2YXRkZGRuZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ0MTcsImV4cCI6MjA3MjcyMDQxN30.1HsQNoFT7VHu1-rFAEOhDRlXYq3SyxhnHcP2whWIVhU'
);

const description = `GM Description:
The Ashen Testament is a Sith war vessel of late-Republic era construction, built low and predatory — all swept angles, black durasteel, and deliberate ritual geometry. It went down during the ancient battle that fractured Malachor V and has been entombed under volcanic glass and compacted ash ever since. The ship is roughly intact: structural collapse is localised to the upper access corridor and a few forward sections. The deeper interior is sealed by pressure failures and dormant systems rather than physical damage, which is why salvage has always been possible in theory and lethal in practice.

Warships of this class were built for both warfare and ceremony. The interior reflects that duality — corridor geometry is architectural, almost reverent, and certain chambers served double roles as command spaces and ritual sites. The ship still holds residual dark side resonance. It manifests as localised gravity drift, harmonic vibration in the metal framework, and a persistent sense of being observed. The ship is not haunted in any supernatural sense. It simply remembers.

The mission objective is a Sith interceptor suspended in the lower gantry vault. The ship's override systems need to be manually unlocked from the command dais at the far end of the vessel before the interceptor's launch corridor can be cleared. That means traversing the full length of the ship.

Key Facts for the GM:
- Hull material: black durasteel with inscribed geometric panelling (Sith architectural style)
- Age: late Republic era, pre-Empire
- Condition: structurally intact below R2; R1-R2 are collapsed but passable
- Atmosphere: partial — breathable in interior rooms after R3 repressurisation, thin and toxic near entry
- Gravity: functional but unstable in R4 and near the reactor section
- Dark side resonance: present throughout — use for mood, not mechanics, unless players engage with it
- Crew: none surviving; no organic remains (consumed by the resonance over centuries)

Read-Aloud (Approach to the Entrance):
"The slope rises into black glass and packed ash, and the storm does not let up. The mountain ahead is featureless at first — just rock and dark and the sound of wind scraping against nothing. But as you push closer, something shifts in the stone. A seam runs along the face of the rock where there should only be solid ground. It does not look like a door. It does not look like anything made. And then it opens."

Skill Check — Finding the Entrance:
Skill: Survival
Difficulty: 2 (purple dice)

Outcomes:
- Success: Vapan locates the entrance. The seam responds to his approach and opens.
- Failure (per failure): Vapan suffers 1 strain. He misjudges the terrain, walks into a dead face of rock, or loses the seam in a gust before finding it again.
- Advantage: Vapan reads the surface well. He gains a Boost die (blue) on all Survival checks made on the planet's surface for the rest of the session.
- Disadvantage: The wind and ash disorient him. He gains a Setback die (black) on all Survival checks made on the planet's surface for the rest of the session.`;

async function update() {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .update({ Description: description })
    .eq('id', 96)
    .select('id, Place_Name')
    .single();

  if (error) {
    console.error('ERROR:', error.message);
  } else {
    console.log(`✓ Updated id=${data.id} — ${data.Place_Name}`);
  }
}

update();
