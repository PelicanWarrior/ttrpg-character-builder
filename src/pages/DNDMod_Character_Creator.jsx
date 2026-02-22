import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function DNDModCharacterCreator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dndMod = searchParams.get('mod') || '';

  const [showClasses, setShowClasses] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [classError, setClassError] = useState('');
  const [expandedClassId, setExpandedClassId] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [skillChoices, setSkillChoices] = useState([]);
  const [initials, setInitials] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [classLevel, setClassLevel] = useState('1');
  const [statValues, setStatValues] = useState({
    STRENGTH: '8',
    DEXTERITY: '8',
    CONSTITUTION: '8',
    INTELLIGENCE: '8',
    WISDOM: '8',
    CHARISMA: '8',
  });
  const [ttrpgId, setTtrpgId] = useState(null);
  const [editingClassId, setEditingClassId] = useState(null);
  const [isInitializingFromEdit, setIsInitializingFromEdit] = useState(false);

  const parseSkillChoices = (skillsText) => {
    if (!skillsText) return { isChoice: false, count: 0, options: [], raw: '' };

    const lower = skillsText.toLowerCase();
    const chooseMatch = /choose\s+(\w+)\s+from\s+(.+)$/i.exec(skillsText);

    if (!chooseMatch) return { isChoice: false, count: 0, options: [], raw: skillsText };

    const numberWord = chooseMatch[1].toLowerCase();
    const numberMap = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };
    const count = numberMap[numberWord] || 2;

    const optionsText = chooseMatch[2];
    const options = optionsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const uniqueOptions = [...new Set(options)];

    return { isChoice: uniqueOptions.length > 0, count, options: uniqueOptions, raw: skillsText };
  };

  const loadClasses = async () => {
    setLoadingClasses(true);
    setClassError('');
    try {
      const { data, error } = await supabase
        .from('DND_Classes')
        .select('id, ClassName, DNDMod, Description, HitDice, Prof_Armour, Prof_Weapons, Prof_SavingThrows, Prof_Skills');

      if (error) throw error;

      const filtered = (data || []).filter((row) =>
        typeof row.DNDMod === 'string' && row.DNDMod.toLowerCase().includes(dndMod.toLowerCase())
      );

      setClasses(filtered.map((row) => ({
        id: row.id,
        name: row.ClassName || 'Unnamed Class',
        description: row.Description || '',
        hitDice: row.HitDice || '',
        profArmour: row.Prof_Armour || '',
        profWeapons: row.Prof_Weapons || '',
        profSavingThrows: row.Prof_SavingThrows || '',
        profSkills: row.Prof_Skills || '',
      })));
    } catch (err) {
      console.error('Failed to load classes:', err);
      setClassError('Failed to load classes. Please try again.');
    } finally {
      setLoadingClasses(false);
    }
  };

  useEffect(() => {
    if (showClasses && dndMod) {
      loadClasses();
    }
  }, [showClasses, dndMod]);

  useEffect(() => {
    if (editingClassId && dndMod && classes.length === 0) {
      loadClasses();
    }
  }, [editingClassId, dndMod, classes.length]);

  useEffect(() => {
    if (isInitializingFromEdit) {
      setIsInitializingFromEdit(false);
      return;
    }
    setSkillChoices([]);
  }, [selectedClass?.id]);

  useEffect(() => {
    const fetchInitials = async () => {
      if (!dndMod) return;
      console.log('[Logo Debug] dndMod param:', dndMod);
      try {
        const { data, error } = await supabase
          .from('TTRPGs')
          .select('Initials, id')
          .eq('TTRPG_name', dndMod)
          .single();

        console.log('[Logo Debug] TTRPGs query result:', { data, error });
        if (!error && data) {
          console.log('[Logo Debug] Setting initials to:', data.Initials);
          setInitials(data.Initials);
          setTtrpgId(data.id);
        } else if (error) {
          console.error('[Logo Debug] Error fetching initials:', error);
        }
      } catch (err) {
        console.error('Failed to fetch initials:', err);
      }
    };

    fetchInitials();
  }, [dndMod]);

  useEffect(() => {
    const loadedCharacterId = localStorage.getItem('loadedCharacterId');
    if (!loadedCharacterId) return;

    const fetchCharacter = async () => {
      try {
        const { data, error } = await supabase
          .from('DND_player_character')
          .select('id, Name, Class, ClassLevel, Class_ProfSkills, Str, Dex, Con, Int, Wis, Cha')
          .eq('id', parseInt(loadedCharacterId, 10))
          .single();

        if (error) throw error;

        setCharacterName(data?.Name || '');
        setEditingClassId(data?.Class ?? null);
        setClassLevel(data?.ClassLevel ? String(data.ClassLevel) : '1');
        setIsInitializingFromEdit(true);
        setStatValues({
          STRENGTH: String(data?.Str ?? 8),
          DEXTERITY: String(data?.Dex ?? 8),
          CONSTITUTION: String(data?.Con ?? 8),
          INTELLIGENCE: String(data?.Int ?? 8),
          WISDOM: String(data?.Wis ?? 8),
          CHARISMA: String(data?.Cha ?? 8),
        });

        const profSkills = String(data?.Class_ProfSkills || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        setSkillChoices(profSkills);

        setShowClasses(true);
      } catch (err) {
        console.error('Failed to load character for edit:', err);
      }
    };

    fetchCharacter();
  }, [dndMod]);

  useEffect(() => {
    if (!editingClassId || classes.length === 0) return;
    const found = classes.find((c) => c.id === editingClassId);
    if (found) {
      setSelectedClass(found);
    }
  }, [editingClassId, classes]);

  const statsList = ['STRENGTH', 'DEXTERITY', 'CONSTITUTION', 'INTELLIGENCE', 'WISDOM', 'CHARISMA'];

  const pointCosts = {
    '8': 0,
    '9': 1,
    '10': 2,
    '11': 3,
    '12': 4,
    '13': 5,
    '14': 7,
    '15': 9,
  };

  const calculatePointsRemaining = () => {
    let pointsSpent = 0;
    Object.values(statValues).forEach((value) => {
      pointsSpent += pointCosts[value] || 0;
    });
    return 27 - pointsSpent;
  };

  const saveCharacter = async () => {
    if (!characterName.trim()) {
      alert('Please enter a character name.');
      return;
    }
    if (!selectedClass) {
      alert('Please select a class.');
      return;
    }
    if (!ttrpgId) {
      alert('TTRPG information not loaded. Please try again.');
      return;
    }

    const profSkills = skillChoices.filter(Boolean).join(', ');
    const loadedCharacterId = localStorage.getItem('loadedCharacterId');
    const userId = localStorage.getItem('userId');

    const characterData = {
      Name: characterName,
      Class: selectedClass.id,
      ClassLevel: parseInt(classLevel, 10),
      Class_ProfSkills: profSkills,
      TTRPG: ttrpgId,
      User_ID: userId ? parseInt(userId, 10) : null,
      Str: parseInt(statValues.STRENGTH, 10),
      Dex: parseInt(statValues.DEXTERITY, 10),
      Con: parseInt(statValues.CONSTITUTION, 10),
      Int: parseInt(statValues.INTELLIGENCE, 10),
      Wis: parseInt(statValues.WISDOM, 10),
      Cha: parseInt(statValues.CHARISMA, 10),
    };

    try {
      let error;

      if (loadedCharacterId) {
        // Update existing character
        const { error: updateError } = await supabase
          .from('DND_player_character')
          .update(characterData)
          .eq('id', parseInt(loadedCharacterId, 10));
        error = updateError;
      } else {
        // Insert new character
        const { error: insertError } = await supabase
          .from('DND_player_character')
          .insert([characterData]);
        error = insertError;
      }

      if (error) throw error;

      alert('Character saved successfully!');
      console.log('Character saved to DND_player_character');
    } catch (err) {
      console.error('Failed to save character:', err);
      alert('Failed to save character. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
        <div className="flex flex-col items-center gap-6">
          {initials && (
            <img
              src={`/${initials}_Pictures/Logo.png`}
              alt={`${dndMod} Logo`}
              className="w-64 h-auto"
              onLoad={() => console.log('[Logo Debug] Logo loaded successfully:', `/${initials}_Pictures/Logo.png`)}
              onError={(e) => { 
                console.error('[Logo Debug] Logo failed to load:', `/${initials}_Pictures/Logo.png`);
                e.currentTarget.style.display = 'none'; 
              }}
            />
          )}
          {!initials && <div style={{ color: 'red' }}>[Logo Debug] No initials set for dndMod: {dndMod}</div>}

          <button
            onClick={() => navigate('/select-ttrpg')}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold shadow hover:bg-black transition"
          >
            Select TTRPG
          </button>

          <div
            className="w-full max-w-xl rounded-lg border p-4"
            style={{ backgroundColor: '#dbeafe', borderColor: '#93c5fd' }}
          >
            <label className="block text-lg font-bold text-gray-800" htmlFor="character-name">
              Character Name
            </label>
            <input
              id="character-name"
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              className="mt-2 w-full box-border rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Enter character name"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setShowClasses((prev) => !prev);
                setShowStats(false);
              }}
              className="px-6 py-3 bg-red-400 text-white rounded-lg font-semibold shadow hover:bg-red-500 transition"
            >
              Class
            </button>
            <button
              onClick={() => {
                setShowStats((prev) => !prev);
                setShowClasses(false);
              }}
              className="px-6 py-3 bg-red-400 text-white rounded-lg font-semibold shadow hover:bg-red-500 transition"
            >
              Stats
            </button>
            <button
              onClick={saveCharacter}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition"
            >
              Save
            </button>
          </div>

          {showStats && (
            <div
              className="w-full max-w-xl rounded-lg border p-4"
              style={{ backgroundColor: '#fecaca', borderColor: '#fca5a5' }}
            >
              <h2 className="text-lg font-semibold text-gray-800">Stats</h2>
              <div className="mt-2 mb-3">
                <p className="text-sm font-semibold text-gray-800">Point Buy</p>
                <p className="text-sm text-gray-700">{calculatePointsRemaining()} / 27</p>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                {statsList.map((stat) => {
                  const currentCost = pointCosts[statValues[stat]] || 0;
                  const othersSpent = Object.entries(statValues).reduce((total, [key, val]) => {
                    if (key !== stat) {
                      total += pointCosts[val] || 0;
                    }
                    return total;
                  }, 0);

                  return (
                    <li key={stat} className="flex items-center justify-between gap-3">
                      <span>{stat}</span>
                      <select
                        value={statValues[stat]}
                        onChange={(e) => setStatValues({ ...statValues, [stat]: e.target.value })}
                        className="rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                      >
                        {['8', '9', '10', '11', '12', '13', '14', '15'].map((value) => {
                          const optionCost = pointCosts[value] || 0;
                          const totalCost = othersSpent + optionCost;
                          const isDisabled = totalCost > 27;
                          const costLabel = value === '8' ? '' : ` (-${optionCost} Point${optionCost > 1 ? 's' : ''})`;

                          return (
                            <option key={value} value={value} disabled={isDisabled}>
                              {value}{costLabel}
                            </option>
                          );
                        })}
                      </select>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {showClasses && (
            <div
              className="w-full max-w-xl rounded-lg border p-4 space-y-3"
              style={{ backgroundColor: '#fecaca', borderColor: '#fca5a5' }}
            >
              <h2 className="text-2xl font-bold text-gray-800">Classes ({dndMod})</h2>
              {loadingClasses && <p className="text-sm text-gray-600">Loading...</p>}
              {classError && <p className="text-sm text-red-600">{classError}</p>}

              {!loadingClasses && !classError && (
                selectedClass ? (
                  (() => {
                    const skillChoice = parseSkillChoices(selectedClass.profSkills || '');
                    return (
                      <div className="space-y-2 bg-white border border-gray-200 rounded-md p-3 shadow-sm text-sm text-gray-800">
                        <div className="flex items-center justify-between">
                          <span className="text-4xl font-extrabold" style={{ fontSize: '28px', fontWeight: 800 }}>
                            {selectedClass.name}
                          </span>
                          <button
                            onClick={() => { setSelectedClass(null); setExpandedClassId(null); }}
                            className="text-xs px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                          >
                            Change Class
                          </button>
                        </div>
                        <div className="border-b border-gray-300" />
                        <div className="max-w-xs">
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Class Level</label>
                          <select
                            value={classLevel}
                            onChange={(e) => setClassLevel(e.target.value)}
                            className="w-full rounded border-gray-300 text-sm"
                          >
                            {Array.from({ length: 20 }).map((_, index) => (
                              <option key={`level-${index + 1}`} value={String(index + 1)}>
                                {index + 1}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <div><span className="font-semibold">Hit Dice:</span> {selectedClass.hitDice || '—'}</div>
                          <div><span className="font-semibold">Prof. Armour:</span> {selectedClass.profArmour || '—'}</div>
                          <div><span className="font-semibold">Prof. Weapons:</span> {selectedClass.profWeapons || '—'}</div>
                          <div><span className="font-semibold">Prof. Saving Throws:</span> {selectedClass.profSavingThrows || '—'}</div>
                          {skillChoice.isChoice ? (
                            <div className="space-y-2">
                              <div className="font-semibold">Skill Choices (pick {skillChoice.count})</div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {Array.from({ length: skillChoice.count }).map((_, index) => (
                                  <select
                                    key={`skill-choice-${index}`}
                                    value={skillChoices[index] || ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      const newChoices = [...skillChoices];
                                      newChoices[index] = value;
                                      setSkillChoices(newChoices);
                                    }}
                                    className="w-full rounded border-gray-300 text-sm"
                                  >
                                    <option value="">Select skill</option>
                                    {skillChoice.options.map((opt) => (
                                      <option 
                                        key={`${opt}-${index}`} 
                                        value={opt} 
                                        disabled={skillChoices.includes(opt) && skillChoices[index] !== opt}
                                      >
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div><span className="font-semibold">Skill Proficiencies:</span> {selectedClass.profSkills || '—'}</div>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <>
                    {classes.length === 0 && (
                      <p className="text-sm text-gray-600">No classes found.</p>
                    )}
                    <div className="space-y-3">
                      {classes.map((c) => (
                        <div key={c.id} className="border border-gray-200 rounded-md p-3 bg-white shadow-sm">
                          <button
                            onClick={() => setExpandedClassId((prev) => prev === c.id ? null : c.id)}
                            className="w-full text-left text-gray-800 font-semibold"
                          >
                            {c.name}
                          </button>

                          {expandedClassId === c.id && (
                            <div className="mt-3 space-y-3 text-sm text-gray-700">
                              <p className="whitespace-pre-wrap">{c.description || 'No description provided.'}</p>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => {
                                    setSelectedClass(c);
                                    setExpandedClassId(null);
                                    localStorage.setItem('dndmod_selected_class_id', String(c.id));
                                    console.log('Selected class id:', c.id);
                                  }}
                                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-semibold"
                                >
                                  Select Class
                                </button>
                                <button
                                  onClick={() => setExpandedClassId(null)}
                                  className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition text-sm font-semibold"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
