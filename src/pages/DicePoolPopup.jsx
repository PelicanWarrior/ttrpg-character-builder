import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Parse roll results to compute net successes, failures, advantages, threats, triumphs, despairs
function parseRollResults(poolResults, diffResults) {
  // Helper to count occurrences of a word in an array of result strings
  function countAll(arr, word) {
    return arr.reduce((acc, val) => {
      const str = String(val).toLowerCase();
      // Count actual occurrences of the word, not just presence
      const matches = str.match(new RegExp(word, 'g'));
      return acc + (matches ? matches.length : 0);
    }, 0);
  }
  const all = [
    ...(poolResults || []),
    ...(diffResults || [])
  ];
  // Count each symbol
  const counts = {
    success: countAll(poolResults || [], 'success'),
    failure: countAll(diffResults || [], 'failure'),
    advantage: countAll(poolResults || [], 'advantage'),
    threat: countAll(diffResults || [], 'threat'),
    triumph: countAll(poolResults || [], 'triumph'),
    despair: countAll(diffResults || [], 'despair'),
  };
  // Triumph counts as a success, despair as a failure
  const netSuccess = counts.success + counts.triumph - counts.failure - counts.despair;
  const netFailure = Math.max(0, -netSuccess);
  const netAdvantage = counts.advantage - counts.threat;
  const netThreat = Math.max(0, -netAdvantage);
  return {
    netSuccess: netSuccess > 0 ? netSuccess : 0,
    netFailure,
    netAdvantage: netAdvantage > 0 ? netAdvantage : 0,
    netThreat,
    counts,
  };
}

// Helper for getting die background color
const getDiceColorStyle = (letter) => {
  switch ((letter || '').toUpperCase()) {
    case 'G': return { backgroundColor: '#6bbf59' }; // Ability
    case 'Y': return { backgroundColor: '#ffd24d' }; // Proficiency
    case 'B': return { backgroundColor: '#6fb7ff' }; // Boost
    case 'R': return { backgroundColor: '#ff6b6b' }; // Difficulty
    case 'P': return { backgroundColor: '#b36bff' }; // Challenge
    case 'K': return { backgroundColor: '#333333' }; // Setback
    default: return { backgroundColor: '#e5e7eb' };
  }
};

// Helper for splitting result lines
const splitResultLines = (text) => {
  if (text === null || text === undefined) return [''];
  const s = String(text).trim();
  if (!s.includes(',')) return [s];
  const parts = s.split(',');
  const first = parts[0].trim();
  const rest = parts.slice(1).join(',').trim();
  return [first, rest];
};

