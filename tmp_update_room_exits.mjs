import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oyqfyjfkqzvatdddngbp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWZ5amZrcXp2YXRkZGRuZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ0MTcsImV4cCI6MjA3MjcyMDQxN30.1HsQNoFT7VHu1-rFAEOhDRlXYq3SyxhnHcP2whWIVhU'
);

const exits = [
  {
    id: 97,
    exits: 'Exits: East → R2 (deeper into the wreck).'
  },
  {
    id: 98,
    exits: 'Exits: West → R1 (back to surface); East → R3 (pressure lock).'
  },
  {
    id: 99,
    exits: 'Exits: West → R2 (access throat); East → R4 (resonant hall); South → R10 [Locked] (vent shaft); West (one-way arrival only from R8 emergency return corridor).'
  },
  {
    id: 100,
    exits: 'Exits: West → R3 (vestibule); East → R5 (work camp); North → R9 [Locked] (reliquary side chamber).'
  },
  {
    id: 101,
    exits: 'Exits: West → R4 (resonant hall); East → R6 (reactor crypt).'
  },
  {
    id: 102,
    exits: 'Exits: West → R5 (work camp); East → R7 (gantry vault); North (one-way arrival from R10 drop — no return via shaft).'
  },
  {
    id: 103,
    exits: 'Exits: West → R6 (reactor crypt); East → R8 (command override).'
  },
  {
    id: 104,
    exits: 'Exits: West → R7 (gantry vault); West emergency return corridor (one-way → R3 only — bypasses R4-R7).'
  },
  {
    id: 105,
    exits: 'Exits: South → R4 [Locked] (resonant hall — only exit).'
  },
  {
    id: 106,
    exits: 'Exits: North → R3 [Locked] (vestibule — entry from R3 only, no climb back); Down (one-way drop) → R6 (reactor crypt).'
  }
];

// Fetch current descriptions first
const { data: rows, error: fetchErr } = await supabase
  .from('SW_campaign_notes')
  .select('id, Description')
  .in('id', exits.map(e => e.id));

if (fetchErr) { console.error('Fetch error:', fetchErr); process.exit(1); }

for (const row of rows) {
  const entry = exits.find(e => e.id === row.id);
  if (!entry) continue;

  // Strip any previously appended exits line to avoid duplicates
  const base = (row.Description || '').replace(/\n\nExits:.*$/s, '').trimEnd();
  const newDesc = base + '\n\n' + entry.exits;

  const { error } = await supabase
    .from('SW_campaign_notes')
    .update({ Description: newDesc })
    .eq('id', row.id);

  if (error) {
    console.error(`Failed id=${row.id}:`, error.message);
  } else {
    console.log(`Updated id=${row.id}`);
  }
}

console.log('Done.');
