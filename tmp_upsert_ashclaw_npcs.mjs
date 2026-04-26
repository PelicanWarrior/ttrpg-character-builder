import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oyqfyjfkqzvatdddngbp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWZ5amZrcXp2YXRkZGRuZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ0MTcsImV4cCI6MjA3MjcyMDQxN30.1HsQNoFT7VHu1-rFAEOhDRlXYq3SyxhnHcP2whWIVhU'
);

const CAMPAIGN_ID = 2;

const npcDefinitions = [
  {
    Name: 'Malachor Ashclaw Broodling',
    Race: null,
    Part_of_Place: 100,
    Description: `A fast, low-profile nest hunter that moves through vent gaps and broken plating. Use 2-3 in R4 as a short pressure fight for a 2-player party.

Tactics:
- Opens by splitting the PCs and forcing movement.
- Prefers hit-and-fade attacks from cover and heat vents.
- Retreats if the queen is dead or if the nest route is blocked.

Image Prompt:
Full-body 3D creature model of a Malachor ashclaw broodling, six-limbed volcanic carrion predator, lean and sinewy body, obsidian-black chitin plates with ash-gray fissure lines, low stalking posture, hooked foreclaws and barbed tail, glowing ember-like eyes, scorched mineral dust across armor, cinematic realism, high detail game-ready sculpt, PBR textures, neutral plain background, no text, no watermark`,
    Brawn: 2,
    Agility: 2,
    Intellect: 1,
    Cunning: 1,
    Willpower: 1,
    Presence: 1,
    Soak: 2,
    Wound: 6,
    Strain: 0,
    Skills: 'Brawl 1,Stealth 1,Perception 1,Survival 1',
    Abilities: 'Pack Hunter (add 1 boost die when an ally is engaged with target),Vent Skitter (ignore difficult terrain from debris once per round),Fragile Carapace (take +1 damage from Blast or fire effects)',
    Equipment: 'Natural claws and bite',
  },
  {
    Name: 'Malachor Ashclaw Queen',
    Race: null,
    Part_of_Place: 104,
    Description: `Brood-mother apex variant of the Malachor Ashclaw species. Final encounter in R8. Tuned to challenge two PCs without becoming a grind.

Tactics:
- Starts aggressive, then uses recovery windows after heavy actions.
- Pressures both PCs with space denial rather than burst damage.
- If reduced below half wounds, becomes defensive and protects vent line.

Image Prompt:
Full-body 3D creature model of a Malachor ashclaw queen, massive armored six-limbed apex brood-mother, layered obsidian carapace with volcanic glass spines, heavy forelimbs, sweeping tail ridges, cracked ember glow beneath plate seams, scarred predatory head crest, dominant nest-guardian stance, cinematic realism, high detail game-ready sculpt, PBR textures, neutral plain background, dramatic side lighting, no text, no watermark`,
    Brawn: 3,
    Agility: 2,
    Intellect: 1,
    Cunning: 2,
    Willpower: 2,
    Presence: 2,
    Soak: 4,
    Wound: 14,
    Strain: 0,
    Skills: 'Brawl 2,Resilience 2,Perception 1,Survival 1',
    Abilities: 'Brood Command (once per round, one broodling gains 1 maneuver),Sweeping Tail (engaged targets each suffer 3 damage, soak applies),Exposed Recovery (after Roar or Lunge, attacks against queen gain 1 boost die until end of next turn)',
    Equipment: 'Natural jaws, talons, tail',
  },
];

async function upsertNpc(npc) {
  const { data: existing, error: lookupError } = await supabase
    .from('SW_campaign_NPC')
    .select('id, Name')
    .eq('CampaignID', CAMPAIGN_ID)
    .eq('Name', npc.Name)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Lookup failed for ${npc.Name}: ${lookupError.message}`);
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from('SW_campaign_NPC')
      .update({ ...npc, CampaignID: CAMPAIGN_ID })
      .eq('id', existing.id);

    if (updateError) {
      throw new Error(`Update failed for ${npc.Name}: ${updateError.message}`);
    }

    console.log(`Updated NPC ${existing.id}: ${npc.Name}`);
    return;
  }

  const { data: inserted, error: insertError } = await supabase
    .from('SW_campaign_NPC')
    .insert([{ ...npc, CampaignID: CAMPAIGN_ID }])
    .select('id, Name')
    .single();

  if (insertError) {
    throw new Error(`Insert failed for ${npc.Name}: ${insertError.message}`);
  }

  console.log(`Inserted NPC ${inserted.id}: ${inserted.Name}`);
}

async function main() {
  for (const npc of npcDefinitions) {
    await upsertNpc(npc);
  }

  const { data, error } = await supabase
    .from('SW_campaign_NPC')
    .select('id, Name, Part_of_Place, Brawn, Agility, Intellect, Cunning, Willpower, Presence, Soak, Wound, Strain')
    .eq('CampaignID', CAMPAIGN_ID)
    .in('Name', npcDefinitions.map(n => n.Name))
    .order('id', { ascending: true });

  if (error) {
    throw new Error(`Verification fetch failed: ${error.message}`);
  }

  console.log('Verification:');
  for (const row of data) {
    console.log(JSON.stringify(row));
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
