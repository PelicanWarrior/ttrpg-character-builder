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
  const [characters, setCharacters] = useState([]);
  const [logs, setLogs] = useState([]);
  const [newLogText, setNewLogText] = useState('');
  const [editingLogId, setEditingLogId] = useState(null);
  const [editingLogText, setEditingLogText] = useState('');

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

        const { data: chars, error: charsErr } = await supabase
          .from('SW_player_characters')
          .select('id, name, picture, race, career, spec')
          .eq('campaign_joined', campaignId);
        if (charsErr) {
          console.error('Error fetching campaign characters:', charsErr);
          setCharacters([]);
        } else {
          setCharacters(chars || []);
        }

        // Fetch campaign logs
        const { data: logsData, error: logsErr } = await supabase
          .from('SW_campaign_log')
          .select('*')
          .eq('campaignID', campaignId)
          .order('Log_number', { ascending: false });
        if (logsErr) {
          console.error('Error fetching campaign logs:', logsErr);
          setLogs([]);
        } else {
          setLogs(logsData || []);
        }
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

  const handleNewLogBlur = async () => {
    if (!newLogText.trim()) return;

    const campaignId = searchParams.get('id');
    if (!campaignId) return;

    // Calculate next log number
    const maxLogNumber = logs.length > 0 ? Math.max(...logs.map(l => l.Log_number || 0)) : 0;
    const nextLogNumber = maxLogNumber + 1;

    const { data: newLog, error } = await supabase
      .from('SW_campaign_log')
      .insert([{ Log: newLogText, Log_number: nextLogNumber, campaignID: parseInt(campaignId) }])
      .select()
      .single();

    if (error) {
      console.error('Error creating log:', error);
    } else if (newLog) {
      setLogs([newLog, ...logs]);
      setNewLogText('');
    }
  };

  const handleLogEdit = (log) => {
    setEditingLogId(log.Log_number);
    setEditingLogText(log.Log);
  };

  const handleLogUpdate = async (logNumber) => {
    const campaignId = searchParams.get('id');
    if (!campaignId) return;

    const { error } = await supabase
      .from('SW_campaign_log')
      .update({ Log: editingLogText })
      .eq('campaignID', parseInt(campaignId))
      .eq('Log_number', logNumber);

    if (error) {
      console.error('Error updating log:', error);
    } else {
      setLogs(logs.map(log => 
        log.Log_number === logNumber ? { ...log, Log: editingLogText } : log
      ));
      setEditingLogId(null);
      setEditingLogText('');
    }
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

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Characters in Campaign</h2>
          {characters.length === 0 ? (
            <p className="text-gray-300">No characters are currently in this campaign.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {characters.map((char) => (
                <div key={char.id} className="bg-gray-800 rounded-lg p-2 text-center border border-gray-700" style={{ minWidth: '120px' }}>
                  <img
                    src={`/SW_Pictures/Picture ${char.picture || 0} Face.png`}
                    alt={char.name}
                    className="rounded object-contain mx-auto"
                    style={{ width: '70px', height: '88px' }}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="100"%3E%3Crect fill="%23333" width="80" height="100"/%3E%3C/svg%3E';
                    }}
                  />
                  <p className="text-sm text-white font-semibold mt-1 leading-tight truncate" style={{ marginBottom: '2px' }}>{char.name}</p>
                  <p className="text-xs text-gray-300 leading-tight truncate" style={{ marginTop: 0 }}>
                    {char.race || 'Unknown'} - {char.career || 'Unknown'}{char.spec ? ` - ${char.spec}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Campaign Log</h2>
          <div className="space-y-3">
            {/* New log entry box at the top */}
            <textarea
              value={newLogText}
              onChange={(e) => setNewLogText(e.target.value)}
              onBlur={handleNewLogBlur}
              placeholder="Type a new log entry..."
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:outline-none focus:border-blue-500 resize-none"
              rows={3}
            />

            {/* Existing logs */}
            {logs.length === 0 ? (
              <p className="text-gray-300">No log entries yet.</p>
            ) : (
              logs.map((log) => (
                <div key={log.Log_number} className="bg-gray-800 rounded-lg border border-gray-700">
                  {editingLogId === log.Log_number ? (
                    <textarea
                      value={editingLogText}
                      onChange={(e) => setEditingLogText(e.target.value)}
                      onBlur={() => handleLogUpdate(log.Log_number)}
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                      rows={Math.max(3, editingLogText.split('\n').length)}
                      autoFocus
                    />
                  ) : (
                    <p
                      onClick={() => handleLogEdit(log)}
                      className="text-gray-200 whitespace-pre-wrap px-4 py-3 cursor-pointer hover:bg-gray-700 rounded-lg"
                    >
                      {log.Log}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
