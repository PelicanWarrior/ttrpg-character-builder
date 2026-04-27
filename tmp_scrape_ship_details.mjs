/**
 * Fetches each ship's individual wiki page and updates the SW_ships table
 * with: manufacturer, hyperdrive_primary, hyperdrive_backup, navicomputer,
 * sensor_range, ship_complement, encumbrance_capacity, passenger_capacity,
 * consumables, customization_hard_points, weapons
 *
 * Usage: node tmp_scrape_ship_details.mjs
 * Optional: node tmp_scrape_ship_details.mjs --dry-run   (parse only, don't update DB)
 */

import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const CONCURRENCY = 3;         // simultaneous fetches
const DELAY_MS = 800;          // ms between batch requests
const MAX_RETRIES = 2;

const supabase = createClient(
  'https://oyqfyjfkqzvatdddngbp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWZ5amZrcXp2YXRkZGRuZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ0MTcsImV4cCI6MjA3MjcyMDQxN30.1HsQNoFT7VHu1-rFAEOhDRlXYq3SyxhnHcP2whWIVhU'
);

// ──────────────────────────────────────────────────────────────────────────────
// URL helpers
// ──────────────────────────────────────────────────────────────────────────────

// Use the MediaWiki API to get raw wikitext — not blocked by Cloudflare
function nameToApiUrl(name) {
  // MediaWiki page titles use spaces (not underscores) in the API, but both work.
  // We'll use the title directly; the API handles encoding.
  const title = encodeURIComponent(name.replace(/ /g, '_'));
  return `https://star-wars-rpg-ffg.fandom.com/api.php?action=query&titles=${title}&prop=revisions&rvprop=content&rvslots=main&format=json&origin=*`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Wikitext cleaner — strips [[links]], {{templates}}, '''bold''', ''italic''
// ──────────────────────────────────────────────────────────────────────────────

function cleanWikitext(wt) {
  return wt
    .replace(/\[\[(?:[^|\]]+\|)?([^\]]+)\]\]/g, '$1')  // [[link|text]] → text
    .replace(/\[https?:[^\s\]]+\s*([^\]]+)\]/g, '$1')  // [url text] → text
    .replace(/\[https?:[^\s\]]+\]/g, '')                // [url] → empty
    .replace(/{{[^}]*}}/gs, '')                          // {{templates}}
    .replace(/'''''([^']+)'''''/g, '$1')                 // bold+italic
    .replace(/'''([^']+)'''/g, '$1')                     // bold
    .replace(/''([^']+)''/g, '$1')                       // italic
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ──────────────────────────────────────────────────────────────────────────────
// Parser
// ──────────────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────────────────
// Wikitext parser — extracts the compact stat block
// ──────────────────────────────────────────────────────────────────────────────

function parseWikiField(wikitext, label) {
  // Escaped label for regex
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Next known fields — anything up to the next '|' key or end of template
  const stopGroup = 'manufacturer|hyperdrive|navicomputer|sensor_range|ship_complement|complement|encumbrance|passenger|consumables|customization|hard_points|weapons|hull_type|class|silhouette|speed|handling|def|armor|hull_trauma|system_strain|price|rarity|source|image';
  const pattern = new RegExp(
    `\\|\\s*${escaped}\\s*=\\s*(.*?)(?=\\|\\s*(?:${stopGroup})|\\}\\})`,
    'is'
  );
  const m = wikitext.match(pattern);
  if (!m) return null;
  return cleanWikitext(m[1]).replace(/^[\s*:]+/, '').replace(/[\s.]+$/, '').trim() || null;
}

function parseShipData(wikitext) {
  // The ship pages may use infobox templates or prose stat blocks.
  // Try template parsing first, then fall back to prose.

  const result = {};

  // ── Template-based parsing ({{Ship Infobox|...}}) ──────────────────────────
  // Look for common template patterns
  const fields = [
    ['manufacturer', /\|\s*manufacturer\s*=\s*([^|\n}]+)/i],
    ['hyperdrive',   /\|\s*hyperdrive\s*=\s*([^|\n}]+)/i],
    ['navicomputer', /\|\s*navicomputer\s*=\s*([^|\n}]+)/i],
    ['sensor_range', /\|\s*sensor_?range\s*=\s*([^|\n}]+)/i],
    ['ship_complement',    /\|\s*(?:ship_?)?complement\s*=\s*([^|\n}]+)/i],
    ['encumbrance_capacity', /\|\s*encumbrance\s*=\s*([^|\n}]+)/i],
    ['passenger_capacity',   /\|\s*passenger\s*=\s*([^|\n}]+)/i],
    ['consumables',          /\|\s*consumables\s*=\s*([^|\n}]+)/i],
    ['customization_hard_points', /\|\s*(?:customization_?hard_?points?|chp)\s*=\s*([^|\n}]+)/i],
    ['weapons',              /\|\s*weapons\s*=\s*([^|\n}]*(?:\n(?!\s*\|)[^|\n}]*)*)/i],
  ];

  let foundTemplate = false;
  for (const [key, pattern] of fields) {
    const m = wikitext.match(pattern);
    if (m) {
      result[key] = cleanWikitext(m[1]).replace(/[\s.]+$/, '').trim() || null;
      foundTemplate = true;
    }
  }

  // ── Prose stat block parsing ───────────────────────────────────────────────
  // Format: "Manufacturer: Foo.Hyperdrive: Primary: Class 2, Backup: Class 12.Navicomputer: Yes."
  if (!foundTemplate) {
    const blockMatch = wikitext.match(/Manufacturer:\s*(.*?)(?=\n\n|==|$)/is);
    if (!blockMatch) return null;
    const block = blockMatch[0];

    const proseField = (label) => {
      const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const nextLabels = "Manufacturer|Hyperdrive|Navicomputer|Sensor Range|Ship's Complement|Encumbrance Capacity|Passenger Capacity|Consumables|Customization Hard Points|Weapons|Price";
      const re = new RegExp(`${esc}:\\s*(.*?)(?=(?:${nextLabels}):|$)`, 'is');
      const m = block.match(re);
      return m ? cleanWikitext(m[1]).replace(/[.\s]+$/, '').trim() || null : null;
    };

    result.manufacturer    = proseField('Manufacturer');
    result.navicomputer    = proseField('Navicomputer');
    result.sensor_range    = proseField('Sensor Range');
    result.ship_complement = proseField("Ship's Complement");
    result.consumables     = proseField('Consumables');

    const hdRaw = proseField('Hyperdrive');
    if (hdRaw) result.hyperdrive = hdRaw;

    const encRaw = proseField('Encumbrance Capacity');
    if (encRaw) result.encumbrance_capacity = encRaw;

    const pasRaw = proseField('Passenger Capacity');
    if (pasRaw) result.passenger_capacity = pasRaw;

    const hpRaw = proseField('Customization Hard Points');
    if (hpRaw) result.customization_hard_points = hpRaw;

    // Weapons prose
    const wpMatch = block.match(/Weapons:\s*([\s\S]+?)(?=\n\n|==|$)/i);
    if (wpMatch) result.weapons = cleanWikitext(wpMatch[1]).trim();
  }

  // ── Post-process hyperdrive ────────────────────────────────────────────────
  if (result.hyperdrive) {
    const hd = String(result.hyperdrive);
    if (/^none$/i.test(hd)) {
      result.hyperdrive_primary = null;
      result.hyperdrive_backup  = null;
    } else {
      const priM = hd.match(/(?:Primary:?\s*)?Class\s*([\d\/]+)/i);
      const bkpM = hd.match(/Backup:?\s*Class\s*([\d\/]+)/i);
      result.hyperdrive_primary = priM ? priM[1] : hd;
      result.hyperdrive_backup  = bkpM ? bkpM[1] : null;
    }
    delete result.hyperdrive;
  }

  // ── Normalise navicomputer ─────────────────────────────────────────────────
  if (result.navicomputer && /^none$/i.test(result.navicomputer)) {
    result.navicomputer = null;
  }

  // ── Numeric fields ─────────────────────────────────────────────────────────
  if (result.encumbrance_capacity !== undefined && result.encumbrance_capacity !== null) {
    const n = parseInt(String(result.encumbrance_capacity).replace(/,/g, ''), 10);
    result.encumbrance_capacity = isNaN(n) ? null : n;
  }

  if (result.passenger_capacity !== undefined && result.passenger_capacity !== null) {
    const raw = String(result.passenger_capacity).trim();
    if (/^none$/i.test(raw)) {
      result.passenger_capacity = 0;
    } else {
      const n = parseInt(raw.replace(/,/g, ''), 10);
      result.passenger_capacity = isNaN(n) ? null : n;
    }
  }

  if (result.customization_hard_points !== undefined && result.customization_hard_points !== null) {
    const n = parseInt(String(result.customization_hard_points), 10);
    result.customization_hard_points = isNaN(n) ? null : n;
  }

  return result;
}

