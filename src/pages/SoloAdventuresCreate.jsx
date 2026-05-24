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
        setAdventureError(adventureErr.message || 'Failed to load adventures.');
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
      setAdventureError(createErr.message || 'Failed to create adventure.');
    } else {
      setTitle('');
      setDescription('');
      setAdventures([...(newAdventure || []), ...adventures]);
    }
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
      setAdventureError(deleteErr.message || 'Failed to delete adventure.');
    } else {
      setAdventures(adventures.filter((adv) => adv.id !== adventureId));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 via-slate-100 to-stone-200 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black tracking-wide text-gray-900">CREATE SOLO ADVENTURE</h1>
            <button
              onClick={() => navigate('/solo-adventures')}
              className="rounded-xl border-2 border-gray-900 bg-white px-5 py-3 text-sm font-bold uppercase tracking-wide text-black shadow-sm transition hover:bg-gray-100"
            >
              Back
            </button>
          </div>
        </div>

        <div className="rounded-3xl border-4 border-gray-900 bg-white p-8 shadow-2xl">
          {loading && <p className="text-lg text-gray-700">Loading TTRPGs...</p>}

          {!loading && error && <p className="text-lg font-semibold text-red-700">{error}</p>}

          {!loading && !error && ttrpgs.length === 0 && (
            <p className="text-lg text-gray-700">No TTRPGs are available.</p>
          )}

          {!loading && !error && ttrpgs.length > 0 && (
            <div className="space-y-8">
              <div className="rounded-3xl border-2 border-sky-500 bg-sky-200 p-6 shadow-sm">
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
                  }}
                  className="w-full rounded-2xl border-2 border-sky-800 bg-sky-50 px-5 py-4 text-lg font-semibold text-sky-950 shadow-sm outline-none transition focus:border-sky-500"
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
                <div className="space-y-6">
                  <div className="rounded-3xl border-2 border-amber-500 bg-amber-200 p-6 shadow-sm">
                    <label className="mb-3 block text-base font-bold text-gray-900" htmlFor="adventure-title">
                      TITLE
                    </label>
                    <input
                      id="adventure-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter adventure title"
                      className="w-full rounded-2xl border-2 border-amber-800 bg-amber-50 px-5 py-3 text-base text-gray-900 placeholder-gray-500 shadow-sm outline-none transition focus:border-amber-500"
                    />

                    <label className="mb-3 mt-6 block text-base font-bold text-gray-900" htmlFor="adventure-description">
                      DESCRIPTION
                    </label>
                    <textarea
                      id="adventure-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter adventure description (optional)"
                      rows="4"
                      className="w-full rounded-2xl border-2 border-emerald-800 bg-emerald-50 px-5 py-3 text-base text-gray-900 placeholder-gray-500 shadow-sm outline-none transition focus:border-emerald-500"
                    />

                    {adventureError && <p className="mt-4 text-base font-semibold text-red-700">{adventureError}</p>}

                    <button
                      onClick={handleCreateAdventure}
                      disabled={creatingAdventure}
                      className="mt-6 w-full rounded-2xl bg-gray-900 px-5 py-3 text-base font-bold uppercase tracking-wide text-black transition hover:bg-gray-800 disabled:opacity-70"
                    >
                      {creatingAdventure ? 'Creating...' : 'Create Adventure'}
                    </button>
                  </div>

                  {loadingAdventures && <p className="mt-6 text-lg text-gray-700">Loading adventures...</p>}

                  {!loadingAdventures && adventures.length > 0 && (
                    <div className="mt-8 rounded-3xl border-2 border-violet-500 bg-violet-200 p-6 shadow-sm">
                      <h2 className="mb-6 text-2xl font-bold text-gray-900">YOUR ADVENTURES</h2>
                      <div className="space-y-4">
                        {adventures.map((adventure) => (
                          <div key={adventure.id} className="rounded-2xl border-2 border-violet-400 bg-violet-50 p-4 shadow-sm">
                            <div>
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <div className="text-lg font-bold text-gray-900">{adventure.title}</div>
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => navigate(`/solo-adventures/edit/${adventure.id}`)}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold uppercase text-black transition hover:bg-blue-700"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAdventure(adventure.id)}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold uppercase text-black transition hover:bg-red-700"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
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
