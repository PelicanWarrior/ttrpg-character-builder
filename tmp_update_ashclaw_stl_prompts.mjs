import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oyqfyjfkqzvatdddngbp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWZ5amZrcXp2YXRkZGRuZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ0MTcsImV4cCI6MjA3MjcyMDQxN30.1HsQNoFT7VHu1-rFAEOhDRlXYq3SyxhnHcP2whWIVhU'
);

const updates = [
  {
    id: 61,
    name: 'Malachor Ashclaw Broodling',
    description: `A fast, low-profile nest hunter that moves through vent gaps and broken plating. Use 2-3 in R4 as a short pressure fight for a 2-player party.

Tactics:
- Opens by splitting the PCs and forcing movement.
- Prefers hit-and-fade attacks from cover and heat vents.
- Retreats if the queen is dead or if the nest route is blocked.

3D AI Studio STL Prompt:
Create a single tabletop miniature of a Malachor Ashclaw Broodling, six-limbed volcanic carrion predator, low stalking pose on all limbs, lean body, segmented obsidian-like carapace, hooked foreclaws, short barbed tail, narrow predatory head, clean silhouette, mouth slightly open, no base, no environment, no text, no logo, no effects, no transparency, no floating parts, no thin dangling elements, manifold watertight geometry, physically connected limbs, print-friendly details for 32mm scale resin miniature, neutral gray clay render.`
  },
  {
    id: 62,
    name: 'Malachor Ashclaw Queen',
    description: `Brood-mother apex variant of the Malachor Ashclaw species. Final encounter in R8. Tuned to challenge two PCs without becoming a grind.

Tactics:
- Starts aggressive, then uses recovery windows after heavy actions.
- Pressures both PCs with space denial rather than burst damage.
- If reduced below half wounds, becomes defensive and protects vent line.

3D AI Studio STL Prompt:
Create a single tabletop miniature of a Malachor Ashclaw Queen, massive six-limbed apex brood-mother, dominant crouched-forward pose, heavy layered carapace armor, broad forelimbs, crest-like head plates, thick sweeping tail, scarred shell texture, aggressive but balanced stance, clean silhouette, no base, no environment, no text, no logo, no effects, no transparency, no floating parts, no thin spikes that would snap, manifold watertight geometry, all body parts physically connected, print-friendly forms for 40-50mm scale resin boss miniature, neutral gray clay render.`
  }
];

for (const item of updates) {
  const { error } = await supabase
    .from('SW_campaign_NPC')
    .update({ Description: item.description })
    .eq('id', item.id)
    .eq('Name', item.name)
    .eq('CampaignID', 2);

  if (error) {
    console.error(`Failed to update ${item.name}: ${error.message}`);
    process.exit(1);
  }

  console.log(`Updated ${item.name} (id=${item.id})`);
}

console.log('Done.');
