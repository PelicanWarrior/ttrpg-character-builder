import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function SWCampaignEdit() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [campaignName, setCampaignName] = useState('');
  const [description, setDescription] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaign = async () => {
      const campaignId = searchParams.get('id');
      if (!campaignId) {
        navigate('/SW_campaign');
        return;
      }

      const { data: campaign, error } = await supabase
        .from('SW_campaign')
        .select('Name, description')
        .eq('id', campaignId)
        .single();

      if (error || !campaign) {
        console.error('Error fetching campaign:', error);
        navigate('/SW_campaign');
      } else {
        setCampaignName(campaign.Name);
        setDescription(campaign.description || '');
      }
      setLoading(false);
    };

    fetchCampaign();
  }, [searchParams, navigate]);

  const handleSave = async () => {
    const campaignId = searchParams.get('id');
    if (!campaignId) return;
    setSaving(true);
    const { error } = await supabase
      .from('SW_campaign')
      .update({ Name: campaignName, description })
      .eq('id', campaignId);
    setSaving(false);
    if (error) {
      console.error('Error updating campaign:', error);
      alert('Failed to save changes');
      return;
    }
    setEditMode(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {editMode ? (
          <input
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:border-blue-500"
            style={{ fontSize: '2.25rem', lineHeight: '1.2', fontWeight: 700 }}
          />
        ) : (
          <h1 className="text-4xl font-bold mb-6">{campaignName}</h1>
        )}

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => navigate('/SW_campaign')}
            className="px-6 py-3 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 shadow-lg transition"
          >
            Your Campaigns
          </button>
          <button
            onClick={() => navigate('/select-ttrpg')}
            className="px-6 py-3 bg-purple-600 text-white font-bold text-lg rounded-xl hover:bg-purple-700 shadow-lg transition"
          >
            Select TTRPG
          </button>
          <button
            onClick={() => setEditMode(true)}
            disabled={editMode}
            className="px-6 py-3 bg-yellow-600 text-white font-bold text-lg rounded-xl hover:bg-yellow-700 disabled:opacity-60 shadow-lg transition"
          >
            Edit
          </button>
          {editMode && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 disabled:opacity-60 shadow-lg transition"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>

        {editMode ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:border-blue-500"
            style={{ fontSize: '1.125rem', lineHeight: '1.5' }}
            rows={5}
          />
        ) : (
          <p className="text-lg text-gray-200 leading-relaxed">{description || 'No description provided.'}</p>
        )}
      </div>
    </div>
  );
}
