BEGIN;

UPDATE public."SW_campaign_NPC"
SET "Description" = 'Scout / Tracker (Rival)
A lean, sharp-eyed woman who moves through shadow like water. Heled rejected the Magick early and found its whispers weak compared to the clarity of the hunt. She tracks prey across ash plains and jungle canopies using nothing but instinct and decades of training.

Personality:
Cold but not cruel. Heled disdains the Magick-users of her clan not out of fear but contempt. She sees reliance on spirit ichor as weakness dressed in ceremony. She respects anyone willing to bleed for their skill and is one of Vapan''s most trusted scouts.

Appearance:
Pale grey clan tattoos across the jaw and collarbone. Wiry frame, dark braided hair wrapped in hunter''s cord. Carries her kills as trophies tied to her belt.',
    "Brawn" = 2,
    "Cunning" = 3,
    "Presence" = 2,
    "Agility" = 4,
    "Intellect" = 2,
    "Willpower" = 3,
    "Skills" = 'Athletics 2, Coordination 3, Melee 2, Perception 3, Ranged (Light) 3, Stealth 4, Survival 3',
    "Abilities" = 'Talents:
Dodge 2: When targeted by combat checks, may spend 1 Strain per rank to add 1 Setback die to the attacker''s pool.
Stalker 2: Add 2 Boost dice to all Stealth and Coordination checks.
Outdoorsman 1: Remove 1 Setback die from Survival and Stealth checks made in natural environments.

Special Abilities:
Fade Into Darkness: When in natural terrain, Heled may make a free Stealth check as an incidental once per encounter to become hidden again even after being detected.
Shadowstep: Once per encounter, Heled may move to any location within Medium range as a manoeuvre without triggering free attacks, provided she begins from a concealed position.',
    "Equipment" = 'Nightsister Recurve Bow: Ranged (Light) | Damage 5 | Critical 3 | Range Medium | Qualities: Accurate 1
Bone-Handled Hunting Knife: Melee | Damage 4 | Critical 3 | Range Engaged | Qualities: Vicious 1
Light Bone-Plate Armour: Soak +1 | Defence 0',
    "CampaignID" = 2,
    "Part_of_Place" = '111',
    "Soak" = 3,
    "Wound" = 13,
    "Strain" = 12
WHERE "id" = 64;

UPDATE public."SW_campaign_NPC"
SET "Description" = 'Warrior / Enforcer (Rival)
Built like the granite ridges of Dathomir, Jusa Kovves is the clan''s immovable wall. She rejected the Magick because she does not need it. Her body is her weapon. She has never lost a test of direct strength and knows it. Her loyalty is to the clan first, and to Vapan by extension.

Personality:
Direct and blunt. Has no patience for manipulation or ceremony. She finds offworlders baffling and gives them exactly one chance to prove themselves useful before writing them off. She will follow Vapan into any danger without hesitation.

Appearance:
Massively built. Ritual scarring across both arms and shoulders marking every significant kill. Shaved head with a single thick braid. Eyes that measure everyone for threat level the moment they enter the room.',
    "Brawn" = 4,
    "Cunning" = 2,
    "Presence" = 2,
    "Agility" = 2,
    "Intellect" = 2,
    "Willpower" = 3,
    "Skills" = 'Athletics 3, Brawl 3, Coercion 2, Melee 4, Resilience 3, Vigilance 2',
    "Abilities" = 'Talents:
Toughened 2: +4 Wound Threshold (already factored in).
Knockdown: After hitting with a Brawl or Melee check, may spend 1 Advantage to knock the target prone.
Intimidating 1: May suffer 2 Strain to downgrade difficulty of Coercion checks once per check, or upgrade difficulty of incoming social checks once per check.
Strong Arm: Treat thrown weapons as if they had one additional range band.

