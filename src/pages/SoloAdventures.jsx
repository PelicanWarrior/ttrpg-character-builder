import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function SoloAdventures() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || '';
  const [userId, setUserId] = useState(null);
  const [ttrpgs, setTtrpgs] = useState([]);
  const [selectedTtrpgId, setSelectedTtrpgId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [characters, setCharacters] = useState([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState('');
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [characterError, setCharacterError] = useState('');

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

  const getCharacterTableName = (ttrpgInitials) => {
    if (!ttrpgInitials) return null;
    return `${ttrpgInitials}_player_characters`;
  };

  const getCharacterSelectFields = (ttrpgInitials) => {
    const initials = (ttrpgInitials || '').toUpperCase();
    if (initials === 'SW') return 'id, name, race, career, spec, picture';
    if (initials === 'FA') return 'id, name, race, level';
    if (initials === 'MM') return 'id, name, hero_name, origin, rank';
    if (initials === 'DND') return 'id, Name, Class, Str, Dex, Con, Int, Wis, Cha';
    if (initials === 'WWW') return 'id, name';
    return 'id, name';
  };

  const getUserIdColumnName = (ttrpgInitials) => {
    const initials = (ttrpgInitials || '').toUpperCase();
    if (initials === 'DND' || initials === 'MM') return 'User_ID';
    return 'user_number';
  };

  useEffect(() => {
    let active = true;

    if (!selectedTtrpgId || !userId) {
      setCharacters([]);
      setCharacterError('');
      return;
    }

    const loadCharacters = async () => {
      setLoadingCharacters(true);
      setCharacterError('');

      console.log('Loading characters for userId:', userId);
      console.log('Selected TTRPG ID:', selectedTtrpgId);

      const selectedTtrpg = ttrpgs.find((t) => String(t.id) === selectedTtrpgId);
      console.log('Selected TTRPG details:', selectedTtrpg);
      
      if (!selectedTtrpg) {
        setCharacterError('TTRPG not found.');
        setLoadingCharacters(false);
        return;
      }

      const tableName = getCharacterTableName(selectedTtrpg.Initials);
      const userIdColumnName = getUserIdColumnName(selectedTtrpg.Initials);
      console.log('Table name:', tableName);
      console.log('User ID column name:', userIdColumnName);
      
      if (!tableName) {
        setCharacterError(`Character table unknown for ${selectedTtrpg.TTRPG_name}.`);
        setLoadingCharacters(false);
        return;
      }

      const { data: charData, error: charError } = await supabase
        .from(tableName)
        .select(getCharacterSelectFields(selectedTtrpg.Initials))
        .eq(userIdColumnName, userId);

      console.log('Character data:', charData);
      console.log('Character error:', charError);

      if (!active) return;

      if (charError) {
        console.error('Error fetching characters:', charError);
        setCharacterError('Failed to load characters.');
        setLoadingCharacters(false);
        return;
      }

      setCharacters(charData || []);
      setSelectedCharacterId('');
      setLoadingCharacters(false);
    };

    loadCharacters();

    return () => {
      active = false;
    };
  }, [selectedTtrpgId, userId, ttrpgs]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 via-slate-100 to-stone-200 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col items-start gap-4">
          <h1 className="text-4xl font-black tracking-wide text-gray-900">SOLO ADVENTURES</h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/select-ttrpg')}
              className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-gray-800"
            >
              Back
            </button>
            <button
              onClick={() => navigate('/solo-adventures/create')}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-indigo-700"
            >
              Create
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
            <div>
              <label className="mb-3 block text-base font-bold text-gray-900" htmlFor="solo-adventures-ttrpg-select">
                SELECT TTRPG
              </label>
              <select
                id="solo-adventures-ttrpg-select"
                value={selectedTtrpgId}
                onChange={(event) => setSelectedTtrpgId(event.target.value)}
                className="w-full rounded-2xl border-2 border-gray-900 bg-gray-50 px-5 py-4 text-lg font-semibold text-gray-900 shadow-sm outline-none transition focus:border-indigo-600"
              >
                <option value="">-- Select a TTRPG --</option>
                {ttrpgs.map((ttrpg) => (
                  <option key={ttrpg.id} value={String(ttrpg.id)}>
                    {ttrpg.TTRPG_name}
                  </option>
                ))}
              </select>
              {selectedTtrpgId && (
                <div className="mt-8">
                  {loadingCharacters && <p className="text-lg text-gray-700">Loading characters...</p>}
                  {!loadingCharacters && characterError && (
                    <p className="text-lg font-semibold text-red-700">{characterError}</p>
                  )}
                  {!loadingCharacters && !characterError && characters.length === 0 && (
                    <p className="text-lg text-gray-700">No characters for this TTRPG.</p>
                  )}
                  {!loadingCharacters && !characterError && characters.length > 0 && (
                    <div>
                      <label className="mb-3 block text-base font-bold text-gray-900" htmlFor="solo-adventures-character-select">
                        SELECT CHARACTER
                      </label>
                      <select
                        id="solo-adventures-character-select"
                        value={selectedCharacterId}
                        onChange={(event) => setSelectedCharacterId(event.target.value)}
                        className="w-full rounded-2xl border-2 border-gray-900 bg-gray-50 px-5 py-4 text-lg font-semibold text-gray-900 shadow-sm outline-none transition focus:border-indigo-600"
                      >
                        <option value="">-- Select a Character --</option>
                        {characters.map((char) => (
                          <option key={char.id} value={String(char.id)}>
                            {char.name || char.Name}
                          </option>
                        ))}
                      </select>
                      {selectedCharacterId && (() => {
                        const selectedChar = characters.find((c) => String(c.id) === selectedCharacterId);
                        return selectedChar ? (
                          <div className="mt-6 rounded-2xl border border-gray-300 bg-gray-50 p-4">
                            <div className="mb-3 text-2xl font-bold text-gray-900">{selectedChar.name || selectedChar.Name}</div>
                            <div className="space-y-2 text-base text-gray-700">
                              {selectedChar.race && <div><span className="font-semibold">Race:</span> {selectedChar.race}</div>}
                              {selectedChar.career && <div><span className="font-semibold">Career:</span> {selectedChar.career}</div>}
                              {selectedChar.spec && <div><span className="font-semibold">Spec:</span> {selectedChar.spec}</div>}
                              {selectedChar.Class && <div><span className="font-semibold">Class:</span> {selectedChar.Class}</div>}
                              {selectedChar.level && <div><span className="font-semibold">Level:</span> {selectedChar.level}</div>}
                              {selectedChar.hero_name && <div><span className="font-semibold">Hero:</span> {selectedChar.hero_name}</div>}
                              {selectedChar.origin && <div><span className="font-semibold">Origin:</span> {selectedChar.origin}</div>}
                              {selectedChar.rank && <div><span className="font-semibold">Rank:</span> {selectedChar.rank}</div>}
                            </div>
                          </div>
                        ) : null;
                      })()}
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