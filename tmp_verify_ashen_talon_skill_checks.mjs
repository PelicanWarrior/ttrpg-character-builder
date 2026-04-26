import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oyqfyjfkqzvatdddngbp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWZ5amZrcXp2YXRkZGRuZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ0MTcsImV4cCI6MjA3MjcyMDQxN30.1HsQNoFT7VHu1-rFAEOhDRlXYq3SyxhnHcP2whWIVhU'
);

const NOTE_ID = 109;

const { data, error } = await supabase
  .from('SW_note_skill_checks')
  .select('check_name, outcome')
  .eq('note_id', NOTE_ID)
  .order('check_name', { ascending: true })
  .order('order_index', { ascending: true });

if (error) {
  console.error(error.message);
  process.exit(1);
}

const grouped = new Map();
for (const row of data) {
  if (!grouped.has(row.check_name)) grouped.set(row.check_name, 0);
  grouped.set(row.check_name, grouped.get(row.check_name) + 1);
}

console.log('Total rows:', data.length);
console.log('Checks:', grouped.size);
for (const [name, count] of grouped.entries()) {
  console.log(`- ${name}: ${count}`);
}
