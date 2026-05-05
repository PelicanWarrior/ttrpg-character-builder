BEGIN;

-- 1. Update Note 115 (Mustafar) - Vapan's discovery
UPDATE public."SW_campaign_notes"
SET "Description" = 'An ancient volcanic world in the Outer Rim, known as a dark-side nexus. During the exploration of the Sith ship on Malachor V, Vapan discovered that the vessel originated from Mustafar. Ship registration markings and encrypted data logs suggest the ship was manufactured or last commissioned there.

GM NOTE: Mustafar is likely the location of the Sith factory the Nightsisters tasked Vapan and Lowrrick with finding. This is a strong hook for the next arc after the Jedha detour — the party may need to travel to Mustafar to locate Archive-Forge Node KHAR-VOSS or the factory that produced both the ship and IG-07.

Key details discovered:
- The Ashen Talon was last registered at a Mustafar installation
- IG-07''s encrypted navicomputer contains 5 stored jump routes — one leads to a Mustafar node
- The Nightsisters'' original tasking ("find the Sith factory") points here
- How the characters travel to Mustafar is TBD — IG-07''s navicomputer or the Ashen Talon''s stored routes are the likely method'
WHERE "id" = 115;

-- 2. Update Note 110 (Holocron Vision - Jedha) - Mark it as TRIGGERED in session
UPDATE public."SW_campaign_notes"
SET "Description" = '[SESSION EVENT - Triggered 28th April 2026]
The vision was triggered when Nix was drawn to IG-07 shortly after the crew reunited on the Sith ship. She touched a glowing red cube concealed inside IG-07''s chest cavity — a hidden Sith holocron — and the vision sequence began.

What Nix experienced:
1) A partly destroyed planet hanging in the dark — broken, scarred, ancient.
2) A bustling city carved into pale stone, alive with people and prayer towers.
3) Crystal caves beneath ruins, lit by cold ghostly light.

What the holocron showed her beyond the vision:
- A powerful version of herself as a force wielder
- Killing the person responsible for her husband''s death with a lightsaber and the Force
- She felt that going to this place would make her stronger and save her husband

Planet Solution: Jedha.

GM Notes:
The group must investigate the clues and identify the planet from the images. This can be done through in-world research, old star charts, library terminals, or asking NPC scholars. Once they identify Jedha, the party can begin searching for the specific ruin.

The vision has now been seen. Nix knows what she saw but does not yet know the name of the planet or its location. The Jedha skill checks (Knowledge Lore / Knowledge Outer Rim) remain the in-character method for the group to pin down the destination.

This note transitions the campaign off Malachor V and points the crew toward a planet-hunt arc. Keep Darth Nihilus references limited to prior discoveries; this vision should focus on destination mystery and Nix''s personal prophecy, not additional identity reveals.'
WHERE "id" = 110;

-- 3. Update the Ashen Talon note (109) damage/repair progress section
-- Read current note first then update the damage state block to reflect session progress
UPDATE public."SW_campaign_notes"
SET "Description" = regexp_replace(
  "Description",
  '--- CURRENT DAMAGE STATE ---\nHull Trauma: 5 \(out of 18\).*$',
  E'--- CURRENT DAMAGE STATE ---\n[UPDATED 28th April 2026 - Session Progress]\nIG-07 has been fully repaired and is operational. The crew (Vapan, Lowrrick, Eril, Nix, Tol) reunited aboard the ship and began work on the Ashen Talon together. Interceptor repairs are in progress but not yet complete — the session ended while work was underway (interrupted by Nix''s holocron vision).\n\nHull Trauma: 5 (out of 18) — structurally safe to fly, not safe in a sustained fight\nSystem Strain: 3 (out of 14) — fuel line and coupling issues contributing\nWeapons: Laser cannons offline; dorsal and ventral twin laser turrets online; torpedo launcher armed (2 loaded, 2 reserve)\nHyperdrive: Primary functional but not calibrated; backup non-functional\n\nRequired Repairs Status:\n1. Repressurize Fuel Lines — IN PROGRESS\n2. Restore Primary Power Coupling to Thrusters — NOT STARTED\n3. Clear Launch Corridor Magnetic Clamps — HANDLED BY R8 OVERRIDE\n4. Calibrate Navicomputer — NOT STARTED\n5. Restore Cockpit Life Support — NOT STARTED',
  'g'
)
WHERE "id" = 109;

COMMIT;

-- Verify updates
SELECT id, "Place_Name", left("Description", 200) AS desc_preview
FROM public."SW_campaign_notes"
WHERE id IN (109, 110, 115)
ORDER BY id;
