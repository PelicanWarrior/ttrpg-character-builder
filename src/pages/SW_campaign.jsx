import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function SWCampaign() {
  // NPCs by campaignId
  const [campaignNpcs, setCampaignNpcs] = useState({});
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [description, setDescription] = useState('');
  const [playerId, setPlayerId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignCharacters, setCampaignCharacters] = useState({});
  const [openCharacters, setOpenCharacters] = useState({});  const [openLogs, setOpenLogs] = useState({});
  const [campaignLogs, setCampaignLogs] = useState({});

  useEffect(() => {
    const username = localStorage.getItem('username');
    if (username) {
      const fetchPlayerIdAndCampaigns = async () => {
        const { data: userData } = await supabase
          .from('user')
          .select('id, admin')
          .eq('username', username)
          .single();
        if (userData) {
          setPlayerId(userData.id);
          if (userData.admin === true) {
            console.log('This user is Admin');
          }
          // Fetch campaigns where user is DM
          const { data: dmCampaigns } = await supabase
            .from('SW_campaign')
            .select('id, Name, description, playerID, campaign_code, user:playerID(username)')
            .eq('playerID', userData.id);
          // Fetch campaigns where user's characters are members
          const { data: userCharacters } = await supabase
            .from('SW_player_characters')
            .select('campaign_joined')
            .eq('user_number', userData.id)
            .not('campaign_joined', 'is', null);
          const memberCampaignIds = [...new Set((userCharacters || []).map(c => c.campaign_joined))];
          let memberCampaigns = [];
          if (memberCampaignIds.length > 0) {
            const { data: campaigns } = await supabase
              .from('SW_campaign')
              .select('id, Name, description, playerID, campaign_code, user:playerID(username)')
              .in('id', memberCampaignIds);
            memberCampaigns = campaigns || [];
          }
          // Combine and deduplicate campaigns
          const allCampaignsMap = new Map();
          [...(dmCampaigns || []), ...memberCampaigns].forEach(c => {
            if (c) allCampaignsMap.set(c.id, c);
          });
          const allCampaigns = Array.from(allCampaignsMap.values());
          const sortedCampaigns = allCampaigns.slice().sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));
          setCampaigns(sortedCampaigns);
          // Fetch characters for each campaign
          if (allCampaigns.length > 0) {
            const charactersByCampaign = {};
            const npcsByCampaign = {};
            for (const campaign of allCampaigns) {
              const [{ data: chars }, { data: npcs }] = await Promise.all([
                supabase
                  .from('SW_player_characters')
                  .select('id, name, race, career, spec, picture, user_number, user:user_number(username)')
                  .eq('campaign_joined', campaign.id),
                supabase
                  .from('SW_campaign_NPC')
                  .select('id, Name, Description, PictureID, campaignID')
                  .eq('campaignID', campaign.id)
              ]);
              charactersByCampaign[campaign.id] = chars || [];
              npcsByCampaign[campaign.id] = npcs || [];
            }
            setCampaignCharacters(charactersByCampaign);
            setCampaignNpcs(npcsByCampaign);
          }
        }
      };
      fetchPlayerIdAndCampaigns();
    }
  }, []);

  const generateUniqueCampaignCode = async () => {
    let code = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let isUnique = false;

    while (!isUnique) {
      code = '';
      for (let i = 0; i < 12; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const { data } = await supabase
        .from('SW_campaign')
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
      alert('Please enter a campaign name');
      return;
    }

    setLoading(true);
    try {
      const campaignCode = await generateUniqueCampaignCode();

      const { error } = await supabase
        .from('SW_campaign')
        .insert([
          {
            Name: campaignName,
            description: description,
            playerID: playerId,
            TTRPG: 1,
            campaign_code: campaignCode,
          },
        ]);

      if (error) {
        console.error('Error creating campaign:', error);
        alert('Failed to create campaign');
      } else {
        setCampaignName('');
        setDescription('');
        setShowModal(false);
        alert('Campaign created successfully!');
        // Refresh campaigns list
        const { data: dmCampaigns } = await supabase
          .from('SW_campaign')
          .select('id, Name, description, playerID, campaign_code, user:playerID(username)')
          .eq('playerID', playerId);
        
        const { data: userCharacters } = await supabase
          .from('SW_player_characters')
          .select('campaign_joined')
          .eq('user_number', playerId)
          .not('campaign_joined', 'is', null);
        
        const memberCampaignIds = [...new Set((userCharacters || []).map(c => c.campaign_joined))];
        
        let memberCampaigns = [];
        if (memberCampaignIds.length > 0) {
          const { data: campaigns } = await supabase
            .from('SW_campaign')
            .select('id, Name, description, playerID, campaign_code, user:playerID(username)')
            .in('id', memberCampaignIds);
          memberCampaigns = campaigns || [];
        }
        
        const allCampaignsMap = new Map();
        [...(dmCampaigns || []), ...memberCampaigns].forEach(c => {
          if (c) allCampaignsMap.set(c.id, c);
        });
        const allCampaigns = Array.from(allCampaignsMap.values());
        
        const sortedCampaigns = allCampaigns.slice().sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));
        setCampaigns(sortedCampaigns);
        
        // Fetch characters and NPCs for the new campaign
        if (allCampaigns.length > 0) {
          const charactersByCampaign = {};
          const npcsByCampaign = {};
          for (const campaign of allCampaigns) {
            const [{ data: chars }, { data: npcs }] = await Promise.all([
              supabase
                .from('SW_player_characters')
                .select('id, name, race, career, spec, picture, user_number, user:user_number(username)')
                .eq('campaign_joined', campaign.id),
              supabase
                .from('SW_campaign_NPC')
                .select('id, Name, Description, PictureID, campaignID')
                .eq('campaignID', campaign.id)
            ]);
            charactersByCampaign[campaign.id] = chars || [];
            npcsByCampaign[campaign.id] = npcs || [];
          }
          setCampaignCharacters(charactersByCampaign);
          setCampaignNpcs(npcsByCampaign);
        }
      }
    } catch (err) {
      console.error('Error:', err);
      alert('An error occurred while creating the campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">My Campaigns</h1>

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

        {/* Create Campaign Modal */}
        {showModal && (
          <div className="bg-gray-800 rounded-xl p-8 max-w-md mb-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Create a Campaign</h2>

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
        <div className="border-t border-gray-600 mb-8"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {[...campaigns].sort((a, b) => (a?.Name || '').localeCompare(b?.Name || '')).map((campaign) => {
            const shareLink = `${window.location.origin}/campaign-join?code=${campaign.campaign_code}`;
            return (
              <div key={campaign.id} className="rounded-2xl p-6 border-2 border-gray-600" style={{ backgroundColor: '#d1d5db', marginBottom: '2rem' }}>
                <h3 className="text-xl font-bold mb-1 text-white text-center">{campaign.Name}</h3>
                <p className="text-sm text-gray-800 font-semibold mb-2 text-left">DM: {campaign.user?.username || 'Unknown'}</p>
                {/* NPCs with PictureID shown to the right of the description */}
                {campaignNpcs[campaign.id] && campaignNpcs[campaign.id].length > 0 ? (
                  <div className="flex items-start mb-4">
                    {/* Show the first NPC with a PictureID, or just the first NPC */}
                    {(() => {
                      const npc = campaignNpcs[campaign.id].find(n => n.PictureID);
                      if (npc && npc.PictureID) {
                        return (
                          <img
                            src={`/SW_Pictures/Picture ${npc.PictureID}.png`}
                            alt={npc.Name}
                            className="w-40 h-52 object-cover rounded-lg shadow-lg mr-6 mb-2 float-right"
                            style={{ float: 'right', marginLeft: '1.5rem', marginBottom: '0.5rem' }}
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        );
                      }
                      return null;
                    })()}
                    <div style={{ flex: 1 }}>
                      <p className="text-gray-300 mb-2" style={{ overflowWrap: 'anywhere' }}>{campaign.description}</p>
                      {/* Optionally show NPC description below or merged with campaign description */}
                      {(() => {
                        const npc = campaignNpcs[campaign.id].find(n => n.Description);
                        if (npc && npc.Description) {
                          return <p className="text-gray-400 text-sm mt-2">NPC: {npc.Description}</p>;
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-300 mb-4">{campaign.description}</p>
                )}
                
                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                  <div className="flex gap-2 items-center mb-2">
                    <p className="text-sm text-gray-400 whitespace-nowrap">Share Link:</p>
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded border border-gray-500 truncate"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareLink);
                        alert('Link copied to clipboard!');
                      }}
                      className="px-3 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 transition whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        setOpenCharacters((prev) => ({
                          ...prev,
                          [campaign.id]: !prev[campaign.id],
                        }));
                        setOpenLogs((prev) => ({
                          ...prev,
                          [campaign.id]: false,
                        }));
                      }}
                      className="px-3 py-2 bg-gray-600 text-white text-sm font-bold rounded hover:bg-gray-700 transition whitespace-nowrap"
                    >
                      Characters
                    </button>
                    {campaign.playerID === playerId && (
                      <button
                        onClick={() => navigate(`/SW_campaign_edit?id=${campaign.id}`)}
                        className="px-3 py-2 bg-yellow-600 text-white text-sm font-bold rounded hover:bg-yellow-700 transition whitespace-nowrap"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        const isOpen = openLogs[campaign.id];
                        setOpenLogs((prev) => ({
                          ...prev,
                          [campaign.id]: !prev[campaign.id],
                        }));
                        setOpenCharacters((prev) => ({
                          ...prev,
                          [campaign.id]: false,
                        }));
                        if (!isOpen) {
                          console.log('Fetching logs for campaign ID:', campaign.id);
                          const { data, error } = await supabase
                            .from('SW_campaign_log')
                            .select('Log, Log_number, campaignID')
                            .eq('campaignID', campaign.id)
                            .order('Log_number', { ascending: false });
                          console.log('Log query result:', { data, error, campaignId: campaign.id });
                          if (error) {
                            console.error('Error fetching logs:', error);
                          }
                          setCampaignLogs((prev) => ({
                            ...prev,
                            [campaign.id]: data || [],
                          }));
                        }
                      }}
                      className="px-3 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 transition whitespace-nowrap"
                    >
                      Log
                    </button>
                    {campaign.playerID === playerId && (
                      <button
                        onClick={() => navigate(`/SW_notes?campaignId=${campaign.id}&campaignName=${encodeURIComponent(campaign.Name)}`)}
                        className="px-3 py-2 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 transition whitespace-nowrap"
                      >
                        My Notes
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/SW_battles?campaignId=${campaign.id}&campaignName=${encodeURIComponent(campaign.Name)}`)}
                      className="px-3 py-2 bg-purple-600 text-white text-sm font-bold rounded hover:bg-purple-700 transition whitespace-nowrap"
                    >
                      Battles
                    </button>
                  </div>
                </div>
                
                {/* Campaign Characters */}
                {openCharacters[campaign.id] && (
                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-white mb-2">Characters in Campaign:</h4>
                    {campaignCharacters[campaign.id] && campaignCharacters[campaign.id].length > 0 ? (
                      <div style={{ backgroundColor: '#000000', color: '#ffffff', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {campaignCharacters[campaign.id].map((character) => (
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
                            <img
                              src={`/SW_Pictures/Picture ${character.picture || 0} Face.png`}
                              alt={character.name}
                              className="rounded object-contain"
                              style={{ width: '80px', height: '100px' }}
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"80\" height=\"100\"%3E%3Crect fill=\"%23333\" width=\"80\" height=\"100\"/%3E%3C/svg%3E';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white truncate leading-none" style={{ fontWeight: 700, fontSize: '1.125rem', lineHeight: '1.1', margin: 0 }}>{character.name}</p>
                              <p className="text-xs text-white truncate leading-none" style={{ lineHeight: '1.1', margin: 0 }}>{character.race} | {character.career}{character.spec ? ` - ${character.spec}` : ''}</p>
                              <p className="text-xs text-white truncate leading-none" style={{ lineHeight: '1.1', margin: 0 }}>Player: {character.user?.username || 'Unknown'}</p>
                              <div className="flex gap-2" style={{ marginTop: '0.75rem' }}>
                                <button
                                  onClick={() => {
                                    localStorage.setItem('loadedCharacterId', character.id);
                                    navigate('/SW_character_overview', { state: { fromCampaign: true, campaignId: campaign.id } });
                                  }}
                                  className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition"
                                >
                                  View
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!confirm(`Remove ${character.name} from this campaign?`)) return;
                                    const { error } = await supabase
                                      .from('SW_player_characters')
                                      .update({ campaign_joined: null })
                                      .eq('id', character.id);
                                    if (error) {
                                      alert('Error removing character from campaign');
                                      console.error('Error removing character:', error);
                                    } else {
                                      setCampaignCharacters(prev => ({
                                        ...prev,
                                        [campaign.id]: (prev[campaign.id] || []).filter(c => c.id !== character.id)
                                      }));
                                    }
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

                {/* Campaign Logs */}
                {openLogs[campaign.id] && (
                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-white mb-2">Campaign Log:</h4>
                    {campaignLogs[campaign.id] && campaignLogs[campaign.id].length > 0 ? (
                      <div style={{ backgroundColor: '#1a1a1a', color: '#ffffff', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {campaignLogs[campaign.id].map((log, index) => (
                          <div
                            key={index}
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
