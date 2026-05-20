import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function SoloAdventuresCreate() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || '';
  const [userId, setUserId] = useState(null);
  const [ttrpgs, setTtrpgs] = useState([]);
  const [selectedTtrpgId, setSelectedTtrpgId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adventures, setAdventures] = useState([]);
  const [loadingAdventures, setLoadingAdventures] = useState(false);
  const [adventureError, setAdventureError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creatingAdventure, setCreatingAdventure] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editingAdventure, setEditingAdventure] = useState(false);

  useEffect(() => {
    let active = true;

    const loadPage = async () => {
      if (!username) {
        navigate('/');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('user')
        .select('id, admin')
        .eq('username', username)
        .single();

      if (userError || !userData) {
        if (!active) return;
        setError('Failed to load user details.');
        setLoading(false);
        return;
      }

      const admin = !!userData.admin;

      const { data: ttrpgData, error: ttrpgError } = await supabase
        .from('TTRPGs')
        .select('id, TTRPG_name, Initials, show')
        .order('TTRPG_name', { ascending: true });

      if (!active) return;

      if (ttrpgError) {
        setError('Failed to load TTRPGs.');
        setLoading(false);
        return;
      }

      const availableTtrpgs = (ttrpgData || []).filter((row) => admin || row.show === true);
      setTtrpgs(availableTtrpgs);
      setUserId(userData.id);
      setLoading(false);
    };

    loadPage();

    return () => {
      active = false;
    };
  }, [navigate, username]);

  useEffect(() => {
    let active = true;

    const loadAdventures = async () => {
      if (!selectedTtrpgId || !userId) {
        setAdventures([]);
        return;
      }

      setLoadingAdventures(true);
      setAdventureError('');

      const { data: adventureData, error: adventureErr } = await supabase
        .from('Solo_Adventures')
        .select('id, title, description, created_at, updated_at')
        .eq('ttrpg_id', selectedTtrpgId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!active) return;

      if (adventureErr) {
        setAdventureError('Failed to load adventures.');
      } else {
        setAdventures(adventureData || []);
      }
      setLoadingAdventures(false);
    };

    loadAdventures();

    return () => {
      active = false;
    };
  }, [selectedTtrpgId, userId]);

  const handleCreateAdventure = async () => {
    if (!title.trim()) {
      setAdventureError('Title is required.');
      return;
    }

    if (!selectedTtrpgId || !userId) {
      setAdventureError('Please select a TTRPG.');
      return;
    }

    setCreatingAdventure(true);
    setAdventureError('');

    const { data: newAdventure, error: createErr } = await supabase
      .from('Solo_Adventures')
      .insert([
        {
          ttrpg_id: parseInt(selectedTtrpgId),
          user_id: userId,
          title: title.trim(),
          description: description.trim() || null,
        },
      ])
      .select();

    setCreatingAdventure(false);

    if (createErr) {
      setAdventureError('Failed to create adventure.');
    } else {
      setTitle('');
      setDescription('');
      setAdventures([...(newAdventure || []), ...adventures]);
    }
  };

  const handleStartEdit = (adventure) => {
    setEditingId(adventure.id);
    setEditTitle(adventure.title);
    setEditDescription(adventure.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      setAdventureError('Title is required.');
      return;
    }

    setEditingAdventure(true);
    setAdventureError('');

    const { error: updateErr } = await supabase
      .from('Solo_Adventures')
      .update({
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingId);

    setEditingAdventure(false);

    if (updateErr) {
      setAdventureError('Failed to update adventure.');
    } else {
      setAdventures(
        adventures.map((adv) =>
          adv.id === editingId
            ? { ...adv, title: editTitle, description: editDescription }
            : adv
        )
      );
      setEditingId(null);
      setEditTitle('');
      setEditDescription('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
  };

  const handleDeleteAdventure = async (adventureId) => {
    if (!window.confirm('Are you sure you want to delete this adventure?')) {
      return;
    }

    const { error: deleteErr } = await supabase
      .from('Solo_Adventures')
      .delete()
      .eq('id', adventureId);

    if (deleteErr) {
      setAdventureError('Failed to delete adventure.');
    } else {
      setAdventures(adventures.filter((adv) => adv.id !== adventureId));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 via-slate-100 to-stone-200 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-4xl font-black tracking-wide text-gray-900">CREATE SOLO ADVENTURE</h1>
          <button
            onClick={() => navigate('/solo-adventures')}
            className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-gray-800"
          >
            Back
          </button>
        </div>

        <div className="rounded-3xl border-4 border-gray-900 bg-white p-8 shadow-2xl">
          {loading && <p className="text-lg text-gray-700">Loading TTRPGs...</p>}

          {!loading && error && <p className="text-lg font-semibold text-red-700">{error}</p>}

          {!loading && !error && ttrpgs.length === 0 && (
            <p className="text-lg text-gray-700">No TTRPGs are available.</p>
          )}

          {!loading && !error && ttrpgs.length > 0 && (
            <div className="space-y-8">
              <div>
                <label className="mb-3 block text-base font-bold text-gray-900" htmlFor="create-solo-adventure-ttrpg-select">
                  SELECT TTRPG FOR
                </label>
                <select
                  id="create-solo-adventure-ttrpg-select"
                  value={selectedTtrpgId}
                  onChange={(event) => {
                    setSelectedTtrpgId(event.target.value);
                    setTitle('');
                    setDescription('');
                    setEditingId(null);
                  }}
                  className="w-full rounded-2xl border-2 border-gray-900 bg-gray-50 px-5 py-4 text-lg font-semibold text-gray-900 shadow-sm outline-none transition focus:border-indigo-600"
                >
                  <option value="">-- Select a TTRPG --</option>
                  {ttrpgs.map((ttrpg) => (
                    <option key={ttrpg.id} value={String(ttrpg.id)}>
                      {ttrpg.TTRPG_name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTtrpgId && (
                <div>
                  <div className="mb-6 border-t-4 border-gray-900 pt-6">
                    <label className="mb-3 block text-base font-bold text-gray-900" htmlFor="adventure-title">
                      TITLE
                    </label>
                    <input
                      id="adventure-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter adventure title"
                      className="w-full rounded-2xl border-2 border-gray-900 bg-gray-50 px-5 py-3 text-base text-gray-900 placeholder-gray-500 shadow-sm outline-none transition focus:border-indigo-600"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="mb-3 block text-base font-bold text-gray-900" htmlFor="adventure-description">
                      DESCRIPTION
                    </label>
                    <textarea
                      id="adventure-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter adventure description (optional)"
                      rows="4"
                      className="w-full rounded-2xl border-2 border-gray-900 bg-gray-50 px-5 py-3 text-base text-gray-900 placeholder-gray-500 shadow-sm outline-none transition focus:border-indigo-600"
                    />
                  </div>

                  {adventureError && <p className="mb-4 text-base font-semibold text-red-700">{adventureError}</p>}

                  <button
                    onClick={handleCreateAdventure}
                    disabled={creatingAdventure}
                    className="w-full rounded-2xl bg-indigo-600 px-5 py-3 text-base font-bold uppercase tracking-wide text-white transition hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {creatingAdventure ? 'Creating...' : 'Create Adventure'}
                  </button>

                  {loadingAdventures && <p className="mt-6 text-lg text-gray-700">Loading adventures...</p>}

                  {!loadingAdventures && adventures.length > 0 && (
                    <div className="mt-8 border-t-4 border-gray-900 pt-6">
                      <h2 className="mb-6 text-2xl font-bold text-gray-900">YOUR ADVENTURES</h2>
                      <div className="space-y-4">
                        {adventures.map((adventure) => (
                          <div key={adventure.id} className="rounded-2xl border-2 border-gray-300 bg-gray-50 p-4">
                            {editingId === adventure.id ? (
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="w-full rounded-lg border-2 border-gray-900 bg-white px-3 py-2 text-base text-gray-900"
                                />
                                <textarea
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  rows="3"
                                  className="w-full rounded-lg border-2 border-gray-900 bg-white px-3 py-2 text-base text-gray-900"
                                />
                                <div className="flex gap-3">
                                  <button
                                    onClick={handleSaveEdit}
                                    disabled={editingAdventure}
                                    className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-bold uppercase text-white transition hover:bg-green-700 disabled:opacity-50"
                                  >
                                    {editingAdventure ? 'Saving...' : 'Save'}
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="flex-1 rounded-lg bg-gray-600 px-3 py-2 text-sm font-bold uppercase text-white transition hover:bg-gray-700"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="mb-2 text-lg font-bold text-gray-900">{adventure.title}</div>
                                {adventure.description && (
                                  <div className="mb-3 text-sm text-gray-700">{adventure.description}</div>
                                )}
                                <div className="text-xs text-gray-500">
                                  Updated: {new Date(adventure.updated_at).toLocaleDateString()}
                                </div>
                                <div className="mt-3 flex gap-3">
                                  <button
                                    onClick={() => handleStartEdit(adventure)}
                                    className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold uppercase text-white transition hover:bg-blue-700"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAdventure(adventure.id)}
                                    className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold uppercase text-white transition hover:bg-red-700"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
