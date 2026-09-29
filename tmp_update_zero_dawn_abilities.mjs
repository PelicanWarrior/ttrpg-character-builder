import { supabase } from './src/supabaseClient.js';

const replacements = {
  107: 'Skilled Mechanic,Known Schematic,Heightened Senses',
  108: 'Skilled Mechanic,Command Presence,Master Leader',
  109: 'Command Presence,Natural Leader,Master Leader',
  110: 'Known Programming,Heightened Senses,Discredit',
  111: "Nobody's Fool 1,Discredit,Natural Leader",
  112: 'Skilled Mechanic,Master Driver,Known Schematic',
  113: 'Grit,Skilled Mechanic,Heightened Senses',
};

const results = [];
for (const [id, abilities] of Object.entries(replacements)) {
  const { data, error } = await supabase
    .from('SW_campaign_NPC')
    .update({ Abilities: abilities })
    .eq('id', Number(id))
    .select('id, Name, Skills, Abilities, Equipment, Part_of_Place');
  if (error) throw error;
  results.push(...data);
}

console.log(JSON.stringify({ updated: results }, null, 2));
