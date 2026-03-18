import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  COMMON_POWER_SETS,
  DEFAULT_MARVEL_STATS,
  DEFAULT_RESOURCES,
  MARVEL_STATS,
  normalizeCharacterRecord,
  normalizeStringArray,
} from './MM_characterData';

const RANK_OPTIONS = [
  {
    value: 1,
    label: 'Rank 1 - Rookie',
    description: "This is where most normal people rank. If you're a super hero, you're just getting started and are maybe playing through your origin story. Not long ago, you thought you were a normal person, but now things are changing fast.",
  },
  {
    value: 2,
    label: 'Rank 2 - Protector',
    description: 'You are a proven local hero who can handle dangerous threats and protect your community consistently.',
  },
  {
    value: 3,
    label: 'Rank 3 - Champion',
    description: 'You are a high-impact hero with wide recognition who can stand against major villains and lead teams.',
  },
  {
    value: 4,
    label: 'Rank 4 - Legend',
    description: 'You are among the elite heroes of the world, trusted to answer global threats and world-shaking crises.',
  },
  {
    value: 5,
    label: 'Rank 5 - Mythic',
    description: 'You operate at extraordinary levels of power and influence, shaping the future of nations and realms.',
  },
  {
    value: 6,
    label: 'Rank 6 - Cosmic',
    description: 'You function on a cosmic scale where multiversal danger, galactic stakes, and reality-level events are routine.',
  },
];

