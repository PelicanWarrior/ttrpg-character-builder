import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const SPECIAL_FIELDS = [
  { key: 'strength', label: 'Strength', short: 'STR' },
  { key: 'perception', label: 'Perception', short: 'PER' },
  { key: 'endurance', label: 'Endurance', short: 'END' },
  { key: 'charisma', label: 'Charisma', short: 'CHA' },
  { key: 'intelligence', label: 'Intelligence', short: 'INT' },
  { key: 'agility', label: 'Agility', short: 'AGI' },
  { key: 'luck', label: 'Luck', short: 'LCK' },
];

const SKILLS = [
  { key: 'athletics', label: 'Athletics', defaultAttribute: 'STR' },
  { key: 'barter', label: 'Barter', defaultAttribute: 'CHA' },
  { key: 'big_guns', label: 'Big Guns', defaultAttribute: 'END' },
  { key: 'energy_weapons', label: 'Energy Weapons', defaultAttribute: 'PER' },
  { key: 'explosives', label: 'Explosives', defaultAttribute: 'PER' },
  { key: 'lockpick', label: 'Lockpick', defaultAttribute: 'PER' },
  { key: 'medicine', label: 'Medicine', defaultAttribute: 'INT' },
  { key: 'melee_weapons', label: 'Melee Weapons', defaultAttribute: 'STR' },
  { key: 'pilot', label: 'Pilot', defaultAttribute: 'PER' },
  { key: 'repair', label: 'Repair', defaultAttribute: 'INT' },
  { key: 'science', label: 'Science', defaultAttribute: 'INT' },
  { key: 'small_guns', label: 'Small Guns', defaultAttribute: 'AGI' },
  { key: 'sneak', label: 'Sneak', defaultAttribute: 'AGI' },
  { key: 'speech', label: 'Speech', defaultAttribute: 'CHA' },
  { key: 'survival', label: 'Survival', defaultAttribute: 'END' },
  { key: 'throwing', label: 'Throwing', defaultAttribute: 'AGI' },
  { key: 'unarmed', label: 'Unarmed', defaultAttribute: 'STR' },
];

const DEFAULT_SPECIAL = {
  strength: 5,
  perception: 5,
  endurance: 5,
  charisma: 5,
  intelligence: 5,
  agility: 5,
  luck: 5,
};

const DEFAULT_SKILLS = SKILLS.reduce((acc, skill) => {
  acc[skill.key] = 0;
  return acc;
}, {});

function parseMaybeJson(value, fallback) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'object') return value;
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeSpecial(input) {
  const parsed = parseMaybeJson(input, {});
  const output = { ...DEFAULT_SPECIAL };
  for (const field of SPECIAL_FIELDS) {
    const current = parsed[field.key] ?? parsed[field.short] ?? parsed[field.short.toLowerCase()];
    const numeric = Number(current);
    if (!Number.isNaN(numeric)) {
      output[field.key] = Math.max(4, Math.min(10, Math.floor(numeric)));
    }
  }
  return output;
}

function normalizeSkillRanks(input) {
  const parsed = parseMaybeJson(input, {});
  const output = { ...DEFAULT_SKILLS };
  for (const skill of SKILLS) {
    const current = parsed[skill.key] ?? parsed[skill.label] ?? parsed[skill.label.toLowerCase()];
    const numeric = Number(current);
    if (!Number.isNaN(numeric)) {
      output[skill.key] = Math.max(0, Math.min(6, Math.floor(numeric)));
    }
  }
  return output;
}

function normalizeTagSkills(input) {
  const parsed = parseMaybeJson(input, input);
  if (Array.isArray(parsed)) {
    return parsed.map((entry) => String(entry || '').trim().toLowerCase()).filter(Boolean);
  }
  if (typeof parsed === 'string') {
    return parsed.split(',').map((entry) => entry.trim().toLowerCase()).filter(Boolean);
  }
  return [];
}

