import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const SPECIAL_FIELDS = [
  { key: 'strength', label: 'Strength', short: 'STR' },
  { key: 'perception', label: 'Perception', short: 'PER' },
  { key: 'endurance', label: 'Endurance', short: 'END' },
  { key: 'charisma', label: 'Charisma', short: 'CHA' },
  { key: 'intelligence', label: 'Intelligence', short: 'INT' },
  { key: 'agility', label: 'Agility', short: 'AGI' },
  { key: 'luck', label: 'Luck', short: 'LCK' },
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

const DEFAULT_SPECIAL = { strength: 5, perception: 5, endurance: 5, charisma: 5, intelligence: 5, agility: 5, luck: 5 };
const DEFAULT_SKILLS = Object.fromEntries(SKILLS.map((s) => [s.key, 0]));

function parseJsonOrDefault(value, fallback) {
  if (!value || typeof value === 'object') return value || fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

export default function FaCampaignEdit() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('id');

  const [campaignName, setCampaignName] = useState('');
  const [description, setDescription] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [characters, setCharacters] = useState([]);
  const [npcs, setNpcs] = useState([]);
  const [races, setRaces] = useState([]);
  const [logs, setLogs] = useState([]);
  const [newLogText, setNewLogText] = useState('');
  const [editingLogId, setEditingLogId] = useState(null);
  const [editingLogText, setEditingLogText] = useState('');

  // NPC form state
  const [showNpcForm, setShowNpcForm] = useState(false);
  const [npcName, setNpcName] = useState('');
  const [npcRace, setNpcRace] = useState('');
  const [npcDescription, setNpcDescription] = useState('');
  const [npcSpecial, setNpcSpecial] = useState({ ...DEFAULT_SPECIAL });
  const [npcSkills, setNpcSkills] = useState({ ...DEFAULT_SKILLS });
  const [npcPicturePath, setNpcPicturePath] = useState('');
  const [savingNpc, setSavingNpc] = useState(false);

  useEffect(() => {
    if (!campaignId) { navigate('/Fa_campaign'); return; }
    const fetchAll = async () => {
      const [
        { data: campaign, error: campErr },
        { data: chars },
        { data: npcData },
        { data: logsData },
        { data: raceData },
      ] = await Promise.all([
        supabase.from('Fa_campaign').select('Name, description').eq('id', campaignId).single(),
        supabase.from('Fa_player_characters').select('id, name, race, level').eq('campaign_joined', campaignId),
        supabase.from('Fa_campaign_NPC').select('*').eq('campaignID', campaignId),
        supabase.from('Fa_campaign_log').select('*').eq('campaignID', campaignId).order('Log_number', { ascending: false }),
        supabase.from('Fa_races').select('race_name').order('race_name'),
      ]);

      if (campErr || !campaign) { navigate('/Fa_campaign'); return; }

      setCampaignName(campaign.Name || '');
      setDescription(campaign.description || '');
      setCharacters(chars || []);
      setNpcs(
        (npcData || []).map((n) => ({
          ...n,
          special: parseJsonOrDefault(n.special, { ...DEFAULT_SPECIAL }),
          skills: parseJsonOrDefault(n.skills, { ...DEFAULT_SKILLS }),
        })),
      );
      setLogs(logsData || []);
      setRaces((raceData || []).map((r) => r.race_name));
      setLoading(false);
    };
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('Fa_campaign').update({ Name: campaignName, description }).eq('id', campaignId);
    setSaving(false);
    if (error) { console.error('Error updating campaign:', error); alert('Failed to save changes.'); return; }
    setEditMode(false);
  };

  const handleNewLogBlur = async () => {
    if (!newLogText.trim() || !campaignId) return;
    const maxLogNo = logs.length > 0 ? Math.max(...logs.map((l) => l.Log_number || 0)) : 0;
    const { data: newLog, error } = await supabase
      .from('Fa_campaign_log')
      .insert([{ Log: newLogText, Log_number: maxLogNo + 1, campaignID: parseInt(campaignId, 10) }])
      .select()
      .single();
    if (error) { console.error('Error creating log:', error); return; }
    setLogs([newLog, ...logs]);
    setNewLogText('');
  };

  const handleLogUpdate = async (logNumber) => {
    const { error } = await supabase
      .from('Fa_campaign_log')
      .update({ Log: editingLogText })
      .eq('campaignID', parseInt(campaignId, 10))
      .eq('Log_number', logNumber);
    if (error) { console.error('Error updating log:', error); return; }
    setLogs(logs.map((l) => (l.Log_number === logNumber ? { ...l, Log: editingLogText } : l)));
    setEditingLogId(null);
    setEditingLogText('');
  };

  const resetNpcForm = () => {
    setNpcName('');
    setNpcRace('');
    setNpcDescription('');
    setNpcSpecial({ ...DEFAULT_SPECIAL });
    setNpcSkills({ ...DEFAULT_SKILLS });
    setNpcPicturePath('');
  };

  const handleSaveNpc = async () => {
    if (!npcName.trim()) { alert('NPC Name is required.'); return; }
    setSavingNpc(true);
    try {
      const payload = {
        campaignID: parseInt(campaignId, 10),
        Name: npcName.trim(),
        Description: npcDescription,
        race: npcRace || null,
        special: npcSpecial,
        skills: npcSkills,
        PicturePath: npcPicturePath.trim() || null,
      };
      const { data: newNpc, error } = await supabase.from('Fa_campaign_NPC').insert([payload]).select().single();
      if (error) throw error;
      setNpcs((prev) => [
        ...prev,
        {
          ...newNpc,
          special: parseJsonOrDefault(newNpc.special, { ...DEFAULT_SPECIAL }),
          skills: parseJsonOrDefault(newNpc.skills, { ...DEFAULT_SKILLS }),
        },
      ]);
      resetNpcForm();
      setShowNpcForm(false);
    } catch (err) {
      console.error('Error saving NPC:', err);
      alert('Failed to save NPC.');
    } finally {
      setSavingNpc(false);
    }
  };

  const handleDeleteNpc = async (npcId) => {
    if (!confirm('Delete this NPC?')) return;
    const { error } = await supabase.from('Fa_campaign_NPC').delete().eq('id', npcId);
    if (error) { alert('Failed to delete NPC.'); return; }
    setNpcs((prev) => prev.filter((n) => n.id !== npcId));
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

        {/* Title */}
        {editMode ? (
          <input
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 mb-6 border border-gray-700 focus:outline-none focus:border-blue-500"
            style={{ fontSize: '2.25rem', fontWeight: 700 }}
          />
        ) : (
          <h1 className="text-4xl font-bold mb-6">{campaignName}</h1>
        )}

        {/* Nav buttons */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <button
            onClick={() => navigate('/Fa_campaign')}
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
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="px-6 py-3 bg-yellow-600 text-white font-bold text-lg rounded-xl hover:bg-yellow-700 shadow-lg transition"
            >
              Edit
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 disabled:opacity-60 shadow-lg transition"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>

        {/* Description */}
        {editMode ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:border-blue-500 mb-6 resize-none"
            style={{ fontSize: '1.125rem' }}
            rows={5}
          />
        ) : (
          <p className="text-lg text-gray-200 leading-relaxed mb-6">{description || 'No description provided.'}</p>
        )}

        {/* Characters */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Characters in Campaign</h2>
          {characters.length === 0 ? (
            <p className="text-gray-400">No characters are currently in this campaign.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {characters.map((char) => (
                <div
                  key={char.id}
                  className="bg-gray-800 rounded-lg p-2 text-center border border-gray-700"
                >
                  <img
                    src={`/Fa_Pictures/${char.race}_Face.png`}
                    alt={char.name}
                    className="rounded object-contain mx-auto"
                    style={{ width: '70px', height: '88px' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <p className="text-sm text-white font-semibold mt-1 truncate">{char.name}</p>
                  <p className="text-xs text-gray-300 truncate">{char.race || 'Unknown'} · Lv {char.level ?? 1}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NPCs */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">NPCs</h2>
            <button
              onClick={() => { setShowNpcForm((s) => !s); if (showNpcForm) resetNpcForm(); }}
              className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
            >
              {showNpcForm ? 'Cancel' : 'Add NPC'}
            </button>
          </div>

          {showNpcForm && (
            <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
              <h3 className="text-lg font-bold mb-4">New NPC</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Name *</label>
                  <input
                    value={npcName}
                    onChange={(e) => setNpcName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Race</label>
                  <select
                    value={npcRace}
                    onChange={(e) => setNpcRace(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-green-500"
                  >
                    <option value="">— Select Race —</option>
                    {races.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold mb-1">Description</label>
                  <textarea
                    value={npcDescription}
                    onChange={(e) => setNpcDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-green-500 resize-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold mb-1">Picture Path (optional, e.g. Human_Face.png)</label>
                  <input
                    value={npcPicturePath}
                    onChange={(e) => setNpcPicturePath(e.target.value)}
                    placeholder="/Fa_Pictures/..."
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>

              <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-gray-400">S.P.E.C.I.A.L.</h4>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-4">
                {SPECIAL_FIELDS.map((field) => (
                  <div key={field.key} className="text-center">
                    <label className="block text-xs text-gray-400 mb-1">{field.short}</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={npcSpecial[field.key]}
                      onChange={(e) =>
                        setNpcSpecial((prev) => ({
                          ...prev,
                          [field.key]: Math.max(1, Math.min(10, Number(e.target.value) || 1)),
                        }))
                      }
                      className="w-full px-1 py-2 bg-gray-700 text-white text-center rounded border border-gray-600 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-gray-400">Skills (rank 0–6)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {SKILLS.map((skill) => (
                  <div key={skill.key} className="flex items-center gap-2">
                    <label className="text-xs text-gray-300 flex-1 truncate">{skill.label}</label>
                    <input
                      type="number"
                      min={0}
                      max={6}
                      value={npcSkills[skill.key]}
                      onChange={(e) =>
                        setNpcSkills((prev) => ({
                          ...prev,
                          [skill.key]: Math.max(0, Math.min(6, Number(e.target.value) || 0)),
                        }))
                      }
                      className="w-14 px-1 py-1 bg-gray-700 text-white text-center rounded border border-gray-600 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveNpc}
                disabled={savingNpc}
                className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-60 transition"
              >
                {savingNpc ? 'Saving...' : 'Save NPC'}
              </button>
            </div>
          )}

          {npcs.length === 0 ? (
            <p className="text-gray-400">No NPCs added yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {npcs.map((npc) => (
                <div key={npc.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-start gap-4">
                    {npc.PicturePath && (
                      <img
                        src={npc.PicturePath.startsWith('/') ? npc.PicturePath : `/Fa_Pictures/${npc.PicturePath}`}
                        alt={npc.Name}
                        className="rounded object-contain"
                        style={{ width: '70px', height: '88px', flexShrink: 0 }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 justify-between mb-1">
                        <h3 className="font-bold text-white">{npc.Name}</h3>
                        <button
                          onClick={() => handleDeleteNpc(npc.id)}
                          className="px-2 py-1 bg-red-700 text-white text-xs rounded hover:bg-red-800 transition"
                        >
                          Delete
                        </button>
                      </div>
                      {npc.race && <p className="text-xs text-gray-400 mb-1">Race: {npc.race}</p>}
                      {npc.Description && <p className="text-sm text-gray-300 mb-2">{npc.Description}</p>}
                      <div className="flex flex-wrap gap-1 mb-1">
                        {SPECIAL_FIELDS.map((f) => (
                          <span
                            key={f.key}
                            className="text-xs bg-gray-700 rounded px-1 py-0.5 text-white font-mono"
                          >
                            {f.short} {npc.special?.[f.key] ?? 5}
                          </span>
                        ))}
                      </div>
                      {(() => {
                        const ranked = SKILLS.filter((s) => (npc.skills?.[s.key] || 0) > 0);
                        if (ranked.length === 0) return null;
                        return (
                          <p className="text-xs text-gray-400">
                            Skills: {ranked.map((s) => `${s.label} ${npc.skills[s.key]}`).join(', ')}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Campaign Log */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4">Campaign Log</h2>
          <textarea
            value={newLogText}
            onChange={(e) => setNewLogText(e.target.value)}
            onBlur={handleNewLogBlur}
            placeholder="Type a new log entry and click away to save..."
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:outline-none focus:border-blue-500 resize-none mb-4"
            rows={3}
          />
          {logs.length === 0 ? (
            <p className="text-gray-400">No log entries yet.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.Log_number} className="bg-gray-800 rounded-lg border border-gray-700">
                  {editingLogId === log.Log_number ? (
                    <textarea
                      value={editingLogText}
                      onChange={(e) => setEditingLogText(e.target.value)}
                      onBlur={() => handleLogUpdate(log.Log_number)}
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:outline-none resize-none"
                      rows={Math.max(3, editingLogText.split('\n').length)}
                      autoFocus
                    />
                  ) : (
                    <div
                      onClick={() => { setEditingLogId(log.Log_number); setEditingLogText(log.Log); }}
                      className="cursor-pointer hover:bg-gray-700 rounded-lg px-4 py-3 transition"
                    >
                      <p className="text-xs text-gray-400 mb-1">Log #{log.Log_number}</p>
                      <p className="text-gray-200 whitespace-pre-wrap">{log.Log}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
