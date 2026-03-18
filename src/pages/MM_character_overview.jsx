import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { MARVEL_STATS, normalizeCharacterRecord } from './MM_characterData';

export default function MMCharacterOverview() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [character, setCharacter] = useState(null);
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError('');

      try {
        const loadedCharacterId = localStorage.getItem('loadedCharacterId');
        if (!loadedCharacterId) {
          setError('No Marvel character selected. Open or create a character first.');
          return;
        }

        const parsedId = Number(loadedCharacterId);
        if (Number.isNaN(parsedId)) {
          setError('Selected character id is invalid.');
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('MM_player_characters')
          .select('*')
          .eq('id', parsedId)
          .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        if (!data) {
          setError('Character not found in Supabase.');
          return;
        }

        setCharacter(normalizeCharacterRecord(data));
      } catch (err) {
        console.error('Failed to load Marvel overview:', err);
        setError('Failed to load Marvel character from Supabase.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const statTotal = useMemo(() => {
    if (!character) return 0;
    return MARVEL_STATS.reduce((sum, stat) => sum + (Number(character.stats[stat.key]) || 0), 0);
  }, [character]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-950 via-neutral-950 to-black px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-6xl rounded-3xl border border-red-700/60 bg-black/70 shadow-2xl shadow-red-950/40">
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
              <div>
                <h1 className="text-2xl font-black uppercase tracking-[0.18em]">Marvel Character Overview</h1>
                <p className="text-sm font-semibold text-black/80">Snapshot of identity, MARVEL values, powers, and story hooks.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/select-ttrpg')}
                className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-900"
              >
                Back
              </button>
              <button
                onClick={() => navigate('/MM_character_creator')}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-neutral-200"
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          {loading && <p className="text-sm text-red-100">Loading character...</p>}
          {error && <p className="rounded-lg border border-red-500/60 bg-red-950/60 px-4 py-3 text-sm text-red-100">{error}</p>}

          {!loading && !error && character && (
            <>
              <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-red-700/60 bg-gradient-to-br from-red-700/40 to-amber-400/20 p-6">
                  <div className="flex h-32 w-32 items-center justify-center rounded-3xl border border-white/20 bg-black/60 text-5xl font-black uppercase text-white">
                    {(character.heroName || character.name || 'M').trim().charAt(0)}
                  </div>
                </div>
                <div className="rounded-3xl border border-red-800/70 bg-neutral-950 p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-200">Identity</p>
                  <h2 className="mt-3 text-3xl font-black uppercase text-white">{character.heroName || character.name}</h2>
                  {character.heroName && <p className="mt-1 text-lg text-red-100/80">{character.name}</p>}
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      { label: 'Rank', value: character.rank },
                      { label: 'Origin', value: character.origin || 'Unspecified' },
                      { label: 'Archetype', value: character.archetype || 'Unspecified' },
                      { label: 'Occupation', value: character.occupation || 'Unspecified' },
                      { label: 'Team', value: character.team || 'Unaffiliated' },
                      { label: 'Stat Total', value: statTotal },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-red-800/60 bg-black p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-200">{item.label}</p>
                        <p className="mt-2 text-lg font-bold text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap border-b border-red-800/50">
                {[
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

              {activeTab === 'stats' && (
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {MARVEL_STATS.map((stat) => (
                      <div key={stat.key} className="rounded-2xl border border-red-800/70 bg-neutral-950 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-200">{stat.short}</p>
                        <h3 className="mt-2 text-lg font-black uppercase text-white">{stat.label}</h3>
                        <p className="mt-4 text-4xl font-black text-amber-300">{character.stats[stat.key]}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      { label: 'Health', value: character.health },
                      { label: 'Focus', value: character.focus },
                      { label: 'Karma', value: character.karma },
                    ].map((resource) => (
                      <div key={resource.label} className="rounded-2xl border border-red-800/70 bg-neutral-950 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-200">{resource.label}</p>
                        <p className="mt-3 text-4xl font-black text-white">{resource.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'powers' && (
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-red-800/70 bg-neutral-950 p-4 lg:col-span-1">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-200">Power Sets</p>
                    {character.powerSets.length === 0 ? (
                      <p className="mt-4 text-sm text-red-100/70">No power sets listed.</p>
                    ) : (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {character.powerSets.map((setName) => (
                          <span key={setName} className="rounded-full border border-amber-400/60 bg-amber-400/10 px-3 py-1 text-sm font-semibold text-amber-100">
                            {setName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-red-800/70 bg-neutral-950 p-4 lg:col-span-1">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-200">Powers</p>
                    {character.powers.length === 0 ? (
                      <p className="mt-4 text-sm text-red-100/70">No powers listed.</p>
                    ) : (
                      <ul className="mt-4 space-y-2 text-sm text-white">
                        {character.powers.map((power) => (
                          <li key={power} className="rounded-xl border border-red-800/60 bg-black px-3 py-2">{power}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="rounded-2xl border border-red-800/70 bg-neutral-950 p-4 lg:col-span-1">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-200">Tags and Traits</p>
                    {character.traits.length === 0 ? (
                      <p className="mt-4 text-sm text-red-100/70">No tags listed.</p>
                    ) : (
                      <ul className="mt-4 space-y-2 text-sm text-white">
                        {character.traits.map((trait) => (
                          <li key={trait} className="rounded-xl border border-red-800/60 bg-black px-3 py-2">{trait}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-red-800/70 bg-neutral-950 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-200">Backstory</p>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white">{character.backstory || 'No backstory recorded.'}</p>
                  </div>
                  <div className="rounded-2xl border border-red-800/70 bg-neutral-950 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-200">Notes</p>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white">{character.notes || 'No notes recorded.'}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}