import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';

const SPECIAL_FIELDS = [
  { key: 'strength', short: 'STR' },
  { key: 'perception', short: 'PER' },
  { key: 'endurance', short: 'END' },
  { key: 'charisma', short: 'CHA' },
  { key: 'intelligence', short: 'INT' },
  { key: 'agility', short: 'AGI' },
  { key: 'luck', short: 'LCK' },
];

const SKILLS = [
  { key: 'athletics', label: 'Athletics' },
  { key: 'barter', label: 'Barter' },
  { key: 'big_guns', label: 'Big Guns' },
  { key: 'energy_weapons', label: 'Energy Weapons' },
  { key: 'explosives', label: 'Explosives' },
  { key: 'lockpick', label: 'Lockpick' },
  { key: 'medicine', label: 'Medicine' },
  { key: 'melee_weapons', label: 'Melee Weapons' },
  { key: 'pilot', label: 'Pilot' },
  { key: 'repair', label: 'Repair' },
  { key: 'science', label: 'Science' },
  { key: 'small_guns', label: 'Small Guns' },
  { key: 'sneak', label: 'Sneak' },
  { key: 'speech', label: 'Speech' },
  { key: 'survival', label: 'Survival' },
  { key: 'throwing', label: 'Throwing' },
  { key: 'unarmed', label: 'Unarmed' },
];