export default function DicePoolPopup({ dicePopup, setDicePopup, onUseResult }) {
  const [rollResults, setRollResults] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(0);
  const [diceTable, setDiceTable] = useState({});
  const fallbackDiceNames = {
    G: 'Ability',
    Y: 'Proficiency',
    B: 'Boost',
    P: 'Challenge',
    R: 'Difficulty',
    K: 'Setback',
    W: 'Force',
  };
  const diceMap = Object.fromEntries(
    Object.entries(diceTable).map(([key, value]) => [key, value?.name || fallbackDiceNames[key] || 'Unknown'])
  );

  const collectSides = (row) => {
    const available = [];
    if (!row) return available;
    for (let s = 1; s <= 12; s++) {
      const variants = [`side_${s}`, `side${s}`, `Side${s}`, `Side ${s}`, `side ${s}`];
      for (const key of variants) {
        if (Object.prototype.hasOwnProperty.call(row, key) && row[key] != null) {
          available.push(row[key]);
          break;
        }
      }
    }
    return available.filter(v => v && String(v).trim() !== '');
  };

  // Load dice data from SW_dice table
  useEffect(() => {
    const loadDiceData = async () => {
      try {
        const { data, error } = await supabase
          .from('SW_dice')
          .select('*');
        
        if (error) throw error;

        // Create a map of color -> die data
        const diceMap = {};
        if (data) {
          data.forEach(die => {
            const key = String(die.colour || '').toUpperCase();
            if (!key) return;
            diceMap[key] = {
              name: die.name,
              sides: collectSides(die)
            };
          });
          console.log('Loaded dice data:', diceMap);
        }
        setDiceTable(diceMap);
      } catch (err) {
        console.error('Failed to load dice data:', err);
      }
    };

    loadDiceData();
  }, []);

  useEffect(() => {
    if (!dicePopup) return;
    const hasDetails = Array.isArray(dicePopup.details);
    const hasBoosts = Array.isArray(dicePopup.boosts);
    const hasSetbacks = Array.isArray(dicePopup.setbacks);
    if (!hasDetails) {
      const pool = dicePopup.pool || '';
      const details = pool.split('').map(color => ({
        color,
        name: diceMap[color] || fallbackDiceNames[color] || 'Unknown'
      }));
      setDicePopup(prev => ({
        ...(prev || {}),
        details,
        boosts: hasBoosts ? prev.boosts : [],
        setbacks: hasSetbacks ? prev.setbacks : []
      }));
      return;
    }

    if (Object.keys(diceMap).length > 0) {
      const updated = dicePopup.details.map(d => {
        const resolved = diceMap[d.color] || d.name || fallbackDiceNames[d.color] || 'Unknown';
        return d.name === resolved ? d : { ...d, name: resolved };
      });
      const needsUpdate = updated.some((d, i) => d.name !== dicePopup.details[i].name);
      if (needsUpdate) {
        setDicePopup(prev => ({ ...(prev || {}), details: updated }));
      }
    }

    if (!hasBoosts || !hasSetbacks) {
      setDicePopup(prev => ({
        ...(prev || {}),
        boosts: hasBoosts ? prev.boosts : [],
        setbacks: hasSetbacks ? prev.setbacks : []
      }));
    }
  }, [dicePopup, diceMap, setDicePopup]);

  const rollSingleDieAsync = async (colorLetter) => {
    const key = String(colorLetter || '').toUpperCase();
    const cached = diceTable[key];
    if (cached?.sides?.length) {
      const nonEmptySides = cached.sides.filter(side => side && String(side).trim() !== '');
      if (nonEmptySides.length > 0) {
        return nonEmptySides[Math.floor(Math.random() * nonEmptySides.length)] || 'Blank';
      }
    }

    try {
      const { data: singleRow, error: singleErr } = await supabase
        .from('SW_dice')
        .select('*')
        .eq('colour', key)
        .single();

      let available = !singleErr ? collectSides(singleRow) : [];

      if (available.length === 0) {
        const { data: rows } = await supabase
          .from('SW_dice')
          .select('side, result')
          .eq('colour', key);
        if (rows && rows.length) {
          available = rows.map(r => r.result).filter(Boolean);
        }
      }

      if (available.length === 0) return 'Blank';
      return available[Math.floor(Math.random() * available.length)] || 'Blank';
    } catch (err) {
      console.error('Failed to roll die:', err);
      return 'Blank';
    }
  };

  // Simulate a dice roll
  const handleRoll = async () => {
    if (!dicePopup) return;
    const poolDetails = dicePopup.details || [];
    const boostsArr = dicePopup.boosts || [];
    const setbacksArr = dicePopup.setbacks || [];

    const poolResults = await Promise.all(
      [...poolDetails, ...boostsArr].map(die => rollSingleDieAsync(die.color))
    );
    const diffResults = await Promise.all(
      [
        ...Array(selectedDifficulty).fill({ color: 'P' }),
        ...setbacksArr
      ].map(die => rollSingleDieAsync(die.color))
    );

    setRollResults({ poolResults, diffResults });
  };

  // --- RETURN THE POPUP JSX ---
  if (!dicePopup) return null;

  const poolDetails = dicePopup.details || [];
  const boostsArr = dicePopup.boosts || [];
  const setbacksArr = dicePopup.setbacks || [];

  return (
    <>
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-bold text-lg mb-4" style={{ color: '#000' }}>{dicePopup.label || 'Dice Pool'}</h3>

        {/* MAIN FLEX: left column + outcome panel */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>

        {/* LEFT COLUMN: pool, boosts, setbacks, difficulty, roll */}
        <div style={{ flex: '0 0 420px' }}>

        <div className="flex items-end mb-1" style={{ gap: 8, alignItems: 'flex-end' }}>
                  {poolDetails.map((d, i) => (
                    <div key={i} className="flex flex-col items-center" style={{ minWidth: 56 }}>
                      <button
                        onClick={() => {
                          setDicePopup(prev => {
                            const updated = { ...(prev || {}) };
                            updated.details = [...(prev?.details || [])];
                            updated.details.splice(i, 1);
                            return updated;
                          });
                          setRollResults(null);
                        }}
                        className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs font-bold mb-1"
                      >
                        Remove
                      </button>
                      {d.color === 'Y' ? (
                        <button
                          onClick={() => {
                            setDicePopup(prev => {
                              const updated = { ...(prev || {}) };
                              updated.details = [...(prev?.details || [])];
                              updated.details[i] = { ...updated.details[i], color: 'G', name: diceMap['G'] || 'Ability' };
                              return updated;
                            });
                            setRollResults(null);
                          }}
                          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-bold mb-1"
                        >
                          Downgrade
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setDicePopup(prev => {
                              const updated = { ...(prev || {}) };
                              updated.details = [...(prev?.details || [])];
                              updated.details[i] = { ...updated.details[i], color: 'Y', name: diceMap['Y'] || 'Proficiency' };
                              return updated;
                            });
                            setRollResults(null);
                          }}
                          className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs font-bold mb-1"
                        >
                          Upgrade
                        </button>
                      )}
                      <div className="text-xs font-medium mb-1 text-center" style={{ maxWidth: 80, color: '#000' }}>{d.name || diceMap[d.color] || fallbackDiceNames[d.color] || 'Unknown'}</div>
                      <div
                        aria-hidden
                        style={{
                          width: 48,
                          height: 48,
                          border: '3px solid black',
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 4,
                          ...getDiceColorStyle(d.color),
                        }}
                      >
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', width: '100%' }}>
                            {splitResultLines(rollResults?.poolResults?.[i] || '').map((ln, idx) => (
                              <div key={idx} style={{ fontSize: 12, lineHeight: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 72, color: '#000' }}>
                                {ln}
                              </div>
                            ))}
                          </div>
                      </div>
                    </div>
                  ))}

                  {/* Boost and Threat (setback) controls to the right of top dice */}
                  <div style={{ display: 'flex', gap: 8, marginLeft: 6 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => {
                          setDicePopup(prev => ({ ...(prev || {}), boosts: (prev?.boosts || []).slice(0, -1) }));
                          setRollResults(null);
                        }}
                        className="px-2 py-1 bg-gray-200 text-xs rounded"
                        disabled={boostsArr.length === 0}
                      >
                        - Boost
                      </button>
                      <button
                        onClick={() => {
                          setDicePopup(prev => ({ ...(prev || {}), boosts: [...(prev?.boosts || []), { color: 'B', name: diceMap['B'] || 'Boost' }] }));
                          setRollResults(null);
                        }}
                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
                      >
                        + Boost
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => {
                          setDicePopup(prev => ({ ...(prev || {}), setbacks: (prev?.setbacks || []).slice(0, -1) }));
                          setRollResults(null);
                        }}
                        className="px-2 py-1 bg-gray-200 text-xs rounded"
                        disabled={setbacksArr.length === 0}
                      >
                        - Setback
                      </button>
                      <button
                        onClick={() => {
                          setDicePopup(prev => ({ ...(prev || {}), setbacks: [...(prev?.setbacks || []), { color: 'K', name: diceMap['K'] || 'Setback' }] }));
                          setRollResults(null);
                        }}
                        className="px-2 py-1 bg-black text-white text-xs rounded"
                      >
                        + Setback
                      </button>
                    </div>
                  </div>
                </div>

                {/* Render any boost dice underneath */}
                {boostsArr.length > 0 && (
                  <div className="flex items-end gap-2 mt-2">
                    {boostsArr.map((b, bi) => {
                      const idx = poolDetails.length + bi;
                      return (
                        <div key={bi} className="flex flex-col items-center" style={{ minWidth: 56 }}>
                          <div className="text-xs font-medium mb-1 text-center" style={{ maxWidth: 80, color: '#000' }}>{b.name || diceMap[b.color] || fallbackDiceNames[b.color] || 'Boost'}</div>
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              border: '3px solid black',
                              borderRadius: 8,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 4,
                              ...getDiceColorStyle(b.color),
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', width: '100%' }}>
                              {splitResultLines(rollResults?.poolResults?.[idx] || '').map((ln, idx2) => (
                                <div key={idx2} style={{ fontSize: 12, lineHeight: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 72, color: '#000' }}>
                                  {ln}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-300">
                  <label className="text-xs font-medium mb-2 block" style={{ color: '#000' }}>Difficulty (1-5)</label>
                  <div className="flex gap-2 mb-3 items-center">
                    {[1, 2, 3, 4, 5].map(num => (
                      <button
                        key={num}
                        onClick={() => setSelectedDifficulty(num)}
                        className={`w-8 h-8 rounded font-bold text-sm ${
                          selectedDifficulty === num ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      onClick={() => setSelectedDifficulty(0)}
                      className={`w-8 h-8 rounded font-bold text-sm ${
                        selectedDifficulty === 0 ? 'bg-gray-500 text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      0
                    </button>
                  </div>

                  {/* Render any difficulty dice */}
                  {selectedDifficulty > 0 && (
                    <div className="flex items-end gap-2 mt-2">
                      {Array.from({ length: selectedDifficulty }).map((_, di) => {
                        return (
                          <div key={di} className="flex flex-col items-center" style={{ minWidth: 56 }}>
                            <div className="text-xs font-medium mb-1 text-center" style={{ maxWidth: 80, color: '#000' }}>Difficulty</div>
                            <div
                              style={{
                                width: 48,
                                height: 48,
                                border: '3px solid black',
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 4,
                                ...getDiceColorStyle('P'),
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', width: '100%' }}>
                                {splitResultLines(rollResults?.diffResults?.[di] || '').map((ln, idx2) => (
                                  <div key={idx2} style={{ fontSize: 12, lineHeight: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 72, color: '#000' }}>
                                    {ln}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Render any setback dice underneath difficulty */}
                  {setbacksArr.length > 0 && (
                    <div className="flex items-end gap-2 mt-2">
                      {setbacksArr.map((s, si) => {
                        const idx = (selectedDifficulty || 0) + si;
                        return (
                          <div key={si} className="flex flex-col items-center" style={{ minWidth: 56 }}>
                            <div className="text-xs font-medium mb-1 text-center" style={{ maxWidth: 80, color: '#000' }}>{s.name || diceMap[s.color] || fallbackDiceNames[s.color] || 'Setback'}</div>
                            <div
                              style={{
                                width: 48,
                                height: 48,
                                border: '3px solid black',
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 4,
                                ...getDiceColorStyle(s.color),
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', width: '100%' }}>
                                {splitResultLines(rollResults?.diffResults?.[idx] || '').map((ln, idx2) => (
                                  <div key={idx2} style={{ fontSize: 12, lineHeight: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 72, color: '#000' }}>
                                    {ln}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Roll button */}
                <div className="mt-6">
                  <button
                    onClick={handleRoll}
                    className="w-full px-3 py-2 bg-gray-100 text-black rounded font-bold hover:bg-gray-200"
                  >
                    Roll
                  </button>
                </div>
                </div>

                {/* Outcome panel to the right */}
                <div style={{ flex: '0 0 260px', borderLeft: '1px solid #e5e7eb', paddingLeft: 12 }}>
                  <h4 className="font-bold text-lg mb-2" style={{ color: '#000' }}>Outcome</h4>
                  {!rollResults && (
                    <div className="text-sm text-gray-500">No roll yet. Press <strong>Roll</strong> to show outcome.</div>
                  )}
                  {rollResults && (
                    <div className="text-sm" style={{ color: '#000' }}>
                      {(() => {
                        const parsed = parseRollResults(rollResults.poolResults, rollResults.diffResults);
                        return (
                          <>
                            {parsed.netSuccess > 0 && (
                              <div className="mb-2">
                                {parsed.netSuccess} Success
                                {parsed.counts.triumph > 0 && (
                                  <span className="text-xs text-gray-600"> (includes {parsed.counts.triumph} Triumph)</span>
                                )}
                              </div>
                            )}
                            {parsed.netFailure > 0 && (
                              <div className="mb-2">
                                {parsed.netFailure} Failure
                                {parsed.counts.despair > 0 && (
                                  <span className="text-xs text-gray-600"> (includes {parsed.counts.despair} Despair)</span>
                                )}
                              </div>
                            )}
                            {parsed.netSuccess === 0 && parsed.netFailure === 0 && (
                              <div className="mb-2 text-gray-500">No net success/failure</div>
                            )}
                            {parsed.netAdvantage > 0 && (
                              <div className="mb-2">
                                {parsed.netAdvantage} Advantage
                              </div>
                            )}
                            {parsed.netThreat > 0 && (
                              <div className="mb-2">
                                {parsed.netThreat} Threat
                              </div>
                            )}
                            {parsed.netAdvantage === 0 && parsed.netThreat === 0 && (
                              <div className="mb-2 text-gray-500">No net advantage/threat</div>
                            )}
                          </>
                        );
                      })()}
                      {onUseResult && (
                        <button
                          className="mt-3 px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                          onClick={() => {
                            if (!rollResults) return;
                            const parsed = parseRollResults(rollResults.poolResults, rollResults.diffResults);
                            onUseResult(parsed.netSuccess, parsed.netAdvantage);
                            setDicePopup(null);
                          }}
                        >
                          Use Result
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
        </div>
    </>
  );
}
