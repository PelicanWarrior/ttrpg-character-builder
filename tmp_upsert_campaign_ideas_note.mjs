import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oyqfyjfkqzvatdddngbp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWZ5amZrcXp2YXRkZGRuZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ0MTcsImV4cCI6MjA3MjcyMDQxN30.1HsQNoFT7VHu1-rFAEOhDRlXYq3SyxhnHcP2whWIVhU'
);

const CAMPAIGN_ID = 2;
const NOTE_NAME = 'Campaign Ideas';

const description = `Campaign Arc: Darth Nihilus and the Holocron Trail

Core Premise:
The Ashen Testament is the personal vessel of Darth Nihilus. He crashed the ship on Malachor V intentionally, knowing he was going to die. Before death, he hid a Sith holocron inside IG-07's chest cavity as a long game trap for Force-sensitive users.

Hidden Plan:
Nihilus designed the holocron to lure Force-sensitive beings to Malachor V. Once activated, it begins feeding clues to ancient temple sites across the galaxy. Each temple grants a new Force-related technique, insight, or power, but slowly shifts the user toward hunger, obsession, and the dark side.

Activation Rule:
The holocron remains inert unless a Force-sensitive user is nearby. Nix or Rapa can trigger it when within short range of IG-07.

How the Trail Works:
- Temple 1: first clue + minor force ability
- Temple 2: deeper lore + stronger force technique
- Temple 3+: escalating power with escalating dark side influence
- Final Temple: Darth Nihilus's primary temple and true ritual seat

Final Temple Twist:
At the final temple, the holocron offers a choice that is really a trap:
- Accept possession: Nihilus attempts to take over the Force-sensitive host to return to power
- Refuse possession: user can still take power, but at severe cost and corruption risk

GM Intent:
Use the temple chain as a long-form progression path for Force-sensitive PCs. Reward curiosity with power, but make every step carry narrative and moral consequences.

Link to Current Story:
- IG-07 is unknowingly the courier container for Nihilus's holocron
- The Ashen Testament is the opening key site
- KHAR-VOSS (Archive-Forge node) can be used as the first major post-Malachor destination in the temple trail`; 

async function getNextOrder() {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .select('Order')
    .eq('CampaignID', CAMPAIGN_ID)
    .order('Order', { ascending: false })
    .limit(1);

  if (error) throw new Error(`Failed to fetch order: ${error.message}`);
  return (data?.[0]?.Order || 0) + 1;
}

async function main() {
  const { data: existing, error: lookupError } = await supabase
    .from('SW_campaign_notes')
    .select('id, Place_Name, Order')
    .eq('CampaignID', CAMPAIGN_ID)
    .eq('Place_Name', NOTE_NAME)
    .eq('Part_of_Place', 0)
    .maybeSingle();

  if (lookupError) throw new Error(`Lookup failed: ${lookupError.message}`);

  if (existing) {
    const { error: updateError } = await supabase
      .from('SW_campaign_notes')
      .update({ Description: description })
      .eq('id', existing.id);

    if (updateError) throw new Error(`Update failed: ${updateError.message}`);
    console.log(`Updated top-level note id=${existing.id}: ${NOTE_NAME}`);
    return;
  }

  const nextOrder = await getNextOrder();

  const { data: inserted, error: insertError } = await supabase
    .from('SW_campaign_notes')
    .insert({
      Place_Name: NOTE_NAME,
      Description: description,
      CampaignID: CAMPAIGN_ID,
      Part_of_Place: 0,
      Order: nextOrder,
    })
    .select('id, Place_Name, Order')
    .single();

  if (insertError) throw new Error(`Insert failed: ${insertError.message}`);
  console.log(`Inserted top-level note id=${inserted.id}: ${inserted.Place_Name} (Order ${inserted.Order})`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