export default function MMCharacterCreator() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('identity');

  const [userId, setUserId] = useState(null);
  const [characterId, setCharacterId] = useState(null);

  const [characterName, setCharacterName] = useState('');
  const [heroName, setHeroName] = useState('');
  const [rank, setRank] = useState(1);
  const [origin, setOrigin] = useState('');
  const [archetype, setArchetype] = useState('');
  const [occupation, setOccupation] = useState('');
  const [team, setTeam] = useState('');
  const [stats, setStats] = useState({ ...DEFAULT_MARVEL_STATS });
  const [health, setHealth] = useState(DEFAULT_RESOURCES.health);
  const [focus, setFocus] = useState(DEFAULT_RESOURCES.focus);
  const [karma, setKarma] = useState(DEFAULT_RESOURCES.karma);
  const [powerSets, setPowerSets] = useState([]);
  const [customPowerSet, setCustomPowerSet] = useState('');
  const [powersText, setPowersText] = useState('');
  const [availablePowers, setAvailablePowers] = useState([]);
  const [powerSetFilter, setPowerSetFilter] = useState('All');
  const [loadingPowerLibrary, setLoadingPowerLibrary] = useState(false);
  const [powerSearch, setPowerSearch] = useState('');
  const [showAddPowerForm, setShowAddPowerForm] = useState(false);
  const [savingPowerForm, setSavingPowerForm] = useState(false);
  const [newPowerName, setNewPowerName] = useState('');
  const [newPowerSet, setNewPowerSet] = useState('Super-Speed');
  const [newPowerRankMin, setNewPowerRankMin] = useState(1);
  const [newPowerPrerequisites, setNewPowerPrerequisites] = useState('');
  const [newPowerActionType, setNewPowerActionType] = useState('');
  const [newPowerTrigger, setNewPowerTrigger] = useState('');
  const [newPowerDuration, setNewPowerDuration] = useState('');
  const [newPowerFocusCost, setNewPowerFocusCost] = useState('');
  const [newPowerEffect, setNewPowerEffect] = useState('');
  const [newPowerDescription, setNewPowerDescription] = useState('');
  const [traitsText, setTraitsText] = useState('');
  const [backstory, setBackstory] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError('');

      try {
        const username = localStorage.getItem('username');
        if (!username) {
          navigate('/');
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from('user')
          .select('id')
          .eq('username', username)
          .maybeSingle();

        if (userError) {
          throw userError;
        }

        setUserId(userData?.id ?? null);

        const loadedCharacterId = localStorage.getItem('loadedCharacterId');
        if (loadedCharacterId) {
          const parsedId = Number(loadedCharacterId);
          if (!Number.isNaN(parsedId)) {
            const { data: characterData, error: characterError } = await supabase
              .from('MM_player_characters')
              .select('*')
              .eq('id', parsedId)
              .maybeSingle();

            if (characterError) {
              console.error('Error loading Marvel character:', characterError);
            } else if (characterData) {
              const normalized = normalizeCharacterRecord(characterData);
              setCharacterId(normalized.id);
              setCharacterName(normalized.name);
              setHeroName(normalized.heroName);
              setRank(normalized.rank);
              setOrigin(normalized.origin);
              setArchetype(normalized.archetype);
              setOccupation(normalized.occupation);
              setTeam(normalized.team);
              setStats(normalized.stats);
              setHealth(normalized.health);
              setFocus(normalized.focus);
              setKarma(normalized.karma);
              setPowerSets(normalized.powerSets);
              setPowersText(normalized.powers.join('\n'));
              setTraitsText(normalized.traits.join('\n'));
              setBackstory(normalized.backstory);
              setNotes(normalized.notes);
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize Marvel creator:', err);
        setError('Failed to load Marvel Multiverse data from Supabase. Run the Marvel schema migration first.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

  useEffect(() => {
    loadPowerLibrary();
  }, []);

  const statTotal = useMemo(
    () => MARVEL_STATS.reduce((sum, stat) => sum + (Number(stats[stat.key]) || 0), 0),
    [stats],
  );

  const selectedRankInfo = useMemo(
    () => RANK_OPTIONS.find((option) => option.value === Number(rank)) || RANK_OPTIONS[0],
    [rank],
  );

  const currentPowers = useMemo(() => normalizeStringArray(powersText), [powersText]);

  const availablePowerSets = useMemo(() => {
    const sets = new Set((availablePowers || []).map((entry) => entry.power_set).filter(Boolean));
    return ['All', ...Array.from(sets).sort((a, b) => a.localeCompare(b))];
  }, [availablePowers]);

  const filteredLibraryPowers = useMemo(() => (
    (availablePowers || []).filter((entry) => {
      const setOk = powerSetFilter === 'All' || entry.power_set === powerSetFilter;
      const rankOk = Number(entry.rank_min || 1) <= Number(rank || 1);
      const search = powerSearch.trim().toLowerCase();
      const searchOk = !search
        || String(entry.power_name || '').toLowerCase().includes(search)
        || String(entry.power_set || '').toLowerCase().includes(search)
        || String(entry.effect || '').toLowerCase().includes(search)
        || String(entry.description || '').toLowerCase().includes(search);
      return setOk && rankOk && searchOk;
    })
  ), [availablePowers, powerSetFilter, rank, powerSearch]);

  const togglePowerSet = (setName) => {
    setPowerSets((prev) => (
      prev.includes(setName)
        ? prev.filter((entry) => entry !== setName)
        : [...prev, setName].sort((a, b) => a.localeCompare(b))
    ));
  };

  const addCustomPowerSet = () => {
    const trimmed = customPowerSet.trim();
    if (!trimmed) return;
    setPowerSets((prev) => (
      prev.includes(trimmed)
        ? prev
        : [...prev, trimmed].sort((a, b) => a.localeCompare(b))
    ));
    setCustomPowerSet('');
  };

  const updateStat = (key, value) => {
    const numeric = Number(value);
    setStats((prev) => ({
      ...prev,
      [key]: Number.isNaN(numeric) ? prev[key] : Math.max(0, Math.min(10, Math.floor(numeric))),
    }));
  };

  const loadPowerLibrary = async () => {
    setLoadingPowerLibrary(true);
    try {
      const { data, error: powerError } = await supabase
        .from('MM_powers')
        .select('id, power_name, power_set, rank_min, prerequisites, action_type, trigger, duration_text, focus_cost, effect, description, source_page, is_official')
        .order('power_set', { ascending: true })
        .order('power_name', { ascending: true });

      if (powerError) throw powerError;
      setAvailablePowers(data || []);
    } catch (err) {
      console.error('Failed to load Marvel power library:', err);
      setAvailablePowers([]);
    } finally {
      setLoadingPowerLibrary(false);
    }
  };

  const addPowerFromLibrary = (powerName) => {
    const existing = normalizeStringArray(powersText);
    if (existing.includes(powerName)) return;
    setPowersText([...existing, powerName].join('\n'));
  };

  const handleCreatePower = async () => {
    setError('');
    if (!newPowerName.trim()) {
      setError('Power name is required.');
      return;
    }
    if (!newPowerSet.trim()) {
      setError('Power set is required.');
      return;
    }

    setSavingPowerForm(true);
    try {
      const payload = {
        power_name: newPowerName.trim(),
        power_set: newPowerSet.trim(),
        rank_min: Math.max(1, Number(newPowerRankMin) || 1),
        prerequisites: newPowerPrerequisites.trim() || null,
        action_type: newPowerActionType.trim() || null,
        trigger: newPowerTrigger.trim() || null,
        duration_text: newPowerDuration.trim() || null,
        focus_cost: newPowerFocusCost === '' ? null : Math.max(0, Number(newPowerFocusCost) || 0),
        effect: newPowerEffect.trim() || null,
        description: newPowerDescription.trim() || null,
        is_official: false,
        created_by_user: userId || null,
      };

      const { data: created, error: createError } = await supabase
        .from('MM_powers')
        .insert([payload])
        .select('id, power_name, power_set, rank_min, prerequisites, action_type, trigger, duration_text, focus_cost, effect, description, source_page, is_official')
        .single();

      if (createError) throw createError;

      setAvailablePowers((prev) => {
        const next = [...prev, created];
        next.sort((a, b) => {
          const setCmp = String(a.power_set || '').localeCompare(String(b.power_set || ''));
          if (setCmp !== 0) return setCmp;
          return String(a.power_name || '').localeCompare(String(b.power_name || ''));
        });
        return next;
      });

      addPowerFromLibrary(created.power_name);
      setShowAddPowerForm(false);
      setNewPowerName('');
      setNewPowerSet('Super-Speed');
      setNewPowerRankMin(1);
      setNewPowerPrerequisites('');
      setNewPowerActionType('');
      setNewPowerTrigger('');
      setNewPowerDuration('');
      setNewPowerFocusCost('');
      setNewPowerEffect('');
      setNewPowerDescription('');
    } catch (err) {
      console.error('Failed to create power:', err);
      setError('Failed to create power. If this power already exists in the same set, choose a different name.');
    } finally {
      setSavingPowerForm(false);
    }
  };

  const saveCharacter = async (goToOverview = false) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (!characterName.trim()) {
        setError('Character name is required.');
        return;
      }

      if (!userId) {
        setError('User account not found.');
        return;
      }

      const payload = {
        name: characterName.trim(),
        hero_name: heroName.trim(),
        rank: Math.max(1, Number(rank) || 1),
        origin: origin.trim(),
        archetype: archetype.trim(),
        occupation: occupation.trim(),
        team: team.trim(),
        marvel_stats: stats,
        health: Math.max(0, Number(health) || 0),
        focus: Math.max(0, Number(focus) || 0),
        karma: Math.max(0, Number(karma) || 0),
        power_sets: powerSets,
        powers: normalizeStringArray(powersText),
        traits: normalizeStringArray(traitsText),
        backstory,
        notes,
        user_number: userId,
        updated_at: new Date().toISOString(),
      };

      let nextId = characterId;
      if (nextId) {
        const { error: updateError } = await supabase
          .from('MM_player_characters')
          .update(payload)
          .eq('id', nextId);

        if (updateError) {
          throw updateError;
        }
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('MM_player_characters')
          .insert([payload])
          .select('id')
          .single();

        if (insertError) {
          throw insertError;
        }

        nextId = inserted?.id ?? null;
        setCharacterId(nextId);
      }

      if (nextId) {
        localStorage.setItem('loadedCharacterId', String(nextId));
      }

      setSuccess('Character saved.');

      if (goToOverview && nextId) {
        navigate('/MM_character_overview');
      }
    } catch (err) {
      console.error('Failed to save Marvel character:', err);
      setError('Failed to save Marvel character. Check that MM_player_characters exists and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-950 via-neutral-950 to-black px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-red-700/60 bg-black/70 shadow-2xl shadow-red-950/40">
        <div className="border-b border-red-700/40 bg-gradient-to-r from-red-900 via-red-700 to-amber-500 px-6 py-5 text-black">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src="/MM_Pictures/Logo.png"
                alt="Marvel Multiverse"
                className="h-16 w-auto rounded-lg bg-white/80 p-2"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/select-ttrpg')}
                className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-900"
              >
                Back
              </button>
              <button
                onClick={() => navigate('/MM_character_overview')}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-neutral-200"
              >
                Overview
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          {loading && <p className="text-sm text-red-100">Loading character...</p>}
          {error && <p className="mb-4 rounded-lg border border-red-500/60 bg-red-950/60 px-4 py-3 text-sm text-red-100">{error}</p>}
          {success && <p className="mb-4 rounded-lg border border-emerald-500/60 bg-emerald-950/60 px-4 py-3 text-sm text-emerald-100">{success}</p>}

          {!loading && (
            <div className="space-y-6">
              <div className="flex flex-wrap border-b border-red-800/50">
                {[
                  { key: 'identity', label: 'Identity' },
                  { key: 'stats', label: 'MARVEL' },
                  { key: 'powers', label: 'Powers' },
                  { key: 'notes', label: 'Notes' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`border-b-2 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition ${
                      activeTab === tab.key
                        ? 'border-amber-400 text-amber-300'
                        : 'border-transparent text-red-100/70 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'identity' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-200">Character Name</span>
                    <input
                      value={characterName}
                      onChange={(event) => setCharacterName(event.target.value)}
                      className="w-full rounded-xl border border-red-800 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                      placeholder="Peter Parker"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-200">Hero Alias</span>
                    <input
                      value={heroName}
                      onChange={(event) => setHeroName(event.target.value)}
                      className="w-full rounded-xl border border-red-800 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                      placeholder="Spider-Man"
                    />
                  </label>
                  <div className="space-y-2 md:col-span-2">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-200">Rank</span>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'nowrap',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        width: '100%',
                        overflowX: 'auto',
                      }}
                    >
                      <div style={{ flex: '0 0 30rem', maxWidth: '30rem' }}>
                        <select
                          value={rank}
                          onChange={(event) => setRank(Number(event.target.value))}
                          className="w-full rounded-xl border border-red-800 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                        >
                          {RANK_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="rounded-2xl border border-amber-500/50 bg-amber-500/10 px-4 py-3" style={{ flex: '1 1 auto', minWidth: '32rem' }}>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200">Selected Rank</p>
                        <p className="mt-1 text-sm font-bold text-amber-100">{selectedRankInfo.label}</p>
                        <p className="mt-2 text-sm leading-6 text-white">{selectedRankInfo.description}</p>
                      </div>
                    </div>
                  </div>
                  <label className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-200">Origin</span>
                    <input
                      value={origin}
                      onChange={(event) => setOrigin(event.target.value)}
                      className="w-full rounded-xl border border-red-800 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                      placeholder="Mutant, Alien, Mystic, Human, Robot..."
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-200">Archetype</span>
                    <input
                      value={archetype}
                      onChange={(event) => setArchetype(event.target.value)}
                      className="w-full rounded-xl border border-red-800 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                      placeholder="Bruiser, Genius, Blaster, Mystic"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-200">Occupation</span>
                    <input
                      value={occupation}
                      onChange={(event) => setOccupation(event.target.value)}
                      className="w-full rounded-xl border border-red-800 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                      placeholder="Scientist, Reporter, Student"
                    />
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-200">Team or Affiliation</span>
                    <input
                      value={team}
                      onChange={(event) => setTeam(event.target.value)}
                      className="w-full rounded-xl border border-red-800 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                      placeholder="Avengers, X-Men, Fantastic Four, Street-Level"
                    />
                  </label>
                </div>
              )}

              {activeTab === 'stats' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-6 gap-2">
                    {MARVEL_STATS.map((stat) => (
                      <div key={stat.key} className="rounded-2xl border border-red-800/70 bg-neutral-950 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-200">{stat.short}</p>
                        <h3 className="mt-2 text-base font-black uppercase leading-tight text-white">{stat.label}</h3>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={stats[stat.key]}
                          onChange={(event) => updateStat(stat.key, event.target.value)}
                          className="mt-3 w-full rounded-xl border border-red-700 bg-black px-2 py-2 text-center text-xl font-black text-white outline-none transition focus:border-amber-400"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="rounded-2xl border border-amber-500/60 bg-amber-500/10 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200">Stat Total</p>
                      <p className="mt-2 text-3xl font-black text-white">{statTotal}</p>
                    </div>
                    {[
                      { key: 'health', label: 'Health', value: health, setter: setHealth },
                      { key: 'focus', label: 'Focus', value: focus, setter: setFocus },
                      { key: 'karma', label: 'Karma', value: karma, setter: setKarma },
                    ].map((resource) => (
                      <label key={resource.key} className="rounded-2xl border border-red-800/70 bg-neutral-950 p-4">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-200">{resource.label}</span>
                        <input
                          type="number"
                          min="0"
                          value={resource.value}
                          onChange={(event) => resource.setter(event.target.value)}
                          className="mt-3 w-full rounded-xl border border-red-700 bg-black px-2 py-2 text-center text-2xl font-black text-white outline-none transition focus:border-amber-400"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'powers' && (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-red-800/70 bg-neutral-950 p-4">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-lg font-black uppercase tracking-[0.18em] text-white">Power Library</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={powerSetFilter}
                          onChange={(event) => setPowerSetFilter(event.target.value)}
                          className="rounded-xl border border-red-700 bg-black px-3 py-2 text-sm text-white outline-none transition focus:border-amber-400"
                        >
                          {availablePowerSets.map((setName) => (
                            <option key={setName} value={setName}>{setName}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={loadPowerLibrary}
                          className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black hover:bg-neutral-200"
                        >
                          Reload Library
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddPowerForm((prev) => !prev)}
                          className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-black hover:bg-amber-300"
                        >
                          {showAddPowerForm ? 'Cancel Add' : 'Add New Power'}
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <input
                        value={powerSearch}
                        onChange={(event) => setPowerSearch(event.target.value)}
                        className="w-full rounded-xl border border-red-700 bg-black px-4 py-2 text-sm text-white outline-none transition focus:border-amber-400"
                        placeholder="Search by name, set, or effect"
                      />
                    </div>

                    {showAddPowerForm && (
                      <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
                        <h4 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-amber-200">Add Power</h4>
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-red-200">Power Name</span>
                            <input
                              value={newPowerName}
                              onChange={(event) => setNewPowerName(event.target.value)}
                              className="w-full rounded-lg border border-red-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                              placeholder="Blur"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-red-200">Power Set</span>
                            <input
                              value={newPowerSet}
                              onChange={(event) => setNewPowerSet(event.target.value)}
                              list="mm-power-set-options"
                              className="w-full rounded-lg border border-red-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                              placeholder="Super-Speed"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-red-200">Rank Min</span>
                            <input
                              type="number"
                              min="1"
                              value={newPowerRankMin}
                              onChange={(event) => setNewPowerRankMin(event.target.value)}
                              className="w-full rounded-lg border border-red-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-red-200">Focus Cost</span>
                            <input
                              type="number"
                              min="0"
                              value={newPowerFocusCost}
                              onChange={(event) => setNewPowerFocusCost(event.target.value)}
                              className="w-full rounded-lg border border-red-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                            />
                          </label>
                          <label className="space-y-1 md:col-span-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-red-200">Prerequisites</span>
                            <input
                              value={newPowerPrerequisites}
                              onChange={(event) => setNewPowerPrerequisites(event.target.value)}
                              className="w-full rounded-lg border border-red-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                              placeholder="Speed Run 2, Rank 2"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-red-200">Action</span>
                            <input
                              value={newPowerActionType}
                              onChange={(event) => setNewPowerActionType(event.target.value)}
                              className="w-full rounded-lg border border-red-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                              placeholder="Standard or reaction"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-red-200">Duration</span>
                            <input
                              value={newPowerDuration}
                              onChange={(event) => setNewPowerDuration(event.target.value)}
                              className="w-full rounded-lg border border-red-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                              placeholder="1 round"
                            />
                          </label>
                          <label className="space-y-1 md:col-span-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-red-200">Trigger</span>
                            <input
                              value={newPowerTrigger}
                              onChange={(event) => setNewPowerTrigger(event.target.value)}
                              className="w-full rounded-lg border border-red-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                              placeholder="The character is attacked."
                            />
                          </label>
                          <label className="space-y-1 md:col-span-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-red-200">Effect</span>
                            <textarea
                              value={newPowerEffect}
                              onChange={(event) => setNewPowerEffect(event.target.value)}
                              rows={2}
                              className="w-full rounded-lg border border-red-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                              placeholder="Any attacks against the character have trouble."
                            />
                          </label>
                          <label className="space-y-1 md:col-span-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-red-200">Short Description</span>
                            <textarea
                              value={newPowerDescription}
                              onChange={(event) => setNewPowerDescription(event.target.value)}
                              rows={2}
                              className="w-full rounded-lg border border-red-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                              placeholder="The character moves like a blur!"
                            />
                          </label>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={handleCreatePower}
                            disabled={savingPowerForm}
                            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-black hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-neutral-500 disabled:text-neutral-200"
                          >
                            {savingPowerForm ? 'Saving...' : 'Save Power'}
                          </button>
                        </div>
                        <datalist id="mm-power-set-options">
                          {COMMON_POWER_SETS.map((setName) => (
                            <option key={setName} value={setName} />
                          ))}
                        </datalist>
                      </div>
                    )}

                    {loadingPowerLibrary && (
                      <p className="text-sm text-red-100">Loading power library...</p>
                    )}

                    {!loadingPowerLibrary && filteredLibraryPowers.length === 0 && (
                      <p className="text-sm text-red-100/80">No powers found for this filter and rank. You can still add custom powers manually below.</p>
                    )}

                    {!loadingPowerLibrary && filteredLibraryPowers.length > 0 && (
                      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                        {filteredLibraryPowers.map((entry) => {
                          const alreadyAdded = currentPowers.includes(entry.power_name);
                          return (
                            <div key={entry.id} className="rounded-xl border border-red-800/60 bg-black px-3 py-3">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-bold text-white">{entry.power_name}</p>
                                  <p className="text-xs text-red-200">
                                    {entry.power_set} - Rank {entry.rank_min || 1}+{entry.is_official === false ? ' - Homebrew' : ''}
                                  </p>
                                  {entry.prerequisites && <p className="mt-1 text-xs text-red-100/90"><strong>Prerequisites:</strong> {entry.prerequisites}</p>}
                                  {entry.action_type && <p className="text-xs text-red-100/90"><strong>Action:</strong> {entry.action_type}</p>}
                                  {entry.trigger && <p className="text-xs text-red-100/90"><strong>Trigger:</strong> {entry.trigger}</p>}
                                  {entry.duration_text && <p className="text-xs text-red-100/90"><strong>Duration:</strong> {entry.duration_text}</p>}
                                  {(entry.focus_cost != null) && <p className="text-xs text-red-100/90"><strong>Cost:</strong> {entry.focus_cost} Focus</p>}
                                  {entry.effect && <p className="text-xs text-red-100/90"><strong>Effect:</strong> {entry.effect}</p>}
                                  {entry.description && <p className="text-xs text-red-100/90"><strong>Summary:</strong> {entry.description}</p>}
                                </div>
                                <button
                                  type="button"
                                  disabled={alreadyAdded}
                                  onClick={() => addPowerFromLibrary(entry.power_name)}
                                  className="rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-black hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-neutral-500 disabled:text-neutral-200"
                                >
                                  {alreadyAdded ? 'Added' : 'Add'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-red-800/70 bg-neutral-950 p-4">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-lg font-black uppercase tracking-[0.18em] text-white">Power Sets</h3>
                      <div className="flex gap-2">
                        <input
                          value={customPowerSet}
                          onChange={(event) => setCustomPowerSet(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              addCustomPowerSet();
                            }
                          }}
                          className="rounded-xl border border-red-700 bg-black px-4 py-2 text-sm text-white outline-none transition focus:border-amber-400"
                          placeholder="Add custom set"
                        />
                        <button
                          type="button"
                          onClick={addCustomPowerSet}
                          className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-black hover:bg-amber-300"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {[...COMMON_POWER_SETS, ...powerSets.filter((entry) => !COMMON_POWER_SETS.includes(entry))].map((setName) => {
                        const selected = powerSets.includes(setName);
                        return (
                          <button
                            key={setName}
                            type="button"
                            onClick={() => togglePowerSet(setName)}
                            className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                              selected
                                ? 'border-amber-400 bg-amber-500/15 text-amber-100'
                                : 'border-red-800 bg-black text-red-100 hover:border-red-500'
                            }`}
                          >
                            {setName}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <label className="space-y-2 rounded-2xl border border-red-800/70 bg-neutral-950 p-4">
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-200">Powers</span>
                      <textarea
                        value={powersText}
                        onChange={(event) => setPowersText(event.target.value)}
                        rows={10}
                        className="w-full rounded-xl border border-red-700 bg-black px-4 py-3 text-white outline-none transition focus:border-amber-400"
                        placeholder="One power per line"
                      />
                    </label>
                    <label className="space-y-2 rounded-2xl border border-red-800/70 bg-neutral-950 p-4">
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-200">Tags and Traits</span>
                      <textarea
                        value={traitsText}
                        onChange={(event) => setTraitsText(event.target.value)}
                        rows={10}
                        className="w-full rounded-xl border border-red-700 bg-black px-4 py-3 text-white outline-none transition focus:border-amber-400"
                        placeholder="One tag per line"
                      />
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="space-y-2 rounded-2xl border border-red-800/70 bg-neutral-950 p-4">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-200">Backstory</span>
                    <textarea
                      value={backstory}
                      onChange={(event) => setBackstory(event.target.value)}
                      rows={12}
                      className="w-full rounded-xl border border-red-700 bg-black px-4 py-3 text-white outline-none transition focus:border-amber-400"
                    />
                  </label>
                  <label className="space-y-2 rounded-2xl border border-red-800/70 bg-neutral-950 p-4">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-200">Notes</span>
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      rows={12}
                      className="w-full rounded-xl border border-red-700 bg-black px-4 py-3 text-white outline-none transition focus:border-amber-400"
                    />
                  </label>
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-3 border-t border-red-800/50 pt-6">
                <button
                  type="button"
                  onClick={() => saveCharacter(false)}
                  disabled={saving}
                  className="rounded-xl bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Character'}
                </button>
                <button
                  type="button"
                  onClick={() => saveCharacter(true)}
                  disabled={saving}
                  className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Save and Open Overview
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}