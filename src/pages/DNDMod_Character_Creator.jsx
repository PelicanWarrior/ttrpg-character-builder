import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function DNDModCharacterCreator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dndMod = searchParams.get('mod') || '';
  
  const [showClasses, setShowClasses] = useState(false);
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [classError, setClassError] = useState('');
  const [expandedClassId, setExpandedClassId] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [skillChoiceOne, setSkillChoiceOne] = useState('');
  const [skillChoiceTwo, setSkillChoiceTwo] = useState('');
  const [initials, setInitials] = useState('');

  const parseSkillChoices = (skillsText) => {
    if (!skillsText) return { isChoice: false, options: [], raw: '' };

    const marker = 'choose two from';
    const lower = skillsText.toLowerCase();
    const idx = lower.indexOf(marker);

    if (idx === -1) return { isChoice: false, options: [], raw: skillsText };

    const listPart = skillsText.slice(idx + marker.length).replace(/^[^A-Za-z0-9]+/, '');
    const options = listPart
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const uniqueOptions = [...new Set(options)];

    return { isChoice: uniqueOptions.length > 0, options: uniqueOptions, raw: skillsText };
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
    // Reset skill choices when the selected class changes
    setSkillChoiceOne('');
    setSkillChoiceTwo('');
  }, [selectedClass?.id]);

  useEffect(() => {
    // Fetch the initials from TTRPGs table
    const fetchInitials = async () => {
      if (!dndMod) return;
      try {
        const { data, error } = await supabase
          .from('TTRPGs')
          .select('Initials')
          .eq('TTRPG_name', dndMod)
          .single();
        
        if (!error && data?.Initials) {
          setInitials(data.Initials);
        }
      } catch (err) {
        console.error('Failed to fetch initials:', err);
      }
    };

    fetchInitials();
  }, [dndMod]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
        <div className="flex flex-col items-center gap-6">
          {initials && (
            <img
              src={`/${initials}_Pictures/Logo.png`}
              alt={`${dndMod} Logo`}
              className="w-64 h-auto"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}

          <button
            onClick={() => navigate('/select-ttrpg')}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold shadow hover:bg-black transition"
          >
            Select TTRPG
          </button>

          <button
            onClick={() => setShowClasses((prev) => !prev)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
          >
            Class
          </button>

          {showClasses && (
            <div className="w-full max-w-xl bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <h2 className="text-lg font-semibold text-gray-800">Classes ({dndMod})</h2>
              {loadingClasses && <p className="text-sm text-gray-600">Loading...</p>}
              {classError && <p className="text-sm text-red-600">{classError}</p>}

              {!loadingClasses && !classError && (
                selectedClass ? (
                  (() => {
                    const skillChoice = parseSkillChoices(selectedClass.profSkills || '');
                    return (
                      <div className="space-y-2 bg-white border border-gray-200 rounded-md p-3 shadow-sm text-sm text-gray-800">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{selectedClass.name}</span>
                          <button
                            onClick={() => { setSelectedClass(null); setExpandedClassId(null); }}
                            className="text-xs px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                          >
                            Change Class
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <div><span className="font-semibold">Hit Dice:</span> {selectedClass.hitDice || '—'}</div>
                          <div><span className="font-semibold">Prof. Armour:</span> {selectedClass.profArmour || '—'}</div>
                          <div><span className="font-semibold">Prof. Weapons:</span> {selectedClass.profWeapons || '—'}</div>
                          <div><span className="font-semibold">Prof. Saving Throws:</span> {selectedClass.profSavingThrows || '—'}</div>
                          {skillChoice.isChoice ? (
                            <div className="space-y-2">
                              <div className="font-semibold">Skill Choices (pick two)</div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <select
                                  value={skillChoiceOne}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setSkillChoiceOne(value);
                                    if (value && value === skillChoiceTwo) {
                                      setSkillChoiceTwo('');
                                    }
                                  }}
                                  className="w-full rounded border-gray-300 text-sm"
                                >
                                  <option value="">Select skill</option>
                                  {skillChoice.options.map((opt) => (
                                    <option key={`${opt}-first`} value={opt} disabled={skillChoiceTwo === opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  value={skillChoiceTwo}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setSkillChoiceTwo(value);
                                    if (value && value === skillChoiceOne) {
                                      setSkillChoiceOne('');
                                    }
                                  }}
                                  className="w-full rounded border-gray-300 text-sm"
                                >
                                  <option value="">Select skill</option>
                                  {skillChoice.options.map((opt) => (
                                    <option key={`${opt}-second`} value={opt} disabled={skillChoiceOne === opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
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
                                  onClick={() => { setSelectedClass(c); setExpandedClassId(null); }}
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
