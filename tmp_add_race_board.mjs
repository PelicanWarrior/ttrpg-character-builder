import { supabase } from './src/supabaseClient.js';

const campaignId = 2;

const description = `A bank of six holo-screens mounted above the bar in The Split Sabacc runs live or near-live coverage of racing events from across the galaxy. The house takes bets on any active race before the final lap marker. Odds are displayed beside each feed and update in real time via encrypted relay. Payouts are handled by the floor staff — the same people who will quietly remove anyone who argues with a result.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTIVE RACES ON THE BOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCREEN 1 — PODRACING
Venue: Malastare Grand Circuit (rotating with Tatooine Boonta Eve qualifiers and Ord Ibanna cloud-track series)
Format: Multi-lap endurance race across open terrain, canyon routes, or atmospheric cloud tracks. Pods are single-pilot engines capable of speeds no biological organism should survive at. Crashes are frequent and violent. The crowd loves it. Betting is active from the race announcement through to the halfway marker of the final lap.
Common bet types: Podracer to win, top three finish, lap leader, first crash, species of winner.

SCREEN 2 — FATHIER RACING
Venue: Canto Bight Downs (also relayed from Ubrikkia Pleasure Circuit and Zeltros Festival Track)
Format: Mounted racing using fathiers — large, fast quadrupeds bred for speed and endurance. Jockeys direct the animals across a measured oval or cross-country circuit. The sport has a veneer of respectability that the betting activity beneath it does not. Canto Bight odds are set by licensed bookmakers, which means they are slightly fairer than everything else on this board. Slightly.
Common bet types: Fathier to win, place, or show; fastest lap; combined exacta (first and second in order).

SCREEN 3 — SWOOP RACING
Venue: Ord Mantell Championship Series (also Nar Shaddaa Underground Swoop Circuit)
Format: Single-pilot swoop bikes over a defined course, typically urban, industrial, or crater-terrain. Swoop racing is the most technically accessible form of racing in the Outer Rim and therefore the most common venue for rigging. The Ord Mantell series is considered relatively clean. The Nar Shaddaa circuit is not and the house adjusts its odds accordingly.
Common bet types: Rider to win, fastest heat time, number of riders to complete the course, first disqualification.

SCREEN 4 — AIRSPEEDER CIRCUIT
Venue: Coruscant Upper-Level Urban Sprint (occasional relays from Corellia City Loop and Naboo Lakeshore Cup)
Format: Purpose-built airspeeders racing through defined urban corridors at altitude. Courses pass between towers, through transit tunnels, and over platform bridges at extreme speed. Races are short — typically six to eight minutes — making them ideal for quick-turnover betting. Collisions with infrastructure are penalised. Collisions with other racers are not.
Common bet types: Winner, margin of victory (close/dominant), number of course penalties, team constructors position.

SCREEN 5 — CLOUD CAR RALLY
Venue: Bespin Atmospheric Championship (seasonal — absent during tibanna extraction peak periods)
Format: Twin-pod cloud cars racing through layered atmospheric bands above the gas giant Bespin. The shifting gas layers, electrical storms, and wind shear make the course different every race. Navigation skill matters as much as raw speed. Races are longer and slower to resolve, making them the preferred market for high-value bets placed early in the session.
Common bet types: Winner, fastest altitude change segment, storm-band crossing leader, retirement odds.

SCREEN 6 — DEEP RUN SPRINT
Venue: Varies — typically the Ryndellia Straight, the Salin Corridor, or the outer Corellian Reach
Format: Point-to-point starship sprints between marked waypoints across open space. Ships range from heavily modified freighters to purpose-built sprint craft. No weapons. No passengers. Pure speed across void. Results arrive via delayed HoloNet relay, which means the race is often already finished before bets close — a fact the house is aware of and exploits.
Common bet types: First to waypoint, arrival order, ship class winner, time-over-distance record attempt.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BETTING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
All bets must be placed before the board locks. The board locks for each race at a point determined by the house — typically the start of the final segment. No bets are accepted after lock. Disputes are settled by the floor manager, whose decision is final and whose patience is limited.

Minimum bet: 50 credits.
Maximum single bet: At floor manager discretion.
Payout timing: Immediately on confirmed result via HoloNet relay.`;

const { data: existing } = await supabase
  .from('SW_campaign_notes')
  .select('id')
  .eq('CampaignID', campaignId)
  .eq('Place_Name', 'The Race Board');

if (existing && existing.length > 0) {
  console.log('Already exists, id:', existing[0].id);
} else {
  const { data, error } = await supabase
    .from('SW_campaign_notes')
    .insert([{ Place_Name: 'The Race Board', Description: description, Part_of_Place: '167', Order: 3, CampaignID: campaignId }])
    .select('id, Place_Name, Part_of_Place');
  if (error) throw error;
  console.log(JSON.stringify(data, null, 2));
}
