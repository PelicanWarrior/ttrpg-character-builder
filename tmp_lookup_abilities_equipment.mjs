import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://oyqfyjfkqzvatdddngbp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWZ5amZrcXp2YXRkZGRuZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ0MTcsImV4cCI6MjA3MjcyMDQxN30.1HsQNoFT7VHu1-rFAEOhDRlXYq3SyxhnHcP2whWIVhU');

const [abilitiesRes, equipmentRes] = await Promise.all([
  supabase.from('SW_abilities').select('ability').order('ability', { ascending: true }),
  supabase.from('SW_equipment').select('name').order('name', { ascending: true }),
]);

if (abilitiesRes.error) throw abilitiesRes.error;
if (equipmentRes.error) throw equipmentRes.error;

console.log(JSON.stringify({
  abilities: abilitiesRes.data.slice(0, 200),
  equipment: equipmentRes.data.slice(0, 200),
}, null, 2));
