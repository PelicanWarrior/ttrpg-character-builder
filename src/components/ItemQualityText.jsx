const ITEM_QUALITY_RULES = {
  'accurate': 'Add one Boost die per rank to combat checks made with this weapon.',
  'auto-fire': 'Increase the attack difficulty by one when using Auto-fire. On a hit, spend 2 Advantage to deal one additional hit. This can be triggered multiple times.',
  'blast': 'On a hit, spend 2 Advantage to deal Blast damage to each character engaged with the target. On a miss, it may be triggered with 3 Advantage.',
  'breach': 'Ignore 1 armor per rank of Breach (equivalent to ignoring 10 soak per rank).',
  'burn': 'If the attack hits and Burn is activated, the target suffers the weapon\'s base damage each round for a number of rounds equal to the Burn rating.',
  'concussive': 'When activated, the target is staggered for a number of rounds equal to the Concussive rating.',
  'cortosis': 'Weapons with Cortosis are immune to Sunder. Armor with Cortosis makes the wearer\'s soak immune to Pierce and Breach.',
  'cumbersome': 'If the wielder\'s Brawn is below the rating, increase the difficulty of checks made with the weapon by the difference.',
  'defensive': 'Increase melee defense by the Defensive rating while wielding the item.',
  'deflection': 'Increase ranged defense by the Deflection rating while using/wearing the item.',
  'disorient': 'When activated, the target is disoriented for rounds equal to the Disorient rating (adds a Setback die to skill checks).',
  'ensnare': 'When activated, the target is immobilized for rounds equal to the Ensnare rating.',
  'guided': 'If activated after a miss, the attack may be made again at the end of the round using Guided rules.',
  'knockdown': 'When activated, the target is knocked prone. Usually costs 2 Advantage plus extra by silhouette.',
  'inaccurate': 'Add Setback dice to the attacker\'s dice pool equal to the Inaccurate rating.',
  'inferior': 'Inferior weapons add an automatic Threat to checks and reduce base damage by 1.',
  'ion': 'Damage is dealt as strain/system strain (still reduced by soak/armor as applicable).',
  'limited ammo': 'The weapon can be used a number of times equal to its rating before requiring reload/replacement.',
  'linked': 'On a successful attack, spend 2 Advantage to deal an additional hit. This can be triggered up to the Linked rating.',
  'pierce': 'Ignore one point of soak per rank of Pierce.',
  'prepare': 'The user must spend a number of preparation maneuvers equal to the rating before attacking.',
  'slow-firing': 'After firing, the weapon cannot be fired again for a number of rounds equal to the rating.',
  'stun': 'When activated, inflict strain equal to the Stun rating.',
  'stun damage': 'Damage from the weapon is applied to strain instead of wounds (and is reduced by soak).',
  'stun setting': 'As an incidental, the weapon can switch to Stun; it deals strain and has a maximum range of Short.',
  'sunder': 'When activated, damage one item carried/wielded by the target by one step. Can be triggered multiple times.',
  'superior': 'Superior weapons add an automatic Advantage to checks and increase base damage by 1.',
  'tractor': 'On a hit, the target may be unable to move unless it succeeds on a Piloting check with difficulty equal to the Tractor rating.',
  'unwieldy': 'If the wielder\'s Agility is below the rating, increase the difficulty of checks made with the weapon by the difference.',
  'vicious': 'When this weapon scores a Critical Injury or Hit, the character adds ten times the Vicious rating to the Critical roll. With Vicious 3, for example, the victim adds +30 to their Critical Injury or Hit result.',
};

const QUALITY_NAMES = Object.keys(ITEM_QUALITY_RULES).sort((a, b) => b.length - a.length);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const QUALITY_REGEX = new RegExp(
  `\\b(${QUALITY_NAMES.map(escapeRegExp).join('|')})(?:\\s+(\\d+))?\\b`,
  'gi'
);

const toTitleCase = (value) =>
  value
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const getItemQualityDetails = (qualityName, rating) => {
  if (!qualityName) return null;

  const normalized = qualityName.toLowerCase();
  const baseText = ITEM_QUALITY_RULES[normalized];
  if (!baseText) return null;

  const ratingNumber = Number.parseInt(rating, 10);
  let detailText = baseText;

  if (normalized === 'vicious' && Number.isFinite(ratingNumber)) {
    detailText = `${baseText} For this item (${ratingNumber}), add +${ratingNumber * 10} to the Critical roll.`;
  }

  return {
    qualityName: toTitleCase(normalized),
    rating: Number.isFinite(ratingNumber) ? ratingNumber : null,
    detailText,
  };
};

export default function ItemQualityText({ text, onQualityClick }) {
  if (!text) return null;

  const content = String(text);
  const segments = [];
  let lastIndex = 0;

  QUALITY_REGEX.lastIndex = 0;

  let match = QUALITY_REGEX.exec(content);
  while (match !== null) {
    const matchedText = match[0];
    const matchedQuality = match[1];
    const matchedRating = match[2] || null;

    if (match.index > lastIndex) {
      segments.push(content.slice(lastIndex, match.index));
    }

    const details = getItemQualityDetails(matchedQuality, matchedRating);

    if (details) {
      segments.push(
        <button
          key={`${matchedQuality}-${match.index}`}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onQualityClick?.(event, details);
          }}
          className="text-blue-700 underline underline-offset-2 hover:text-blue-900"
          title={`Show ${details.qualityName} details`}
        >
          {matchedText}
        </button>
      );
    } else {
      segments.push(matchedText);
    }

    lastIndex = QUALITY_REGEX.lastIndex;
    match = QUALITY_REGEX.exec(content);
  }

  if (lastIndex < content.length) {
    segments.push(content.slice(lastIndex));
  }

  return <>{segments}</>;
}
