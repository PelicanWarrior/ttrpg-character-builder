import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import DicePoolPopup from './DicePoolPopup';
import AddNPCModal from './AddNPCModal';

export default function SWBattles() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  const campaignName = searchParams.get('campaignName');
  const [battles, setBattles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBattle, setEditingBattle] = useState(null);
  const [battleTitle, setBattleTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [campaignNpcs, setCampaignNpcs] = useState([]);
  const [battleNpcs, setBattleNpcs] = useState({});
  const [showNpcModal, setShowNpcModal] = useState(false);
  const [currentBattleId, setCurrentBattleId] = useState(null);
  const [selectedNpcs, setSelectedNpcs] = useState([]);
  const [availableNpc, setAvailableNpc] = useState('');
  const [showBattleModal, setShowBattleModal] = useState(false);
  const [campaignCharacters, setCampaignCharacters] = useState([]);
  const [dicePopup, setDicePopup] = useState({ show: false, pool: '' });
  const [battleStats, setBattleStats] = useState({}); // {npcId/playerId: {success: '', advantage: ''}}
  const [currentDiceTarget, setCurrentDiceTarget] = useState(null); // {type: 'npc'|'player', id: number}
  const [showAddNPCModal, setShowAddNPCModal] = useState(false);

  useEffect(() => {
    if (campaignId) {
      fetchBattles();
      fetchCampaignNpcs();
      fetchCampaignCharacters();
    }
  }, [campaignId]);

  const fetchBattles = async () => {
    const { data, error } = await supabase
      .from('SW_campaign_battles')
      .select('id, Battle_Title, Description, CampaignID, PlayerOrder')
      .eq('CampaignID', campaignId)
      .order('id', { ascending: false });

    if (error) {
      console.error('Error fetching battles:', error);
    } else {
      setBattles(data || []);
      // Fetch NPCs for each battle
      if (data && data.length > 0) {
        fetchBattleNpcs(data.map(b => b.id));
      }
    }
  };

  const fetchCampaignNpcs = async () => {
    console.log('Fetching NPCs for campaignId:', campaignId, 'Type:', typeof campaignId);
    const { data, error } = await supabase
      .from('SW_campaign_NPC')
      .select('id, Name, Description, PictureID, CampaignID')
      .eq('CampaignID', parseInt(campaignId))
      .order('Name', { ascending: true });

    if (error) {
      console.error('Error fetching campaign NPCs:', error);
      console.log('Query params - campaignId:', campaignId);
    } else {
      console.log('Fetched NPCs:', data);
      setCampaignNpcs(data || []);
    }
  };

  const fetchCampaignCharacters = async () => {
    const { data, error } = await supabase
      .from('SW_player_characters')
      .select('id, name, race, career, spec, picture, user_number, user:user_number(username)')
      .eq('campaign_joined', parseInt(campaignId));

    if (error) {
      console.error('Error fetching campaign characters:', error);
    } else {
      setCampaignCharacters(data || []);
    }
  };

  const fetchBattleNpcs = async (battleIds) => {
    const { data, error } = await supabase
      .from('SW_campaign_battles_npc')
      .select('id, NPC, BattleID, BattleOrder, SW_campaign_NPC(id, Name, Description, PictureID, Race, races(id, name), Presence, Willpower, Skills)')
      .in('BattleID', battleIds);

    if (error) {
      console.error('Error fetching battle NPCs:', error);
    } else {
      const npcsByBattle = {};
      (data || []).forEach(item => {
        if (!npcsByBattle[item.BattleID]) {
          npcsByBattle[item.BattleID] = [];
        }
        npcsByBattle[item.BattleID].push(item);
      });
      setBattleNpcs(npcsByBattle);
    }
  };

  const handleCreateBattle = async () => {
    if (!battleTitle.trim()) {
      alert('Please enter a battle title');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('SW_campaign_battles')
        .insert([
          {
            Battle_Title: battleTitle,
            Description: description,
            CampaignID: parseInt(campaignId),
          },
        ]);

      if (error) {
        console.error('Error creating battle:', error);
        alert('Failed to create battle');
      } else {
        setBattleTitle('');
        setDescription('');
        setShowModal(false);
        alert('Battle created successfully!');
        fetchBattles();
      }
    } catch (err) {
      console.error('Error:', err);
      alert('An error occurred while creating the battle');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBattle = async () => {
    if (!battleTitle.trim()) {
      alert('Please enter a battle title');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('SW_campaign_battles')
        .update({
          Battle_Title: battleTitle,
          Description: description,
        })
        .eq('id', editingBattle.id);

      if (error) {
        console.error('Error updating battle:', error);
        alert('Failed to update battle');
      } else {
        setBattleTitle('');
        setDescription('');
        setShowEditModal(false);
        setEditingBattle(null);
        alert('Battle updated successfully!');
        fetchBattles();
      }
    } catch (err) {
      console.error('Error:', err);
      alert('An error occurred while updating the battle');
    } finally {
      setLoading(false);
    }
  };


  const openBattleModal = (battleId) => {
    setCurrentBattleId(battleId);
    setShowBattleModal(true);
  };

  const calculateCoolDicePool = (npc) => {
    const presence = npc.Presence || 0;
    const skills = npc.Skills || '';
    const coolCount = (skills.match(/Cool/g) || []).length;

    let pool = '';
    // Add Y dice for skill ranks
    for (let i = 0; i < Math.min(coolCount, presence); i++) {
      pool += 'Y';
    }
    // Add G dice for remaining presence
    for (let i = coolCount; i < presence; i++) {
      pool += 'G';
    }
    // If skill ranks exceed presence, add G for remaining ranks
    for (let i = presence; i < coolCount; i++) {
      pool += 'G';
    }

    return pool;
  };

  const calculateVigilanceDicePool = (npc) => {
    const willpower = npc.Willpower || 0;
    const skills = npc.Skills || '';
    const vigilanceCount = (skills.match(/Vigilance/g) || []).length;

    let pool = '';
    // Add Y dice for skill ranks
    for (let i = 0; i < Math.min(vigilanceCount, willpower); i++) {
      pool += 'Y';
    }
    // Add G dice for remaining willpower
    for (let i = vigilanceCount; i < willpower; i++) {
      pool += 'G';
    }
    // If skill ranks exceed willpower, add G for remaining ranks
    for (let i = willpower; i < vigilanceCount; i++) {
      pool += 'G';
    }

    return pool;
  };
  
  const handleUseResult = (netSuccess, netAdvantage) => {
    if (currentDiceTarget) {
      const key = `${currentDiceTarget.type}-${currentDiceTarget.id}`;
      setBattleStats(prev => ({
        ...prev,
        [key]: {
          success: String(netSuccess),
          advantage: String(netAdvantage)
        }
      }));
    }
  };

  const handleBattle = async () => {
    // Collect all combatants with their stats
    const combatants = [];

    // Add NPCs
    if (battleNpcs[currentBattleId]) {
      battleNpcs[currentBattleId].forEach(npcItem => {
        const success = parseInt(battleStats[`npc-${npcItem.id}`]?.success) || 0;
        const advantage = parseInt(battleStats[`npc-${npcItem.id}`]?.advantage) || 0;
        combatants.push({
          type: 'npc',
          id: npcItem.id,
          name: npcItem.SW_campaign_NPC?.Name || 'Unknown',
          success,
          advantage,
          isPC: false
        });
      });
    }

    // Add Player Characters
    campaignCharacters.forEach(char => {
      const success = parseInt(battleStats[`player-${char.id}`]?.success) || 0;
      const advantage = parseInt(battleStats[`player-${char.id}`]?.advantage) || 0;
      combatants.push({
        type: 'player',
        id: char.id,
        name: char.name,
        success,
        advantage,
        isPC: true
      });
    });

    // Sort according to initiative rules:
    // 1. Most Successes (primary)
    // 2. Most Advantages (tiebreaker)
    // 3. PCs rank ahead of NPCs (final tie)
    combatants.sort((a, b) => {
      // Primary: Most successes
      if (a.success !== b.success) {
        return b.success - a.success;
      }
      // Tiebreaker: Most advantages
      if (a.advantage !== b.advantage) {
        return b.advantage - a.advantage;
      }
      // Final tie: PCs rank ahead
      if (a.isPC !== b.isPC) {
        return a.isPC ? -1 : 1;
      }
      return 0;
    });

    // Log initiative order to console
    console.log('Initiative Order:');
    combatants.forEach((combatant, index) => {
      console.log(`${index + 1}. ${combatant.name} (${combatant.isPC ? 'PC' : 'NPC'}) - Success: ${combatant.success}, Advantage: ${combatant.advantage}`);
    });

    // Update database with initiative order
    try {
      // Update NPCs with BattleOrder
      for (let i = 0; i < combatants.length; i++) {
        const combatant = combatants[i];
        if (combatant.type === 'npc') {
          await supabase
            .from('SW_campaign_battles_npc')
            .update({ BattleOrder: i + 1 })
            .eq('id', combatant.id);
        }
      }

      // Collect player orders
      const playerOrders = [];
      combatants.forEach((combatant, index) => {
        if (combatant.type === 'player') {
          playerOrders.push(`${combatant.id},${index + 1}`);
        }
      });

      // Update battle with PlayerOrder
      if (playerOrders.length > 0) {
        await supabase
          .from('SW_campaign_battles')
          .update({ PlayerOrder: playerOrders.join(',') })
          .eq('id', currentBattleId);
      }

      // Refresh the battle NPCs and battles to show updated order
      await fetchBattleNpcs([currentBattleId]);
      await fetchBattles();
      
      alert('Initiative order set!');
    } catch (error) {
      console.error('Error setting initiative order:', error);
      alert('Error setting initiative order');
    }
  };

  const getSortedNpcs = () => {
    if (!battleNpcs[currentBattleId]) return [];
    return [...battleNpcs[currentBattleId]].sort((a, b) => {
      const orderA = a.BattleOrder || 999;
      const orderB = b.BattleOrder || 999;
      return orderA - orderB;
    });
  };

  const getSortedPlayers = () => {
    if (!campaignCharacters || campaignCharacters.length === 0) return [];
    
    // Parse PlayerOrder from current battle
    const currentBattle = battles.find(b => b.id === currentBattleId);
    if (!currentBattle || !currentBattle.PlayerOrder) {
      return campaignCharacters;
    }

    const playerOrders = {};
    const parts = currentBattle.PlayerOrder.split(',');
    for (let i = 0; i < parts.length; i += 2) {
      const playerId = parseInt(parts[i]);
      const order = parseInt(parts[i + 1]);
      playerOrders[playerId] = order;
    }

    return [...campaignCharacters].sort((a, b) => {
      const orderA = playerOrders[a.id] || 999;
      const orderB = playerOrders[b.id] || 999;
      return orderA - orderB;
    });
  };

  const getSortedCombatants = () => {
    const combatants = [];
    const currentBattle = battles.find(b => b.id === currentBattleId);

    // Parse player orders from current battle
    const playerOrders = {};
    if (currentBattle && currentBattle.PlayerOrder) {
      const parts = currentBattle.PlayerOrder.split(',');
      for (let i = 0; i < parts.length; i += 2) {
        const playerId = parseInt(parts[i]);
        const order = parseInt(parts[i + 1]);
        playerOrders[playerId] = order;
      }
    }

    // Add NPCs
    if (battleNpcs[currentBattleId]) {
      battleNpcs[currentBattleId].forEach(npc => {
        combatants.push({
          type: 'npc',
          id: npc.id,
          order: npc.BattleOrder || 999,
          data: npc
        });
      });
    }

    // Add players
    campaignCharacters.forEach(player => {
      combatants.push({
        type: 'player',
        id: player.id,
        order: playerOrders[player.id] || 999,
        data: player
      });
    });

    // Sort by order
    return combatants.sort((a, b) => a.order - b.order);
  };

  const openEditModal = (battle) => {
    setEditingBattle(battle);
    setBattleTitle(battle.Battle_Title);
    setDescription(battle.Description || '');
    setShowEditModal(true);
  };

  const openNpcModal = (battleId) => {
    setCurrentBattleId(battleId);
    setSelectedNpcs([]);
    setAvailableNpc('');
    setShowNpcModal(true);
  };

  const addNpcToSelection = () => {
    if (availableNpc) {
      // Create a unique instance key so the same NPC can be added multiple times
      const instanceKey = `${availableNpc}-${Date.now()}-${Math.random()}`;
      setSelectedNpcs([...selectedNpcs, { id: availableNpc, instanceKey }]);
    }
  };

  const removeNpcFromSelection = (instanceKey) => {
    setSelectedNpcs(selectedNpcs.filter(item => item.instanceKey !== instanceKey));
  };

  const saveNpcsToBattle = async () => {
    if (selectedNpcs.length === 0) {
      alert('Please select at least one NPC');
      return;
    }

    setLoading(true);
    try {
      const inserts = selectedNpcs.map(item => ({
        BattleID: currentBattleId,
        NPC: parseInt(item.id),
      }));

      const { error } = await supabase
        .from('SW_campaign_battles_npc')
        .insert(inserts);

      if (error) {
        console.error('Error saving NPCs to battle:', error);
        alert('Failed to add NPCs to battle');
      } else {
        setShowNpcModal(false);
        setSelectedNpcs([]);
        setCurrentBattleId(null);
        alert('NPCs added successfully!');
        fetchBattleNpcs([currentBattleId]);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('An error occurred while adding NPCs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Campaign Battles</h1>
        
        {campaignName && (
          <h2 className="text-2xl text-gray-400 mb-6">{decodeURIComponent(campaignName)}</h2>
        )}

        <div className="flex gap-6 mb-8">
          <button
            onClick={() => navigate('/SW_campaign')}
            className="px-8 py-3 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 shadow-lg transition"
          >
            Back
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-8 py-3 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 shadow-lg transition"
          >
            Create
          </button>
        </div>

        {/* Create Battle Modal */}
        {showModal && (
          <div className="bg-gray-800 rounded-xl p-8 max-w-md mb-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Create a Battle</h2>

            <div className="mb-6">
              <label className="block text-lg font-semibold mb-2">Battle Title</label>
              <input
                type="text"
                value={battleTitle}
                onChange={(e) => setBattleTitle(e.target.value)}
                placeholder="Enter battle title"
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-lg font-semibold mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter battle description"
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none h-24 resize-none"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCreateBattle}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-500 transition"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setBattleTitle('');
                  setDescription('');
                }}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 disabled:bg-gray-500 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Edit Battle Modal */}
        {showEditModal && (
          <div className="bg-gray-800 rounded-xl p-8 max-w-md mb-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Edit Battle</h2>

            <div className="mb-6">
              <label className="block text-lg font-semibold mb-2">Battle Title</label>
              <input
                type="text"
                value={battleTitle}
                onChange={(e) => setBattleTitle(e.target.value)}
                placeholder="Enter battle title"
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-lg font-semibold mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter battle description"
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none h-24 resize-none"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleEditBattle}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-500 transition"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingBattle(null);
                  setBattleTitle('');
                  setDescription('');
                }}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 disabled:bg-gray-500 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Battle Modal */}
        {showBattleModal && currentBattleId && (
          <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
            <div style={{ backgroundColor: '#1a1a1a' }} className="rounded-xl p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border-2 border-gray-600">
              <div className="flex justify-between items-center mb-6">
                <h2 style={{ color: '#ffffff' }} className="text-3xl font-bold">ROLL FOR INITIATIVE</h2>
                <div className="flex gap-3">
                  <button
                    onClick={handleBattle}
                    className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
                  >
                    BATTLE
                  </button>
                  <button
                    onClick={() => {
                      setShowBattleModal(false);
                      setCurrentBattleId(null);
                    }}
                    className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
                  >
                    Exit Battle
                  </button>
                </div>
              </div>

              {/* Initiative Order - Combined NPCs and Players in Order */}
              <div className="mb-8">
                <h3 style={{ color: '#ffffff' }} className="text-2xl font-bold mb-4">Initiative</h3>
                <div className="space-y-3">
                  {getSortedCombatants().map((combatant) => {
                    if (combatant.type === 'npc') {
                      const item = combatant.data;
                      return (
                        <div key={`npc-${item.id}`} className="bg-gray-800 p-4 rounded-lg border-2 border-yellow-400">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <p style={{ color: '#ffffff' }} className="text-xl font-bold">
                                {item.SW_campaign_NPC?.Name || 'Unknown NPC'}
                                {item.SW_campaign_NPC?.races?.name && ` - ${item.SW_campaign_NPC.races.name}`}
                              </p>
                            </div>
                            {item.SW_campaign_NPC && (
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    const npc = item.SW_campaign_NPC;
                                    const pool = calculateCoolDicePool(npc);
                                    const details = pool.split('').map(color => ({
                                      color,
                                      name: {'G': 'Ability', 'Y': 'Proficiency', 'B': 'Boost', 'P': 'Challenge', 'R': 'Threat', 'K': 'Setback', 'W': 'Force'}[color] || 'Unknown'
                                    }));
                                    setCurrentDiceTarget({ type: 'npc', id: item.id });
                                    setDicePopup({
                                      pool,
                                      details,
                                      x: e.clientX,
                                      y: e.clientY,
                                      label: `${npc.name || 'NPC'} - Cool`,
                                      boosts: [],
                                      setbacks: []
                                    });
                                  }}
                                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition"
                                >
                                  Cool: {calculateCoolDicePool(item.SW_campaign_NPC)}
                                </button>
                                <button
                                  onClick={(e) => {
                                    const npc = item.SW_campaign_NPC;
                                    const pool = calculateVigilanceDicePool(npc);
                                    const details = pool.split('').map(color => ({
                                      color,
                                      name: {'G': 'Ability', 'Y': 'Proficiency', 'B': 'Boost', 'P': 'Challenge', 'R': 'Threat', 'K': 'Setback', 'W': 'Force'}[color] || 'Unknown'
                                    }));
                                    setCurrentDiceTarget({ type: 'npc', id: item.id });
                                    setDicePopup({
                                      pool,
                                      details,
                                      x: e.clientX,
                                      y: e.clientY,
                                      label: `${npc.name || 'NPC'} - Vigilance`,
                                      boosts: [],
                                      setbacks: []
                                    });
                                  }}
                                  className="px-4 py-2 bg-purple-600 text-white font-bold rounded hover:bg-purple-700 transition"
                                >
                                  Vigilance: {calculateVigilanceDicePool(item.SW_campaign_NPC)}
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                              <label style={{ color: '#ffffff' }} className="font-semibold">Success:</label>
                              <input
                                type="text"
                                value={battleStats[`npc-${item.id}`]?.success || ''}
                                onChange={(e) => {
                                  const key = `npc-${item.id}`;
                                  setBattleStats(prev => ({
                                    ...prev,
                                    [key]: { ...prev[key], success: e.target.value }
                                  }));
                                }}
                                className="w-20 px-2 py-1 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label style={{ color: '#ffffff' }} className="font-semibold">Advantage:</label>
                              <input
                                type="text"
                                value={battleStats[`npc-${item.id}`]?.advantage || ''}
                                onChange={(e) => {
                                  const key = `npc-${item.id}`;
                                  setBattleStats(prev => ({
                                    ...prev,
                                    [key]: { ...prev[key], advantage: e.target.value }
                                  }));
                                }}
                                className="w-20 px-2 py-1 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      const character = combatant.data;
                      return (
                        <div key={`player-${character.id}`} className="bg-gray-800 p-4 rounded-lg border-2 border-blue-400">
                          <div className="flex items-center gap-3 mb-2">
                            <p style={{ color: '#ffffff' }} className="text-xl font-bold">{character.name}</p>
                          </div>
                          <p style={{ color: '#ffffff' }} className="text-sm mb-2">
                            {character.race} | {character.career}{character.spec ? ` - ${character.spec}` : ''}
                          </p>
                          <p style={{ color: '#ffffff' }} className="text-sm mb-3">Player: {character.user?.username || 'Unknown'}</p>
                          <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                              <label style={{ color: '#ffffff' }} className="font-semibold">Success:</label>
                              <input
                                type="text"
                                value={battleStats[`player-${character.id}`]?.success || ''}
                                onChange={(e) => {
                                  const key = `player-${character.id}`;
                                  setBattleStats(prev => ({
                                    ...prev,
                                    [key]: { ...prev[key], success: e.target.value }
                                  }));
                                }}
                                className="w-20 px-2 py-1 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label style={{ color: '#ffffff' }} className="font-semibold">Advantage:</label>
                              <input
                                type="text"
                                value={battleStats[`player-${character.id}`]?.advantage || ''}
                                onChange={(e) => {
                                  const key = `player-${character.id}`;
                                  setBattleStats(prev => ({
                                    ...prev,
                                    [key]: { ...prev[key], advantage: e.target.value }
                                  }));
                                }}
                                className="w-20 px-2 py-1 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setShowBattleModal(false);
                    setCurrentBattleId(null);
                  }}
                  className="px-8 py-3 bg-green-600 text-white font-bold text-lg rounded-lg hover:bg-green-700 transition"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Battles List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {battles.length > 0 ? (
            battles.map((battle) => (
              <div 
                key={battle.id} 
                className="rounded-2xl p-6 border-2 border-gray-600" 
                style={{ backgroundColor: '#d1d5db', marginBottom: '1rem' }}
              >
                <h3 className="text-xl font-bold mb-3 text-gray-900">{battle.Battle_Title}</h3>
                <p className="text-gray-700 whitespace-pre-wrap mb-4">{battle.Description}</p>
                
                {/* NPCs in this battle */}
                {battleNpcs[battle.id] && battleNpcs[battle.id].length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">NPCs in Battle:</h4>
                    <div className="space-y-1">
                      {battleNpcs[battle.id].map((item) => (
                        <div key={item.id} className="text-sm text-gray-800 bg-gray-300 px-2 py-1 rounded">
                          {item.SW_campaign_NPC?.Name || 'Unknown NPC'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-700 rounded-lg p-3 mb-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(battle)}
                      className="flex-1 px-4 py-2 bg-yellow-600 text-white text-sm font-bold rounded hover:bg-yellow-700 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openNpcModal(battle.id)}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded hover:bg-purple-700 transition"
                    >
                      Add NPCs
                    </button>
                    <button
                      onClick={() => openBattleModal(battle.id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded hover:bg-red-700 transition"
                    >
                      BATTLE!
                    </button>
                  </div>
                </div>

                {/* Inline NPC Selection Form */}
                {showNpcModal && currentBattleId === battle.id && (
                  <div className="bg-gray-700 rounded-lg p-4 mb-4 border border-purple-500">
                    <h4 className="text-lg font-bold text-white mb-4">Add NPCs to Battle</h4>

                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-white mb-2">Select NPC</label>
                      <div className="flex gap-2">
                        <select
                          value={availableNpc}
                          onChange={(e) => setAvailableNpc(e.target.value)}
                          className="flex-1 px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-green-500 focus:outline-none text-sm"
                        >
                          <option value="">Choose an NPC...</option>
                          {campaignNpcs.map((npc) => (
                            <option key={npc.id} value={npc.id}>
                              {npc.Name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={addNpcToSelection}
                          disabled={!availableNpc}
                          className="px-3 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 disabled:bg-gray-500 transition"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {selectedNpcs.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-white mb-2">Selected NPCs:</label>
                        <div className="space-y-2">
                          {selectedNpcs.map((item) => {
                            const npc = campaignNpcs.find(n => n.id.toString() === item.id);
                            return (
                              <div key={item.instanceKey} className="flex items-center justify-between bg-gray-600 p-2 rounded text-sm">
                                <span className="text-white">{npc?.Name}</span>
                                <button
                                  onClick={() => removeNpcFromSelection(item.instanceKey)}
                                  className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition"
                                >
                                  Remove
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={saveNpcsToBattle}
                        disabled={loading || selectedNpcs.length === 0}
                        className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 disabled:bg-gray-500 transition"
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setShowAddNPCModal(true)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 transition"
                      >
                        Create NPC
                      </button>
                      <button
                        onClick={() => {
                          setShowNpcModal(false);
                          setSelectedNpcs([]);
                          setCurrentBattleId(null);
                          setAvailableNpc('');
                        }}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white text-sm font-bold rounded hover:bg-gray-500 disabled:bg-gray-500 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center italic col-span-full">No battles created yet</p>
          )}
        </div>
        {dicePopup.pool && (
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
              onClick={() => setDicePopup({ show: false, pool: '' })}
              style={{ position: 'absolute', top: 8, right: 8, zIndex: 10000 }}
              className="text-2xl font-bold text-red-600 hover:text-red-800 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md"
              aria-label="Close dice popup"
            >
              ×
            </button>
            <DicePoolPopup
              dicePopup={dicePopup}
              setDicePopup={setDicePopup}
              onUseResult={handleUseResult}
            />
          </div>
        )}

        {/* Add NPC Modal */}
        <AddNPCModal
          isOpen={showAddNPCModal}
          onClose={() => {
            setShowAddNPCModal(false);
            fetchCampaignNpcs();
          }}
          onSave={() => {
            fetchCampaignNpcs();
          }}
          campaignId={campaignId}
        />
      </div>
    </div>
  );
}