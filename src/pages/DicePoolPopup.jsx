import { useState } from 'react';

// Parse roll results to compute net successes, failures, advantages, threats, triumphs, despairs
function parseRollResults(poolResults, diffResults) {
  // Helper to count occurrences in an array of result strings
  function countAll(arr, word) {
    return arr.reduce((acc, val) => acc + (String(val).toLowerCase().includes(word) ? 1 : 0), 0);
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
const getDieBackgroundColor = (color) => {
  switch (color) {
    case 'G': return { backgroundColor: '#6bbf59' };
    case 'B': return { backgroundColor: '#6fb7ff' };
    case 'R': return { backgroundColor: '#ff6b6b' };
    case 'P': return { backgroundColor: '#b36bff' };
    case 'K': return { backgroundColor: '#333333' };
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

export default function DicePoolPopup({ dicePopup, setDicePopup }) {
  const [rollResults, setRollResults] = useState(null);
  const [boosts, setBoosts] = useState([]);
  const [setbacks, setSetbacks] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState(1);

  // Simulate a dice roll (placeholder logic)
  const handleRoll = () => {
    // For demo: randomize results for all dice, including boosts and setbacks
    const poolDice = [
      ...dicePopup.pool.split('').map(color => ({ color })),
      ...boosts.map(() => ({ color: 'B' })),
    ];
    const poolResults = poolDice.map(die => {
      if (die.color === 'B') {
        const opts = ['Advantage', 'Success', 'Blank'];
        return opts[Math.floor(Math.random() * opts.length)];
      }
      const opts = ['Success', 'Advantage', 'Blank', 'Triumph'];
      return opts[Math.floor(Math.random() * opts.length)];
    });
    // Difficulty and setbacks
    const diffDice = [
      ...Array(selectedDifficulty).fill({ color: 'P' }),
      ...setbacks.map(() => ({ color: 'K' })),
    ];
    const diffResults = diffDice.map(die => {
      if (die.color === 'K') {
        const opts = ['Threat', 'Blank'];
        return opts[Math.floor(Math.random() * opts.length)];
      }
      const opts = ['Failure', 'Threat', 'Blank', 'Despair'];
      return opts[Math.floor(Math.random() * opts.length)];
    });
    setRollResults({ poolResults, diffResults });
  };

  // --- RETURN THE POPUP JSX ---
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: `${dicePopup.x - 760 + 56}px`,
          top: `${dicePopup.y}px`,
          backgroundColor: 'white',
          border: '3px solid black',
          padding: '18px',
          borderRadius: '10px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          zIndex: 9999,
          minWidth: '760px',
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => setDicePopup(null)}
          style={{ position: 'absolute', top: 8, right: 8, zIndex: 10000 }}
          className="text-2xl font-bold text-red-600 hover:text-red-800 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md"
          aria-label="Close dice popup"
        >
          ×
        </button>
        <h3 className="font-bold text-lg mb-4" style={{ color: '#000' }}>{dicePopup.label || 'Dice Pool'}</h3>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* LEFT COLUMN: dice controls and dice display */}
          <div style={{ flex: '0 0 480px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Ability/Boost controls row and dice */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Ability and Boost dice in a single row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0, marginBottom: 8 }}>
                {/* Ability dice */}
                {/* Table layout for buttons and dice */}
                <table style={{ borderCollapse: 'separate', borderSpacing: '12px 0', marginBottom: 8 }}>
                  <tbody>
                    <tr>
                      {/* Remove/Upgrade buttons for each green die */}
                      {(() => {
                        const poolArr = (dicePopup.pool || '').split('');
                        // Find all green and yellow dice indexes
                        const abilityIndexes = [];
                        poolArr.forEach((d, idx) => { if (d === 'G' || d === 'Y') abilityIndexes.push(idx); });
                        return abilityIndexes.map((poolIdx, i) => {
                          const isYellow = poolArr[poolIdx] === 'Y';
                          return (
                            <td key={'btn'+i} style={{ textAlign: 'center', paddingBottom: 4 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <button style={{ minWidth: 60, marginBottom: 2 }} onClick={() => {
                                  setDicePopup(p => {
                                    const arr = (p.pool || '').split('');
                                    arr.splice(poolIdx, 1);
                                    return { ...p, pool: arr.join('') };
                                  });
                                }}>Remove</button>
                                {isYellow ? (
                                  <button style={{ minWidth: 60 }} onClick={() => {
                                    setDicePopup(p => {
                                      const arr = (p.pool || '').split('');
                                      arr[poolIdx] = 'G';
                                      return { ...p, pool: arr.join('') };
                                    });
                                  }}>Downgrade</button>
                                ) : (
                                  <button style={{ minWidth: 60 }} onClick={() => {
                                    setDicePopup(p => {
                                      const arr = (p.pool || '').split('');
                                      arr[poolIdx] = 'Y';
                                      return { ...p, pool: arr.join('') };
                                    });
                                  }}>Upgrade</button>
                                )}
                              </div>
                            </td>
                          );
                        });
                      })()}
                      {/* Remove button for each boost die */}
                      {boosts.map((_, i) => (
                        <td key={'boost-btn'+i} style={{ textAlign: 'center', paddingBottom: 4 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <button style={{ minWidth: 60, marginBottom: 2 }} onClick={() => setBoosts(b => b.filter((_, j) => j !== i))}>Remove</button>
                          </div>
                        </td>
                      ))}
                      {/* Single set of +Boost/+Ability buttons to the right of boost dice */}
                      <td key="add-controls" style={{ textAlign: 'center', paddingBottom: 4, verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginLeft: 12 }}>
                          <button className="px-2 py-1 bg-gray-100 rounded text-xs mb-1" style={{ minWidth: 60 }} onClick={() => setBoosts(b => [...b, { color: 'B', name: 'Boost' }])}>+ Boost</button>
                          <button className="px-2 py-1 bg-gray-100 rounded text-xs" style={{ minWidth: 60 }} onClick={() => {
                            setDicePopup(p => {
                              const poolArr = (p.pool || '').split('');
                              // Insert 'G' before first boost die, or at end if no boost dice
                              const firstBoostIdx = poolArr.findIndex(d => d === 'B');
                              if (firstBoostIdx === -1) {
                                poolArr.push('G');
                              } else {
                                poolArr.splice(firstBoostIdx, 0, 'G');
                              }
                              return { ...p, pool: poolArr.join('') };
                            });
                          }}>+ Ability</button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      {/* Green dice */}
                      {(() => {
                        const poolArr = (dicePopup.pool || '').split('');
                        // Find all green and yellow dice indexes
                        const abilityIndexes = [];
                        poolArr.forEach((d, idx) => { if (d === 'G' || d === 'Y') abilityIndexes.push(idx); });
                        return abilityIndexes.map((poolIdx, i) => {
                          const dieColor = poolArr[poolIdx];
                          const text = rollResults && rollResults.poolResults && rollResults.poolResults[i] ? rollResults.poolResults[i] : '';
                          const baseFontSize = 16;
                          const minFontSize = 10;
                          const fontSize = Math.max(minFontSize, Math.min(baseFontSize, Math.floor(44 / (text.length || 1))));
                          let bg = '#6bbf59';
                          let border = '#222';
                          let color = '#000';
                          if (dieColor === 'Y') { bg = '#ffe066'; border = '#bfa600'; color = '#000'; }
                          return (
                            <td key={'die'+i} style={{ textAlign: 'center', verticalAlign: 'top' }}>
                              <div style={{ width: 56, height: 56, background: bg, border: `2px solid ${border}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color, padding: 2, margin: '0 auto' }}>
                                <span style={{ width: '100%', height: '100%', textAlign: 'center', fontSize, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>{text}</span>
                              </div>
                            </td>
                          );
                        });
                      })()}
                      {/* Boost dice */}
                      {boosts.map((_, i) => {
                        const text = rollResults && rollResults.poolResults && rollResults.poolResults[dicePopup.pool.length + i] ? rollResults.poolResults[dicePopup.pool.length + i] : '';
                        const baseFontSize = 16;
                        const minFontSize = 10;
                        const fontSize = Math.max(minFontSize, Math.min(baseFontSize, Math.floor(44 / (text.length || 1))));
                        return (
                          <td key={'boost-die'+i} style={{ textAlign: 'center', verticalAlign: 'top' }}>
                            <div style={{ width: 56, height: 56, background: '#6fb7ff', border: '2px solid #222', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#000', padding: 2, margin: '0 auto' }}>
                              <span style={{ width: '100%', height: '100%', textAlign: 'center', fontSize, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>{text}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
                {/* Boost dice are now only rendered in the table above */}
              </div>
              {/* Controls for adding/removing ability/boost dice moved to above each die */}
            </div>
            <hr className="my-2" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="font-semibold" style={{ color: '#000' }}>Difficulty (1-5)</span>
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  onClick={() => setSelectedDifficulty(n)}
                  className={
                    'px-3 py-1 rounded border ' +
                    (selectedDifficulty === n ? 'border-black bg-white font-bold' : 'border-gray-200 bg-gray-100')
                  }
                  style={{ minWidth: 32 }}
                >
                  {n}
                </button>
              ))}
              <button className="px-2 py-1 bg-gray-100 rounded ml-4" onClick={() => setSetbacks(s => s.slice(0, -1))} disabled={setbacks.length === 0}>- Setback</button>
              <button className="px-2 py-1 bg-gray-100 rounded" onClick={() => setSetbacks(s => [...s, { color: 'K', name: 'Setback' }])}>+ Setback</button>
            </div>
            {/* Difficulty and setback dice display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              {[...Array(selectedDifficulty)].map((_, i) => {
                const text = rollResults && rollResults.diffResults && rollResults.diffResults[i] ? rollResults.diffResults[i] : '';
                const baseFontSize = 16;
                const minFontSize = 10;
                const fontSize = Math.max(minFontSize, Math.min(baseFontSize, Math.floor(44 / (text.length || 1))));
                return (
                  <div key={i} style={{ width: 56, height: 56, background: '#b36bff', border: '2px solid #222', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#000', padding: 2 }}>
                    <span style={{ width: '100%', height: '100%', textAlign: 'center', fontSize, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>{text}</span>
                  </div>
                );
              })}
              {setbacks.map((_, i) => {
                const text = rollResults && rollResults.diffResults && rollResults.diffResults[selectedDifficulty + i] ? rollResults.diffResults[selectedDifficulty + i] : '';
                const baseFontSize = 16;
                const minFontSize = 10;
                const fontSize = Math.max(minFontSize, Math.min(baseFontSize, Math.floor(44 / (text.length || 1))));
                return (
                  <div key={i} style={{ width: 56, height: 56, background: '#333', border: '2px solid #222', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', padding: 2 }}>
                    <span style={{ width: '100%', height: '100%', textAlign: 'center', fontSize, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>{text}</span>
                  </div>
                );
              })}
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
                          {parsed.netAdvantage} Advantage (Positive Side Effect)
                        </div>
                      )}
                      {parsed.netThreat > 0 && (
                        <div className="mb-2">
                          {parsed.netThreat} Threat (Negative Side Effect)
                        </div>
                      )}
                      {parsed.netAdvantage === 0 && parsed.netThreat === 0 && (
                        <div className="mb-2 text-gray-500">No net advantage/threat</div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
