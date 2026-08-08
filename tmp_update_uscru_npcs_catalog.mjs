import { supabase } from './src/supabaseClient.js';

const updates = [
  {
    id: 133,
    Abilities: 'Black Market Contacts,Clever Solution',
    Equipment: 'Engineering Datapad,Heavy Work Clothes,Heavy Blaster Pistol',
  },
  {
    id: 134,
    Abilities: 'Black Market Contacts,Dead Drop Specialist,Counter-Surveillance Tradecraft',
    Equipment: 'Concealed Hold-Out Blaster,Encrypted Comlink,Heavy Clothes',
  },
];

for (const entry of updates) {
  const { error } = await supabase
    .from('SW_campaign_NPC')
    .update({
      Abilities: entry.Abilities,
      Equipment: entry.Equipment,
    })
    .eq('id', entry.id);

  if (error) throw error;
}

const { data, error } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Abilities, Equipment')
  .in('id', updates.map((entry) => entry.id));

if (error) throw error;
console.log(JSON.stringify(data, null, 2));
