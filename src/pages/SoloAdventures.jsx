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
  const [characterFaceErrored, setCharacterFaceErrored] = useState(false);
  const [adventures, setAdventures] = useState([]);
  const [selectedAdventureId, setSelectedAdventureId] = useState('');
  const [loadingAdventures, setLoadingAdventures] = useState(false);
  const [adventureError, setAdventureError] = useState('');
  const [checkingEquipment, setCheckingEquipment] = useState(false);
  const [hasEquipment, setHasEquipment] = useState(null);
  const [equipmentCheckError, setEquipmentCheckError] = useState('');
  const [showSaves, setShowSaves] = useState(false);
  const [saves, setSaves] = useState([]);
  const [loadingSaves, setLoadingSaves] = useState(false);
  const [savesError, setSavesError] = useState('');
  const [resumingSaveId, setResumingSaveId] = useState(null);

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
    if (initials === 'SW') return 'id, name, race, career, spec, picture, campaign_joined';
    if (initials === 'FA') return 'id, name, race, level, campaign_joined';
    if (initials === 'MM') return 'id, name, hero_name, origin, rank, campaign_joined';
    if (initials === 'DND') return 'id, Name, Class, Str, Dex, Con, Int, Wis, Cha, campaign_joined';
    if (initials === 'WWW') return 'id, name, campaign_joined';
    return 'id, name, campaign_joined';
  };

  const getUserIdColumnName = (ttrpgInitials) => {
    const initials = (ttrpgInitials || '').toUpperCase();
    if (initials === 'DND' || initials === 'MM') return 'User_ID';
    return 'user_number';
  };

  const resolveCharacterFaceUrl = (character, ttrpgInitials) => {
    const rawFace = character?.picture ?? character?.Picture ?? character?.avatar ?? character?.image_url ?? '';
    if (!rawFace && rawFace !== 0) return '';

    const value = String(rawFace).trim();
    if (!value) return '';

    if (
      value.startsWith('http://') ||
      value.startsWith('https://') ||
      value.startsWith('/') ||
      value.startsWith('data:')
    ) {
      return value;
    }

    const initials = (ttrpgInitials || '').toUpperCase();
    const numericFaceId = /^\d+$/.test(value);

    if (initials === 'SW' && numericFaceId) {
      return `/SW_Pictures/Picture ${value} Face.png`;
    }

    if ((initials === 'FA' || initials === 'F') && numericFaceId) {
      return `/F_Pictures/Picture ${value} Face.png`;
    }

    return `/${value.replace(/^\/+/, '')}`;
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

  useEffect(() => {
    setCharacterFaceErrored(false);
  }, [selectedCharacterId, selectedTtrpgId]);

  useEffect(() => {
    let active = true;

    const checkCharacterEquipment = async () => {
      if (!selectedCharacterId || !selectedTtrpgId) {
        setHasEquipment(null);
        setEquipmentCheckError('');
        return;
      }

      const selectedTtrpg = ttrpgs.find((t) => String(t.id) === selectedTtrpgId);
      const selectedChar = characters.find((c) => String(c.id) === selectedCharacterId);
      if (!selectedTtrpg || !selectedChar) {
        setHasEquipment(null);
        return;
      }

      setCheckingEquipment(true);
      setEquipmentCheckError('');

      const initials = (selectedTtrpg.Initials || '').toUpperCase();

      if (initials === 'SW') {
        const { data, error: equipError } = await supabase
          .from('SW_character_equipment')
          .select('id, equipmentID')
          .eq('characterID', selectedCharacterId);

        if (!active) return;

        if (equipError) {
          setEquipmentCheckError(equipError.message || 'Failed to check equipment.');
          setHasEquipment(false);
          setCheckingEquipment(false);
          return;
        }

        setHasEquipment((data || []).length > 0);
        setCheckingEquipment(false);
        return;
      }

      const rawEquipment = selectedChar.equipment ?? selectedChar.Equipment ?? selectedChar.inventory ?? selectedChar.items ?? '';
      let equipmentCount = 0;

      if (Array.isArray(rawEquipment)) {
        equipmentCount = rawEquipment.filter((entry) => String(entry || '').trim()).length;
      } else if (typeof rawEquipment === 'string') {
        equipmentCount = rawEquipment
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean).length;
      } else if (rawEquipment) {
        equipmentCount = 1;
      }

      if (!active) return;

      setHasEquipment(equipmentCount > 0);
      setCheckingEquipment(false);
    };

    checkCharacterEquipment();

    return () => {
      active = false;
    };
  }, [selectedCharacterId, selectedTtrpgId, characters, ttrpgs]);

  useEffect(() => {
    let active = true;

    if (!selectedTtrpgId || !userId) {
      setAdventures([]);
      setSelectedAdventureId('');
      setAdventureError('');
      return;
    }

    const loadAdventures = async () => {
      setLoadingAdventures(true);
      setAdventureError('');

      const { data, error: advError } = await supabase
        .from('Solo_Adventures')
        .select('id, title, description, created_at, updated_at')
        .eq('ttrpg_id', selectedTtrpgId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!active) return;

      if (advError) {
        setAdventureError(advError.message || 'Failed to load adventures.');
        setLoadingAdventures(false);
        return;
      }

      setAdventures(data || []);
      setSelectedAdventureId('');
      setLoadingAdventures(false);
    };

    loadAdventures();

    return () => {
      active = false;
    };
  }, [selectedTtrpgId, userId]);

  useEffect(() => {
    let active = true;

    const loadSaves = async () => {
      if (!showSaves || !userId) return;

      setLoadingSaves(true);
      setSavesError('');

      const { data, error: saveError } = await supabase
        .from('Solo_Adventure_Saves')
        .select('id, adventure_id, character_id, current_page_id, character_name, adventure_title, updated_at, created_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (!active) return;

      if (saveError) {
        setSaves([]);
        setSavesError(saveError.message || 'Failed to load saves.');
        setLoadingSaves(false);
        return;
      }

      setSaves(data || []);
      setLoadingSaves(false);
    };

    loadSaves();

    return () => {
      active = false;
    };
  }, [showSaves, userId]);

  const handleViewCharacterOverview = () => {
    if (!selectedCharacterId || !selectedTtrpgId) return;

    const selectedChar = characters.find((c) => String(c.id) === selectedCharacterId);
    if (selectedChar?.campaign_joined) return;

    const selectedTtrpg = ttrpgs.find((t) => String(t.id) === selectedTtrpgId);
    const initials = (selectedTtrpg?.Initials || '').toUpperCase();

    localStorage.setItem('loadedCharacterId', selectedCharacterId);

    if (initials === 'SW') {
      navigate('/SW_character_overview');
      return;
    }

    if (initials === 'FA' || initials === 'F') {
      navigate('/Fa_character_overview');
      return;
    }

    if (initials === 'MM') {
      navigate('/MM_character_overview');
      return;
    }

    if (initials === 'WWW') {
      navigate('/WWW_character_overview');
      return;
    }

    if (initials === 'DND') {
      const modName = selectedTtrpg?.TTRPG_name || '';
      navigate(`/DNDmod_character_overview?mod=${encodeURIComponent(modName)}`);
      return;
    }
  };

  const handleStartAdventure = () => {
    if (!selectedAdventureId || !selectedCharacterId || !hasEquipment) return;

    const selectedChar = characters.find((c) => String(c.id) === selectedCharacterId);
    if (selectedChar?.campaign_joined) return;

    navigate(`/solo-adventures/play/${selectedAdventureId}?characterId=${selectedCharacterId}`);
  };

  const handleResumeSave = (save) => {
    if (!save?.adventure_id || !save?.character_id) return;

    setResumingSaveId(save.id);
    const pageQuery = save.current_page_id ? `&pageId=${encodeURIComponent(save.current_page_id)}` : '';
    navigate(`/solo-adventures/play/${save.adventure_id}?characterId=${save.character_id}${pageQuery}`);
  };

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
            <button
              onClick={() => setShowSaves((prev) => !prev)}
              className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-emerald-800"
            >
              Continue
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
              {showSaves && (
                <div className="mb-8 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4">
                  <h2 className="mb-3 text-xl font-bold text-gray-900">Saved Adventures</h2>
                  {loadingSaves && <p className="text-base text-gray-700">Loading saves...</p>}
                  {!loadingSaves && savesError && <p className="text-base font-semibold text-red-700">{savesError}</p>}
                  {!loadingSaves && !savesError && saves.length === 0 && (
                    <p className="text-base text-gray-700">No saves yet.</p>
                  )}
                  {!loadingSaves && !savesError && saves.length > 0 && (
                    <div className="space-y-3">
                      {saves.map((save) => (
                        <div key={save.id} className="rounded-xl border border-emerald-200 bg-white p-3">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1 text-sm text-gray-700">
                              <div className="text-base font-bold text-gray-900">{save.adventure_title || `Adventure #${save.adventure_id}`}</div>
                              <div><span className="font-semibold">Character:</span> {save.character_name || `#${save.character_id}`}</div>
                              <div><span className="font-semibold">Page ID:</span> {save.current_page_id || 'Not set'}</div>
                              <div>
                                <span className="font-semibold">Last Saved:</span>{' '}
                                {save.updated_at ? new Date(save.updated_at).toLocaleString() : 'Unknown'}
                              </div>
                            </div>
                            <button
                              onClick={() => handleResumeSave(save)}
                              disabled={resumingSaveId === save.id}
                              className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {resumingSaveId === save.id ? 'Opening...' : 'Continue'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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
                  {loadingAdventures && <p className="text-lg text-gray-700">Loading adventures...</p>}
                  {!loadingAdventures && adventureError && (
                    <p className="text-lg font-semibold text-red-700">{adventureError}</p>
                  )}
                  {!loadingAdventures && !adventureError && adventures.length === 0 && (
                    <p className="text-lg text-gray-700">No solo adventures for this TTRPG yet.</p>
                  )}
                  {!loadingAdventures && !adventureError && adventures.length > 0 && (
                    <div className="mb-8">
                      <label className="mb-3 block text-base font-bold text-gray-900" htmlFor="solo-adventures-adventure-select">
                        SELECT ADVENTURE
                      </label>
                      <select
                        id="solo-adventures-adventure-select"
                        value={selectedAdventureId}
                        onChange={(event) => setSelectedAdventureId(event.target.value)}
                        className="w-full rounded-2xl border-2 border-gray-900 bg-gray-50 px-5 py-4 text-lg font-semibold text-gray-900 shadow-sm outline-none transition focus:border-indigo-600"
                      >
                        <option value="">-- Select an Adventure --</option>
                        {adventures.map((adventure) => (
                          <option key={adventure.id} value={String(adventure.id)}>
                            {adventure.title}
                          </option>
                        ))}
                      </select>

                      {selectedAdventureId && (() => {
                        const selectedAdventure = adventures.find((a) => String(a.id) === selectedAdventureId);
                        return selectedAdventure ? (
                          <div className="mt-6 rounded-2xl border border-gray-300 bg-gray-50 p-4">
                            <div className="mb-2 text-2xl font-bold text-gray-900">{selectedAdventure.title}</div>
                            {selectedAdventure.description && (
                              <p className="mb-3 text-base text-gray-700">{selectedAdventure.description}</p>
                            )}
                            <div className="space-y-1 text-sm text-gray-600">
                              {selectedAdventure.created_at && (
                                <div>
                                  <span className="font-semibold">Created:</span>{' '}
                                  {new Date(selectedAdventure.created_at).toLocaleString()}
                                </div>
                              )}
                              {selectedAdventure.updated_at && (
                                <div>
                                  <span className="font-semibold">Updated:</span>{' '}
                                  {new Date(selectedAdventure.updated_at).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

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
                        const selectedTtrpg = ttrpgs.find((t) => String(t.id) === selectedTtrpgId);
                        const characterFace = resolveCharacterFaceUrl(selectedChar, selectedTtrpg?.Initials);
                        const isInCampaign = !!selectedChar?.campaign_joined;
                        return selectedChar ? (
                          <div className="mt-6 rounded-2xl border border-gray-300 bg-gray-50 p-4">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                              <div className="w-full sm:w-40">
                                {characterFace && !characterFaceErrored ? (
                                  <img
                                    src={characterFace}
                                    alt={`${selectedChar.name || selectedChar.Name} portrait`}
                                    className="h-40 w-40 rounded-xl border-2 border-gray-300 bg-white object-cover shadow-sm"
                                    onError={() => setCharacterFaceErrored(true)}
                                  />
                                ) : (
                                  <div className="flex h-40 w-40 items-center justify-center rounded-xl border-2 border-dashed border-gray-400 bg-white text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    No Portrait
                                  </div>
                                )}
                              </div>

                              <div className="flex-1">
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

                                <div className="mt-4">
                                  {isInCampaign && (
                                    <p className="text-sm font-semibold text-red-700">
                                      You cannot choose a character involved in a campaign.
                                    </p>
                                  )}
                                  {checkingEquipment && <p className="text-sm text-gray-700">Checking equipment...</p>}
                                  {!checkingEquipment && equipmentCheckError && (
                                    <p className="text-sm font-semibold text-red-700">{equipmentCheckError}</p>
                                  )}
                                  {!isInCampaign && !checkingEquipment && !equipmentCheckError && hasEquipment === false && (
                                    <div className="space-y-3">
                                      <p className="text-sm font-semibold text-amber-800">
                                        In order to start this adventure you need to have some weapons and, ideally some armour.
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          onClick={handleViewCharacterOverview}
                                          className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-blue-700"
                                        >
                                          Overview
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                  {!isInCampaign && !checkingEquipment && !equipmentCheckError && hasEquipment === true && (
                                    <div className="space-y-2">
                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          onClick={handleStartAdventure}
                                          disabled={!selectedAdventureId}
                                          className="rounded-xl bg-green-700 px-5 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                          Start Adventure
                                        </button>
                                      </div>
                                      {!selectedAdventureId && (
                                        <p className="text-sm text-gray-600">Select an adventure above to start.</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
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