function parseJsonOrDefault(value, fallback) {
  if (!value || typeof value === 'object') return value || fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

export default function FaCampaign() {
  const navigate = useNavigate();

  const [playerId, setPlayerId] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignCharacters, setCampaignCharacters] = useState({});
  const [campaignNpcs, setCampaignNpcs] = useState({});
  const [campaignLogs, setCampaignLogs] = useState({});
  const [openCharacters, setOpenCharacters] = useState({});
  const [openLogs, setOpenLogs] = useState({});
  const [openNpcs, setOpenNpcs] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const sortedCampaigns = useMemo(
    () => [...campaigns].sort((a, b) => (a?.Name || '').localeCompare(b?.Name || '')),
    [campaigns],
  );

  const generateUniqueCampaignCode = async () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    let isUnique = false;
    while (!isUnique) {
      code = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const { data } = await supabase.from('Fa_campaign').select('campaign_code').eq('campaign_code', code);
      if (!data || data.length === 0) isUnique = true;
    }
    return code;
  };

  const loadCampaignDetails = async (campaignRows) => {
    if (!Array.isArray(campaignRows) || campaignRows.length === 0) return;
    const byChars = {};
    const byNpcs = {};
    for (const campaign of campaignRows) {
      const [{ data: chars }, { data: npcs }] = await Promise.all([
        supabase
          .from('Fa_player_characters')
          .select('id, name, race, level, user_number')
          .eq('campaign_joined', campaign.id),
        supabase
          .from('Fa_campaign_NPC')
          .select('id, Name, Description, race, special, skills, PicturePath, campaignID')
          .eq('campaignID', campaign.id),
      ]);
      byChars[campaign.id] = chars || [];
      byNpcs[campaign.id] = (npcs || []).map((n) => ({
        ...n,
        special: parseJsonOrDefault(n.special, {}),
        skills: parseJsonOrDefault(n.skills, {}),
      }));
    }
    setCampaignCharacters(byChars);
    setCampaignNpcs(byNpcs);
  };

  const loadCampaigns = async (currentPlayerId) => {
    const { data: dmCampaigns } = await supabase
      .from('Fa_campaign')
      .select('id, Name, description, playerID, campaign_code')
      .eq('playerID', currentPlayerId);

    const { data: myChars } = await supabase
      .from('Fa_player_characters')
      .select('campaign_joined')
      .eq('user_number', currentPlayerId)
      .not('campaign_joined', 'is', null);

    const memberIds = [...new Set((myChars || []).map((c) => c.campaign_joined).filter(Boolean))];
    let memberCampaigns = [];
    if (memberIds.length > 0) {
      const { data } = await supabase
        .from('Fa_campaign')
        .select('id, Name, description, playerID, campaign_code')
        .in('id', memberIds);
      memberCampaigns = data || [];
    }

    const mergedMap = new Map();
    [...(dmCampaigns || []), ...memberCampaigns].forEach((c) => c && mergedMap.set(c.id, c));
    const merged = Array.from(mergedMap.values());

    const playerIds = [...new Set(merged.map((c) => c.playerID).filter(Boolean))];
    const usernameById = {};
    if (playerIds.length > 0) {
      const { data: users } = await supabase.from('user').select('id, username').in('id', playerIds);
      (users || []).forEach((u) => { usernameById[u.id] = u.username; });
    }

    const withUsers = merged.map((c) => ({ ...c, dmName: usernameById[c.playerID] || 'Unknown' }));
    setCampaigns(withUsers);
    await loadCampaignDetails(withUsers);
  };

  useEffect(() => {
    const username = localStorage.getItem('username');
    if (!username) return;
    const init = async () => {
      const { data: userData } = await supabase.from('user').select('id').eq('username', username).single();
      if (!userData) return;
      setPlayerId(userData.id);
      await loadCampaigns(userData.id);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateCampaign = async () => {
    if (!campaignName.trim() || !playerId) { alert('Please enter a campaign name.'); return; }
    setCreating(true);
    try {
      const campaignCode = await generateUniqueCampaignCode();
      const { error } = await supabase
        .from('Fa_campaign')
        .insert([{ Name: campaignName.trim(), description, playerID: playerId, campaign_code: campaignCode }]);
      if (error) throw error;
      setCampaignName('');
      setDescription('');
      setShowModal(false);
      await loadCampaigns(playerId);
    } catch (err) {
      console.error('Failed creating Fallout campaign:', err);
      alert('Failed to create campaign.');
    } finally {
      setCreating(false);
    }
  };

  const loadCampaignLogs = async (campaignId) => {
    const { data, error } = await supabase
      .from('Fa_campaign_log')
      .select('Log, Log_number, campaignID')
      .eq('campaignID', campaignId)
      .order('Log_number', { ascending: false });
    if (error) console.error('Error fetching logs:', error);
    setCampaignLogs((prev) => ({ ...prev, [campaignId]: data || [] }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-center gap-4 mb-8">
          <img
            src="/Fa_Pictures/Logo.png"
            alt="Fallout"
            className="h-12 w-auto"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>

        <div className="flex gap-6 mb-8">
          <button
            onClick={() => navigate('/select-ttrpg')}
            className="px-8 py-3 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 shadow-lg transition"
          >
            Select TTRPG
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-8 py-3 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 shadow-lg transition"
          >
            Create a Campaign
          </button>
        </div>

        {showModal && (
          <div className="bg-gray-800 rounded-xl p-8 max-w-md mb-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Create a Fallout Campaign</h2>
            <div className="mb-6">
              <label className="block text-lg font-semibold mb-2">Campaign Name</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Enter campaign name"
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none"
              />
            </div>
            <div className="mb-6">
              <label className="block text-lg font-semibold mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter campaign description"
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none h-24 resize-none"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleCreateCampaign}
                disabled={creating}
                className="flex-1 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-500 transition"
              >
                {creating ? 'Creating...' : 'Create Campaign'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={creating}
                className="flex-1 px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 disabled:bg-gray-500 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <h2 className="text-2xl font-bold mb-4">Active Campaigns</h2>
        <div className="border-t border-gray-600 mb-8" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedCampaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-2xl p-6 border-2 border-gray-600" style={{ backgroundColor: '#d1d5db' }}>
              <h3 className="text-xl font-bold mb-1 text-white text-center">{campaign.Name}</h3>
              <p className="text-sm text-gray-800 font-semibold mb-2">DM: {campaign.dmName}</p>
              <p className="text-gray-700 mb-4">{campaign.description}</p>

              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button
                    onClick={() => {
                      setOpenCharacters((prev) => ({ ...prev, [campaign.id]: !prev[campaign.id] }));
                      setOpenLogs((prev) => ({ ...prev, [campaign.id]: false }));
                      setOpenNpcs((prev) => ({ ...prev, [campaign.id]: false }));
                    }}
                    className="px-3 py-2 bg-gray-600 text-white text-sm font-bold rounded hover:bg-gray-500 transition"
                  >
                    Characters
                  </button>
                  <button
                    onClick={() => {
                      setOpenNpcs((prev) => ({ ...prev, [campaign.id]: !prev[campaign.id] }));
                      setOpenCharacters((prev) => ({ ...prev, [campaign.id]: false }));
                      setOpenLogs((prev) => ({ ...prev, [campaign.id]: false }));
                    }}
                    className="px-3 py-2 bg-gray-600 text-white text-sm font-bold rounded hover:bg-gray-500 transition"
                  >
                    NPCs
                  </button>
                  {campaign.playerID === playerId && (
                    <button
                      onClick={() => navigate(`/Fa_campaign_edit?id=${campaign.id}`)}
                      className="px-3 py-2 bg-yellow-600 text-white text-sm font-bold rounded hover:bg-yellow-700 transition"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      const isOpen = openLogs[campaign.id];
                      setOpenLogs((prev) => ({ ...prev, [campaign.id]: !prev[campaign.id] }));
                      setOpenCharacters((prev) => ({ ...prev, [campaign.id]: false }));
                      setOpenNpcs((prev) => ({ ...prev, [campaign.id]: false }));
                      if (!isOpen) await loadCampaignLogs(campaign.id);
                    }}
                    className="px-3 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 transition"
                  >
                    Log
                  </button>
                </div>
              </div>

              {/* Characters */}
              {openCharacters[campaign.id] && (
                <div className="mt-4">
                  <h4 className="text-sm font-bold text-white mb-2">Characters in Campaign:</h4>
                  {(campaignCharacters[campaign.id] || []).length > 0 ? (
                    <div className="rounded-xl p-4 mb-4 flex flex-col gap-3" style={{ backgroundColor: '#000000' }}>
                      {campaignCharacters[campaign.id].map((character) => (
                        <div
                          key={character.id}
                          style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: '#000000', border: '2px solid #dc2626', borderRadius: '0.5rem', flexWrap: 'wrap' }}
                        >
                          <img
                            src={`/Fa_Pictures/${character.race}_Face.png`}
                            alt={character.name}
                            className="rounded object-contain"
                            style={{ width: '60px', height: '75px', flexShrink: 0 }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold truncate">{character.name}</p>
                            <p className="text-xs text-gray-400">{character.race} · Lv {character.level ?? 1}</p>
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => { localStorage.setItem('loadedCharacterId', character.id); navigate('/Fa_character_overview'); }}
                                className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition"
                              >
                                View
                              </button>
                              {campaign.playerID === playerId && (
                                <button
                                  onClick={async () => {
                                    if (!confirm(`Remove ${character.name} from this campaign?`)) return;
                                    const { error } = await supabase.from('Fa_player_characters').update({ campaign_joined: null }).eq('id', character.id);
                                    if (error) { alert('Error removing character.'); return; }
                                    setCampaignCharacters((prev) => ({ ...prev, [campaign.id]: (prev[campaign.id] || []).filter((c) => c.id !== character.id) }));
                                  }}
                                  className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700 transition"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No characters in this campaign yet</p>
                  )}
                </div>
              )}

              {/* NPCs */}
              {openNpcs[campaign.id] && (
                <div className="mt-4">
                  <h4 className="text-sm font-bold text-white mb-2">NPCs:</h4>
                  {(campaignNpcs[campaign.id] || []).length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {campaignNpcs[campaign.id].map((npc) => (
                        <div key={npc.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                          <div className="flex items-start gap-3">
                            {npc.PicturePath && (
                              <img
                                src={npc.PicturePath.startsWith('/') ? npc.PicturePath : `/Fa_Pictures/${npc.PicturePath}`}
                                alt={npc.Name}
                                className="rounded object-contain"
                                style={{ width: '55px', height: '68px', flexShrink: 0 }}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-white">{npc.Name}</p>
                              {npc.race && <p className="text-xs text-gray-400">Race: {npc.race}</p>}
                              {npc.Description && <p className="text-xs text-gray-300 mt-1">{npc.Description}</p>}
                              <div className="flex flex-wrap gap-1 mt-2">
                                {SPECIAL_FIELDS.map((f) => (
                                  <span key={f.key} className="text-xs bg-gray-700 rounded px-1 py-0.5 text-white font-mono">
                                    {f.short} {npc.special?.[f.key] ?? 5}
                                  </span>
                                ))}
                              </div>
                              {(() => {
                                const ranked = SKILLS.filter((s) => (npc.skills?.[s.key] || 0) > 0);
                                if (ranked.length === 0) return null;
                                return <p className="text-xs text-gray-400 mt-1">Skills: {ranked.map((s) => `${s.label} ${npc.skills[s.key]}`).join(', ')}</p>;
                              })()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No NPCs added yet</p>
                  )}
                </div>
              )}

              {/* Logs */}
              {openLogs[campaign.id] && (
                <div className="mt-4">
                  <h4 className="text-sm font-bold text-white mb-2">Campaign Log:</h4>
                  {(campaignLogs[campaign.id] || []).length > 0 ? (
                    <div className="rounded-xl p-4 mb-4 flex flex-col gap-3" style={{ backgroundColor: '#1a1a1a' }}>
                      {campaignLogs[campaign.id].map((log, idx) => (
                        <div key={idx} style={{ padding: '0.75rem', backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '0.5rem' }}>
                          <p className="text-xs text-gray-400 mb-1">Log #{log.Log_number}</p>
                          <p className="text-sm text-white whitespace-pre-wrap">{log.Log}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No logs for this campaign yet</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
