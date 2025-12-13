import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function CampaignJoin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [campaign, setCampaign] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joiningCampaign, setJoiningCampaign] = useState(false);
  const [error, setError] = useState('');
  const [playerId, setPlayerId] = useState(null);
  const [alreadyInCampaign, setAlreadyInCampaign] = useState(false);

  useEffect(() => {
    const fetchCampaignAndCharacters = async () => {
      const username = localStorage.getItem('username');
      
      console.log('CampaignJoin - Username:', username);
      
      if (!username) {
        setError('You must be logged in to join a campaign');
        setLoading(false);
        return;
      }

      const campaignCode = searchParams.get('code');
      
      console.log('CampaignJoin - Campaign Code:', campaignCode);
      
      if (!campaignCode) {
        setError('Invalid campaign link (missing campaign code)');
        setLoading(false);
        return;
      }

      try {
        // Get user ID
        const { data: userData, error: userError } = await supabase
          .from('user')
          .select('id')
          .eq('username', username)
          .single();

        console.log('CampaignJoin - User Data:', userData, 'Error:', userError);

        if (userError || !userData) {
          setError(`Could not find user information: ${userError?.message || 'No user data'}`);
          setLoading(false);
          return;
        }

        setPlayerId(userData.id);

        // Get campaign details
        const { data: campaignData, error: campaignError } = await supabase
          .from('SW_campaign')
          .select('*')
          .eq('campaign_code', campaignCode)
          .single();

        console.log('CampaignJoin - Campaign Data:', campaignData, 'Error:', campaignError);

        if (campaignError || !campaignData) {
          setError(`Campaign not found: ${campaignError?.message || 'No campaign data'}`);
          setLoading(false);
          return;
        }

        setCampaign(campaignData);

        // Get user's characters that are not already in a campaign
        const { data: characterData, error: characterError } = await supabase
          .from('SW_player_characters')
          .select('id, name, race, career, spec, picture, campaign_joined')
          .eq('user_number', userData.id)
          .order('name', { ascending: true });

        console.log('CampaignJoin - Character Data:', characterData, 'Error:', characterError);

        if (characterError) {
          console.error('Error fetching characters:', characterError);
          setError(`Could not load your characters: ${characterError.message}`);
          setLoading(false);
        } else {
          // Check if user already has a character in this campaign
          const characterInCampaign = (characterData || []).find(char => char.campaign_joined === campaignData.id);
          
          if (characterInCampaign) {
            setAlreadyInCampaign(true);
            setLoading(false);
            return;
          }
          
          // Filter out characters that already have a campaign
          const availableCharacters = (characterData || []).filter(char => !char.campaign_joined);
          setCharacters(availableCharacters);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error:', err);
        setError(`An error occurred while loading the campaign: ${err.message}`);
        setLoading(false);
      }
    };

    fetchCampaignAndCharacters();
  }, [searchParams]);

  useEffect(() => {
    if (alreadyInCampaign && campaign) {
      const characterInCampaign = characters.find(char => char.campaign_joined === campaign.id);
      alert(`You already have a character in this campaign${characterInCampaign ? ` (${characterInCampaign.name})` : ''}.`);
      navigate('/select-ttrpg');
    }
  }, [alreadyInCampaign, campaign, navigate]);

  const handleJoinCampaign = async () => {
    if (!selectedCharacterId) {
      alert('Please select a character to join the campaign');
      return;
    }

    setJoiningCampaign(true);
    try {
      // Update character's campaign_joined field
      const { error } = await supabase
        .from('SW_player_characters')
        .update({ campaign_joined: campaign.id })
        .eq('id', selectedCharacterId);

      if (error) {
        console.error('Error joining campaign:', error);
        alert(`Failed to join campaign: ${error.message}`);
      } else {
        alert(`Successfully joined campaign "${campaign.Name}" with ${characters.find(c => c.id === selectedCharacterId).name}!`);
        navigate('/select-ttrpg');
      }
    } catch (err) {
      console.error('Error:', err);
      alert(`An error occurred while joining the campaign: ${err.message}`);
    } finally {
      setJoiningCampaign(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-500">Error</h2>
          <p className="text-lg mb-8">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/select-ttrpg')}
          className="mb-8 px-4 py-2 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition"
        >
          ← Back
        </button>

        <div className="bg-gray-800 rounded-xl p-8 shadow-2xl mb-8">
          <h1 className="text-4xl font-bold mb-2">{campaign?.Name}</h1>
          <p className="text-gray-400 mb-6">Campaign Code: <span className="font-mono text-gray-300">{campaign?.campaign_code}</span></p>
          
          {campaign?.description && (
            <div className="bg-gray-700 rounded-lg p-4 mb-8">
              <p className="text-gray-300">{campaign.description}</p>
            </div>
          )}

          <h2 className="text-2xl font-bold mb-6">Select a Character to Join</h2>

          {characters.length === 0 ? (
            <div className="bg-gray-700 rounded-lg p-6 text-center mb-6">
              <p className="text-gray-300 mb-4">You don't have any characters yet.</p>
              <button
                onClick={() => navigate('/sweote-character-creator')}
                className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
              >
                Create a Character
              </button>
            </div>
          ) : (
            <div className="space-y-3 mb-8">
              {characters.map((character) => (
                <div
                  key={character.id}
                  className="p-4 rounded-lg border-2 bg-gray-700 border-gray-600 flex items-center gap-4"
                >
                  <img
                    src={`/SW_Pictures/Picture ${character.picture || 0} Face.png?t=${Date.now()}`}
                    alt={character.name}
                    style={{ width: '80px', height: '100px', objectFit: 'contain' }}
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{character.name}</h3>
                    <p className="text-gray-400">{character.race} - {character.career || 'No Career'}{character.spec ? ` / ${character.spec}` : ''}</p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm(`Join campaign "${campaign.Name}" with ${character.name}?`)) {
                        return;
                      }
                      
                      setJoiningCampaign(true);
                      try {
                        const { error } = await supabase
                          .from('SW_player_characters')
                          .update({ campaign_joined: campaign.id })
                          .eq('id', character.id);

                        if (error) {
                          console.error('Error joining campaign:', error);
                          alert(`Failed to join campaign: ${error.message}`);
                        } else {
                          alert(`Successfully joined campaign "${campaign.Name}" with ${character.name}!`);
                          navigate('/select-ttrpg');
                        }
                      } catch (err) {
                        console.error('Error:', err);
                        alert(`An error occurred while joining the campaign: ${err.message}`);
                      } finally {
                        setJoiningCampaign(false);
                      }
                    }}
                    disabled={joiningCampaign}
                    className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-500 transition"
                  >
                    {joiningCampaign ? 'Joining...' : 'Join Campaign'}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={() => navigate('/select-ttrpg')}
              className="px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