// ──────────────────────────────────────────────────────────────────────────────
// Fetch with retry
// ──────────────────────────────────────────────────────────────────────────────

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TTRPG-Bot/1.0)',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      // MediaWiki API response structure
      const pages = json?.query?.pages;
      if (!pages) return { status: 0, text: null, error: 'No pages in API response' };
      const page = Object.values(pages)[0];
      if (page.missing !== undefined) return { status: 404, text: null };

      // Get wikitext from slots.main or revisions[0]
      const wikitext =
        page?.revisions?.[0]?.slots?.main?.['*'] ||
        page?.revisions?.[0]?.['*'] ||
        null;

      if (!wikitext) return { status: 0, text: null, error: 'No wikitext in response' };
      return { status: 200, text: wikitext };
    } catch (err) {
      if (attempt === retries) return { status: 0, text: null, error: err.message };
      await sleep(1000 * (attempt + 1));
    }
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ──────────────────────────────────────────────────────────────────────────────
// Process a single ship
// ──────────────────────────────────────────────────────────────────────────────

async function processShip(ship) {
  const url = nameToApiUrl(ship.name);
  const { status, text, error } = await fetchWithRetry(url);

  if (status === 404) {
    return { ship, result: 'not_found', url };
  }
  if (status !== 200) {
    return { ship, result: 'error', url, error };
  }

  const data = parseShipData(text);

  if (!data) {
    return { ship, result: 'parse_failed', url };
  }

  // Only keep fields that have non-null values so we don't overwrite existing data with nulls
  const updates = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== null && v !== undefined) updates[k] = v;
  }

  if (Object.keys(updates).length === 0) {
    return { ship, result: 'no_data', url };
  }

  if (!DRY_RUN) {
    const { error: dbErr } = await supabase
      .from('SW_ships')
      .update(updates)
      .eq('id', ship.id);
    if (dbErr) return { ship, result: 'db_error', url, error: dbErr.message };
  }

  return { ship, result: 'ok', url, updates };
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────

