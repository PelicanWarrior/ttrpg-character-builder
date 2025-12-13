import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function SelectTTRPG() {
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [staCharacters, setStaCharacters] = useState([]);
  const [selectedStaCharacter, setSelectedStaCharacter] = useState('');
  const [feastlandsCharacters, setFeastlandsCharacters] = useState([]);
  const [selectedFeastlandsCharacter, setSelectedFeastlandsCharacter] = useState('');
  const [animalAdventuresCharacters, setAnimalAdventuresCharacters] = useState([]);
  const [selectedAnimalAdventuresCharacter, setSelectedAnimalAdventuresCharacter] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [playerId, setPlayerId] = useState(null);

  // Dice roll state
  const [dicePopup, setDicePopup] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(0);
  const [rollResults, setRollResults] = useState(null);
  const [diceMap, setDiceMap] = useState({});

  const [ttrpgVisibility, setTtrpgVisibility] = useState({
    'Star Wars': true,
    'Star Trek Adventures': true,
    'Feastlands': false,
    'Animal Adventures': false,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const username = localStorage.getItem('username');
      if (!username) return;

      const { data: userData } = await supabase
        .from('user')
        .select('id, admin')
        .eq('username', username)
        .single();

      if (!userData) return;

      setPlayerId(userData.id);
      setIsAdmin(!!userData.admin);

      const [swRes, staRes, flRes, diceRes] = await Promise.all([
        supabase.from('SW_player_characters').select('id, name, race, career, spec').eq('user_number', userData.id),
        supabase.from('STA_player_characters').select('id, name').eq('playerID', userData.id),
        supabase.from('FL_player_characters').select('id, name').eq('playerID', userData.id),
        supabase.from('SW_dice').select('colour, name'),
      ]);

      setCharacters(swRes.data || []);
      setStaCharacters(staRes.data || []);
      setFeastlandsCharacters(flRes.data || []);

      // Build dice color to name map
      const diceMapping = {};
      diceRes.data?.forEach(row => {
        diceMapping[row.colour] = row.name;
      });
      setDiceMap(diceMapping);

      const { data: ttrpgData } = await supabase
        .from('TTRPGs')
        .select('TTRPG_name, show');

      const visibilityMap = {};
      ttrpgData?.forEach(row => visibilityMap[row.TTRPG_name] = row.show);

      setTtrpgVisibility({
        'Star Wars': visibilityMap['Star Wars'] ?? true,
        'Star Trek Adventures': visibilityMap['Star Trek Adventures'] ?? true,
        'Feastlands': visibilityMap['Feastlands'] ?? false,
        'Animal Adventures': visibilityMap['Animal Adventures'] ?? false,
      });
    };

    fetchData();
  }, []);

  const toggleTTRPGVisibility = async (name, current) => {
    const newVal = !current;
    await supabase.from('TTRPGs').update({ show: newVal }).eq('TTRPG_name', name);
    setTtrpgVisibility(prev => ({ ...prev, [name]: newVal }));
  };

  const handleDeleteCharacter = async () => {
    if (!selectedCharacter) {
      alert('Select a character to delete');
      return;
    }

    const target = characters.find(c => c.id === selectedCharacter);
    if (!target) {
      alert('Character not found');
      return;
    }

    const confirmed = window.confirm(`Delete ${target.name}? This cannot be undone.`);
    if (!confirmed) return;

    // Delete dependent records first to satisfy foreign keys
    const { error: equipErr } = await supabase
      .from('SW_character_equipment')
      .delete()
      .eq('characterID', target.id);
    if (equipErr) {
      console.error('Error deleting character equipment:', equipErr);
      alert('Failed to delete equipment for this character.');
      return;
    }

    const { error } = await supabase.from('SW_player_characters').delete().eq('id', target.id);
    if (error) {
      console.error('Error deleting character:', error);
      alert('Failed to delete character.');
      return;
    }

    setCharacters(prev => prev.filter(c => c.id !== target.id));
    setSelectedCharacter('');

    const loaded = localStorage.getItem('loadedCharacterId');
    if (loaded && String(loaded) === String(target.id)) {
      localStorage.removeItem('loadedCharacterId');
    }
  };

  const shouldShow = (name) => isAdmin || ttrpgVisibility[name] === true;

  const getDiceColorStyle = (letter) => {
    switch ((letter || '').toUpperCase()) {
      case 'G': return { backgroundColor: '#6bbf59' };
      case 'Y': return { backgroundColor: '#ffd24d' };
      case 'B': return { backgroundColor: '#6fb7ff' };
      case 'R': return { backgroundColor: '#ff6b6b' };
      case 'P': return { backgroundColor: '#b36bff' };
      case 'K': return { backgroundColor: '#333333' };
      default: return { backgroundColor: '#e5e7eb' };
    }
  };

  const splitResultLines = (text) => {
    if (text === null || text === undefined) return [''];
    const s = String(text).trim();
    if (!s.includes(',')) return [s];
    const parts = s.split(',');
    const first = parts[0].trim();
    const rest = parts.slice(1).join(',').trim();
    return [first, rest];
  };

  const parseRollResults = (poolResultsArray, diffResultsArray) => {
    const counts = {
      success: 0,
      failure: 0,
      triumph: 0,
      despair: 0,
      advantage: 0,
      threat: 0,
    };

    const parseResultText = (text) => {
      if (!text) return;
      const lc = String(text).toLowerCase();
      
      const successMatches = lc.match(/success/g);
      const failureMatches = lc.match(/failure/g);
      const triumphMatches = lc.match(/triumph/g);
      const despairMatches = lc.match(/despair/g);
      const advantageMatches = lc.match(/advantage/g);
      const threatMatches = lc.match(/threat/g);
      
      if (successMatches) counts.success += successMatches.length;
      if (failureMatches) counts.failure += failureMatches.length;
      if (triumphMatches) counts.triumph += triumphMatches.length;
      if (despairMatches) counts.despair += despairMatches.length;
      if (advantageMatches) counts.advantage += advantageMatches.length;
      if (threatMatches) counts.threat += threatMatches.length;
    };

    (poolResultsArray || []).forEach(r => parseResultText(r));
    (diffResultsArray || []).forEach(r => parseResultText(r));

    const totalSuccess = counts.success + counts.triumph;
    const totalFailure = counts.failure + counts.despair;

    let netSuccess = 0;
    let netFailure = 0;
    if (totalSuccess > totalFailure) {
      netSuccess = totalSuccess - totalFailure;
    } else if (totalFailure > totalSuccess) {
      netFailure = totalFailure - totalSuccess;
    }

    let netAdvantage = 0;
    let netThreat = 0;
    if (counts.advantage > counts.threat) {
      netAdvantage = counts.advantage - counts.threat;
    } else if (counts.threat > counts.advantage) {
      netThreat = counts.threat - counts.advantage;
    }

    return {
      counts,
      netSuccess,
      netFailure,
      netAdvantage,
      netThreat,
      totalSuccess,
      totalFailure,
    };
  };

  const openDiceRoll = (event) => {
    event.stopPropagation();
    // Position popup at left edge of screen
    console.log('Opening dice roll popup');
    setDicePopup({
      pool: '',
      details: [],
      x: 0,
      y: 150,
      label: 'Dice Roll',
      boosts: [],
      setbacks: []
    });
    setRollResults(null);
    console.log('Dice popup state set');
  };

  const handleRoll = async () => {
    if (!dicePopup || !dicePopup.details) return;

    const poolResults = [];
    const combinedDice = [...(dicePopup.details || []), ...((dicePopup.boosts || []))];

    for (const die of combinedDice) {
      try {
        const { data: singleRow, error: singleErr } = await supabase
          .from('SW_dice')
          .select('*')
          .eq('colour', die.color)
          .single();

        let available = [];

        if (!singleErr && singleRow) {
          for (let s = 1; s <= 12; s++) {
            const variants = [`side${s}`, `Side${s}`, `Side ${s}`, `side ${s}`];
            for (const key of variants) {
              if (Object.prototype.hasOwnProperty.call(singleRow, key) && singleRow[key] != null) {
                available.push(singleRow[key]);
                break;
              }
            }
          }
        }

        if (available.length === 0) {
          const { data: rows } = await supabase
            .from('SW_dice')
            .select('side, result')
            .eq('colour', die.color)
            .in('side', Array.from({ length: 12 }, (_, i) => i + 1));
          if (rows && rows.length > 0) {
            available = rows.map(r => r.result).filter(r => r != null);
          }
        }

        poolResults.push(available.length === 0 ? '—' : available[Math.floor(Math.random() * available.length)]);
      } catch (err) {
        poolResults.push('—');
      }
    }

    const diffResults = [];
    if (selectedDifficulty > 0) {
      try {
        const { data: pRow, error: pErr } = await supabase.from('SW_dice').select('*').eq('colour', 'P').single();
        let availableP = [];
        if (!pErr && pRow) {
          for (let s = 1; s <= 12; s++) {
            const variants = [`side${s}`, `Side${s}`, `Side ${s}`, `side ${s}`];
            for (const key of variants) {
              if (Object.prototype.hasOwnProperty.call(pRow, key) && pRow[key] != null) {
                availableP.push(pRow[key]);
                break;
              }
            }
          }
        }

        if (availableP.length === 0) {
          const { data: prowRows } = await supabase
            .from('SW_dice')
            .select('side, result')
            .eq('colour', 'P')
            .in('side', Array.from({ length: 12 }, (_, i) => i + 1));
          if (prowRows && prowRows.length > 0) availableP = prowRows.map(r => r.result).filter(r => r != null);
        }

        for (let i = 0; i < selectedDifficulty; i++) {
          diffResults.push(availableP.length === 0 ? '—' : availableP[Math.floor(Math.random() * availableP.length)]);
        }
      } catch (err) {
        for (let i = 0; i < selectedDifficulty; i++) diffResults.push('—');
      }
    }

    if (dicePopup.setbacks && dicePopup.setbacks.length > 0) {
      try {
        const { data: kRow, error: kErr } = await supabase.from('SW_dice').select('*').eq('colour', 'Black').single();
        let availableK = [];
        if (!kErr && kRow) {
          for (let s = 1; s <= 12; s++) {
            const variants = [`side${s}`, `Side${s}`, `Side ${s}`, `side ${s}`];
            for (const key of variants) {
              if (Object.prototype.hasOwnProperty.call(kRow, key) && kRow[key] != null) {
                availableK.push(kRow[key]);
                break;
              }
            }
          }
        }

        if (availableK.length === 0) {
          const { data: krowRows } = await supabase.from('SW_dice').select('*').eq('colour', 'Black');
          if (krowRows && krowRows.length > 0) {
            for (const row of krowRows) {
              for (let s = 1; s <= 12; s++) {
                const variants = [`side${s}`, `Side${s}`, `Side ${s}`, `side ${s}`];
                for (const key of variants) {
                  if (Object.prototype.hasOwnProperty.call(row, key) && row[key] != null) {
                    availableK.push(row[key]);
                    break;
                  }
                }
              }
            }
          }
        }

        for (let i = 0; i < dicePopup.setbacks.length; i++) {
          diffResults.push(availableK.length === 0 ? '—' : availableK[Math.floor(Math.random() * availableK.length)]);
        }
      } catch (err) {
        for (let i = 0; i < (dicePopup.setbacks?.length || 0); i++) diffResults.push('—');
      }
    }

    setRollResults({ poolResults, diffResults });
  };

  useEffect(() => {
    if (!dicePopup) return;
    const handler = () => setDicePopup(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [dicePopup]);

  const username = localStorage.getItem('username') || 'Guest';

  console.log('dicePopup state:', dicePopup);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 py-12 px-6 relative">
      {/* Dice Roll Popup */}
      {dicePopup && (
        <div
          style={{
            position: 'fixed',
            left: `${dicePopup.x}px`,
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
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {console.log('Rendering dice popup!')}
          <button
            onClick={() => setDicePopup(null)}
            style={{ position: 'absolute', top: 8, right: 8, zIndex: 10000 }}
            className="text-2xl font-bold text-red-600 hover:text-red-800 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md"
            aria-label="Close dice popup"
          >
            ×
          </button>
          <h3 className="font-bold text-lg mb-4" style={{ color: '#000' }}>{dicePopup.label || 'Dice Pool'}</h3>

          {/* MAIN FLEX: left column + outcome panel */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>

            {/* LEFT COLUMN: pool, boosts, setbacks, difficulty, roll */}
            <div style={{ flex: '0 0 420px' }}>

              <div className="flex items-end mb-1" style={{ gap: 8, alignItems: 'flex-end' }}>
                {dicePopup.details.map((d, i) => (
                  <div key={i} className="flex flex-col items-center" style={{ minWidth: 56 }}>
                    <button
                      onClick={() => {
                        setDicePopup(prev => {
                          const updated = { ...prev };
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
                            const updated = { ...prev };
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
                            const updated = { ...prev };
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
                    <div className="text-xs font-medium mb-1 text-center" style={{ maxWidth: 80, color: '#000' }}>{d.name}</div>
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

                {/* Boost controls to the right of dice */}
                <div style={{ display: 'flex', gap: 8, marginLeft: 6 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => {
                        setDicePopup(prev => ({
                          ...(prev || {}),
                          details: [
                            ...(prev?.details || []),
                            { color: 'G', name: diceMap['G'] || 'Ability' },
                          ],
                        }));
                        setRollResults(null);
                      }}
                      className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-bold"
                    >
                      + Ability
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    {dicePopup?.boosts && dicePopup.boosts.length > 0 && (
                      <button
                        onClick={() => {
                          setDicePopup(prev => {
                            const cur = prev || {};
                            const curBoosts = cur.boosts || [];
                            return { ...cur, boosts: curBoosts.slice(0, -1) };
                          });
                          setRollResults(null);
                        }}
                        className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-bold"
                      >
                        - Boost
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setDicePopup(prev => ({
                          ...(prev || {}),
                          boosts: [
                            ...(prev?.boosts || []),
                            { color: 'B', name: diceMap['B'] || 'Boost' },
                          ],
                        }));
                        setRollResults(null);
                      }}
                      className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-bold"
                    >
                      + Boost
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-300">
                <label className="text-xs font-medium mb-2 block" style={{ color: '#000' }}>Difficulty (1-5)</label>
                <div className="flex gap-2 mb-3 items-center">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      onClick={() => setSelectedDifficulty(num)}
                      className={`w-8 h-8 rounded font-bold text-sm ${
                        selectedDifficulty === num
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))}

                  {/* Setback controls to the right of difficulty numbers */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 8 }}>
                    {dicePopup?.setbacks && dicePopup.setbacks.length > 0 && (
                      <button
                        onClick={() => {
                          setDicePopup(prev => {
                            const cur = prev || {};
                            const curSetbacks = cur.setbacks || [];
                            return { ...cur, setbacks: curSetbacks.slice(0, -1) };
                          });
                          setRollResults(null);
                        }}
                        className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-bold"
                      >
                        - Setback
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setDicePopup(prev => ({
                          ...(prev || {}),
                          setbacks: [
                            ...(prev?.setbacks || []),
                            { color: 'K', name: diceMap['K'] || diceMap['Black'] || 'Setback' },
                          ],
                        }));
                        setRollResults(null);
                      }}
                      className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-800 text-xs font-bold"
                    >
                      + Setback
                    </button>
                  </div>
                </div>
                {selectedDifficulty > 0 && (
                  <div className="flex items-end gap-2">
                    {Array.from({ length: selectedDifficulty }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: 48,
                          height: 48,
                          border: '3px solid black',
                          borderRadius: 6,
                          backgroundColor: '#b36bff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '700',
                          padding: 4,
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                          {splitResultLines(rollResults?.diffResults?.[i] || '').map((ln, idx) => (
                            <div key={idx} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 48, lineHeight: '1rem' }}>
                              {ln}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Render any setback dice underneath difficulty */}
                {dicePopup?.setbacks && dicePopup.setbacks.length > 0 && (
                  <div className="flex items-end gap-2 mt-2">
                    {dicePopup.setbacks.map((s, si) => {
                      const idx = (selectedDifficulty || 0) + si;
                      return (
                        <div
                          key={si}
                          style={{
                            width: 48,
                            height: 48,
                            border: '3px solid black',
                            borderRadius: 6,
                            backgroundColor: '#333333',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: '700',
                            padding: 4,
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                            {splitResultLines(rollResults?.diffResults?.[idx] || '').map((ln, idx2) => (
                              <div key={idx2} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 48, lineHeight: '1rem', color: '#fff' }}>
                                {ln}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={handleRoll}
                className="w-full px-4 py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700"
              >
                Roll
              </button>
            </div>

            {/* OUTCOME PANEL */}
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold text-center text-gray-800 mb-4">Select TTRPG</h1>
        <p className="text-center text-2xl mb-12 text-gray-700">
          Welcome {username}
          {isAdmin && <span className="text-red-600 font-bold"> (Admin)</span>}
        </p>

        {/* Settings and Log Out Buttons */}
        <div className="flex justify-center gap-6 mb-20">
          <button onClick={() => navigate('/settings', { state: { playerId } })} className="px-12 py-4 bg-gray-800 text-white text-lg font-bold rounded-xl hover:bg-gray-900 shadow-lg transition">
            Settings
          </button>
          <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="px-12 py-4 bg-red-600 text-white text-lg font-bold rounded-xl hover:bg-red-700 shadow-lg transition">
            Log Out
          </button>
        </div>

        {/* TOP ROW: Star Wars + Star Trek Adventures (NO HEADER) */}
        {(shouldShow('Star Wars') || shouldShow('Star Trek Adventures')) && (
          <div className="mb-20">
            {/* Removed "Sci-Fi Adventures" header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

              {/* STAR WARS */}
              {shouldShow('Star Wars') && (
                <div className="bg-white rounded-3xl shadow-2xl border-4 border-gray-900 overflow-hidden transform hover:scale-105 transition duration-300">
                  {isAdmin && (
                    <div className="bg-gray-900 text-white p-4 flex items-center gap-4">
                      <input type="checkbox" checked={ttrpgVisibility['Star Wars']} onChange={() => toggleTTRPGVisibility('Star Wars', ttrpgVisibility['Star Wars'])} className="w-6 h-6 rounded" />
                      <span className="font-bold text-lg">Show Star Wars</span>
                    </div>
                  )}
                  <div className="p-10 text-center">
                    <img src="/Star Wars.png" alt="Star Wars" className="w-72 mx-auto mb-8" />
                    <select className="w-full max-w-md mx-auto border-4 border-gray-800 rounded-xl px-6 py-4 text-lg mb-8 bg-white" value={selectedCharacter} onChange={(e) => setSelectedCharacter(e.target.value)}>
                      <option value="">Select Character</option>
                      {characters.map(c => {
                        const displayName = c.race || c.career || c.spec
                          ? `${c.name} (${c.race} - ${c.career} ${c.spec})`
                          : c.name;
                        return <option key={c.id} value={c.id}>{displayName}</option>;
                      })}
                    </select>
                    <div className="flex justify-center gap-6">
                      <button onClick={handleDeleteCharacter} className="px-10 py-5 bg-red-700 text-white font-bold text-xl rounded-xl hover:bg-red-800 shadow-lg transition">Delete</button>
                      <button onClick={() => { if (!selectedCharacter) return alert('Select a character'); localStorage.setItem('loadedCharacterId', selectedCharacter); navigate('/sweote-character-creator', { state: { create_character: false } }); }} className="px-10 py-5 bg-blue-600 text-white font-bold text-xl rounded-xl hover:bg-blue-700 shadow-lg transition">Edit</button>
                      <button onClick={() => { if (!selectedCharacter) return alert('Select a character'); localStorage.setItem('loadedCharacterId', selectedCharacter); navigate('/SW_character_overview'); }} className="px-10 py-5 bg-purple-600 text-white font-bold text-xl rounded-xl hover:bg-purple-700 shadow-lg transition">Overview</button>
                      <button onClick={() => navigate('/sweote-character-creator', { state: { create_character: true } })} className="px-10 py-5 bg-green-600 text-white font-bold text-xl rounded-xl hover:bg-green-700 shadow-lg transition">Create</button>
                      <button onClick={openDiceRoll} className="px-10 py-5 bg-blue-500 text-white font-bold text-xl rounded-xl hover:bg-blue-600 shadow-lg transition">Dice Roll</button>
                    </div>
                  </div>
                </div>
              )}

              {/* STAR TREK ADVENTURES */}
              {shouldShow('Star Trek Adventures') && (
                <div className="bg-white rounded-3xl shadow-2xl border-4 border-gray-900 overflow-hidden transform hover:scale-105 transition duration-300">
                  {isAdmin && (
                    <div className="bg-gray-900 text-white p-4 flex items-center gap-4">
                      <input type="checkbox" checked={ttrpgVisibility['Star Trek Adventures']} onChange={() => toggleTTRPGVisibility('Star Trek Adventures', ttrpgVisibility['Star Trek Adventures'])} className="w-6 h-6 rounded" />
                      <span className="font-bold text-lg">Show Star Trek Adventures</span>
                    </div>
                  )}
                  <div className="p-10 text-center">
                    <img src="/Star Trek Adventures.png" alt="Star Trek Adventures" className="w-72 mx-auto mb-8" />
                    <select className="w-full max-w-md mx-auto border-4 border-gray-800 rounded-xl px-6 py-4 text-lg mb-8 bg-white" value={selectedStaCharacter} onChange={(e) => setSelectedStaCharacter(e.target.value)}>
                      <option>Select Character</option>
                      {staCharacters.map(c => <option key={c.id}>{c.name}</option>)}
                    </select>
                    <div className="flex justify-center gap-6">
                      <button onClick={() => { if (!selectedStaCharacter) return alert('Select a character'); const char = staCharacters.find(c => c.name === selectedStaCharacter); localStorage.setItem('loadedStaCharacterId', char.id); navigate('/sta-character-creator', { state: { create_character: false } }); }} className="px-10 py-5 bg-blue-600 text-white font-bold text-xl rounded-xl hover:bg-blue-700 shadow-lg transition">Edit</button>
                      <button onClick={() => { if (!selectedStaCharacter) return alert('Select a character'); const char = staCharacters.find(c => c.name === selectedStaCharacter); localStorage.setItem('loadedStaCharacterId', char.id); navigate('/STA_character_overview'); }} className="px-10 py-5 bg-purple-600 text-white font-bold text-xl rounded-xl hover:bg-purple-700 shadow-lg transition">Overview</button>
                      <button onClick={() => navigate('/sta-character-creator', { state: { create_character: true } })} className="px-10 py-5 bg-green-600 text-white font-bold text-xl rounded-xl hover:bg-green-700 shadow-lg transition">Create</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* D&D MODS ROW */}
        {(shouldShow('Feastlands') || shouldShow('Animal Adventures')) && (
          <div>
            <h2 className="text-5xl font-bold text-purple-700 text-center mb-16">
              Dungeons and Dragons Mods
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-6xl mx-auto">
              {shouldShow('Feastlands') && (
                <div className="bg-white rounded-3xl shadow-2xl border-4 border-gray-900 overflow-hidden transform hover:scale-105 transition duration-300">
                  {isAdmin && (
                    <div className="bg-gray-900 text-white p-4 flex items-center gap-4">
                      <input type="checkbox" checked={ttrpgVisibility['Feastlands']} onChange={() => toggleTTRPGVisibility('Feastlands', ttrpgVisibility['Feastlands'])} className="w-6 h-6 rounded" />
                      <span className="font-bold text-lg">Show Feastlands</span>
                    </div>
                  )}
                  <div className="p-10 text-center">
                    <img src="/Feastlands.png" alt="Feastlands" className="w-72 mx-auto mb-8" />
                    <select className="w-full max-w-md mx-auto border-4 border-gray-800 rounded-xl px-6 py-4 text-lg mb-8 bg-white" value={selectedFeastlandsCharacter} onChange={(e) => setSelectedFeastlandsCharacter(e.target.value)}>
                      <option>Select Character</option>
                      {feastlandsCharacters.map(c => <option key={c.id}>{c.name}</option>)}
                    </select>
                    <div className="flex justify-center gap-6">
                      <button onClick={() => { if (!selectedFeastlandsCharacter) return alert('Select a character'); const char = feastlandsCharacters.find(c => c.name === selectedFeastlandsCharacter); localStorage.setItem('loadedFeastlandsCharacterId', char.id); navigate('/feastlands-character-creator', { state: { create_character: false } }); }} className="px-10 py-5 bg-blue-600 text-white font-bold text-xl rounded-xl hover:bg-blue-700 shadow-lg transition">Edit</button>
                      <button onClick={() => { if (!selectedFeastlandsCharacter) return alert('Select a character'); const char = feastlandsCharacters.find(c => c.name === selectedFeastlandsCharacter); localStorage.setItem('loadedFeastlandsCharacterId', char.id); navigate('/FL_character_overview'); }} className="px-10 py-5 bg-purple-600 text-white font-bold text-xl rounded-xl hover:bg-purple-700 shadow-lg transition">Overview</button>
                      <button onClick={() => navigate('/feastlands-character-creator', { state: { create_character: true } })} className="px-10 py-5 bg-green-600 text-white font-bold text-xl rounded-xl hover:bg-green-700 shadow-lg transition">Create</button>
                    </div>
                  </div>
                </div>
              )}

              {shouldShow('Animal Adventures') && (
                <div className="bg-white rounded-3xl shadow-2xl border-4 border-gray-900 overflow-hidden transform hover:scale-105 transition duration-300">
                  {isAdmin && (
                    <div className="bg-gray-900 text-white p-4 flex items-center gap-4">
                      <input type="checkbox" checked={ttrpgVisibility['Animal Adventures']} onChange={() => toggleTTRPGVisibility('Animal Adventures', ttrpgVisibility['Animal Adventures'])} className="w-6 h-6 rounded" />
                      <span className="font-bold text-lg">Show Animal Adventures</span>
                    </div>
                  )}
                  <div className="p-10 text-center">
                    <img src="/Animal Adventures.png" alt="Animal Adventures" className="w-72 mx-auto mb-8" />
                    <select disabled className="w-full max-w-md mx-auto border-4 border-gray-400 rounded-xl px-6 py-4 text-lg mb-8 bg-gray-100 cursor-not-allowed">
                      <option>No characters yet</option>
                    </select>
                    <div className="flex justify-center gap-6">
                      <button disabled className="px-10 py-5 bg-gray-500 text-gray-300 font-bold text-xl rounded-xl cursor-not-allowed">Edit</button>
                      <button disabled className="px-10 py-5 bg-gray-500 text-gray-300 font-bold text-xl rounded-xl cursor-not-allowed">Overview</button>
                      <button disabled className="px-10 py-5 bg-gray-500 text-gray-300 font-bold text-xl rounded-xl cursor-not-allowed">Create</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}