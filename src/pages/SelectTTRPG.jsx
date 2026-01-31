
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function SelectTTRPG() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || '';
  const [isAdmin, setIsAdmin] = useState(false);
  const [playerId, setPlayerId] = useState(null);
  const [ttrpgRows, setTtrpgRows] = useState([]);
  const [dicePopup, setDicePopup] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(0);
  const [rollResults, setRollResults] = useState(null);
  const [diceMap, setDiceMap] = useState({});
  const [characters, setCharacters] = useState([]);
  const [showCharacterList, setShowCharacterList] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [showSWCampaigns, setShowSWCampaigns] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTtrpgName, setNewTtrpgName] = useState('');
  const [newTtrpgInitials, setNewTtrpgInitials] = useState('');
  const [newTtrpgDndMod, setNewTtrpgDndMod] = useState(false);
  const [newTtrpgCustomSystems, setNewTtrpgCustomSystems] = useState(false);
  const [pendingLogoFile, setPendingLogoFile] = useState(null);
  const addFormRef = useRef(null);

  useEffect(() => {
    console.log('Hello World');
    const fetchData = async () => {
      const uname = localStorage.getItem('username');
      if (!uname) return;

      const { data: userData } = await supabase
        .from('user')
        .select('id, admin')
        .eq('username', uname)
        .single();
      if (!userData) return;

      setPlayerId(userData.id);
      setIsAdmin(!!userData.admin);

      const [ttrpgQ, diceQ, swCharsQ, swCampsQ, adminCtrlQ] = await Promise.all([
        supabase.from('TTRPGs').select('TTRPG_name, show, DND_Mod, Custom_System, Initials'),
        supabase.from('SW_dice').select('colour, name'),
        supabase
          .from('SW_player_characters')
          .select('id, name, race, career, spec, picture, campaign_joined')
          .eq('user_number', userData.id),
        supabase.from('SW_campaign').select('id, Name'),
        supabase.from('Admin_Control').select('SW_campaigns').eq('id', 1).single(),
      ]);

      const rows = (ttrpgQ.data || []).map(r => ({
        name: r.TTRPG_name,
        show: !!r.show,
        dndMod: !!r.DND_Mod,
        customSystems: !!r.Custom_System,
        initials: r.Initials || '',
      }));
      setTtrpgRows(rows);

      const diceMapping = {};
      diceQ.data?.forEach((row) => {
        diceMapping[row.colour] = row.name;
      });
      setDiceMap(diceMapping);

      setCharacters(swCharsQ.data || []);
      setCampaigns(swCampsQ.data || []);
      if (!adminCtrlQ.error && adminCtrlQ.data) {
        setShowSWCampaigns(!!adminCtrlQ.data.SW_campaigns);
      }

      // Logos are expected in public: /<INITIALS>_Pictures/Logo.png
    };

    fetchData();
  }, []);


  const toggleTTRPGVisibility = async (name, current) => {
    const newVal = !current;
    await supabase.from('TTRPGs').update({ show: newVal }).eq('TTRPG_name', name);
    setTtrpgRows(prev => prev.map(r => r.name === name ? { ...r, show: newVal } : r));
  };

  const shouldShow = (row) => isAdmin || row.show === true;

  const toggleSWCampaignsVisibility = async () => {
    const newVal = !showSWCampaigns;
    const { error } = await supabase
      .from('Admin_Control')
      .update({ SW_campaigns: newVal })
      .eq('id', 1);
    if (!error) setShowSWCampaigns(newVal);
  };

  const initialsFor = (name) => {
    if (!name) return '';
    const words = String(name).trim().split(/\s+/);
    const firstTwo = words.slice(0, 2);
    return firstTwo.map(w => (w[0] || '').toUpperCase()).join('');
  };

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
  };

  const handleRoll = async () => {
    if (!dicePopup || !dicePopup.details) return;

    const poolResults = [];
    const combinedDice = [...(dicePopup.details || []), ...(dicePopup.boosts || [])];

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
        let availableK = [];
        const { data: kRowK, error: kErrK } = await supabase.from('SW_dice').select('*').eq('colour', 'K').single();
        const kRow = !kErrK && kRowK ? kRowK : (await supabase.from('SW_dice').select('*').eq('colour', 'Black').single()).data;
        if (kRow) {
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
          const { data: kRows } = await supabase
            .from('SW_dice')
            .select('side, result')
            .in('colour', ['K', 'Black'])
            .in('side', Array.from({ length: 12 }, (_, i) => i + 1));
          if (kRows && kRows.length > 0) {
            availableK = kRows.map(r => r.result).filter(r => r != null);
          }
        }
        for (let i = 0; i < dicePopup.setbacks.length; i++) {
          diffResults.push(availableK.length === 0 ? '—' : availableK[Math.floor(Math.random() * availableK.length)]);
        }
      } catch (err) {
        for (let i = 0; i < dicePopup.setbacks.length; i++) diffResults.push('—');
      }
    }

    setRollResults({ poolResults, diffResults });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {dicePopup && (
        <div
          style={{
            position: 'absolute',
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
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { setDicePopup(null); setSelectedDifficulty(0); setRollResults(null); }}
            style={{ position: 'absolute', top: 8, right: 8, zIndex: 10000 }}
            className="text-2xl font-bold text-red-600 hover:text-red-800 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md"
            aria-label="Close dice popup"
          >
            ×
          </button>
          <h3 className="font-bold text-lg mb-4" style={{ color: '#000' }}>{dicePopup.label || 'Dice Pool'}</h3>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
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

                <div style={{ display: 'flex', gap: 8, marginLeft: 6 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => {
                        setDicePopup(prev => ({ 
                          ...(prev || {}), 
                          details: [...(prev?.details || []), { color: 'G', name: diceMap['G'] || 'Ability' }] 
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
                        setDicePopup(prev => ({ ...(prev || {}), boosts: [...(prev?.boosts || []), { color: 'B', name: diceMap['B'] || 'Boost' }] }));
                        setRollResults(null);
                      }}
                      className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-bold"
                    >
                      + Boost
                    </button>
                  </div>
                </div>
              </div>

              {dicePopup.boosts && dicePopup.boosts.length > 0 && (
                <div className="flex items-end mt-2" style={{ gap: 8 }}>
                  {dicePopup.boosts.map((b, bi) => {
                    const idx = (dicePopup.details?.length || 0) + bi;
                    return (
                      <div key={bi} className="flex flex-col items-center" style={{ minWidth: 56 }}>
                        <div className="text-xs font-medium mb-1 text-center" style={{ maxWidth: 80, color: '#000' }}>{b.name}</div>
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
                        selectedDifficulty === num
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))}

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
                        setDicePopup(prev => ({ ...(prev || {}), setbacks: [...(prev?.setbacks || []), { color: 'K', name: diceMap['K'] || diceMap['Black'] || 'Setback' }] }));
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

                <div className="mt-3">
                  <button
                    onClick={handleRoll}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700"
                  >
                    Roll
                  </button>
                </div>
              </div>
            </div>

            <div style={{ flex: '0 0 260px', borderLeft: '1px solid #e5e7eb', paddingLeft: 12, marginLeft: 12 }}>
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
      )}

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
      {/* Dynamic TTRPG Grid (Non-DND Mods) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
        {ttrpgRows
          .filter(r => !r.dndMod && !r.customSystems)
          .sort((a, b) => {
            if (a.show === b.show) return (a.name || '').localeCompare(b.name || '');
            return a.show ? -1 : 1;
          })
          .map(row => {
          const initials = row.initials || initialsFor(row.name);
          if (!shouldShow(row)) return null;
          const isSW = initials === 'SW' || row.name === 'Star Wars';
          return (
            <div key={row.name} className="bg-white rounded-3xl shadow-2xl border-4 border-gray-900 overflow-hidden transform hover:scale-105 transition duration-300">
              {isAdmin && (
                <div className="bg-gray-900 text-white p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <input type="checkbox" checked={row.show} onChange={() => toggleTTRPGVisibility(row.name, row.show)} className="w-6 h-6 rounded" />
                    <span className="font-bold text-lg">Show {row.name}</span>
                  </div>
                  {isSW && (
                    <div className="flex items-center gap-4">
                      <input type="checkbox" checked={showSWCampaigns} onChange={toggleSWCampaignsVisibility} className="w-6 h-6 rounded" />
                      <span className="font-bold text-lg">Show SW Campaigns</span>
                    </div>
                  )}
                </div>
              )}
              <div className="p-10 text-center">
                <img
                  src={`/${initials}_Pictures/Logo.png?t=${Date.now()}`}
                  alt={`${row.name} Logo`}
                  className="w-72 mx-auto mb-8"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div className="flex justify-center gap-4 mb-6">
                  <button
                    onClick={() => {
                      if (isSW) {
                        setShowCharacterList(s => !s);
                      } else {
                        navigate(`/ttrpg/${initials}/player_characters`);
                      }
                    }}
                    className="px-10 py-4 bg-gray-900 text-white font-bold text-lg rounded-xl hover:bg-black shadow-lg transition"
                  >
                    Your Characters
                  </button>
                  <button
                    onClick={() => {
                      if (isSW) {
                        navigate('/sweote-character-creator', { state: { create_character: true } });
                      } else if (row.dndMod) {
                        navigate(`/dndmod_character_creator?mod=${encodeURIComponent(row.name)}`);
                      } else {
                        navigate(`/${initials}_character_creator`);
                      }
                    }}
                    className="px-10 py-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 shadow-lg transition"
                  >
                    Create Character
                  </button>
                  {(!isSW) && (
                    <button
                      onClick={() => navigate(`/ttrpg/${initials}/campaign`)}
                      className="px-10 py-4 bg-purple-600 text-white font-bold text-lg rounded-xl hover:bg-purple-700 shadow-lg transition"
                    >
                      Campaign
                    </button>
                  )}
                  {(isSW && (showSWCampaigns || isAdmin)) && (
                    <button
                      onClick={() => navigate('/SW_campaign')}
                      className="px-10 py-4 bg-purple-600 text-white font-bold text-lg rounded-xl hover:bg-purple-700 shadow-lg transition"
                    >
                      Campaign
                    </button>
                  )}
                  {isSW && (
                    <button onClick={openDiceRoll} className="px-10 py-4 bg-blue-500 text-white font-bold text-lg rounded-xl hover:bg-blue-600 shadow-lg transition">Dice Roll</button>
                  )}
                </div>

                {/* Star Wars Character List (inline) */}
                {isSW && showCharacterList && (
                  <div style={{ backgroundColor: '#000000', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {characters.length === 0 ? (
                      <p style={{ color: 'white', textAlign: 'center', padding: '1rem' }}>No characters found</p>
                    ) : (
                      <>
                        {characters
                          .slice()
                          .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                          .map(character => (
                          <div 
                            key={character.id} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '1rem', 
                              padding: '1rem', 
                              backgroundColor: '#000000', 
                              border: '2px solid #dc2626', 
                              borderRadius: '0.5rem',
                              flexWrap: 'wrap'
                            }}
                          >
                          <div style={{ flexShrink: 0 }}>
                            <img
                              src={`/SW_Pictures/Picture ${typeof character.picture === 'number' ? character.picture : 0} Face.png`}
                              alt={character.name}
                              className="rounded object-contain"
                              style={{ width: '80px', height: '100px' }}
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="100"%3E%3Crect fill="%23333" width="80" height="100"/%3E%3C/svg%3E';
                              }}
                            />
                          </div>

                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <h3 style={{ fontWeight: 'bold', fontSize: '1.125rem', color: 'white' }}>{character.name}</h3>
                            <p style={{ fontSize: '0.875rem', color: '#999999' }}>{character.race}</p>
                            <p style={{ fontSize: '0.875rem', color: '#dddddd' }}>{character.career} - {character.spec}</p>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
                            <button 
                              onClick={() => {
                                localStorage.setItem('loadedCharacterId', character.id);
                                navigate('/sweote-character-creator', { state: { create_character: false } });
                              }}
                              className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition text-sm"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => {
                                localStorage.setItem('loadedCharacterId', character.id);
                                navigate('/SW_character_overview');
                              }}
                              className="px-6 py-2 bg-purple-600 text-white font-bold rounded hover:bg-purple-700 transition text-sm"
                            >
                              Overview
                            </button>
                            <button 
                              onClick={async () => {
                                if (!confirm(`Delete ${character.name}?`)) return;
                                const { error: equipErr } = await supabase
                                  .from('SW_character_equipment')
                                  .delete()
                                  .eq('characterID', character.id);
                                if (equipErr) {
                                  console.error('Error deleting character equipment:', equipErr);
                                  alert('Failed to delete equipment for this character.');
                                  return;
                                }
                                const { error } = await supabase
                                  .from('SW_player_characters')
                                  .delete()
                                  .eq('id', character.id);
                                if (error) {
                                  console.error('Error deleting character:', error);
                                  alert('Error deleting character');
                                } else {
                                  setCharacters(prev => prev.filter(c => c.id !== character.id));
                                  const loaded = localStorage.getItem('loadedCharacterId');
                                  if (loaded && String(loaded) === String(character.id)) {
                                    localStorage.removeItem('loadedCharacterId');
                                  }
                                }
                              }}
                              className="px-6 py-2 bg-red-700 text-white font-bold rounded hover:bg-red-800 transition text-sm"
                            >
                              Delete
                            </button>
                          </div>

                          {character.campaign_joined && (() => {
                            const campaign = campaigns.find(c => c.id === character.campaign_joined);
                            return campaign ? (
                              <div style={{ width: '100%' }}>
                                <hr style={{ margin: '0.5rem 0', borderColor: '#444444' }} />
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                  <p style={{ fontSize: '0.875rem', color: '#aaaaaa', margin: 0 }}>Campaign: {campaign.Name}</p>
                                  <button
                                    onClick={async () => {
                                      if (!confirm('Are you sure you want to leave this campaign?')) return;
                                      const { error } = await supabase
                                        .from('SW_player_characters')
                                        .update({ campaign_joined: null })
                                        .eq('id', character.id);
                                      if (error) {
                                        alert('Error leaving campaign');
                                        console.error('Error leaving campaign:', error);
                                      } else {
                                        setCharacters(prev => prev.map(c => c.id === character.id ? { ...c, campaign_joined: null } : c));
                                      }
                                    }}
                                    className="px-3 py-1 bg-gray-600 text-white text-xs font-semibold rounded hover:bg-gray-700 transition"
                                  >
                                    Leave
                                  </button>
                                </div>
                              </div>
                            ) : null;
                          })()}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dungeons and Dragons Mods */}
      {ttrpgRows.some(r => r.dndMod && !r.customSystems && shouldShow(r)) && (
        <div className="mt-16">
          <h2 className="text-4xl font-bold text-purple-700 text-center mb-10">Dungeons and Dragons Mods</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
            {ttrpgRows
              .filter(r => r.dndMod && !r.customSystems)
              .sort((a, b) => {
                if (a.show === b.show) return (a.name || '').localeCompare(b.name || '');
                return a.show ? -1 : 1;
              })
              .map(row => {
              if (!shouldShow(row)) return null;
              const initials = row.initials || initialsFor(row.name);
              return (
                <div key={row.name} className="bg-white rounded-3xl shadow-2xl border-4 border-gray-900 overflow-hidden transform hover:scale-105 transition duration-300">
                  {isAdmin && (
                    <div className="bg-gray-900 text-white p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-4">
                        <input type="checkbox" checked={row.show} onChange={() => toggleTTRPGVisibility(row.name, row.show)} className="w-6 h-6 rounded" />
                        <span className="font-bold text-lg">Show {row.name}</span>
                      </div>
                    </div>
                  )}
                  <div className="p-10 text-center">
                    <img
                      src={`/${initials}_Pictures/Logo.png?t=${Date.now()}`}
                      alt={`${row.name} Logo`}
                      className="w-72 mx-auto mb-8"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="flex justify-center gap-4 mb-6">
                      <button
                        onClick={() => navigate(`/ttrpg/${initials}/player_characters`)}
                        className="px-10 py-4 bg-gray-900 text-white font-bold text-lg rounded-xl hover:bg-black shadow-lg transition"
                      >
                        Your Characters
                      </button>
                      <button
                        onClick={() => {
                          if (row.dndMod) {
                            navigate(`/dndmod_character_creator?mod=${encodeURIComponent(row.name)}`);
                          } else {
                            navigate(`/${initials}_character_creator`);
                          }
                        }}
                        className="px-10 py-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 shadow-lg transition"
                      >
                        Create Character
                      </button>
                      <button
                        onClick={() => navigate(`/ttrpg/${initials}/campaign`)}
                        className="px-10 py-4 bg-purple-600 text-white font-bold text-lg rounded-xl hover:bg-purple-700 shadow-lg transition"
                      >
                        Campaign
                      </button>
                      {/* No dice here; dice is SW-only */}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Systems */}
      {ttrpgRows.some(r => r.customSystems && shouldShow(r)) && (
        <div className="mt-16">
          <h2 className="text-4xl font-bold text-blue-700 text-center mb-10">Custom Systems</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
            {ttrpgRows
              .filter(r => r.customSystems)
              .sort((a, b) => {
                if (a.show === b.show) return (a.name || '').localeCompare(b.name || '');
                return a.show ? -1 : 1;
              })
              .map(row => {
              if (!shouldShow(row)) return null;
              const initials = row.initials || initialsFor(row.name);
              return (
                <div key={row.name} className="bg-white rounded-3xl shadow-2xl border-4 border-gray-900 overflow-hidden transform hover:scale-105 transition duration-300">
                  {isAdmin && (
                    <div className="bg-gray-900 text-white p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-4">
                        <input type="checkbox" checked={row.show} onChange={() => toggleTTRPGVisibility(row.name, row.show)} className="w-6 h-6 rounded" />
                        <span className="font-bold text-lg">Show {row.name}</span>
                      </div>
                    </div>
                  )}
                  <div className="p-10 text-center">
                    <img
                      src={`/${initials}_Pictures/Logo.png?t=${Date.now()}`}
                      alt={`${row.name} Logo`}
                      className="w-72 mx-auto mb-8"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="flex justify-center gap-4 mb-6">
                      <button
                        onClick={() => navigate(`/ttrpg/${initials}/player_characters`)}
                        className="px-10 py-4 bg-gray-900 text-white font-bold text-lg rounded-xl hover:bg-black shadow-lg transition"
                      >
                        Your Characters
                      </button>
                      <button
                        onClick={() => {
                          if (row.dndMod) {
                            navigate(`/dndmod_character_creator?mod=${encodeURIComponent(row.name)}`);
                          } else {
                            navigate(`/${initials}_character_creator`);
                          }
                        }}
                        className="px-10 py-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 shadow-lg transition"
                      >
                        Create Character
                      </button>
                      <button
                        onClick={() => navigate(`/ttrpg/${initials}/campaign`)}
                        className="px-10 py-4 bg-purple-600 text-white font-bold text-lg rounded-xl hover:bg-purple-700 shadow-lg transition"
                      >
                        Campaign
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin: Add TTRPG */}
      {isAdmin && (
        <div ref={addFormRef} className="max-w-3xl mx-auto mt-16 mb-8 p-6 border-4 border-gray-900 rounded-2xl bg-white shadow-xl">
          {!showAddForm ? (
            <div className="text-center">
              <button onClick={() => { setShowAddForm(true); setTimeout(() => addFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 0); }} className="px-10 py-4 bg-gray-900 text-white font-bold text-lg rounded-xl hover:bg-black shadow-lg transition">
                Add TTRPG
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-bold mb-4">Add TTRPG</h3>
              <div className="flex flex-col gap-4">
                <label className="flex items-center gap-3">
                  <span className="w-32 font-semibold">TTRPG</span>
                  <input value={newTtrpgName} onChange={(e) => {
                    setNewTtrpgName(e.target.value);
                    setNewTtrpgInitials(initialsFor(e.target.value));
                  }} className="flex-1 border border-gray-400 rounded px-3 py-2" placeholder="Enter TTRPG name" />
                </label>
                <label className="flex items-center gap-3">
                  <span className="w-32 font-semibold">Initials</span>
                  <input value={newTtrpgInitials} onChange={(e) => setNewTtrpgInitials(e.target.value)} className="flex-1 border border-gray-400 rounded px-3 py-2" placeholder="e.g., MM, SW, AA" />
                </label>
                <label className="flex items-center gap-3">
                  <span className="w-32 font-semibold">DND Mod</span>
                  <input type="checkbox" checked={newTtrpgDndMod} onChange={(e) => setNewTtrpgDndMod(e.target.checked)} />
                </label>
                <label className="flex items-center gap-3">
                  <span className="w-32 font-semibold">Custom Systems</span>
                  <input type="checkbox" checked={newTtrpgCustomSystems} onChange={(e) => setNewTtrpgCustomSystems(e.target.checked)} />
                </label>

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={async () => {
                      const name = newTtrpgName.trim();
                      if (!name) { alert('Please enter a TTRPG name'); return; }
                      try {
                        const { error } = await supabase
                          .from('TTRPGs')
                          .insert({ TTRPG_name: name, Initials: newTtrpgInitials, show: false, DND_Mod: newTtrpgDndMod, Custom_System: newTtrpgCustomSystems });
                        if (error) { alert('Failed to save TTRPG'); console.error(error); return; }

                        const row = { name, initials: newTtrpgInitials, show: false, dndMod: newTtrpgDndMod, customSystems: newTtrpgCustomSystems };
                        setTtrpgRows(prev => [...prev, row]);

                        const initials = initialsFor(name);
                        const wantUpload = window.confirm('Do you want to add a logo now?\nPlace a PNG at public/' + initials + '_Pictures/Logo.png');
                        if (wantUpload) {
                          alert('Please copy your logo file (PNG) to: public/' + initials + '_Pictures/Logo.png, then refresh this page.');
                        }

                        setShowAddForm(false);
                        setNewTtrpgName('');
                        setNewTtrpgInitials('');
                        setNewTtrpgDndMod(false);
                        setNewTtrpgCustomSystems(false);
                      } catch (e) {
                        console.error(e);
                        alert('Unexpected error saving TTRPG');
                      }
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setShowAddForm(false); setNewTtrpgName(''); setNewTtrpgInitials(''); setNewTtrpgDndMod(false); setNewTtrpgCustomSystems(false); }}
                    className="px-6 py-2 bg-gray-500 text-white rounded font-semibold hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