console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Starting ship detail scraper...`);

// 1. Fetch all ships from DB
const { data: ships, error: fetchErr } = await supabase
  .from('SW_ships')
  .select('id, name')
  .order('name');

if (fetchErr) {
  console.error('Failed to fetch ships:', fetchErr.message);
  process.exit(1);
}

console.log(`Found ${ships.length} ships in DB. Fetching wiki pages...\n`);

const stats = { ok: 0, not_found: 0, parse_failed: 0, error: 0, db_error: 0, no_data: 0 };
const failures = [];

// 2. Process in batches of CONCURRENCY
for (let i = 0; i < ships.length; i += CONCURRENCY) {
  const batch = ships.slice(i, i + CONCURRENCY);
  const results = await Promise.all(batch.map(processShip));

  for (const r of results) {
    stats[r.result] = (stats[r.result] || 0) + 1;
    const icon = r.result === 'ok' ? '✓' : r.result === 'not_found' ? '?' : '✗';
    const detail = r.result === 'ok'
      ? `(${Object.keys(r.updates).join(', ')})`
      : r.error ? `[${r.error}]` : '';
    console.log(`[${i + results.indexOf(r) + 1}/${ships.length}] ${icon} ${r.ship.name} ${detail}`);

    if (r.result !== 'ok' && r.result !== 'no_data') {
      failures.push({ name: r.ship.name, result: r.result, url: r.url, error: r.error });
    }
  }

  // Polite delay between batches
  if (i + CONCURRENCY < ships.length) {
    await sleep(DELAY_MS);
  }
}

console.log('\n─────────────────────────────────────────');
console.log('SUMMARY');
console.log(`  Updated:      ${stats.ok}`);
console.log(`  No data:      ${stats.no_data}`);
console.log(`  Not found:    ${stats.not_found}`);
console.log(`  Parse failed: ${stats.parse_failed}`);
console.log(`  Fetch error:  ${stats.error}`);
console.log(`  DB error:     ${stats.db_error}`);

if (failures.length > 0) {
  console.log('\nFailed ships (may need manual attention):');
  for (const f of failures) {
    console.log(`  [${f.result}] ${f.name}`);
    console.log(`    URL: ${f.url}`);
    if (f.error) console.log(`    Error: ${f.error}`);
  }
}

if (DRY_RUN) {
  console.log('\n[DRY RUN] No database changes were made.');
}
