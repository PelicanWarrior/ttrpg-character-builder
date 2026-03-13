import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';

const parseModNames = (value) => String(value || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const rowMatchesMod = (rowMod, targetMod) => {
  const normalizedTarget = String(targetMod || '').trim().toLowerCase();
  if (!normalizedTarget) return true;
  const mods = parseModNames(rowMod).map((item) => item.toLowerCase());
  if (mods.length === 0) return false;
  return mods.includes(normalizedTarget);
};

const parseTtrpgId = (value) => {
  const normalized = String(value ?? '').trim();
  if (!normalized) return null;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const applyCampaignTtrpgFilter = (query, ttrpgId) => {
  if (ttrpgId == null) return query;
  // Include legacy null/0 rows so campaigns created before filter fixes still appear.
  return query.or(`TTRPG.eq.${ttrpgId},TTRPG.is.null,TTRPG.eq.0`);
};

const attachCampaignUsernames = async (campaignRows) => {
  const rows = Array.isArray(campaignRows) ? campaignRows : [];
  if (rows.length === 0) return [];

  const playerIds = [...new Set(rows.map((row) => row?.playerID).filter(Boolean))];
  if (playerIds.length === 0) {
    return rows.map((row) => ({ ...row, user: { username: 'Unknown' } }));
  }

  const { data: users, error } = await supabase
    .from('user')
    .select('id, username')
    .in('id', playerIds);

  if (error) {
    console.error('Failed loading campaign usernames:', error);
    return rows.map((row) => ({ ...row, user: { username: 'Unknown' } }));
  }

  const usernameById = {};
  (users || []).forEach((userRow) => {
    usernameById[userRow.id] = userRow.username || 'Unknown';
  });

  return rows.map((row) => ({
    ...row,
    user: { username: usernameById[row.playerID] || 'Unknown' },
  }));
};

export default function DNDCampaign() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const mod = searchParams.get('mod') || '';
  const ttrpgIdParam = searchParams.get('ttrpgId') || '';
  const ttrpgId = parseTtrpgId(ttrpgIdParam);

  const [playerId, setPlayerId] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignCharacters, setCampaignCharacters] = useState({});
  const [campaignNpcs, setCampaignNpcs] = useState({});
  const [raceMap, setRaceMap] = useState({});
  const [classMap, setClassMap] = useState({});
  const [openCharacters, setOpenCharacters] = useState({});
  const [openLogs, setOpenLogs] = useState({});
  const [campaignLogs, setCampaignLogs] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const sortedCampaigns = useMemo(
    () => [...campaigns].sort((a, b) => (a?.Name || '').localeCompare(b?.Name || '')),
    [campaigns]
  );

  const loadCampaignDetails = async (campaignRows) => {
    if (!Array.isArray(campaignRows) || campaignRows.length === 0) {
      setCampaignCharacters({});
      setCampaignNpcs({});
      return;
    }

    const byCampaignCharacters = {};
    const byCampaignNpcs = {};

    for (const campaign of campaignRows) {
      const [{ data: chars }, { data: npcs }] = await Promise.all([
        supabase
          .from('DND_player_character')
          .select('id, Name, Race, Class, User_ID')
          .eq('campaign_joined', campaign.id),
        supabase
          .from('DND_campaign_NPC')
          .select('id, Name, Description, PictureID, CampaignID')
          .eq('CampaignID', campaign.id),
      ]);

      byCampaignCharacters[campaign.id] = chars || [];
      byCampaignNpcs[campaign.id] = npcs || [];
    }

    setCampaignCharacters(byCampaignCharacters);
    setCampaignNpcs(byCampaignNpcs);
  };

  const loadCampaigns = async (currentPlayerId) => {
    if (!currentPlayerId) return;

    const dmQuery = applyCampaignTtrpgFilter(
      supabase
      .from('DND_campaign')
      .select('id, Name, description, playerID, TTRPG, campaign_code')
      .eq('playerID', currentPlayerId),
      ttrpgId
    );

    const { data: dmCampaigns, error: dmError } = await dmQuery;
    if (dmError) {
      console.error('Failed loading DND DM campaigns:', dmError);
    }

    const characterQuery = supabase
      .from('DND_player_character')
      .select('campaign_joined')
      .eq('User_ID', currentPlayerId)
      .not('campaign_joined', 'is', null);

    if (ttrpgId != null) {
      characterQuery.eq('TTRPG', ttrpgId);
    }

    const { data: userCharacters, error: characterError } = await characterQuery;
    if (characterError) {
      console.error('Failed loading DND character campaign membership:', characterError);
    }

    const memberCampaignIds = [...new Set((userCharacters || []).map((c) => c.campaign_joined).filter(Boolean))];
    let memberCampaigns = [];

    if (memberCampaignIds.length > 0) {
      const memberQuery = applyCampaignTtrpgFilter(
        supabase
          .from('DND_campaign')
          .select('id, Name, description, playerID, TTRPG, campaign_code')
          .in('id', memberCampaignIds),
        ttrpgId
      );

      const { data, error } = await memberQuery;
      if (error) {
        console.error('Failed loading joined DND campaigns:', error);
      } else {
        memberCampaigns = data || [];
      }
    }

    const mergedMap = new Map();
    [...(dmCampaigns || []), ...memberCampaigns].forEach((campaign) => {
      if (!campaign) return;
      mergedMap.set(campaign.id, campaign);
    });

    const merged = Array.from(mergedMap.values());
    const campaignsWithUsers = await attachCampaignUsernames(merged);
    setCampaigns(campaignsWithUsers);
    await loadCampaignDetails(campaignsWithUsers);
  };

  useEffect(() => {
    const loadStaticMaps = async () => {
      const [{ data: raceRows }, { data: classRows }] = await Promise.all([
        supabase.from('DND_Races').select('id, RaceName, DNDMod'),
        supabase.from('DND_Classes').select('id, ClassName, DNDMod'),
      ]);

      const nextRaceMap = {};
      (raceRows || [])
        .filter((row) => rowMatchesMod(row.DNDMod, mod))
        .forEach((row) => {
          nextRaceMap[row.id] = row.RaceName || 'Unknown Race';
        });

      const nextClassMap = {};
      (classRows || [])
        .filter((row) => rowMatchesMod(row.DNDMod, mod))
        .forEach((row) => {
          nextClassMap[row.id] = row.ClassName || 'Unknown Class';
        });

      setRaceMap(nextRaceMap);
      setClassMap(nextClassMap);
    };

    loadStaticMaps();
  }, [mod]);

  useEffect(() => {
    const username = localStorage.getItem('username');
    if (!username) return;

    const init = async () => {
      const { data: userData, error: userError } = await supabase
        .from('user')
        .select('id')
        .eq('username', username)
        .single();

      if (userError || !userData) {
        console.error('Failed loading user for DND campaigns:', userError);
        return;
      }

      setPlayerId(userData.id);
      await loadCampaigns(userData.id);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mod, ttrpgIdParam]);

  const generateUniqueCampaignCode = async () => {
    let code = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let isUnique = false;

    while (!isUnique) {
      code = '';
      for (let i = 0; i < 12; i += 1) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const { data } = await supabase
        .from('DND_campaign')
        .select('campaign_code')
        .eq('campaign_code', code);

      if (!data || data.length === 0) {
        isUnique = true;
      }
    }

    return code;
  };

  const handleCreateCampaign = async () => {
    if (!campaignName.trim() || !playerId) {
      alert('Please enter a campaign name.');
      return;
    }

    setLoading(true);
    try {
      const campaignCode = await generateUniqueCampaignCode();
      const payload = {
        Name: campaignName.trim(),
        description,
        playerID: playerId,
        TTRPG: ttrpgId,
        campaign_code: campaignCode,
      };

      const { error } = await supabase
        .from('DND_campaign')
        .insert([payload]);

      if (error) throw error;

      setCampaignName('');
      setDescription('');
      setShowModal(false);
      await loadCampaigns(playerId);
      alert('Campaign created successfully!');
    } catch (err) {
      console.error('Failed creating DND campaign:', err);
      alert('Failed to create campaign.');
    } finally {
      setLoading(false);
    }
  };

  const loadCampaignLogs = async (campaignId) => {
    const { data, error } = await supabase
      .from('DND_campaign_log')
      .select('Log, Log_number, campaignID')
      .eq('campaignID', campaignId)
      .order('Log_number', { ascending: false });

    if (error) {
      console.error('Failed loading DND campaign logs:', error);
      setCampaignLogs((prev) => ({ ...prev, [campaignId]: [] }));
      return;
    }

    setCampaignLogs((prev) => ({ ...prev, [campaignId]: data || [] }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">DND Campaigns</h1>

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
            <h2 className="text-2xl font-bold mb-6">Create a DND Campaign</h2>

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
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-500 transition"
              >
                {loading ? 'Creating...' : 'Create Campaign'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
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
              <p className="text-sm text-gray-800 font-semibold mb-2 text-left">DM: {campaign.user?.username || 'Unknown'}</p>

              {campaignNpcs[campaign.id] && campaignNpcs[campaign.id].length > 0 ? (
                <div className="mb-4">
                  <p className="text-gray-300 mb-2" style={{ overflowWrap: 'anywhere' }}>{campaign.description}</p>
                  {(() => {
                    const npc = campaignNpcs[campaign.id].find((n) => n.Description);
                    if (!npc) return null;
                    return <p className="text-gray-400 text-sm mt-2">NPC: {npc.Description}</p>;
                  })()}
                </div>
              ) : (
                <p className="text-gray-300 mb-4">{campaign.description}</p>
              )}

              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button
                    onClick={() => {
                      setOpenCharacters((prev) => ({ ...prev, [campaign.id]: !prev[campaign.id] }));
                      setOpenLogs((prev) => ({ ...prev, [campaign.id]: false }));
                    }}
                    className="px-3 py-2 bg-gray-600 text-white text-sm font-bold rounded hover:bg-gray-700 transition"
                  >
                    Characters
                  </button>
                  {campaign.playerID === playerId && (
                    <button
                      onClick={() => navigate(`/DND_campaign_edit?id=${campaign.id}&mod=${encodeURIComponent(mod)}&ttrpgId=${encodeURIComponent(ttrpgIdParam || '')}`)}
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
                      if (!isOpen) {
                        await loadCampaignLogs(campaign.id);
                      }
                    }}
                    className="px-3 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 transition"
                  >
                    Log
                  </button>
                  {campaign.playerID === playerId && (
                    <button
                      onClick={() => navigate(`/DND_notes?campaignId=${campaign.id}&campaignName=${encodeURIComponent(campaign.Name)}&mod=${encodeURIComponent(mod)}&ttrpgId=${encodeURIComponent(ttrpgIdParam || '')}`)}
                      className="px-3 py-2 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 transition"
                    >
                      My Notes
                    </button>
                  )}
                </div>
              </div>

              {openCharacters[campaign.id] && (
                <div className="mt-4">
                  <h4 className="text-sm font-bold text-white mb-2">Characters in Campaign:</h4>
                  {(campaignCharacters[campaign.id] || []).length > 0 ? (
                    <div className="rounded-xl p-4 mb-4 flex flex-col gap-3" style={{ backgroundColor: '#000000' }}>
                      {campaignCharacters[campaign.id]
                        .slice()
                        .sort((a, b) => (a.Name || '').localeCompare(b.Name || ''))
                        .map((character) => (
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
                              flexWrap: 'wrap',
                            }}
                          >
                            <div
                              style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '9999px',
                                border: '2px solid #dc2626',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontWeight: 700,
                              }}
                            >
                              {(character.Name || 'U')[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white truncate leading-none" style={{ fontWeight: 700, fontSize: '1.125rem', lineHeight: '1.1', margin: 0 }}>{character.Name}</p>
                              <p className="text-xs text-white truncate leading-none" style={{ lineHeight: '1.1', margin: 0 }}>
                                {(raceMap[character.Race] || 'Unknown Race')} | {(classMap[character.Class] || 'Unknown Class')}
                              </p>
                              <div className="flex gap-2" style={{ marginTop: '0.75rem' }}>
                                <button
                                  onClick={() => {
                                    localStorage.setItem('loadedCharacterId', character.id);
                                    navigate(`/dndmod_character_creator?mod=${encodeURIComponent(mod)}`);
                                  }}
                                  className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!confirm(`Remove ${character.Name} from this campaign?`)) return;
                                    const { error } = await supabase
                                      .from('DND_player_character')
                                      .update({ campaign_joined: null })
                                      .eq('id', character.id);
                                    if (error) {
                                      alert('Error removing character from campaign');
                                      return;
                                    }
                                    setCampaignCharacters((prev) => ({
                                      ...prev,
                                      [campaign.id]: (prev[campaign.id] || []).filter((c) => c.id !== character.id),
                                    }));
                                  }}
                                  className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700 transition"
                                >
                                  Remove
                                </button>
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

              {openLogs[campaign.id] && (
                <div className="mt-4">
                  <h4 className="text-sm font-bold text-white mb-2">Campaign Log:</h4>
                  {(campaignLogs[campaign.id] || []).length > 0 ? (
                    <div className="rounded-xl p-4 mb-4 flex flex-col gap-3" style={{ backgroundColor: '#1a1a1a' }}>
                      {campaignLogs[campaign.id].map((log) => (
                        <div
                          key={`${campaign.id}-${log.Log_number}`}
                          style={{
                            padding: '0.75rem',
                            backgroundColor: '#2a2a2a',
                            border: '1px solid #444',
                            borderRadius: '0.5rem',
                          }}
                        >
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
