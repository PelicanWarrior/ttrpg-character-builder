import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function SelectTTRPG() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || '';
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [showCharacterList, setShowCharacterList] = useState(false);
  const [characterPictures, setCharacterPictures] = useState({});
  const [staCharacters, setStaCharacters] = useState([]);
  const [selectedStaCharacter, setSelectedStaCharacter] = useState('');
  const [feastlandsCharacters, setFeastlandsCharacters] = useState([]);
  const [selectedFeastlandsCharacter, setSelectedFeastlandsCharacter] = useState('');
  const [animalAdventuresCharacters, setAnimalAdventuresCharacters] = useState([]);
  const [selectedAnimalAdventuresCharacter, setSelectedAnimalAdventuresCharacter] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [playerId, setPlayerId] = useState(null);
  const [showSWCampaigns, setShowSWCampaigns] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [ttrpgVisibility, setTtrpgVisibility] = useState({
    'Star Wars': true,
    'Star Trek Adventures': true,
    Feastlands: false,
    'Animal Adventures': false,
  });

  // Dice roll state
  const [dicePopup, setDicePopup] = useState(null);
  const [showDiceModal, setShowDiceModal] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState(0);
  const [rollResults, setRollResults] = useState(null);
  const [diceMap, setDiceMap] = useState({});

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

      const [swRes, staRes, flRes, diceRes, campaignRes] = await Promise.all([
        supabase
          .from('SW_player_characters')
          .select('id, name, race, career, spec, picture, campaign_joined')
          .eq('user_number', userData.id),
        supabase.from('STA_player_characters').select('id, name').eq('playerID', userData.id),
        supabase.from('FL_player_characters').select('id, name').eq('playerID', userData.id),
        supabase.from('SW_dice').select('colour, name'),
        supabase.from('SW_campaign').select('id, Name'),
      ]);

      setCharacters(swRes.data || []);
      setCampaigns(campaignRes.data || []);
      setStaCharacters(staRes.data || []);
      setFeastlandsCharacters(flRes.data || []);

      // Build dice color to name map
      const diceMapping = {};
      diceRes.data?.forEach((row) => {
        diceMapping[row.colour] = row.name;
      });
      setDiceMap(diceMapping);

      const { data: ttrpgData } = await supabase.from('TTRPGs').select('TTRPG_name, show');

      const visibilityMap = {};
      ttrpgData?.forEach((row) => (visibilityMap[row.TTRPG_name] = row.show));

      setTtrpgVisibility({
        'Star Wars': visibilityMap['Star Wars'] ?? true,
        'Star Trek Adventures': visibilityMap['Star Trek Adventures'] ?? true,
        Feastlands: visibilityMap['Feastlands'] ?? false,
        'Animal Adventures': visibilityMap['Animal Adventures'] ?? false,
      });

      // Fetch campaign visibility setting
      const { data: adminControlData } = await supabase.from('Admin_Control').select('SW_campaigns').single();
      if (adminControlData) {
        setShowSWCampaigns(adminControlData.SW_campaigns ?? false);
      }
    };

    fetchData();
  }, []);

  const toggleTTRPGVisibility = async (name, current) => {
    const newVal = !current;
    await supabase.from('TTRPGs').update({ show: newVal }).eq('TTRPG_name', name);
    setTtrpgVisibility(prev => ({ ...prev, [name]: newVal }));
  };

  const toggleSWCampaignsVisibility = async () => {
    const newVal = !showSWCampaigns;
    await supabase.from('Admin_Control').update({ SW_campaigns: newVal });
    setShowSWCampaigns(newVal);
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
    setShowDiceModal(true);
    setRollResults(null);
    console.log('Dice popup state set');
  };

  const handleRoll = async () => {
    if (!dicePopup || !dicePopup.details) return;

    const poolResults = [];
    const combinedDice = [...(dicePopup.details || []), ...(dicePopup.boosts || [])];

    // Roll ability/proficiency/boost dice
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
    // Roll difficulty dice (P)
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

    // Roll setback dice (K/Black)
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
        {showDiceModal && dicePopup && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-60 py-12 px-4" onClick={() => { setDicePopup(null); setRollResults(null); setShowDiceModal(false); }}>
            <div
              className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-xl font-bold text-gray-900">Star Wars Dice Roller</h3>
                <button
                  className="px-3 py-1 text-sm font-semibold text-white bg-red-600 rounded hover:bg-red-700"
                  onClick={() => { setDicePopup(null); setRollResults(null); setSelectedDifficulty(0); setShowDiceModal(false); }}
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-6">
                {/* Pool Builder */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <button
                      className="px-3 py-2 bg-green-600 text-white rounded font-semibold text-sm hover:bg-green-700"
                      onClick={() => {
                        setDicePopup(prev => ({ ...(prev || {}), details: [...(prev?.details || []), { color: 'G', name: diceMap['G'] || 'Ability' }] }));
                        setRollResults(null);
                      }}
                    >
                      + Ability (G)
                    </button>
                    <button
                      className="px-3 py-2 bg-yellow-500 text-white rounded font-semibold text-sm hover:bg-yellow-600"
                      onClick={() => {
                        setDicePopup(prev => ({ ...(prev || {}), details: [...(prev?.details || []), { color: 'Y', name: diceMap['Y'] || 'Proficiency' }] }));
                        setRollResults(null);
                      }}
                    >
                      + Proficiency (Y)
                    </button>
                    <button
                      className="px-3 py-2 bg-blue-500 text-white rounded font-semibold text-sm hover:bg-blue-600"
                      onClick={() => {
                        setDicePopup(prev => ({ ...(prev || {}), boosts: [...(prev?.boosts || []), { color: 'B', name: diceMap['B'] || 'Boost' }] }));
                        setRollResults(null);
                      }}
                    >
                      + Boost (B)
                    </button>
                    <button
                      className="px-3 py-2 bg-gray-700 text-white rounded font-semibold text-sm hover:bg-gray-800"
                      onClick={() => {
                        setDicePopup(prev => ({ ...(prev || {}), setbacks: [...(prev?.setbacks || []), { color: 'K', name: diceMap['K'] || 'Setback' }] }));
                        setRollResults(null);
                      }}
                    >
                      + Setback (K)
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700">Difficulty:</span>
                      {[0,1,2,3,4,5].map(n => (
                        <button
                          key={n}
                          className={`w-8 h-8 rounded text-sm font-bold ${selectedDifficulty === n ? 'bg-purple-700 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                          onClick={() => { setSelectedDifficulty(n); setRollResults(null); }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dice Preview */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[...(dicePopup.details || []), ...(dicePopup.boosts || [])].map((die, idx) => (
                      <div key={`pool-${idx}`} className="flex items-center gap-2 bg-gray-100 rounded p-2">
                        <div className="w-10 h-10 rounded flex items-center justify-center text-xs font-bold border border-black" style={getDiceColorStyle(die.color)}>
                          <span>{die.color}</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900 truncate">{die.name || 'Die'}</div>
                          <div className="text-xs text-gray-600 truncate">Result: {rollResults?.poolResults?.[idx] ?? '—'}</div>
                        </div>
                        <button
                          className="text-xs text-red-600 font-semibold"
                          onClick={() => {
                            setDicePopup(prev => {
                              if (!prev) return prev;
                              const details = [...(prev.details || []), ...(prev.boosts || [])];
                              details.splice(idx, 1);
                              // Re-split into details (non-boost) and boosts by color
                              const newDetails = details.filter(d => d.color !== 'B');
                              const newBoosts = details.filter(d => d.color === 'B');
                              return { ...prev, details: newDetails, boosts: newBoosts };
                            });
                            setRollResults(null);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}

                    {(dicePopup.setbacks || []).map((die, idx) => (
                      <div key={`setback-${idx}`} className="flex items-center gap-2 bg-gray-100 rounded p-2">
                        <div className="w-10 h-10 rounded flex items-center justify-center text-xs font-bold border border-black" style={getDiceColorStyle(die.color)}>
                          <span>{die.color}</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900 truncate">{die.name || 'Setback'}</div>
                          <div className="text-xs text-gray-600 truncate">Result: {rollResults?.diffResults?.[selectedDifficulty + idx] ?? '—'}</div>
                        </div>
                        <button
                          className="text-xs text-red-600 font-semibold"
                          onClick={() => {
                            setDicePopup(prev => {
                              if (!prev) return prev;
                              const newSetbacks = [...(prev.setbacks || [])];
                              newSetbacks.splice(idx, 1);
                              return { ...prev, setbacks: newSetbacks };
                            });
                            setRollResults(null);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      className="px-4 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700"
                      onClick={handleRoll}
                    >
                      Roll
                    </button>
                    <button
                      className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded hover:bg-gray-300"
                      onClick={() => { setRollResults(null); setDicePopup(prev => prev ? { ...prev, details: [], boosts: [], setbacks: [] } : prev); setSelectedDifficulty(0); }}
                    >
                      Clear Pool
                    </button>
                  </div>
                </div>

                {/* Outcome */}
                <div className="space-y-3">
                  <div className="p-3 rounded border border-gray-200 bg-gray-50">
                    <div className="text-sm text-gray-700 font-semibold mb-2">Difficulty Dice (P): {selectedDifficulty}</div>
                    {selectedDifficulty > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: selectedDifficulty }).map((_, i) => (
                          <div key={`diff-${i}`} className="h-16 rounded border border-black flex items-center justify-center text-xs font-semibold" style={getDiceColorStyle('P')}>
                            <span className="text-center px-1 leading-tight">{rollResults?.diffResults?.[i] ?? '—'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded border border-gray-200 bg-gray-50">
                    <div className="text-sm text-gray-700 font-semibold mb-2">Pool Results</div>
                    {rollResults ? (
                      <div className="grid grid-cols-3 gap-2">
                        {(rollResults.poolResults || []).map((r, i) => (
                          <div key={`res-${i}`} className="h-14 rounded border border-gray-300 flex items-center justify-center text-xs text-gray-800 bg-white">
                            <span className="text-center px-1 leading-tight">{r || '—'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Roll to see results.</p>
                    )}
                  </div>

                  <div className="p-3 rounded border border-gray-200 bg-gray-50">
                    <div className="text-sm text-gray-700 font-semibold mb-2">Outcome</div>
                    {rollResults ? (
                      (() => {
                        const parsed = parseRollResults(rollResults.poolResults, rollResults.diffResults);
                        return (
                          <div className="space-y-1 text-sm text-gray-800">
                            <div>Net Success: {parsed.netSuccess}</div>
                            <div>Net Failure: {parsed.netFailure}</div>
                            <div>Net Advantage: {parsed.netAdvantage}</div>
                            <div>Net Threat: {parsed.netThreat}</div>
                            {parsed.counts.triumph > 0 && <div>Triumph: {parsed.counts.triumph}</div>}
                            {parsed.counts.despair > 0 && <div>Despair: {parsed.counts.despair}</div>}
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-sm text-gray-500">No roll yet.</p>
                    )}
                  </div>
                </div>
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

        {/* TOP ROW: Star Wars + Star Trek Adventures (NO HEADER) */}
        {(shouldShow('Star Wars') || shouldShow('Star Trek Adventures')) && (
          <div className="mb-20">
            {/* Removed "Sci-Fi Adventures" header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

              {/* STAR WARS */}
              {shouldShow('Star Wars') && (
                <div className={`bg-white rounded-3xl shadow-2xl border-4 border-gray-900 overflow-hidden ${!showCharacterList ? 'transform hover:scale-105 transition duration-300' : ''}`}>
                    {isAdmin && (
                      <div className="bg-gray-900 text-white p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-4">
                          <input type="checkbox" checked={ttrpgVisibility['Star Wars']} onChange={() => toggleTTRPGVisibility('Star Wars', ttrpgVisibility['Star Wars'])} className="w-6 h-6 rounded" />
                          <span className="font-bold text-lg">Show Star Wars</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <input type="checkbox" checked={showSWCampaigns} onChange={toggleSWCampaignsVisibility} className="w-6 h-6 rounded" />
                          <span className="font-bold text-lg">Show SW Campaigns</span>
                        </div>
                      </div>
                    )}
                    <div className="p-10 text-center">
                      <img src="/Star Wars.png" alt="Star Wars" className="w-72 mx-auto mb-8" />
                      
                      {/* Button Row */}
                      <div className="flex justify-center gap-4 mb-6">
                        <button 
                          onClick={() => setShowCharacterList(!showCharacterList)}
                          className="px-10 py-4 bg-gray-900 text-white font-bold text-lg rounded-xl hover:bg-black shadow-lg transition"
                        >
                          Your Characters
                        </button>
                        <button onClick={() => navigate('/sweote-character-creator', { state: { create_character: true } })} className="px-10 py-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 shadow-lg transition">Create Character</button>
                        {(showSWCampaigns || isAdmin) && (
                          <button onClick={() => navigate('/SW_campaign')} className="px-10 py-4 bg-purple-600 text-white font-bold text-lg rounded-xl hover:bg-purple-700 shadow-lg transition">Campaign</button>
                        )}
                        <button onClick={openDiceRoll} className="px-10 py-4 bg-blue-500 text-white font-bold text-lg rounded-xl hover:bg-blue-600 shadow-lg transition">Dice Roll</button>
                      </div>

                      {/* Character List */}
                      {showCharacterList && (
                        <div style={{ backgroundColor: '#000000', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {characters.length === 0 ? (
                            <p style={{ color: 'white', textAlign: 'center', padding: '1rem' }}>No characters found</p>
                          ) : (
                            characters.sort((a, b) => a.name.localeCompare(b.name)).map(character => (
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
                                {/* Character Picture */}
                                <div style={{ flexShrink: 0 }}>
                                  <img
                                    src={`/SW_Pictures/Picture ${typeof character.picture === 'number' ? character.picture : 0} Face.png`}
                                    alt={character.name}
                                    className="rounded object-contain"
                                    style={{ width: '80px', height: '100px' }}
                                    onError={(e) => {
                                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="100"%3E%3Crect fill="%23333" width="80" height="100"/%3E%3C/svg%3E';
                                    }}
                                  />
                                </div>

                                {/* Character Info */}
                                <div style={{ flex: 1, textAlign: 'left' }}>
                                  <h3 style={{ fontWeight: 'bold', fontSize: '1.125rem', color: 'white' }}>{character.name}</h3>
                                  <p style={{ fontSize: '0.875rem', color: '#999999' }}>{character.race}</p>
                                  <p style={{ fontSize: '0.875rem', color: '#dddddd' }}>{character.career} - {character.spec}</p>
                                </div>

                                {/* Action Buttons */}
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
                                      const { error } = await supabase
                                        .from('SW_player_characters')
                                        .delete()
                                        .eq('id', character.id);
                                      if (error) {
                                        alert('Error deleting character');
                                      } else {
                                        setCharacters(characters.filter(c => c.id !== character.id));
                                      }
                                    }}
                                    className="px-6 py-2 bg-red-700 text-white font-bold rounded hover:bg-red-800 transition text-sm"
                                  >
                                    Delete
                                  </button>
                                </div>

                                {/* Campaign Info at bottom of card */}
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
                            ))
                          )}
                        </div>
                      )}
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
  );
}