Special Abilities:
Iron Stance: Once per encounter, Jusa may suffer 2 Strain to ignore the effects of knockback, disorientation, or forced movement from any source until the end of her next turn.
Relentless: When Jusa is hit by a combat attack, she may spend a Destiny Point to immediately make a free Brawl or Melee counter-attack as an out-of-turn incidental.',
    "Equipment" = 'Ancestral Vibro-Spear: Melee | Damage 8 | Critical 2 | Range Engaged | Qualities: Pierce 2, Defensive 1
Bone-Knuckle Guards: Brawl | Damage 6 | Critical 4 | Range Engaged | Qualities: Disorient 1
Clan-Hardened Leather Armour: Soak +2 | Defence 0',
    "CampaignID" = 2,
    "Part_of_Place" = '111',
    "Soak" = 6,
    "Wound" = 16,
    "Strain" = 12
WHERE "id" = 65;

UPDATE public."SW_campaign_NPC"
SET "Description" = 'Matriarch-in-Waiting / Strategist (Nemesis)
The eldest and most dangerous of the three. Enjazzi Ezil holds no formal authority yet, but everyone in the clan knows she will. She has studied the Magick traditions closely not to practise them, but to counter them. Her rejection of the Magick is not a weakness; it is a weapon she uses against those who rely on it.

Personality:
Quietly calculating. She has mapped every exit, every alliance, and every weakness in the room before she speaks her first word. She does not raise her voice because she does not need to. She is curious about Vapan in a way she has not decided is trust yet.

Appearance:
Tall and composed. Grey-and-red clan paint in precise angular patterns across the face and neck. Long dark robes layered over armour. Carries the clan blade openly as both weapon and symbol of authority she has not yet formally claimed.',
    "Brawn" = 2,
    "Cunning" = 4,
    "Presence" = 3,
    "Agility" = 3,
    "Intellect" = 3,
    "Willpower" = 4,
    "Skills" = 'Coercion 3, Cool 3, Deception 3, Leadership 3, Melee 2, Perception 3, Survival 2, Vigilance 3',
    "Abilities" = 'Talents:
Adversary 1: Upgrade the difficulty of all combat checks targeting Enjazzi once.
Commanding Presence 1: Remove 1 Setback die from Leadership and Cool checks.
Natural Leader: Once per round, one ally within Medium range may add 1 Boost die to their next check.
Resolve 1: When suffering Strain from enemy effects, reduce Strain suffered by 1 (minimum 1).
Grit 2: +2 Strain Threshold (already factored in).

Special Abilities:
Reject the Weave: Enjazzi''s deliberate rejection of the Magick has built an instinctive resistance to Force-based and spirit-ichor abilities. Any Force power or Nightsister ichor ability used against her requires 1 additional upgrade to the difficulty. This does not protect her from purely physical effects.
Read the Room: Once per scene, Enjazzi may make a Perception check (Difficulty 2) as an incidental to identify the single most significant threat or opportunity present. The GM provides one true, useful piece of tactical information.
Tactical Direction: As an action, Enjazzi may direct up to 3 allies she can see. Each directed ally may reroll 1 die on their next check this round and keep the better result.',
    "Equipment" = 'Ceremonial Ritual Blade (non-magical): Melee | Damage 5 | Critical 2 | Range Engaged | Qualities: Accurate 1, Vicious 1
Hunting Sidearm: Ranged (Light) | Damage 5 | Critical 4 | Range Medium
Clan Sigil Armour: Soak +1 | Defence 1',
    "CampaignID" = 2,
    "Part_of_Place" = '111',
    "Soak" = 3,
    "Wound" = 14,
    "Strain" = 15
WHERE "id" = 66;

DELETE FROM public."SW_campaign_notes"
WHERE "Part_of_Place" = '111'
  AND "Place_Name" IN ('Heled Intraj', 'Jusa Kovves', 'Enjazzi Ezil');

COMMIT;

SELECT "id", "Name", "Brawn", "Agility", "Intellect", "Cunning", "Willpower", "Presence", "Soak", "Wound", "Strain"
FROM public."SW_campaign_NPC"
WHERE "id" IN (64, 65, 66)
ORDER BY "id";
