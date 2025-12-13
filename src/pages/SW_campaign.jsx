import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function SWCampaign() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [description, setDescription] = useState('');
  const [playerId, setPlayerId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignCharacters, setCampaignCharacters] = useState({});

  useEffect(() => {
    const username = localStorage.getItem('username');
    if (username) {
      const fetchPlayerIdAndCampaigns = async () => {
        const { data: userData } = await supabase
          .from('user')
          .select('id')
          .eq('username', username)
          .single();
        if (userData) {
          setPlayerId(userData.id);
          const { data: campaignData } = await supabase
            .from('SW_campaign')
            .select('*')
            .eq('playerID', userData.id);
          setCampaigns(campaignData || []);
          
          // Fetch characters for each campaign
          if (campaignData && campaignData.length > 0) {
            const charactersByCampaign = {};
            for (const campaign of campaignData) {
              const { data: chars } = await supabase
                .from('SW_player_characters')
                .select('id, name, race, career, spec, picture, user_number, user:user_number(username)')
                .eq('campaign_joined', campaign.id);
              charactersByCampaign[campaign.id] = chars || [];
            }
            setCampaignCharacters(charactersByCampaign);
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
        const { data: campaignData } = await supabase
          .from('SW_campaign')
          .select('*')
          .eq('playerID', playerId);
        setCampaigns(campaignData || []);
        
        // Fetch characters for the new campaign
        if (campaignData && campaignData.length > 0) {
          const charactersByCampaign = {};
          for (const campaign of campaignData) {
            const { data: chars } = await supabase
              .from('SW_player_characters')
              .select('id, name, race, career, spec, picture, user_number, user:user_number(username)')
              .eq('campaign_joined', campaign.id);
            charactersByCampaign[campaign.id] = chars || [];
          }
          setCampaignCharacters(charactersByCampaign);
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => {
            const shareLink = `${window.location.origin}/campaign-join?code=${campaign.campaign_code}`;
            return (
              <div key={campaign.id} className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
                <h3 className="text-xl font-bold mb-3 text-white text-center">{campaign.Name}</h3>
                <p className="text-gray-300 mb-4">{campaign.description}</p>
                
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
                </div>
                
                {/* Campaign Characters */}
                <div className="mt-4">
                  <h4 className="text-sm font-bold text-gray-300 mb-2">Characters in Campaign:</h4>
                  {campaignCharacters[campaign.id] && campaignCharacters[campaign.id].length > 0 ? (
                    <div className="space-y-2">
                      {campaignCharacters[campaign.id].map((character) => (
                        <div key={character.id} className="flex items-center gap-3 bg-gray-600 rounded-lg p-2 border-2 border-gray-500">
                          <img
                            src={`/SW_Pictures/Picture ${character.picture || 0} Face.png`}
                            alt={character.name}
                            className="rounded object-contain"
                            style={{ width: '80px', height: '100px' }}
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="100"%3E%3Crect fill="%23333" width="80" height="100"/%3E%3C/svg%3E';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{character.name}</p>
                            <p className="text-xs text-gray-300 truncate">{character.race} | {character.career}{character.spec ? ` - ${character.spec}` : ''}</p>
                            <p className="text-xs text-gray-400 truncate">Player: {character.user?.username || 'Unknown'}</p>
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => {
                                  localStorage.setItem('loadedCharacterId', character.id);
                                  navigate('/SW_character_overview');
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
                                    // Update the local state to remove the character from the list
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