export default function FCharacterOverview() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [character, setCharacter] = useState(null);
  const [activeTab, setActiveTab] = useState('special');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError('');

      try {
        const loadedCharacterId = localStorage.getItem('loadedCharacterId');
        if (!loadedCharacterId) {
          setError('No Fallout character selected. Open or create a character first.');
          return;
        }

        const parsedId = Number(loadedCharacterId);
        if (Number.isNaN(parsedId)) {
          setError('Selected character id is invalid.');
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('Fa_player_characters')
          .select('*')
          .eq('id', parsedId)
          .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        if (!data) {
          setError('Character not found in Supabase.');
          return;
        }

        const special = normalizeSpecial(data.special ?? data.attributes);
        const skills = normalizeSkillRanks(data.skills ?? data.skill_ranks);
        const tagSkills = normalizeTagSkills(data.tag_skills ?? data.tags);

        setCharacter({
          id: data.id,
          name: data.name || data.character_name || 'Unnamed',
          race: data.race || data.species || 'Unknown',
          level: Number(data.level) > 0 ? Number(data.level) : 1,
          exp: Number(data.exp ?? data.experience) || 0,
          notes: data.notes || data.background || '',
          special,
          skills,
          tagSkills,
        });
      } catch (err) {
        console.error('Failed to load Fallout overview:', err);
        setError('Failed to load Fallout character from Supabase.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const derived = useMemo(() => {
    if (!character) {
      return {
        carryWeight: 0,
        initiative: 0,
        defense: 1,
        maxHp: 0,
        meleeBonusDice: 0,
      };
    }

    const str = Number(character.special.strength) || 0;
    const per = Number(character.special.perception) || 0;
    const end = Number(character.special.endurance) || 0;
    const agi = Number(character.special.agility) || 0;
    const lck = Number(character.special.luck) || 0;

    let meleeBonusDice = 0;
    if (str >= 11) meleeBonusDice = 3;
    else if (str >= 9) meleeBonusDice = 2;
    else if (str >= 7) meleeBonusDice = 1;

    return {
      carryWeight: 150 + str * 10,
      initiative: per + agi,
      defense: agi >= 9 ? 2 : 1,
      maxHp: end + lck,
      meleeBonusDice,
    };
  }, [character]);

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto w-full max-w-6xl rounded-xl border border-gray-300 bg-white p-6 shadow">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <img
              src="/Fa_Pictures/Logo.png"
              alt="Fallout"
              className="h-14 w-auto"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/select-ttrpg')}
              className="rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-800"
            >
              Back
            </button>
            <button
              onClick={() => navigate('/Fa_character_creator')}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Edit
            </button>
          </div>
        </div>

        {loading && <p className="text-sm text-gray-700">Loading character...</p>}
        {error && <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {!loading && !error && character && (
          <div className="space-y-4">
            {/* Identity */}
            <div className="rounded border border-gray-300 bg-gray-50 p-4">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Identity</h2>
              <div className="flex items-center gap-6">
                <img
                  src={`/Fa_Pictures/${character.race}_Face.png`}
                  alt={`${character.race} portrait`}
                  className="h-32 w-32 rounded border border-gray-300 object-cover"
                  onError={(event) => { event.currentTarget.style.display = 'none'; }}
                />
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {character.name}</p>
                  <p><strong>Race:</strong> {character.race}</p>
                  <p><strong>Level:</strong> {character.level}</p>
                  <p><strong>Experience:</strong> {character.exp}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div>
              <div className="flex border-b border-gray-300">
                {[
                  { key: 'special', label: 'S.P.E.C.I.A.L' },
                  { key: 'skills', label: 'Skills' },
                  { key: 'derived', label: 'Derived Stats' },
                  { key: 'notes', label: 'Notes' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                      activeTab === tab.key
                        ? 'border-gray-900 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="rounded-b border border-t-0 border-gray-300 bg-gray-50 p-4">
                {activeTab === 'special' && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {SPECIAL_FIELDS.map((field) => (
                      <div key={field.key} className="rounded border border-gray-200 bg-white p-3 text-center">
                        <div className="text-xs font-semibold text-gray-500 uppercase">{field.short}</div>
                        <div className="text-2xl font-bold text-gray-900">{character.special[field.key]}</div>
                        <div className="text-xs text-gray-500">{field.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'skills' && (
                  <div className="max-h-[26rem] overflow-y-auto rounded border border-gray-200 bg-white">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-100">
                        <tr>
                          <th className="border-b border-gray-200 px-2 py-2 text-left">Skill</th>
                          <th className="border-b border-gray-200 px-2 py-2 text-center">Attr</th>
                          <th className="border-b border-gray-200 px-2 py-2 text-center">Rank</th>
                          <th className="border-b border-gray-200 px-2 py-2 text-center">Tag</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SKILLS.map((skill) => (
                          <tr key={skill.key}>
                            <td className="border-b border-gray-100 px-2 py-2">{skill.label}</td>
                            <td className="border-b border-gray-100 px-2 py-2 text-center">{skill.defaultAttribute}</td>
                            <td className="border-b border-gray-100 px-2 py-2 text-center">{character.skills[skill.key] ?? 0}</td>
                            <td className="border-b border-gray-100 px-2 py-2 text-center">
                              {character.tagSkills.includes(skill.key) ? 'Yes' : 'No'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'derived' && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                      { label: 'Carry Weight', value: `${derived.carryWeight} lbs` },
                      { label: 'Initiative', value: derived.initiative },
                      { label: 'Defense', value: derived.defense },
                      { label: 'Max HP', value: derived.maxHp },
                      { label: 'Melee Bonus Dice', value: `+${derived.meleeBonusDice} DC` },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded border border-gray-200 bg-white p-3 text-center">
                        <div className="text-xs font-semibold text-gray-500 uppercase">{stat.label}</div>
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'notes' && (
                  <p className="whitespace-pre-wrap text-sm text-gray-800">
                    {character.notes || 'No notes yet.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
