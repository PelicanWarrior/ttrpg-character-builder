import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oyqfyjfkqzvatdddngbp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWZ5amZrcXp2YXRkZGRuZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ0MTcsImV4cCI6MjA3MjcyMDQxN30.1HsQNoFT7VHu1-rFAEOhDRlXYq3SyxhnHcP2whWIVhU'
);

const NOTE_ID = 109;

const checks = [
  {
    check_name: 'Repressurize Fuel Lines',
    skill_name: 'Mechanics',
    difficulty: 2,
    outcomes: {
      Success: 'Fuel lines hold pressure; thrust curve stabilizes.',
      Failure: 'Pressure leak persists; speed hard-capped at 2.',
      Advantage: 'Quick purge; remove 1 System Strain.',
      Disadvantage: 'Ventback flash; active mechanic suffers 1 Strain.',
      Triumph: 'Permanent reroute; gain +1 handling for next ship encounter.',
      Despair: 'Ignition flare; ship suffers 2 Hull Trauma.'
    }
  },
  {
    check_name: 'Restore Primary Power Coupling to Thrusters',
    skill_name: 'Mechanics',
    difficulty: 3,
    outcomes: {
      Success: 'Thrusters pull full load; no high-speed strain tax.',
      Failure: 'Coupling unstable; speed 4+ inflicts 1 System Strain per round.',
      Advantage: 'Power efficiency up; recover 1 additional System Strain.',
      Disadvantage: 'Brownout during test; one nearby system goes offline until next check.',
      Triumph: 'Overclock tuned; first acceleration to max speed is free of strain.',
      Despair: 'Arc fault; suffer 3 System Strain immediately.'
    }
  },
  {
    check_name: 'Clear Launch Corridor Magnetic Clamps (R8 Override)',
    skill_name: 'Computers',
    difficulty: 2,
    outcomes: {
      Success: 'Clamps release cleanly; launch lane clears.',
      Failure: 'One clamp sticks; requires a second control action in R8.',
      Advantage: 'Timing window opens; first Piloting check after launch gets 1 Boost.',
      Disadvantage: 'Violent release shock; all aboard suffer 1 Strain.',
      Triumph: 'Perfect release geometry; gain +1 defense (fore) for first combat round.',
      Despair: 'Clamp snaps and ricochets; ship suffers 2 Hull Trauma before launch.'
    }
  },
  {
    check_name: 'Calibrate Navicomputer',
    skill_name: 'Computers',
    difficulty: 2,
    outcomes: {
      Success: 'Nav solution restored; encrypted routes readable.',
      Failure: 'Route index scrambled; Sith routes stay locked.',
      Advantage: 'Fast alignment; reduce next Astrogation difficulty by 1.',
      Disadvantage: 'Drift error; add 1 Setback to next Astrogation check.',
      Triumph: 'Hidden packet recovered; unlock one bonus waypoint or lore key.',
      Despair: 'Nav corruption; next jump is forced to emergency-safe vector.'
    }
  },
  {
    check_name: 'Restore Cockpit Life Support',
    skill_name: 'Mechanics',
    difficulty: 1,
    outcomes: {
      Success: 'Atmosphere and scrubbers stable.',
      Failure: 'Life support partial; crew suffer 1 Strain per flight hour.',
      Advantage: 'Air mix optimized; first fatigue-related check gains 1 Boost.',
      Disadvantage: 'Irritant trace; pilot suffers 1 Strain at launch.',
      Triumph: 'Redundant loop recovered; ignore first life-support-related failure later.',
      Despair: 'Toxic spike; each aboard suffers 1 Wound (soak does not apply).'
    }
  },
  {
    check_name: 'Repair Hull Stress Fractures',
    skill_name: 'Mechanics',
    difficulty: 2,
    outcomes: {
      Success: 'Plates sealed; restore 3 Hull Trauma.',
      Failure: 'Cracks remain; no Hull Trauma restored.',
      Advantage: 'Bracing improves; +1 defense (aft) until next major repair stop.',
      Disadvantage: 'Sealant waste; consume extra parts, future hull repair +1 difficulty once.',
      Triumph: 'Structural harmonics corrected; restore +2 extra Hull Trauma.',
      Despair: 'New microfracture chain; suffer 2 Hull Trauma.'
    }
  },
  {
    check_name: 'Recalibrate Twin Laser Targeting Systems',
    skill_name: 'Mechanics',
    difficulty: 2,
    outcomes: {
      Success: 'Fixed forward lasers online.',
      Failure: 'Targeting desync; lasers remain offline.',
      Advantage: 'Tight grouping; first laser attack gains Accurate +1.',
      Disadvantage: 'Feed jitter; first laser shot this session adds 1 Setback.',
      Triumph: 'Fire-control tune; reduce laser Critical rating by 1 for one encounter.',
      Despair: 'Emitter burnout; laser system disabled until parts are replaced.'
    }
  },
  {
    check_name: 'Restore Backup Hyperdrive',
    skill_name: 'Mechanics',
    difficulty: 3,
    outcomes: {
      Success: 'Backup class 12 operational.',
      Failure: 'Backup remains dead.',
      Advantage: 'Clean spool; next hyperdrive spool time reduced noticeably.',
      Disadvantage: 'Heat bleed; suffer 1 System Strain after each jump until serviced.',
      Triumph: 'Safer fallback; first emergency jump this arc upgrades pilot check once.',
      Despair: 'Containment fault; primary hyperdrive gains 1 Setback on next jump check.'
    }
  },
  {
    check_name: 'Flush Coolant System',
    skill_name: 'Mechanics',
    difficulty: 1,
    outcomes: {
      Success: 'Thermal load normalized.',
      Failure: 'Hot running persists; speed 5 still auto-adds 1 System Strain in combat rounds.',
      Advantage: 'Cool reserve; ignore first heat-related strain trigger.',
      Disadvantage: 'Sludge spread; one random repair this session gains 1 Setback.',
      Triumph: 'Exceptional thermal efficiency; remove 2 System Strain now.',
      Despair: 'Coolant rupture; each active turret is offline until patched.'
    }
  },
  {
    check_name: 'Repair Sensor Array',
    skill_name: 'Computers',
    difficulty: 2,
    outcomes: {
      Success: 'Sensor range returns to Medium.',
      Failure: 'Sensors remain Short range.',
      Advantage: 'Clean signal; first detection check gains 1 Boost.',
      Disadvantage: 'Ghost returns; first detection check gains 1 Setback.',
      Triumph: 'Deep scan profile restored; detect cloaked/hidden contact at one band farther once.',
      Despair: 'Sensor blackout pulse; no active scans possible for one scene.'
    }
  },
  {
    check_name: 'Restore Resonance Dampeners',
    skill_name: 'Mechanics',
    difficulty: 3,
    outcomes: {
      Success: 'Dampeners active; Crimson Shadow Running unlocked.',
      Failure: 'Dampeners remain unstable; ability stays offline.',
      Advantage: 'Field smooth; crew ignore first dark-side-resonance strain event.',
      Disadvantage: 'Harmonic feedback; crew each suffer 1 Strain when engines ignite.',
      Triumph: 'Perfect null field; enemy detection attempts upgrade in your favor once.',
      Despair: 'Resonance inversion; ship broadcasts a trace signature for one scene.'
    }
  }
];

