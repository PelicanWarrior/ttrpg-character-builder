import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const ABILITIES = [
  { short: 'STR', label: 'Strength' },
  { short: 'DEX', label: 'Dexterity' },
  { short: 'CON', label: 'Constitution' },
  { short: 'INT', label: 'Intelligence' },
  { short: 'WIS', label: 'Wisdom' },
  { short: 'CHA', label: 'Charisma' },
];

const SKILLS = [
  { name: 'Acrobatics', ability: 'DEX' },
  { name: 'Animal Handling', ability: 'WIS' },
  { name: 'Arcana', ability: 'INT' },
  { name: 'Athletics', ability: 'STR' },
  { name: 'Deception', ability: 'CHA' },
  { name: 'History', ability: 'INT' },
  { name: 'Insight', ability: 'WIS' },
  { name: 'Intimidation', ability: 'CHA' },
  { name: 'Investigation', ability: 'INT' },
  { name: 'Medicine', ability: 'WIS' },
  { name: 'Nature', ability: 'INT' },
  { name: 'Perception', ability: 'WIS' },
  { name: 'Performance', ability: 'CHA' },
  { name: 'Persuasion', ability: 'CHA' },
  { name: 'Religion', ability: 'INT' },
  { name: 'Sleight of Hand', ability: 'DEX' },
  { name: 'Stealth', ability: 'DEX' },
  { name: 'Survival', ability: 'WIS' },
];

const normalizeList = (value) => String(value || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const normalizeIdList = (value) => normalizeList(value)
  .map((item) => Number(item))
  .filter((item) => !Number.isNaN(item));

const normalizeSkillKey = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const parseLevel = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
};

const abilityModifier = (score) => Math.floor((score - 10) / 2);

const formatSigned = (value) => (value >= 0 ? `+${value}` : String(value));

const classProfSkillsFromCharacter = (character) => {
  const source = [
    character?.Class_ProfSkills,
    character?.class_profskills,
    character?.Class_Prof_Skills,
    character?.class_prof_skills,
    character?.ProfSkills,
    character?.profskills,
  ].find((entry) => String(entry || '').trim() !== '');

  return normalizeList(source).map((entry) => normalizeSkillKey(entry));
};

