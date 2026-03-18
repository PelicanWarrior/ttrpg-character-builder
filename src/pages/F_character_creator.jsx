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

function normalizeTagSkills(input) {
  const parsed = parseMaybeJson(input, input);
  if (Array.isArray(parsed)) {
    return parsed
      .map((entry) => String(entry || '').trim().toLowerCase())
      .filter((entry) => SKILLS.some((skill) => skill.key === entry));
  }

  if (typeof parsed === 'string') {
    return parsed
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => SKILLS.some((skill) => skill.key === entry));
  }

  return [];
}

function getRaceName(row) {
  return String(row?.race_name || row?.name || row?.Race || '').trim();
}

export default function FCharacterCreator() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [userId, setUserId] = useState(null);
  const [characterId, setCharacterId] = useState(null);
  const [races, setRaces] = useState([]);

  const [characterName, setCharacterName] = useState('');
  const [selectedRace, setSelectedRace] = useState('');
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [special, setSpecial] = useState({ ...DEFAULT_SPECIAL });
  const [skillRanks, setSkillRanks] = useState({ ...DEFAULT_SKILLS });
  const [tagSkills, setTagSkills] = useState([]);
  const [activeTab, setActiveTab] = useState('special');
  const [backstory, setBackstory] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError('');

      try {
        const username = localStorage.getItem('username');
        if (!username) {
          navigate('/');
          return;
        }

        const [{ data: userData, error: userError }, { data: raceData, error: raceError }] = await Promise.all([
          supabase.from('user').select('id').eq('username', username).maybeSingle(),
          supabase.from('Fa_races').select('*').order('race_name', { ascending: true }),
        ]);

        if (userError) {
          throw userError;
        }

        setUserId(userData?.id ?? null);

        if (!raceError) {
          const raceNames = (raceData || [])
            .map((row) => getRaceName(row))
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));
          setRaces(raceNames);
        }

        const loadedCharacterId = localStorage.getItem('loadedCharacterId');
        if (loadedCharacterId) {
          const parsedId = Number(loadedCharacterId);
          if (!Number.isNaN(parsedId)) {
            const { data: characterData, error: characterError } = await supabase
              .from('Fa_player_characters')
              .select('*')
              .eq('id', parsedId)
              .maybeSingle();

            if (characterError) {
              console.error('Error loading Fallout character:', characterError);
            } else if (characterData) {
              setCharacterId(characterData.id);
              setCharacterName(characterData.name || characterData.character_name || '');
              setSelectedRace(characterData.race || characterData.species || '');
              setLevel(Number(characterData.level) > 0 ? Number(characterData.level) : 1);
              setExperience(Number(characterData.exp ?? characterData.experience) || 0);
              setSpecial(normalizeSpecial(characterData.special ?? characterData.attributes));
              setSkillRanks(normalizeSkillRanks(characterData.skills ?? characterData.skill_ranks));
              setTagSkills(normalizeTagSkills(characterData.tag_skills ?? characterData.tags));
              setBackstory(characterData.backstory || characterData.background || '');
              setNotes(characterData.notes || '');
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize Fallout creator:', err);
        setError('Failed to load Fallout data from Supabase. Ensure Fa_races and Fa_player_characters are available.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

  const derivedStats = useMemo(() => {
    const strength = Number(special.strength) || 0;
    const perception = Number(special.perception) || 0;
    const endurance = Number(special.endurance) || 0;
    const agility = Number(special.agility) || 0;
    const luck = Number(special.luck) || 0;

    const carryWeight = 150 + strength * 10;
    const initiative = perception + agility;
    const defense = agility >= 9 ? 2 : 1;
    const maxHp = endurance + luck;

    let meleeBonusDice = 0;
    if (strength >= 11) meleeBonusDice = 3;
    else if (strength >= 9) meleeBonusDice = 2;
    else if (strength >= 7) meleeBonusDice = 1;

    return {
      carryWeight,
      initiative,
      defense,
      maxHp,
      meleeBonusDice,
    };
  }, [special]);

  const updateSpecial = (key, value) => {
    const numeric = Number(value);
    setSpecial((prev) => ({
      ...prev,
      [key]: Number.isNaN(numeric) ? prev[key] : Math.max(4, Math.min(10, Math.floor(numeric))),
    }));
  };

  const updateSkillRank = (key, value) => {
    const numeric = Number(value);
    setSkillRanks((prev) => ({
      ...prev,
      [key]: Number.isNaN(numeric) ? prev[key] : Math.max(0, Math.min(6, Math.floor(numeric))),
    }));
  };

  const toggleTagSkill = (skillKey) => {
    setError('');
    setTagSkills((prev) => {
      if (prev.includes(skillKey)) {
        return prev.filter((entry) => entry !== skillKey);
      }
      if (prev.length >= 3) {
        setError('You can only tag up to 3 skills.');
        return prev;
      }
      return [...prev, skillKey];
    });
  };

  const runUpdateOrInsert = async (payload) => {
    const loadedCharacterId = characterId ?? Number(localStorage.getItem('loadedCharacterId'));
    const validLoadedId = Number.isNaN(loadedCharacterId) ? null : loadedCharacterId;

    if (validLoadedId) {
      const { error: updateError } = await supabase
        .from('Fa_player_characters')
        .update(payload)
        .eq('id', validLoadedId);

      if (updateError) {
        return { ok: false, error: updateError };
      }

      return { ok: true, id: validLoadedId };
    }

    const { data: inserted, error: insertError } = await supabase
      .from('Fa_player_characters')
      .insert([payload])
      .select('id')
      .single();

    if (insertError) {
      return { ok: false, error: insertError };
    }

    return { ok: true, id: inserted?.id ?? null };
  };

  const saveCharacter = async (goToOverview = false) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (!characterName.trim()) {
        setError('Character name is required.');
        return;
      }

      if (!selectedRace.trim()) {
        setError('Please select a race.');
        return;
      }

      const fullPayload = {
        name: characterName.trim(),
        race: selectedRace,
        level: Number(level) > 0 ? Number(level) : 1,
        exp: Number(experience) >= 0 ? Number(experience) : 0,
        special,
        skills: skillRanks,
        tag_skills: tagSkills,
        backstory,
        notes,
        user_number: userId,
      };

      const fallbackPayloads = [
        fullPayload,
        { ...fullPayload, tag_skills: undefined },
        { ...fullPayload, tag_skills: undefined, skills: undefined },
        { ...fullPayload, tag_skills: undefined, skills: undefined, special: undefined },
        { name: fullPayload.name, race: fullPayload.race, user_number: fullPayload.user_number },
        { name: fullPayload.name, race: fullPayload.race },
      ].map((payload) => {
        const cleaned = {};
        Object.keys(payload).forEach((key) => {
          if (payload[key] !== undefined) cleaned[key] = payload[key];
        });
        return cleaned;
      });

      let lastError = null;
      let savedId = null;

      for (const payload of fallbackPayloads) {
        const result = await runUpdateOrInsert(payload);
        if (result.ok) {
          savedId = result.id;
          break;
        }
        lastError = result.error;
      }

      if (savedId == null && lastError) {
        throw lastError;
      }

      if (savedId != null) {
        setCharacterId(savedId);
        localStorage.setItem('loadedCharacterId', String(savedId));
      }

      setSuccess('Character saved successfully.');

      if (goToOverview) {
        navigate('/Fa_character_overview');
      }
    } catch (err) {
      console.error('Failed to save Fallout character:', err);
      setError('Failed to save character to Supabase. Ensure table Fa_player_characters contains compatible columns.');
    } finally {
      setSaving(false);
    }
  };

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
              onClick={() => navigate('/Fa_character_overview')}
              className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
              disabled={!characterId}
              title={!characterId ? 'Save character first' : 'Open overview'}
            >
              Overview
            </button>
          </div>
        </div>

        {loading && <p className="text-sm text-gray-700">Loading Fallout data...</p>}
        {error && <p className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {success && <p className="mb-3 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>}

        {!loading && (
          <div className="space-y-4">
            <div className="rounded border border-gray-300 bg-gray-50 p-4">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Identity</h2>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Character Name</label>
                  <input
                    value={characterName}
                    onChange={(event) => setCharacterName(event.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    placeholder="Enter character name"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Race</label>
                  <select
                    value={selectedRace}
                    onChange={(event) => setSelectedRace(event.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2"
                  >
                    <option value="">-- Select race --</option>
                    {races.map((race) => (
                      <option key={race} value={race}>{race}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Level</label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={level}
                      onChange={(event) => setLevel(Number(event.target.value) || 1)}
                      className="w-full rounded border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Experience</label>
                    <input
                      type="number"
                      min={0}
                      value={experience}
                      onChange={(event) => setExperience(Math.max(0, Number(event.target.value) || 0))}
                      className="w-full rounded border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded border border-gray-300 bg-gray-50 p-4">
              <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-300 pb-3">
                <button
                  onClick={() => setActiveTab('special')}
                  className={`rounded px-3 py-2 text-sm font-semibold ${activeTab === 'special' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
                >
                  S.P.E.C.I.A.L
                </button>
                <button
                  onClick={() => setActiveTab('skills')}
                  className={`rounded px-3 py-2 text-sm font-semibold ${activeTab === 'skills' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
                >
                  Skills
                </button>
                <button
                  onClick={() => setActiveTab('derived')}
                  className={`rounded px-3 py-2 text-sm font-semibold ${activeTab === 'derived' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
                >
                  Derived Stats
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`rounded px-3 py-2 text-sm font-semibold ${activeTab === 'notes' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
                >
                  Notes
                </button>
              </div>

              {activeTab === 'special' && (
                <div>
                  <h2 className="mb-3 text-lg font-semibold text-gray-900">S.P.E.C.I.A.L.</h2>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {SPECIAL_FIELDS.map((field) => (
                      <div key={field.key} className="rounded border border-gray-200 bg-white p-2">
                        <label className="mb-1 block text-sm font-medium text-gray-700">{field.label} ({field.short})</label>
                        <input
                          type="number"
                          min={4}
                          max={10}
                          value={special[field.key]}
                          onChange={(event) => updateSpecial(field.key, event.target.value)}
                          className="w-full rounded border border-gray-300 px-3 py-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'skills' && (
                <div>
                  <h2 className="mb-1 text-lg font-semibold text-gray-900">Skills</h2>
                  <p className="mb-3 text-xs text-gray-600">Set ranks from 0-6. Tag up to 3 skills for criticals on rolls at or below rank.</p>

                  <div className="max-h-[30rem] overflow-y-auto rounded border border-gray-200 bg-white">
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
                            <td className="border-b border-gray-100 px-2 py-2 text-center">
                              <input
                                type="number"
                                min={0}
                                max={6}
                                value={skillRanks[skill.key]}
                                onChange={(event) => updateSkillRank(skill.key, event.target.value)}
                                className="w-16 rounded border border-gray-300 px-2 py-1 text-center"
                              />
                            </td>
                            <td className="border-b border-gray-100 px-2 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={tagSkills.includes(skill.key)}
                                onChange={() => toggleTagSkill(skill.key)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'derived' && (
                <div>
                  <h2 className="mb-3 text-lg font-semibold text-gray-900">Derived Stats</h2>
                  <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <div className="rounded border border-gray-200 bg-white p-2">Carry Weight: <strong>{derivedStats.carryWeight} lbs</strong></div>
                    <div className="rounded border border-gray-200 bg-white p-2">Initiative: <strong>{derivedStats.initiative}</strong></div>
                    <div className="rounded border border-gray-200 bg-white p-2">Defense: <strong>{derivedStats.defense}</strong></div>
                    <div className="rounded border border-gray-200 bg-white p-2">Max HP: <strong>{derivedStats.maxHp}</strong></div>
                    <div className="rounded border border-gray-200 bg-white p-2 sm:col-span-2">Melee Bonus Dice: <strong>+{derivedStats.meleeBonusDice} DC</strong></div>
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Backstory</label>
                    <textarea
                      value={backstory}
                      onChange={(event) => setBackstory(event.target.value)}
                      rows={6}
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      placeholder="Describe your character's past, motivations, and defining moments..."
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      rows={5}
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      placeholder="Gear summary, session notes, goals, allies..."
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => saveCharacter(false)}
                disabled={saving}
                className="rounded bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {saving ? 'Saving...' : 'Save Character'}
              </button>

              <button
                onClick={() => saveCharacter(true)}
                disabled={saving}
                className="rounded bg-purple-600 px-6 py-3 font-bold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                Save and Open Overview
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