const { data: noteRows, error: noteErr } = await supabase
  .from('SW_campaign_notes')
  .select('id, CampaignID, Description')
  .eq('id', NOTE_ID)
  .single();

if (noteErr) {
  console.error('Failed to load note:', noteErr.message);
  process.exit(1);
}

const cleanedDescription = (noteRows.Description || '')
  .replace(/\n\n--- REPAIR CHECK OUTCOME RESULTS ---[\s\S]*$/m, '')
  .trimEnd();

const { error: descUpdateErr } = await supabase
  .from('SW_campaign_notes')
  .update({ Description: cleanedDescription })
  .eq('id', NOTE_ID);

if (descUpdateErr) {
  console.error('Failed to clean note description:', descUpdateErr.message);
  process.exit(1);
}

// Remove existing skill checks for this note, then insert fresh set.
const { error: deleteErr } = await supabase
  .from('SW_note_skill_checks')
  .delete()
  .eq('note_id', NOTE_ID);

if (deleteErr) {
  console.error('Failed to clear existing skill checks:', deleteErr.message);
  process.exit(1);
}

const rowsToInsert = [];
let orderIndex = 1;
for (const check of checks) {
  for (const outcome of ['Success', 'Failure', 'Advantage', 'Disadvantage', 'Triumph', 'Despair']) {
    rowsToInsert.push({
      note_id: NOTE_ID,
      CampaignID: noteRows.CampaignID,
      check_name: check.check_name,
      skill_name: check.skill_name,
      difficulty: check.difficulty,
      outcome,
      effect: check.outcomes[outcome],
      order_index: orderIndex++,
    });
  }
}

const { error: insertErr } = await supabase
  .from('SW_note_skill_checks')
  .insert(rowsToInsert);

if (insertErr) {
  console.error('Failed to insert skill checks:', insertErr.message);
  process.exit(1);
}

console.log(`Migrated ${rowsToInsert.length} skill-check rows to SW_note_skill_checks for note ${NOTE_ID}.`);