const subclassIdFromCharacter = (character) => {
  const source = [
    character?.Subclass,
    character?.subclass,
    character?.SubClass,
    character?.sub_class,
    character?.CharacterSubclass,
    character?.character_subclass,
  ].find((entry) => entry != null && String(entry).trim() !== '');

  const parsed = Number(source);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function DNDModCharacterOverview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dndMod = searchParams.get('mod') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('actions');
  const [initials, setInitials] = useState('');

  const [character, setCharacter] = useState(null);
  const [classRow, setClassRow] = useState(null);
  const [subclassRow, setSubclassRow] = useState(null);
  const [raceRow, setRaceRow] = useState(null);
  const [backgroundRow, setBackgroundRow] = useState(null);
  const [featureRows, setFeatureRows] = useState([]);
  const [equipmentRows, setEquipmentRows] = useState([]);
  const [spellRows, setSpellRows] = useState([]);

  useEffect(() => {
    const loadOverview = async () => {
      setLoading(true);
      setError('');

      try {
        const loadedCharacterId = localStorage.getItem('loadedCharacterId');
        if (!loadedCharacterId) {
          setError('No DnD character selected. Open a character first.');
          return;
        }

        const parsedId = Number(loadedCharacterId);
        if (!Number.isFinite(parsedId)) {
          setError('Selected character id is invalid.');
          return;
        }

        const [characterResult, initialsResult] = await Promise.all([
          supabase
            .from('DND_player_character')
            .select('*')
            .eq('id', parsedId)
            .maybeSingle(),
          dndMod
            ? supabase
              .from('TTRPGs')
              .select('Initials')
              .eq('TTRPG_name', dndMod)
              .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (characterResult.error) throw characterResult.error;
        if (!characterResult.data) {
          setError('DnD character not found.');
          return;
        }

        const row = characterResult.data;
        setCharacter(row);
        if (!initialsResult.error && initialsResult.data?.Initials) {
          setInitials(initialsResult.data.Initials);
        }

        const classId = Number(row.Class);
        const raceId = Number(row.Race);
        const backgroundId = Number(row.Background);
        const subclassId = subclassIdFromCharacter(row);
        const knownEquipmentIds = normalizeIdList(row.Known_Equipment);
        const knownSpellIds = normalizeIdList(row.Known_Spells);

        const [classResult, raceResult, backgroundResult, subclassResult] = await Promise.all([
          Number.isFinite(classId)
            ? supabase
              .from('DND_Classes')
              .select('id, ClassName, Prof_Armour, Prof_Weapons, Prof_SavingThrows')
              .eq('id', classId)
              .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          Number.isFinite(raceId)
            ? supabase
              .from('DND_Races')
              .select('id, RaceName')
              .eq('id', raceId)
              .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          Number.isFinite(backgroundId)
            ? supabase
              .from('DND_Backgrounds')
              .select('id, BackgroundName')
              .eq('id', backgroundId)
              .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          Number.isFinite(subclassId)
            ? supabase
              .from('DND_Subclasses')
              .select('id, SubclassName')
              .eq('id', subclassId)
              .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (classResult.error) throw classResult.error;
        if (raceResult.error) throw raceResult.error;
        if (backgroundResult.error) throw backgroundResult.error;
        if (subclassResult.error) throw subclassResult.error;

        setClassRow(classResult.data || null);
        setRaceRow(raceResult.data || null);
        setBackgroundRow(backgroundResult.data || null);
        setSubclassRow(subclassResult.data || null);

        let classFeatureIds = [];
        const classLevel = parseLevel(row.ClassLevel);

        if (Number.isFinite(classId)) {
          const classLevelsResult = await supabase
            .from('DND_Class_Levels')
            .select('Level, Features')
            .eq('Class', classId)
            .order('Level', { ascending: true });
          if (classLevelsResult.error) throw classLevelsResult.error;

          classFeatureIds = (classLevelsResult.data || [])
            .filter((levelRow) => parseLevel(levelRow.Level) <= classLevel)
            .flatMap((levelRow) => normalizeIdList(levelRow.Features));
        }

        if (Number.isFinite(subclassId)) {
          const subclassLevelsResult = await supabase
            .from('DND_Subclass_Levels')
            .select('Level, Features')
            .eq('Subclass', subclassId)
            .order('Level', { ascending: true });

          if (!subclassLevelsResult.error) {
            classFeatureIds = classFeatureIds.concat(
              (subclassLevelsResult.data || [])
                .filter((levelRow) => parseLevel(levelRow.Level) <= classLevel)
                .flatMap((levelRow) => normalizeIdList(levelRow.Features))
            );
          }
        }

        const uniqueFeatureIds = [...new Set(classFeatureIds)];
        if (uniqueFeatureIds.length > 0) {
          const featuresResult = await supabase
            .from('DND_ClassFeatures')
            .select('id, FeatureName, FeatureText')
            .in('id', uniqueFeatureIds);
          if (!featuresResult.error) {
            setFeatureRows(featuresResult.data || []);
          }
        } else {
          setFeatureRows([]);
        }

        if (knownEquipmentIds.length > 0) {
          const equipmentResult = await supabase
            .from('DND_Equipment')
            .select('id, ItemName, Category')
            .in('id', knownEquipmentIds);
          if (!equipmentResult.error) {
            setEquipmentRows(equipmentResult.data || []);
          }
        } else {
          setEquipmentRows([]);
        }

        if (knownSpellIds.length > 0) {
          const spellsResult = await supabase
            .from('DND_Spells')
            .select('id, SpellName, SpellLevel')
            .in('id', knownSpellIds);
          if (!spellsResult.error) {
            setSpellRows(spellsResult.data || []);
          }
        } else {
          setSpellRows([]);
        }
      } catch (err) {
        console.error('Failed to load DnD overview:', err);
        setError('Failed to load DnD overview from Supabase.');
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, [dndMod]);

  const derived = useMemo(() => {
    if (!character) {
      return {
        level: 1,
        abilityScores: { STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 },
        abilityMods: { STR: -1, DEX: -1, CON: -1, INT: -1, WIS: -1, CHA: -1 },
        proficiencyBonus: 2,
        savingThrowProficiencies: new Set(),
        skillProficiencies: new Set(),
        ac: 10,
        hpCurrent: 0,
        hpMax: 0,
      };
    }

    const level = parseLevel(character.ClassLevel);
    const proficiencyBonus = 2 + Math.floor((Math.max(level, 1) - 1) / 4);

    const abilityScores = {
      STR: Number(character.Str) || 8,
      DEX: Number(character.Dex) || 8,
      CON: Number(character.Con) || 8,
      INT: Number(character.Int) || 8,
      WIS: Number(character.Wis) || 8,
      CHA: Number(character.Cha) || 8,
    };

    const abilityMods = {
      STR: abilityModifier(abilityScores.STR),
      DEX: abilityModifier(abilityScores.DEX),
      CON: abilityModifier(abilityScores.CON),
      INT: abilityModifier(abilityScores.INT),
      WIS: abilityModifier(abilityScores.WIS),
      CHA: abilityModifier(abilityScores.CHA),
    };

    const savingThrowProficiencies = new Set(
      normalizeList(classRow?.Prof_SavingThrows).map((entry) => entry.toUpperCase())
    );
    const skillProficiencies = new Set(classProfSkillsFromCharacter(character));

    const hpCurrent = Number(character.CurrentHP);
    const hpMax = Number(character.MaxHP);
    const ac = Number(character.ArmorClass);

    return {
      level,
      abilityScores,
      abilityMods,
      proficiencyBonus,
      savingThrowProficiencies,
      skillProficiencies,
      ac: Number.isFinite(ac) ? ac : 10 + abilityMods.DEX,
      hpCurrent: Number.isFinite(hpCurrent) ? hpCurrent : 0,
      hpMax: Number.isFinite(hpMax) ? hpMax : 0,
    };
  }, [character, classRow]);

  const className = classRow?.ClassName || 'Unknown Class';
  const subclassName = subclassRow?.SubclassName || '';
  const displayClassName = subclassName ? `${className} (${subclassName})` : className;
  const raceName = raceRow?.RaceName || 'Unknown Race';
  const backgroundName = backgroundRow?.BackgroundName || 'Unknown Background';

  const tabs = [
    { key: 'actions', label: 'Actions' },
    { key: 'features', label: 'Features & Traits' },
    { key: 'notes', label: 'Notes' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-800 via-stone-700 to-stone-900 px-4 py-6 text-stone-100">
      <div className="mx-auto max-w-7xl rounded-2xl border border-stone-500/60 bg-black/40 shadow-2xl backdrop-blur-sm">
        <div className="border-b border-stone-500/50 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-700 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              {initials && (
                <img
                  src={`/${initials}_Pictures/Logo.png`}
                  alt={`${dndMod} logo`}
                  className="h-14 w-auto"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div>
                <h1 className="text-2xl font-bold tracking-wide text-amber-100">{character?.Name || 'DnD Character'}</h1>
                <p className="text-sm text-stone-300">{raceName} • {displayClassName} • Level {derived.level} • {backgroundName}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/select-ttrpg')}
                className="rounded bg-stone-700 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-600"
              >
                Back
              </button>
              <button
                onClick={() => navigate(`/dndmod_character_creator?mod=${encodeURIComponent(dndMod)}`)}
                className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        <div className="p-5">
          {loading && <p className="text-sm text-stone-200">Loading character overview...</p>}
          {error && <p className="rounded border border-red-500 bg-red-900/40 px-3 py-2 text-sm text-red-100">{error}</p>}

          {!loading && !error && character && (
            <div className="space-y-4">
              <div className="overflow-x-auto pb-1">
                <div className="flex min-w-max items-stretch gap-2">
                  {ABILITIES.map((ability) => (
                    <div key={ability.short} className="min-w-[110px] rounded border border-red-600/70 bg-stone-900/80 px-3 py-2 text-center shadow-md">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-stone-300">{ability.label}</p>
                      <p className="text-xl font-black text-amber-200">{formatSigned(derived.abilityMods[ability.short])}</p>
                      <p className="text-lg font-semibold text-white">{derived.abilityScores[ability.short]}</p>
                    </div>
                  ))}

                  <div className="min-w-[120px] rounded border border-red-600/70 bg-stone-900/80 px-3 py-2 text-center shadow-md">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-stone-300">Proficiency</p>
                    <p className="mt-1 text-3xl font-black leading-none text-amber-200">{formatSigned(derived.proficiencyBonus)}</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-stone-300">Bonus</p>
                  </div>

                  <div className="min-w-[120px] rounded border border-red-600/70 bg-stone-900/80 px-3 py-2 text-center shadow-md">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-stone-300">Walking</p>
                    <p className="mt-1 text-3xl font-black leading-none text-amber-200">{Number(character.Speed) || 0}<span className="ml-1 text-sm font-semibold">ft.</span></p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-stone-300">Speed</p>
                  </div>

                  <div className="min-w-[120px] rounded border border-red-600/70 bg-stone-900/80 px-3 py-2 text-center shadow-md">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-stone-300">Heroic</p>
                    <p className="mt-1 text-lg font-black leading-none text-amber-200">{character.Inspiration ? 'Yes' : 'No'}</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-stone-300">Inspiration</p>
                  </div>

                  <div className="min-w-[220px] rounded border border-red-600/70 bg-stone-900/80 px-3 py-2 text-center shadow-md">
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-bold uppercase tracking-wide text-stone-300">
                      <span>Heal</span>
                      <span>Current</span>
                      <span>Max</span>
                    </div>
                    <div className="mt-1 grid grid-cols-3 items-center gap-2 text-xl font-black text-amber-200">
                      <span>--</span>
                      <span>{derived.hpCurrent}</span>
                      <span>{derived.hpMax}</span>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-stone-300">Hit Points</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[210px_minmax(300px,0.72fr)_420px]">
                <div className="rounded border border-red-600/70 bg-stone-900/80 p-3">
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-amber-200">Saving Throws</h3>
                  <div className="space-y-1 text-sm">
                    {ABILITIES.map((ability) => {
                      const isProficient = derived.savingThrowProficiencies.has(ability.short)
                        || derived.savingThrowProficiencies.has(ability.label.toUpperCase());
                      const baseMod = derived.abilityMods[ability.short] ?? 0;
                      const saveMod = baseMod + (isProficient ? derived.proficiencyBonus : 0);
                      return (
                        <div key={`save-${ability.short}`} className="flex items-center justify-between rounded border border-stone-700 px-2 py-1">
                          <span>{ability.short}</span>
                          <span className="font-semibold">{formatSigned(saveMod)}{isProficient ? ' *' : ''}</span>
                        </div>
                      );
                    })}
                  </div>

                  <h3 className="mb-2 mt-4 text-sm font-bold uppercase tracking-wide text-amber-200">Proficiencies & Training</h3>
                  <div className="space-y-1 text-xs text-stone-300">
                    <p><span className="font-semibold text-stone-100">Armor:</span> {classRow?.Prof_Armour || '—'}</p>
                    <p><span className="font-semibold text-stone-100">Weapons:</span> {classRow?.Prof_Weapons || '—'}</p>
                    <p><span className="font-semibold text-stone-100">Class Skills:</span> {normalizeList(character.Class_ProfSkills || character.class_profskills).join(', ') || '—'}</p>
                  </div>

                  <div className="mt-3 rounded border border-stone-700 px-3 py-2 text-xs text-stone-300">
                    <p><span className="font-semibold text-stone-100">Alignment:</span> {character.Alignment || '—'}</p>
                    <p><span className="font-semibold text-stone-100">Background:</span> {backgroundName}</p>
                  </div>
                </div>

                <div className="rounded border border-red-600/70 bg-stone-900/80 p-3">
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-amber-200">Skills</h3>
                  <div className="grid gap-1">
                    {SKILLS.map((skill) => {
                      const abilityMod = derived.abilityMods[skill.ability] ?? 0;
                      const isProficient = derived.skillProficiencies.has(normalizeSkillKey(skill.name));
                      const total = abilityMod + (isProficient ? derived.proficiencyBonus : 0);
                      return (
                        <div key={`skill-${skill.name}`} className="grid grid-cols-[18px_1fr_auto] items-center gap-2 rounded border border-stone-700 px-2 py-1 text-sm">
                          <span className={isProficient ? 'text-green-400' : 'text-stone-500'}>{isProficient ? '●' : '○'}</span>
                          <span>{skill.name}</span>
                          <span className="font-semibold">{formatSigned(total)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded border border-red-600/70 bg-stone-900/80 p-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded border border-stone-700 px-2 py-2">
                      <p className="text-[11px] uppercase text-stone-400">Armor Class</p>
                      <p className="text-2xl font-black text-amber-200">{derived.ac}</p>
                    </div>
                    <div className="rounded border border-stone-700 px-2 py-2">
                      <p className="text-[11px] uppercase text-stone-400">Initiative</p>
                      <p className="text-2xl font-black text-amber-200">{formatSigned(Number(character.InitiativeBonus) || 0)}</p>
                    </div>
                    <div className="rounded border border-stone-700 px-2 py-2">
                      <p className="text-[11px] uppercase text-stone-400">Passive Perception</p>
                      <p className="text-2xl font-black text-amber-200">{Number(character.PassivePerception) || 10}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-nowrap items-center gap-1 rounded border border-stone-700 px-2 py-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`whitespace-nowrap rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${
                          activeTab === tab.key
                            ? 'border-amber-300 bg-amber-300/15 text-amber-200'
                            : 'border-stone-600 text-stone-300 hover:border-stone-400 hover:text-stone-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 rounded border border-stone-700 bg-black/30 p-3">
                    {activeTab === 'actions' && (
                      <div className="space-y-3 text-sm">
                        <div className="rounded border border-stone-700 bg-black/30 p-3">
                          <p className="font-semibold text-amber-200">Unarmed Strike</p>
                          <p>Hit bonus: {formatSigned((derived.abilityMods.STR || 0) + derived.proficiencyBonus)}</p>
                          <p>Damage: {Math.max(1, 1 + (derived.abilityMods.STR || 0))} bludgeoning</p>
                        </div>

                        <div className="space-y-3">
                          <div className="rounded border border-stone-700 bg-black/30 p-3">
                            <p className="mb-2 font-semibold text-amber-200">Equipment</p>
                            {equipmentRows.length === 0 ? (
                              <p className="text-stone-400">No equipment selected.</p>
                            ) : (
                              <ul className="space-y-1">
                                {equipmentRows
                                  .slice()
                                  .sort((a, b) => (a.ItemName || '').localeCompare(b.ItemName || ''))
                                  .map((item) => (
                                    <li key={`equipment-${item.id}`}>{item.ItemName}{item.Category ? ` (${item.Category})` : ''}</li>
                                  ))}
                              </ul>
                            )}
                          </div>

                          <div className="rounded border border-stone-700 bg-black/30 p-3">
                            <p className="mb-2 font-semibold text-amber-200">Spells</p>
                            {spellRows.length === 0 ? (
                              <p className="text-stone-400">No spells selected.</p>
                            ) : (
                              <ul className="space-y-1">
                                {spellRows
                                  .slice()
                                  .sort((a, b) => Number(a.SpellLevel || 0) - Number(b.SpellLevel || 0) || (a.SpellName || '').localeCompare(b.SpellName || ''))
                                  .map((spell) => (
                                    <li key={`spell-${spell.id}`}>{spell.SpellName} (Level {Number(spell.SpellLevel) || 0})</li>
                                  ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'features' && (
                      <div className="space-y-2">
                        {featureRows.length === 0 && <p className="text-sm text-stone-400">No features found for current class level.</p>}
                        {featureRows
                          .slice()
                          .sort((a, b) => (a.FeatureName || '').localeCompare(b.FeatureName || ''))
                          .map((feature) => (
                            <details key={`feature-${feature.id}`} className="rounded border border-stone-700 bg-black/30">
                              <summary className="cursor-pointer px-3 py-2 font-semibold text-amber-200">{feature.FeatureName}</summary>
                              <div className="whitespace-pre-wrap border-t border-stone-700 px-3 py-2 text-sm text-stone-200">
                                {feature.FeatureText || 'No text provided.'}
                              </div>
                            </details>
                          ))}
                      </div>
                    )}

                    {activeTab === 'notes' && (
                      <div className="space-y-3">
                        <div className="rounded border border-stone-700 bg-black/30 p-3">
                          <p className="mb-2 font-semibold text-amber-200">Character Notes</p>
                          <p className="whitespace-pre-wrap text-sm text-stone-200">{character.Character_Notes || 'No notes.'}</p>
                        </div>
                        <div className="rounded border border-stone-700 bg-black/30 p-3">
                          <p className="mb-2 font-semibold text-amber-200">Background & Story</p>
                          <p className="whitespace-pre-wrap text-sm text-stone-200">{character.Backstory || character.Ideals || character.Bonds || character.Flaws || 'No story details.'}</p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
