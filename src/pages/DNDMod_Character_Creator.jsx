import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const normalizeList = (value) => String(value || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const normalizeIdList = (value) => normalizeList(value)
  .map((item) => Number(item))
  .filter((item) => !Number.isNaN(item));

const normalizeDndExtraLevelFields = (value) => {
  const list = Array.isArray(value)
    ? value
    : normalizeList(value);

  return [...new Set(list
    .map((item) => String(item || '').trim())
    .filter(Boolean))];
};

const normalizeDndExtraLevelValues = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).reduce((acc, [key, fieldValue]) => {
      const normalizedKey = String(key || '').trim();
      if (!normalizedKey) return acc;
      acc[normalizedKey] = fieldValue == null ? '' : String(fieldValue);
      return acc;
    }, {});
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return normalizeDndExtraLevelValues(parsed);
      }
    } catch {
      return {};
    }
  }

  return {};
};

const toNumericString = (value, fallback = '0') => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : String(parsed);
};

const parseIntegerOrNull = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseIntegerOrFallback = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const DND_ABILITY_STATS = ['STRENGTH', 'DEXTERITY', 'CONSTITUTION', 'INTELLIGENCE', 'WISDOM', 'CHARISMA'];
const DND_ABILITY_SHORT_LABEL = {
  STRENGTH: 'STR',
  DEXTERITY: 'DEX',
  CONSTITUTION: 'CON',
  INTELLIGENCE: 'INT',
  WISDOM: 'WIS',
  CHARISMA: 'CHA',
};
const DND_ABILITY_ALIAS = {
  STR: 'STRENGTH',
  DEX: 'DEXTERITY',
  CON: 'CONSTITUTION',
  INT: 'INTELLIGENCE',
  WIS: 'WISDOM',
  CHA: 'CHARISMA',
  STRENGTH: 'STRENGTH',
  DEXTERITY: 'DEXTERITY',
  CONSTITUTION: 'CONSTITUTION',
  INTELLIGENCE: 'INTELLIGENCE',
  WISDOM: 'WISDOM',
  CHARISMA: 'CHARISMA',
};

const normalizeDndAbilityStat = (value) => {
  const normalized = String(value || '').trim().toUpperCase();
  return DND_ABILITY_ALIAS[normalized] || '';
};

const normalizeRaceAbilityBonusRules = (value) => {
  const parsed = (() => {
    if (!value) return {};
    if (typeof value === 'string') {
      try {
        const json = JSON.parse(value);
        return json && typeof json === 'object' ? json : {};
      } catch {
        return {};
      }
    }
    return value && typeof value === 'object' ? value : {};
  })();

  const fixed = Array.isArray(parsed.fixed)
    ? parsed.fixed
      .map((entry) => ({
        stat: normalizeDndAbilityStat(entry?.stat),
        amount: parseIntegerOrFallback(entry?.amount, 0),
      }))
      .filter((entry) => entry.stat && entry.amount !== 0)
    : [];

  const choices = Array.isArray(parsed.choices)
    ? parsed.choices
      .map((entry, index) => {
        const count = Math.max(1, parseIntegerOrFallback(entry?.count, 1));
        const amount = parseIntegerOrFallback(entry?.amount, 1);
        const options = [...new Set(
          (Array.isArray(entry?.options) ? entry.options : [])
            .map((option) => normalizeDndAbilityStat(option))
            .filter(Boolean)
        )];
        return {
          id: String(entry?.id || `choice-${index + 1}`),
          count,
          amount,
          options,
        };
      })
      .filter((entry) => entry.options.length > 0 && entry.amount !== 0)
    : [];

  return { fixed, choices };
};

const raceAbilityRulesFromRow = (row) => {
  const fromRules = normalizeRaceAbilityBonusRules(row?.AbilityBonusRules);
  if (fromRules.fixed.length > 0 || fromRules.choices.length > 0) {
    return fromRules;
  }

  const legacyFixed = [
    { stat: 'STRENGTH', amount: parseIntegerOrFallback(row?.AbilityBonus_Str, 0) },
    { stat: 'DEXTERITY', amount: parseIntegerOrFallback(row?.AbilityBonus_Dex, 0) },
    { stat: 'CONSTITUTION', amount: parseIntegerOrFallback(row?.AbilityBonus_Con, 0) },
    { stat: 'INTELLIGENCE', amount: parseIntegerOrFallback(row?.AbilityBonus_Int, 0) },
    { stat: 'WISDOM', amount: parseIntegerOrFallback(row?.AbilityBonus_Wis, 0) },
    { stat: 'CHARISMA', amount: parseIntegerOrFallback(row?.AbilityBonus_Cha, 0) },
  ].filter((entry) => entry.amount !== 0);

  return {
    fixed: legacyFixed,
    choices: [],
  };
};

const calculateRaceAbilityBonuses = (rules, selections) => {
  const totals = {
    STRENGTH: 0,
    DEXTERITY: 0,
    CONSTITUTION: 0,
    INTELLIGENCE: 0,
    WISDOM: 0,
    CHARISMA: 0,
  };

  (rules?.fixed || []).forEach((entry) => {
    if (!entry?.stat || !Object.prototype.hasOwnProperty.call(totals, entry.stat)) return;
    totals[entry.stat] += parseIntegerOrFallback(entry.amount, 0);
  });

  const unresolved = [];

  (rules?.choices || []).forEach((choice) => {
    const maxPicks = Math.max(1, parseIntegerOrFallback(choice.count, 1));
    const amount = parseIntegerOrFallback(choice.amount, 0);
    const options = Array.isArray(choice.options)
      ? choice.options.map((option) => normalizeDndAbilityStat(option)).filter(Boolean)
      : [];
    const selectedRaw = Array.isArray(selections?.[choice.id]) ? selections[choice.id] : [];
    const selectedValid = [...new Set(
      selectedRaw
        .map((option) => normalizeDndAbilityStat(option))
        .filter((option) => options.includes(option))
    )].slice(0, maxPicks);

    selectedValid.forEach((stat) => {
      if (!Object.prototype.hasOwnProperty.call(totals, stat)) return;
      totals[stat] += amount;
    });

    if (selectedValid.length < maxPicks) {
      unresolved.push({
        id: choice.id,
        count: maxPicks,
        selectedCount: selectedValid.length,
      });
    }
  });

  return { totals, unresolved };
};

const normalizeRaceAbilityChoiceSelections = (value) => {
  const parsed = (() => {
    if (!value) return {};
    if (typeof value === 'string') {
      try {
        const json = JSON.parse(value);
        return json && typeof json === 'object' ? json : {};
      } catch {
        return {};
      }
    }
    return value && typeof value === 'object' ? value : {};
  })();

  return Object.entries(parsed).reduce((acc, [choiceId, selectedValues]) => {
    if (!choiceId) return acc;
    const selected = Array.isArray(selectedValues)
      ? [...new Set(selectedValues
        .map((entry) => normalizeDndAbilityStat(entry))
        .filter(Boolean))]
      : [];
    acc[String(choiceId)] = selected;
    return acc;
  }, {});
};

const buildRaceAbilityChoiceSelectionsForRules = (rules, selections) => {
  const result = {};

  (rules?.choices || []).forEach((choice) => {
    if (!choice?.id) return;
    const options = Array.isArray(choice.options)
      ? choice.options.map((option) => normalizeDndAbilityStat(option)).filter(Boolean)
      : [];
    const maxPicks = Math.max(1, parseIntegerOrFallback(choice.count, 1));
    const selectedRaw = Array.isArray(selections?.[choice.id]) ? selections[choice.id] : [];
    const selectedValid = [...new Set(
      selectedRaw
        .map((option) => normalizeDndAbilityStat(option))
        .filter((option) => options.includes(option))
    )].slice(0, maxPicks);
    result[choice.id] = selectedValid;
  });

  return result;
};

export default function DNDModCharacterCreator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dndMod = searchParams.get('mod') || '';

  const [activeSection, setActiveSection] = useState('basics');
  const [classes, setClasses] = useState([]);
  const [races, setRaces] = useState([]);
  const [backgrounds, setBackgrounds] = useState([]);
  const [dndPictures, setDndPictures] = useState([]);
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [spellOptions, setSpellOptions] = useState([]);
  const [classLevels, setClassLevels] = useState([]);
  const [classFeaturesById, setClassFeaturesById] = useState({});

  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingReferenceData, setLoadingReferenceData] = useState(false);
  const [classError, setClassError] = useState('');
  const [dataWarnings, setDataWarnings] = useState([]);

  const [expandedClassId, setExpandedClassId] = useState(null);
  const [expandedRaceId, setExpandedRaceId] = useState(null);
  const [expandedBackgroundId, setExpandedBackgroundId] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedRace, setSelectedRace] = useState(null);
  const [raceChoiceSelections, setRaceChoiceSelections] = useState({});
  const [savedRaceChoiceSelections, setSavedRaceChoiceSelections] = useState(null);
  const [selectedBackground, setSelectedBackground] = useState(null);

  const [skillChoices, setSkillChoices] = useState([]);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState([]);
  const [selectedSpellIds, setSelectedSpellIds] = useState([]);

  const [initials, setInitials] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [classLevel, setClassLevel] = useState('1');
  const [alignment, setAlignment] = useState('');
  const [experience, setExperience] = useState('0');
  const [maxHp, setMaxHp] = useState('');
  const [currentHp, setCurrentHp] = useState('');
  const [tempHp, setTempHp] = useState('0');
  const [armorClass, setArmorClass] = useState('');
  const [initiativeBonus, setInitiativeBonus] = useState('0');
  const [speedOverride, setSpeedOverride] = useState('');
  const [inspiration, setInspiration] = useState(false);
  const [passivePerception, setPassivePerception] = useState('10');

  const [inventoryText, setInventoryText] = useState('');
  const [personalityTraits, setPersonalityTraits] = useState('');
  const [ideals, setIdeals] = useState('');
  const [bonds, setBonds] = useState('');
  const [flaws, setFlaws] = useState('');
  const [backstory, setBackstory] = useState('');
  const [characterNotes, setCharacterNotes] = useState('');

  const [cp, setCp] = useState('0');
  const [sp, setSp] = useState('0');
  const [ep, setEp] = useState('0');
  const [gp, setGp] = useState('0');
  const [pp, setPp] = useState('0');

  const [statValues, setStatValues] = useState({
    STRENGTH: '8',
    DEXTERITY: '8',
    CONSTITUTION: '8',
    INTELLIGENCE: '8',
    WISDOM: '8',
    CHARISMA: '8',
  });
  const [ttrpgId, setTtrpgId] = useState(null);
  const [editingClassId, setEditingClassId] = useState(null);
  const [editingRaceId, setEditingRaceId] = useState(null);
  const [editingBackgroundId, setEditingBackgroundId] = useState(null);
  const [isInitializingFromEdit, setIsInitializingFromEdit] = useState(false);

  const matchesMod = useCallback((rowModValue) => {
    if (!dndMod) return true;
    const target = dndMod.trim().toLowerCase();
    if (!target) return true;
    const values = normalizeList(rowModValue).map((entry) => entry.toLowerCase());
    if (values.length === 0) {
      const raw = String(rowModValue || '').trim().toLowerCase();
      if (!raw) return true;
      return raw.includes(target);
    }
    return values.includes(target);
  }, [dndMod]);

  const parseSkillChoices = (skillsText) => {
    if (!skillsText) return { isChoice: false, count: 0, options: [], raw: '' };

    const chooseMatch = /choose\s+(\w+)\s+from\s+(.+)$/i.exec(skillsText);

    if (!chooseMatch) return { isChoice: false, count: 0, options: [], raw: skillsText };

    const numberWord = chooseMatch[1].toLowerCase();
    const numberMap = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };
    const count = numberMap[numberWord] || 2;

    const optionsText = chooseMatch[2];
    const options = optionsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const uniqueOptions = [...new Set(options)];

    return { isChoice: uniqueOptions.length > 0, count, options: uniqueOptions, raw: skillsText };
  };

  const loadClasses = useCallback(async () => {
    setLoadingClasses(true);
    setClassError('');
    try {
      const classesWithExtras = await supabase
        .from('DND_Classes')
        .select('id, ClassName, DNDMod, Description, HitDice, Prof_Armour, Prof_Weapons, Prof_SavingThrows, Prof_Skills, PointsName, ExtraLevelFields');

      let classRows = [];
      if (classesWithExtras.error) {
        const classesFallback = await supabase
          .from('DND_Classes')
          .select('id, ClassName, DNDMod, Description, HitDice, Prof_Armour, Prof_Weapons, Prof_SavingThrows, Prof_Skills, PointsName');
        if (classesFallback.error) throw classesFallback.error;
        classRows = classesFallback.data || [];
      } else {
        classRows = classesWithExtras.data || [];
      }

      const filtered = classRows.filter((row) => matchesMod(row.DNDMod));

      setClasses(filtered.map((row) => ({
        id: row.id,
        name: row.ClassName || 'Unnamed Class',
        description: row.Description || '',
        hitDice: row.HitDice || '',
        profArmour: row.Prof_Armour || '',
        profWeapons: row.Prof_Weapons || '',
        profSavingThrows: row.Prof_SavingThrows || '',
        profSkills: row.Prof_Skills || '',
        pointsName: row.PointsName || 'Class Points',
        extraLevelFields: normalizeDndExtraLevelFields(row.ExtraLevelFields),
      })));
    } catch (err) {
      console.error('Failed to load classes:', err);
      setClassError('Failed to load classes. Please try again.');
    } finally {
      setLoadingClasses(false);
    }
  }, [matchesMod]);

  const loadReferenceData = useCallback(async () => {
    setLoadingReferenceData(true);
    const warnings = [];

    try {
      const raceWithRules = await supabase
        .from('DND_Races')
        .select('id, RaceName, DNDMod, Description, Size, Speed, Languages, Traits, AbilityBonusRules, AbilityBonus_Str, AbilityBonus_Dex, AbilityBonus_Con, AbilityBonus_Int, AbilityBonus_Wis, AbilityBonus_Cha');

      let raceRows = [];
      if (raceWithRules.error) {
        const raceFallback = await supabase
          .from('DND_Races')
          .select('id, RaceName, DNDMod, Description, Size, Speed, Languages, Traits, AbilityBonus_Str, AbilityBonus_Dex, AbilityBonus_Con, AbilityBonus_Int, AbilityBonus_Wis, AbilityBonus_Cha');
        if (raceFallback.error) {
          warnings.push('DND_Races table is missing or unavailable.');
        } else {
          raceRows = raceFallback.data || [];
        }
      } else {
        raceRows = raceWithRules.data || [];
      }

      const [backgroundResult, equipmentResult, spellResult, pictureResult] = await Promise.all([
        supabase
          .from('DND_Backgrounds')
          .select('id, BackgroundName, DNDMod, Description, SkillProficiencies, ToolProficiencies, Languages, FeatureName, FeatureText, StartingEquipment'),
        supabase
          .from('DND_Equipment')
          .select('id, ItemName, DNDMod, Category, Description, Cost, Weight, Properties, Damage, DamageType, ArmorClass, AllowedClasses'),
        supabase
          .from('DND_Spells')
          .select('id, SpellName, DNDMod, SpellLevel, School, CastingTime, Range, Components, Duration, Description, ClassList'),
        supabase
          .from('DND_Pictures')
          .select('id, PictureID, Class, Race, DNDMod'),
      ]);

      if (raceRows.length > 0) {
        const filteredRaceRows = raceRows.filter((row) => matchesMod(row.DNDMod));
        setRaces(filteredRaceRows.map((row) => ({
          id: row.id,
          name: row.RaceName || 'Unnamed Race',
          description: row.Description || '',
          size: row.Size || '',
          speed: row.Speed != null ? String(row.Speed) : '',
          languages: row.Languages || '',
          traits: row.Traits || '',
          abilityBonusRules: raceAbilityRulesFromRow(row),
        })));
      } else {
        setRaces([]);
      }

      if (backgroundResult.error) {
        warnings.push('DND_Backgrounds table is missing or unavailable.');
      } else {
        const backgroundRows = (backgroundResult.data || []).filter((row) => matchesMod(row.DNDMod));
        setBackgrounds(backgroundRows.map((row) => ({
          id: row.id,
          name: row.BackgroundName || 'Unnamed Background',
          description: row.Description || '',
          skillProficiencies: row.SkillProficiencies || '',
          toolProficiencies: row.ToolProficiencies || '',
          languages: row.Languages || '',
          featureName: row.FeatureName || '',
          featureText: row.FeatureText || '',
          startingEquipment: row.StartingEquipment || '',
        })));
      }

      if (equipmentResult.error) {
        warnings.push('DND_Equipment table is missing or unavailable.');
      } else {
        const equipmentRows = (equipmentResult.data || []).filter((row) => matchesMod(row.DNDMod));
        setEquipmentOptions(equipmentRows.map((row) => ({
          id: row.id,
          name: row.ItemName || 'Unnamed Item',
          category: row.Category || '',
          description: row.Description || '',
          cost: row.Cost || '',
          weight: row.Weight || '',
          properties: row.Properties || '',
          damage: row.Damage || '',
          damageType: row.DamageType || '',
          armorClass: row.ArmorClass || '',
          allowedClasses: row.AllowedClasses || '',
        })));
      }

      if (spellResult.error) {
        warnings.push('DND_Spells table is missing or unavailable.');
      } else {
        const spellRows = (spellResult.data || []).filter((row) => matchesMod(row.DNDMod));
        setSpellOptions(spellRows.map((row) => ({
          id: row.id,
          name: row.SpellName || 'Unnamed Spell',
          spellLevel: parseIntegerOrFallback(row.SpellLevel, 0),
          school: row.School || '',
          castingTime: row.CastingTime || '',
          range: row.Range || '',
          components: row.Components || '',
          duration: row.Duration || '',
          description: row.Description || '',
          classList: row.ClassList || '',
        })));
      }

      if (pictureResult.error) {
        warnings.push('DND_Pictures table is missing or unavailable.');
      } else {
        const pictureRows = (pictureResult.data || []).filter((row) => matchesMod(row.DNDMod));
        setDndPictures(pictureRows.map((row) => ({
          id: row.id,
          pictureId: parseIntegerOrFallback(row.PictureID, 0),
          classId: parseIntegerOrFallback(row.Class, 0),
          raceId: parseIntegerOrFallback(row.Race, 0),
        })).filter((row) => row.pictureId > 0));
      }
    } finally {
      setDataWarnings(warnings);
      setLoadingReferenceData(false);
    }
  }, [matchesMod]);

  const loadClassProgression = useCallback(async (classId) => {
    if (!classId) {
      setClassLevels([]);
      return;
    }

    try {
      const [featureResult, levelsWithExtras] = await Promise.all([
        supabase
          .from('DND_ClassFeatures')
          .select('id, FeatureName, FeatureText'),
        supabase
          .from('DND_Class_Levels')
          .select('Level, ProfBonus, Features, Cantrips, SpellsKnown, Points, ExtraValues')
          .eq('Class', classId)
          .order('Level', { ascending: true }),
      ]);

      if (featureResult.error) throw featureResult.error;

      let levelRows = [];
      if (levelsWithExtras.error) {
        const levelsFallback = await supabase
          .from('DND_Class_Levels')
          .select('Level, ProfBonus, Features, Cantrips, SpellsKnown, Points')
          .eq('Class', classId)
          .order('Level', { ascending: true });
        if (levelsFallback.error) throw levelsFallback.error;
        levelRows = levelsFallback.data || [];
      } else {
        levelRows = levelsWithExtras.data || [];
      }

      const featureMap = {};
      (featureResult.data || []).forEach((feature) => {
        featureMap[feature.id] = {
          name: feature.FeatureName || 'Unnamed Feature',
          text: feature.FeatureText || '',
        };
      });

      setClassFeaturesById(featureMap);
      setClassLevels(levelRows.map((row) => ({
        ...row,
        ExtraValues: normalizeDndExtraLevelValues(row.ExtraValues),
      })));
    } catch (err) {
      console.error('Failed to load class progression:', err);
      setClassLevels([]);
    }
  }, []);

  useEffect(() => {
    if (!dndMod) return;
    loadClasses();
    loadReferenceData();
  }, [dndMod, loadClasses, loadReferenceData]);

  useEffect(() => {
    if (editingClassId && classes.length === 0) {
      loadClasses();
    }
  }, [editingClassId, classes.length, loadClasses]);

  useEffect(() => {
    if (!selectedClass?.id) {
      setClassLevels([]);
      return;
    }
    loadClassProgression(selectedClass.id);
  }, [selectedClass?.id, loadClassProgression]);

  useEffect(() => {
    if (isInitializingFromEdit) {
      setIsInitializingFromEdit(false);
      return;
    }
    setSkillChoices([]);
  }, [selectedClass?.id, isInitializingFromEdit]);

  useEffect(() => {
    const fetchInitials = async () => {
      if (!dndMod) return;
      try {
        const { data, error } = await supabase
          .from('TTRPGs')
          .select('Initials, id')
          .eq('TTRPG_name', dndMod)
          .single();

        if (!error && data) {
          setInitials(data.Initials);
          setTtrpgId(data.id);
        }
      } catch (err) {
        console.error('Failed to fetch initials:', err);
      }
    };

    fetchInitials();
  }, [dndMod]);

  useEffect(() => {
    const loadedCharacterId = localStorage.getItem('loadedCharacterId');
    if (!loadedCharacterId) return;

    const fetchCharacter = async () => {
      try {
        const { data, error } = await supabase
          .from('DND_player_character')
          .select('*')
          .eq('id', parseInt(loadedCharacterId, 10))
          .single();

        if (error) throw error;

        setCharacterName(data?.Name || '');
        setEditingClassId(data?.Class ?? null);
        setEditingRaceId(data?.Race ?? null);
        setEditingBackgroundId(data?.Background ?? null);
        setClassLevel(data?.ClassLevel ? String(data.ClassLevel) : '1');
        setAlignment(data?.Alignment || '');
        setExperience(toNumericString(data?.Experience, '0'));

        setMaxHp(toNumericString(data?.MaxHP, ''));
        setCurrentHp(toNumericString(data?.CurrentHP, ''));
        setTempHp(toNumericString(data?.TempHP, '0'));
        setArmorClass(toNumericString(data?.ArmorClass, ''));
        setInitiativeBonus(toNumericString(data?.InitiativeBonus, '0'));
        setSpeedOverride(toNumericString(data?.Speed, ''));
        setPassivePerception(toNumericString(data?.PassivePerception, '10'));
        setInspiration(Boolean(data?.Inspiration));

        setInventoryText(data?.Inventory || '');
        setPersonalityTraits(data?.PersonalityTraits || '');
        setIdeals(data?.Ideals || '');
        setBonds(data?.Bonds || '');
        setFlaws(data?.Flaws || '');
        setBackstory(data?.Backstory || '');
        setCharacterNotes(data?.Character_Notes || '');

        setCp(toNumericString(data?.Money_CP, '0'));
        setSp(toNumericString(data?.Money_SP, '0'));
        setEp(toNumericString(data?.Money_EP, '0'));
        setGp(toNumericString(data?.Money_GP, '0'));
        setPp(toNumericString(data?.Money_PP, '0'));

        setSelectedEquipmentIds(normalizeIdList(data?.Known_Equipment));
        setSelectedSpellIds(normalizeIdList(data?.Known_Spells));
        setSavedRaceChoiceSelections(normalizeRaceAbilityChoiceSelections(data?.RaceAbilityChoices));

        setIsInitializingFromEdit(true);
        setStatValues({
          STRENGTH: String(data?.Str ?? 8),
          DEXTERITY: String(data?.Dex ?? 8),
          CONSTITUTION: String(data?.Con ?? 8),
          INTELLIGENCE: String(data?.Int ?? 8),
          WISDOM: String(data?.Wis ?? 8),
          CHARISMA: String(data?.Cha ?? 8),
        });

        const profSkills = String(data?.Class_ProfSkills || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        setSkillChoices(profSkills);

        setActiveSection('class');
      } catch (err) {
        console.error('Failed to load character for edit:', err);
      }
    };

    fetchCharacter();
  }, [dndMod]);

  useEffect(() => {
    if (!editingClassId || classes.length === 0) return;
    const found = classes.find((c) => c.id === editingClassId);
    if (found) {
      setSelectedClass(found);
    }
  }, [editingClassId, classes]);

  useEffect(() => {
    if (!editingRaceId || races.length === 0) return;
    const found = races.find((race) => race.id === editingRaceId);
    if (found) {
      setSelectedRace(found);
    }
  }, [editingRaceId, races]);

  useEffect(() => {
    if (!selectedRace) {
      setRaceChoiceSelections({});
      return;
    }

    const choiceRules = selectedRace.abilityBonusRules?.choices || [];
    setRaceChoiceSelections((prev) => {
      const sourceSelections = savedRaceChoiceSelections && typeof savedRaceChoiceSelections === 'object'
        ? savedRaceChoiceSelections
        : prev;
      const next = {};
      choiceRules.forEach((choice) => {
        const options = Array.isArray(choice.options) ? choice.options : [];
        const selected = Array.isArray(sourceSelections?.[choice.id]) ? sourceSelections[choice.id] : [];
        next[choice.id] = [...new Set(
          selected
            .map((value) => normalizeDndAbilityStat(value))
            .filter((value) => options.includes(value))
        )].slice(0, Math.max(1, parseIntegerOrFallback(choice.count, 1)));
      });
      return next;
    });
    if (savedRaceChoiceSelections != null) {
      setSavedRaceChoiceSelections(null);
    }
  }, [selectedRace, savedRaceChoiceSelections]);

  useEffect(() => {
    if (!editingBackgroundId || backgrounds.length === 0) return;
    const found = backgrounds.find((background) => background.id === editingBackgroundId);
    if (found) {
      setSelectedBackground(found);
    }
  }, [editingBackgroundId, backgrounds]);

  const statsList = DND_ABILITY_STATS;
  const statColumnMap = {
    STRENGTH: 'Str',
    DEXTERITY: 'Dex',
    CONSTITUTION: 'Con',
    INTELLIGENCE: 'Int',
    WISDOM: 'Wis',
    CHARISMA: 'Cha',
  };

  const alignmentOptions = [
    'Lawful Good',
    'Neutral Good',
    'Chaotic Good',
    'Lawful Neutral',
    'True Neutral',
    'Chaotic Neutral',
    'Lawful Evil',
    'Neutral Evil',
    'Chaotic Evil',
    'Unaligned',
  ];

  const pointCosts = {
    '8': 0,
    '9': 1,
    '10': 2,
    '11': 3,
    '12': 4,
    '13': 5,
    '14': 7,
    '15': 9,
  };

  const calculatePointsRemaining = () => {
    let pointsSpent = 0;
    Object.values(statValues).forEach((value) => {
      pointsSpent += pointCosts[value] || 0;
    });
    return 27 - pointsSpent;
  };

  const selectedClassLevelData = classLevels.find((row) => String(row.Level) === String(classLevel)) || null;
  const selectedClassLevelNumber = Math.max(1, parseIntegerOrFallback(classLevel, 1));
  const selectedClassFeatureIds = classLevels
    .filter((row) => parseIntegerOrFallback(row.Level, 0) <= selectedClassLevelNumber)
    .flatMap((row) => normalizeIdList(row?.Features));
  const uniqueSelectedClassFeatureIds = [...new Set(selectedClassFeatureIds)];
  const selectedClassFeatures = uniqueSelectedClassFeatureIds
    .map((featureId) => ({ id: featureId, ...classFeaturesById[featureId] }))
    .filter((feature) => Boolean(feature.name));
  const selectedClassExtraFieldNames = selectedClass?.extraLevelFields || [];
  const selectedClassExtraValues = normalizeDndExtraLevelValues(selectedClassLevelData?.ExtraValues);
  const selectedClassExtraEntries = selectedClassExtraFieldNames.map((fieldName) => ({
    fieldName,
    value: selectedClassExtraValues[fieldName] || '—',
  }));

  const selectedRaceAbilityRules = selectedRace?.abilityBonusRules || { fixed: [], choices: [] };
  const raceAbilityBonusState = calculateRaceAbilityBonuses(selectedRaceAbilityRules, raceChoiceSelections);
  const raceAbilityRuleDescriptions = [
    ...selectedRaceAbilityRules.fixed.map((entry) => (
      `${DND_ABILITY_SHORT_LABEL[entry.stat]} ${entry.amount >= 0 ? '+' : ''}${entry.amount}`
    )),
    ...selectedRaceAbilityRules.choices.map((choice) => (
      `Choose ${choice.count} from ${choice.options.map((stat) => DND_ABILITY_SHORT_LABEL[stat]).join('/')} ${choice.amount >= 0 ? `(+${choice.amount} each)` : `(${choice.amount} each)`}`
    )),
  ];
  const raceBonusTotalsDescription = statsList
    .filter((stat) => (raceAbilityBonusState.totals[stat] || 0) !== 0)
    .map((stat) => `${DND_ABILITY_SHORT_LABEL[stat]} ${raceAbilityBonusState.totals[stat] >= 0 ? '+' : ''}${raceAbilityBonusState.totals[stat]}`)
    .join(', ');

  const raceAbilityBonus = (statName) => raceAbilityBonusState.totals?.[statName] || 0;

  const selectedDndPicture = (() => {
    if (!Array.isArray(dndPictures) || dndPictures.length === 0) return null;

    const selectedClassId = parseIntegerOrFallback(selectedClass?.id, 0);
    const selectedRaceId = parseIntegerOrFallback(selectedRace?.id, 0);

    if (selectedClassId > 0 && selectedRaceId > 0) {
      const exact = dndPictures.find((row) => row.classId === selectedClassId && row.raceId === selectedRaceId);
      if (exact) return exact;
    }

    if (selectedRaceId > 0) {
      const raceMatch = dndPictures.find((row) => row.raceId === selectedRaceId);
      if (raceMatch) return raceMatch;
    }

    if (selectedClassId > 0) {
      const classMatch = dndPictures.find((row) => row.classId === selectedClassId);
      if (classMatch) return classMatch;
    }

    return null;
  })();

  const totalStatValue = (statName) => {
    const baseValue = parseIntegerOrFallback(statValues[statName], 8);
    return baseValue + raceAbilityBonus(statName);
  };

  const abilityModifier = (score) => Math.floor((score - 10) / 2);

  const spellById = spellOptions.reduce((acc, spell) => {
    acc[spell.id] = spell;
    return acc;
  }, {});

  const filteredSpellOptions = spellOptions.filter((spell) => {
    if (!selectedClass) return true;
    const allowedClasses = normalizeList(spell.classList).map((item) => item.toLowerCase());
    if (allowedClasses.length === 0) return true;
    return allowedClasses.includes(selectedClass.name.toLowerCase());
  });

  const cantripLimit = parseIntegerOrFallback(selectedClassLevelData?.Cantrips, 0);
  const spellsKnownLimit = parseIntegerOrFallback(selectedClassLevelData?.SpellsKnown, 0);

  const countSelectedCantrips = selectedSpellIds.filter((id) => (spellById[id]?.spellLevel || 0) === 0).length;
  const countSelectedLeveledSpells = selectedSpellIds.filter((id) => (spellById[id]?.spellLevel || 0) > 0).length;

  const toggleEquipment = (equipmentId) => {
    setSelectedEquipmentIds((prev) => (
      prev.includes(equipmentId)
        ? prev.filter((id) => id !== equipmentId)
        : [...prev, equipmentId]
    ));
  };

  const toggleRaceChoiceOption = (choice, stat) => {
    const normalizedStat = normalizeDndAbilityStat(stat);
    if (!choice?.id || !normalizedStat) return;

    const maxPicks = Math.max(1, parseIntegerOrFallback(choice.count, 1));
    setRaceChoiceSelections((prev) => {
      const current = Array.isArray(prev?.[choice.id]) ? prev[choice.id] : [];
      const exists = current.includes(normalizedStat);

      if (exists) {
        return {
          ...prev,
          [choice.id]: current.filter((item) => item !== normalizedStat),
        };
      }

      if (current.length >= maxPicks) {
        return prev;
      }

      return {
        ...prev,
        [choice.id]: [...current, normalizedStat],
      };
    });
  };

  const toggleSpell = (spellId) => {
    setSelectedSpellIds((prev) => {
      if (prev.includes(spellId)) {
        return prev.filter((id) => id !== spellId);
      }

      const spell = spellById[spellId];
      if (!spell) return prev;

      if (spell.spellLevel === 0 && cantripLimit > 0 && countSelectedCantrips >= cantripLimit) {
        alert(`You can only pick ${cantripLimit} cantrip${cantripLimit === 1 ? '' : 's'} at this class level.`);
        return prev;
      }
      if (spell.spellLevel > 0 && spellsKnownLimit > 0 && countSelectedLeveledSpells >= spellsKnownLimit) {
        alert(`You can only pick ${spellsKnownLimit} known spell${spellsKnownLimit === 1 ? '' : 's'} at this class level.`);
        return prev;
      }

      return [...prev, spellId];
    });
  };

  const isMissingCharacterColumnError = (error) => {
    const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
    return message.includes('column') && message.includes('dnd_player_character');
  };

  const isMissingRaceAbilityChoicesColumnError = (error) => {
    const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
    return message.includes('column') && message.includes('raceabilitychoices');
  };

  const saveCharacter = async () => {
    if (!characterName.trim()) {
      alert('Please enter a character name.');
      return;
    }
    if (!selectedClass) {
      alert('Please select a class.');
      return;
    }
    if (raceAbilityBonusState.unresolved.length > 0) {
      alert('Please finish selecting your race ability score choices before saving.');
      return;
    }
    if (!ttrpgId) {
      alert('TTRPG information not loaded. Please try again.');
      return;
    }

    const profSkills = skillChoices.filter(Boolean).join(', ');
    const loadedCharacterId = localStorage.getItem('loadedCharacterId');
    const userId = localStorage.getItem('userId');
    const raceAbilityChoicesForSave = selectedRace
      ? buildRaceAbilityChoiceSelectionsForRules(selectedRaceAbilityRules, raceChoiceSelections)
      : null;

    const baseCharacterData = {
      Name: characterName,
      Class: selectedClass.id,
      ClassLevel: parseInt(classLevel, 10),
      Class_ProfSkills: profSkills,
      TTRPG: ttrpgId,
      User_ID: userId ? parseInt(userId, 10) : null,
      Str: parseIntegerOrFallback(statValues.STRENGTH, 8),
      Dex: parseIntegerOrFallback(statValues.DEXTERITY, 8),
      Con: parseIntegerOrFallback(statValues.CONSTITUTION, 8),
      Int: parseIntegerOrFallback(statValues.INTELLIGENCE, 8),
      Wis: parseIntegerOrFallback(statValues.WISDOM, 8),
      Cha: parseIntegerOrFallback(statValues.CHARISMA, 8),
    };

    const extendedCharacterData = {
      Race: selectedRace?.id || null,
      Background: selectedBackground?.id || null,
      Alignment: alignment || null,
      Experience: parseIntegerOrNull(experience),
      MaxHP: parseIntegerOrNull(maxHp),
      CurrentHP: parseIntegerOrNull(currentHp),
      TempHP: parseIntegerOrNull(tempHp),
      ArmorClass: parseIntegerOrNull(armorClass),
      InitiativeBonus: parseIntegerOrNull(initiativeBonus),
      Speed: parseIntegerOrNull(speedOverride || selectedRace?.speed),
      Inspiration: inspiration,
      PassivePerception: parseIntegerOrNull(passivePerception),
      Inventory: inventoryText || null,
      Known_Equipment: selectedEquipmentIds.length > 0 ? selectedEquipmentIds.join(', ') : null,
      Known_Spells: selectedSpellIds.length > 0 ? selectedSpellIds.join(', ') : null,
      RaceAbilityChoices: raceAbilityChoicesForSave,
      PersonalityTraits: personalityTraits || null,
      Ideals: ideals || null,
      Bonds: bonds || null,
      Flaws: flaws || null,
      Backstory: backstory || null,
      Character_Notes: characterNotes || null,
      Money_CP: parseIntegerOrNull(cp),
      Money_SP: parseIntegerOrNull(sp),
      Money_EP: parseIntegerOrNull(ep),
      Money_GP: parseIntegerOrNull(gp),
      Money_PP: parseIntegerOrNull(pp),
    };

    const fullCharacterData = { ...baseCharacterData, ...extendedCharacterData };
    const { RaceAbilityChoices: _RaceAbilityChoices, ...extendedCharacterDataWithoutRaceAbilityChoices } = extendedCharacterData;
    const fullCharacterDataWithoutRaceAbilityChoices = {
      ...baseCharacterData,
      ...extendedCharacterDataWithoutRaceAbilityChoices,
    };

    try {
      let error;
      let usedFallbackSchema = false;
      let usedRaceChoiceColumnFallback = false;

      if (loadedCharacterId) {
        const { error: updateError } = await supabase
          .from('DND_player_character')
          .update(fullCharacterData)
          .eq('id', parseInt(loadedCharacterId, 10));

        if (updateError && isMissingRaceAbilityChoicesColumnError(updateError)) {
          usedRaceChoiceColumnFallback = true;
          const { error: retryUpdateError } = await supabase
            .from('DND_player_character')
            .update(fullCharacterDataWithoutRaceAbilityChoices)
            .eq('id', parseInt(loadedCharacterId, 10));

          if (retryUpdateError && isMissingCharacterColumnError(retryUpdateError)) {
            usedFallbackSchema = true;
            const { error: fallbackError } = await supabase
              .from('DND_player_character')
              .update(baseCharacterData)
              .eq('id', parseInt(loadedCharacterId, 10));
            error = fallbackError;
          } else {
            error = retryUpdateError;
          }
        } else if (updateError && isMissingCharacterColumnError(updateError)) {
          usedFallbackSchema = true;
          const { error: fallbackError } = await supabase
            .from('DND_player_character')
            .update(baseCharacterData)
            .eq('id', parseInt(loadedCharacterId, 10));
          error = fallbackError;
        } else {
          error = updateError;
        }
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from('DND_player_character')
          .insert([fullCharacterData])
          .select('id')
          .single();

        if (insertError && isMissingRaceAbilityChoicesColumnError(insertError)) {
          usedRaceChoiceColumnFallback = true;
          const { data: retryInsertData, error: retryInsertError } = await supabase
            .from('DND_player_character')
            .insert([fullCharacterDataWithoutRaceAbilityChoices])
            .select('id')
            .single();

          if (retryInsertError && isMissingCharacterColumnError(retryInsertError)) {
            usedFallbackSchema = true;
            const { data: fallbackInsertData, error: fallbackInsertError } = await supabase
              .from('DND_player_character')
              .insert([baseCharacterData])
              .select('id')
              .single();
            error = fallbackInsertError;
            if (!fallbackInsertError && fallbackInsertData?.id != null) {
              localStorage.setItem('loadedCharacterId', String(fallbackInsertData.id));
            }
          } else {
            error = retryInsertError;
            if (!retryInsertError && retryInsertData?.id != null) {
              localStorage.setItem('loadedCharacterId', String(retryInsertData.id));
            }
          }
        } else if (insertError && isMissingCharacterColumnError(insertError)) {
          usedFallbackSchema = true;
          const { data: fallbackInsertData, error: fallbackInsertError } = await supabase
            .from('DND_player_character')
            .insert([baseCharacterData])
            .select('id')
            .single();
          error = fallbackInsertError;
          if (!fallbackInsertError && fallbackInsertData?.id != null) {
            localStorage.setItem('loadedCharacterId', String(fallbackInsertData.id));
          }
        } else {
          error = insertError;
          if (!insertError && insertData?.id != null) {
            localStorage.setItem('loadedCharacterId', String(insertData.id));
          }
        }
      }

      if (error) throw error;

      if (usedFallbackSchema) {
        alert('Character saved with base fields only. Run the DND migration to store race/background/spells/equipment and notes.');
      } else if (usedRaceChoiceColumnFallback) {
        alert('Character saved, but race choice selections require the latest DND migration to persist.');
      } else {
        alert('Character saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save character:', err);
      alert('Failed to save character. Please try again.');
    }
  };

  const SectionButton = ({ sectionKey, label }) => (
    <button
      onClick={() => setActiveSection(sectionKey)}
      className={`px-4 py-2 rounded-lg font-semibold shadow transition ${
        activeSection === sectionKey
          ? 'bg-red-600 text-white hover:bg-red-700'
          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
        <div className="flex flex-col items-center gap-6">
          {initials && (
            <img
              src={`/${initials}_Pictures/Logo.png`}
              alt={`${dndMod} Logo`}
              className="w-64 h-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}

          <div className="w-full max-w-xl rounded-lg border p-4 bg-blue-50 border-blue-300">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-800" htmlFor="character-name">
                  Character Name
                </label>
                <input
                  id="character-name"
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  className="mt-2 w-full box-border rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Enter character name"
                />
              </div>
              <div className="w-full sm:w-52">
                <label className="block text-sm font-bold text-gray-800">Alignment</label>
                <select
                  value={alignment}
                  onChange={(e) => setAlignment(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Select alignment</option>
                  {alignmentOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {(classError || dataWarnings.length > 0) && (
            <div className="w-full max-w-xl rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              {classError && <p>{classError}</p>}
              {dataWarnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          )}

          <button
            onClick={() => navigate('/select-ttrpg')}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold shadow hover:bg-black transition"
          >
            Select TTRPG
          </button>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <SectionButton sectionKey="basics" label="Basics" />
            <SectionButton sectionKey="race" label="Race" />
            <SectionButton sectionKey="background" label="Background" />
            <SectionButton sectionKey="class" label="Class" />
            <SectionButton sectionKey="stats" label="Stats" />
            <SectionButton sectionKey="gear" label="Gear & Spells" />
            <SectionButton sectionKey="notes" label="Notes" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={saveCharacter}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition"
            >
              Save
            </button>
          </div>

          {activeSection === 'basics' && (
            <div className="w-full max-w-3xl rounded-lg border border-gray-300 bg-white p-4 space-y-3">
              <h2 className="text-2xl font-bold text-gray-800">Basics ({dndMod})</h2>
              {loadingReferenceData && (
                <p className="text-sm text-gray-600">Loading mod data...</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Experience</label>
                  <input
                    type="number"
                    min="0"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Passive Perception</label>
                  <input
                    type="number"
                    min="0"
                    value={passivePerception}
                    onChange={(e) => setPassivePerception(e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Max HP</label>
                  <input
                    type="number"
                    min="0"
                    value={maxHp}
                    onChange={(e) => setMaxHp(e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Current HP</label>
                  <input
                    type="number"
                    min="0"
                    value={currentHp}
                    onChange={(e) => setCurrentHp(e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Temp HP</label>
                  <input
                    type="number"
                    min="0"
                    value={tempHp}
                    onChange={(e) => setTempHp(e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Armor Class</label>
                  <input
                    type="number"
                    min="0"
                    value={armorClass}
                    onChange={(e) => setArmorClass(e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Initiative Bonus</label>
                  <input
                    type="number"
                    value={initiativeBonus}
                    onChange={(e) => setInitiativeBonus(e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Speed</label>
                  <input
                    type="number"
                    min="0"
                    value={speedOverride}
                    onChange={(e) => setSpeedOverride(e.target.value)}
                    placeholder={selectedRace?.speed ? `Race default: ${selectedRace.speed}` : 'e.g. 30'}
                    className="w-full rounded border border-gray-300 px-2 py-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">CP</label>
                  <input type="number" value={cp} onChange={(e) => setCp(e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">SP</label>
                  <input type="number" value={sp} onChange={(e) => setSp(e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">EP</label>
                  <input type="number" value={ep} onChange={(e) => setEp(e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">GP</label>
                  <input type="number" value={gp} onChange={(e) => setGp(e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">PP</label>
                  <input type="number" value={pp} onChange={(e) => setPp(e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1" />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
                <input
                  type="checkbox"
                  checked={inspiration}
                  onChange={(e) => setInspiration(e.target.checked)}
                />
                Inspiration
              </label>
            </div>
          )}

          {activeSection === 'race' && (
            <div className="w-full max-w-3xl rounded-lg border border-gray-300 bg-white p-4 space-y-3">
              <h2 className="text-2xl font-bold text-gray-800">Race ({dndMod})</h2>
              {selectedRace ? (
                <div className="rounded border border-gray-300 p-3 bg-gray-50 text-sm text-gray-800 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {selectedDndPicture && (
                        <img
                          src={`/F_Pictures/Picture ${selectedDndPicture.pictureId} Face.png`}
                          alt={`Race portrait ${selectedDndPicture.pictureId}`}
                          className="rounded"
                          style={{
                            width: '40px',
                            height: '40px',
                            objectFit: 'cover',
                            border: 'none',
                            borderRadius: '4px',
                            display: 'block',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <h3 className="text-xl font-bold truncate">{selectedRace.name}</h3>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedRace(null);
                        setRaceChoiceSelections({});
                      }}
                      className="px-3 py-1 text-xs rounded bg-gray-300 hover:bg-gray-400"
                    >
                      Change Race
                    </button>
                  </div>
                  {selectedRace.description && <p className="whitespace-pre-wrap">{selectedRace.description}</p>}
                  <p><span className="font-semibold">Size:</span> {selectedRace.size || '—'}</p>
                  <p><span className="font-semibold">Speed:</span> {selectedRace.speed || '—'}</p>
                  <p><span className="font-semibold">Languages:</span> {selectedRace.languages || '—'}</p>
                  <p><span className="font-semibold">Traits:</span> {selectedRace.traits || '—'}</p>
                  <div>
                    <p className="font-semibold">Ability Bonuses</p>
                    {raceAbilityRuleDescriptions.length === 0 && (
                      <p>No racial ability bonuses.</p>
                    )}
                    {raceAbilityRuleDescriptions.length > 0 && (
                      <ul className="list-disc pl-5">
                        {raceAbilityRuleDescriptions.map((line, index) => (
                          <li key={`race-rule-${index}`}>{line}</li>
                        ))}
                      </ul>
                    )}
                    {selectedRaceAbilityRules.choices.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {selectedRaceAbilityRules.choices.map((choice) => (
                          <div key={`race-choice-${choice.id}`} className="rounded border border-gray-300 bg-white p-2">
                            <p className="font-semibold text-xs">
                              Choose {choice.count} from {choice.options.map((stat) => DND_ABILITY_SHORT_LABEL[stat]).join(', ')}
                              {' '}({choice.amount >= 0 ? '+' : ''}{choice.amount} each)
                            </p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {choice.options.map((stat) => {
                                const selected = Array.isArray(raceChoiceSelections[choice.id])
                                  && raceChoiceSelections[choice.id].includes(stat);
                                const isMaxed = Array.isArray(raceChoiceSelections[choice.id])
                                  && raceChoiceSelections[choice.id].length >= choice.count
                                  && !selected;

                                return (
                                  <label key={`${choice.id}-${stat}`} className="inline-flex items-center gap-1 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      disabled={isMaxed}
                                      onChange={() => toggleRaceChoiceOption(choice, stat)}
                                    />
                                    {DND_ABILITY_SHORT_LABEL[stat]}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {raceBonusTotalsDescription && (
                      <p className="mt-2 text-xs text-gray-700">Applied: {raceBonusTotalsDescription}</p>
                    )}
                    {raceAbilityBonusState.unresolved.length > 0 && (
                      <p className="mt-1 text-xs text-amber-700">Complete all race ability choices to apply full bonuses.</p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {races.length === 0 && (
                    <p className="text-sm text-gray-600">No races found for this mod.</p>
                  )}
                  <div className="space-y-2">
                    {races.map((race) => (
                      <div key={race.id} className="rounded border border-gray-300 p-3 bg-gray-50 text-sm">
                        <button
                          onClick={() => setExpandedRaceId((prev) => (prev === race.id ? null : race.id))}
                          className="font-semibold text-left w-full"
                        >
                          {race.name}
                        </button>
                        {expandedRaceId === race.id && (
                          <div className="mt-2 space-y-2">
                            <p className="whitespace-pre-wrap">{race.description || 'No description provided.'}</p>
                            <p><span className="font-semibold">Size:</span> {race.size || '—'} | <span className="font-semibold">Speed:</span> {race.speed || '—'}</p>
                            <button
                              onClick={() => {
                                setSelectedRace(race);
                                setRaceChoiceSelections({});
                                setExpandedRaceId(null);
                              }}
                              className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Select Race
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeSection === 'background' && (
            <div className="w-full max-w-3xl rounded-lg border border-gray-300 bg-white p-4 space-y-3">
              <h2 className="text-2xl font-bold text-gray-800">Background ({dndMod})</h2>
              {selectedBackground ? (
                <div className="rounded border border-gray-300 p-3 bg-gray-50 text-sm text-gray-800 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-bold">{selectedBackground.name}</h3>
                    <button
                      onClick={() => setSelectedBackground(null)}
                      className="px-3 py-1 text-xs rounded bg-gray-300 hover:bg-gray-400"
                    >
                      Change Background
                    </button>
                  </div>
                  {selectedBackground.description && <p className="whitespace-pre-wrap">{selectedBackground.description}</p>}
                  <p><span className="font-semibold">Skills:</span> {selectedBackground.skillProficiencies || '—'}</p>
                  <p><span className="font-semibold">Tools:</span> {selectedBackground.toolProficiencies || '—'}</p>
                  <p><span className="font-semibold">Languages:</span> {selectedBackground.languages || '—'}</p>
                  <p><span className="font-semibold">Feature:</span> {selectedBackground.featureName || '—'}</p>
                  <p className="whitespace-pre-wrap">{selectedBackground.featureText || ''}</p>
                  <p><span className="font-semibold">Starting Equipment:</span> {selectedBackground.startingEquipment || '—'}</p>
                </div>
              ) : (
                <>
                  {backgrounds.length === 0 && (
                    <p className="text-sm text-gray-600">No backgrounds found for this mod.</p>
                  )}
                  <div className="space-y-2">
                    {backgrounds.map((background) => (
                      <div key={background.id} className="rounded border border-gray-300 p-3 bg-gray-50 text-sm">
                        <button
                          onClick={() => setExpandedBackgroundId((prev) => (prev === background.id ? null : background.id))}
                          className="font-semibold text-left w-full"
                        >
                          {background.name}
                        </button>
                        {expandedBackgroundId === background.id && (
                          <div className="mt-2 space-y-2">
                            <p className="whitespace-pre-wrap">{background.description || 'No description provided.'}</p>
                            <button
                              onClick={() => {
                                setSelectedBackground(background);
                                setExpandedBackgroundId(null);
                              }}
                              className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Select Background
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeSection === 'class' && (
            <div className="w-full max-w-3xl rounded-lg border border-gray-300 bg-white p-4 space-y-3">
              <h2 className="text-2xl font-bold text-gray-800">Class ({dndMod})</h2>
              {loadingClasses && <p className="text-sm text-gray-600">Loading classes...</p>}

              {!loadingClasses && selectedClass && (
                <div className="space-y-3 rounded border border-gray-300 p-3 bg-gray-50 text-sm text-gray-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {selectedDndPicture && (
                        <img
                          src={`/F_Pictures/Picture ${selectedDndPicture.pictureId} Face.png`}
                          alt={`Class portrait ${selectedDndPicture.pictureId}`}
                          className="rounded"
                          style={{
                            width: '40px',
                            height: '40px',
                            objectFit: 'cover',
                            border: 'none',
                            borderRadius: '4px',
                            display: 'block',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <h3 className="text-2xl font-bold truncate">{selectedClass.name}</h3>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedClass(null);
                        setExpandedClassId(null);
                      }}
                      className="px-3 py-1 text-xs rounded bg-gray-300 hover:bg-gray-400"
                    >
                      Change Class
                    </button>
                  </div>

                  <div className="max-w-xs">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Class Level</label>
                    <select
                      value={classLevel}
                      onChange={(e) => setClassLevel(e.target.value)}
                      className="w-full rounded border-gray-300 text-sm"
                    >
                      {Array.from({ length: 20 }).map((_, index) => (
                        <option key={`level-${index + 1}`} value={String(index + 1)}>
                          {index + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div><span className="font-semibold">Hit Dice:</span> {selectedClass.hitDice || '—'}</div>
                    <div><span className="font-semibold">Prof. Armour:</span> {selectedClass.profArmour || '—'}</div>
                    <div><span className="font-semibold">Prof. Weapons:</span> {selectedClass.profWeapons || '—'}</div>
                    <div><span className="font-semibold">Prof. Saving Throws:</span> {selectedClass.profSavingThrows || '—'}</div>
                    <div><span className="font-semibold">Points Name:</span> {selectedClass.pointsName || '—'}</div>
                    <div><span className="font-semibold">Proficiency Bonus:</span> {selectedClassLevelData?.ProfBonus ?? '—'}</div>
                    <div><span className="font-semibold">Cantrips:</span> {selectedClassLevelData?.Cantrips ?? '—'}</div>
                    <div><span className="font-semibold">Spells Known:</span> {selectedClassLevelData?.SpellsKnown ?? '—'}</div>
                    <div><span className="font-semibold">Class Points:</span> {selectedClassLevelData?.Points ?? '—'}</div>
                    {selectedClassExtraEntries.map((entry) => (
                      <div key={`selected-class-extra-${entry.fieldName}`}><span className="font-semibold">{entry.fieldName}:</span> {entry.value}</div>
                    ))}
                  </div>

                  {(() => {
                    const skillChoice = parseSkillChoices(selectedClass.profSkills || '');
                    if (!skillChoice.isChoice) {
                      return <div><span className="font-semibold">Skill Proficiencies:</span> {selectedClass.profSkills || '—'}</div>;
                    }

                    return (
                      <div className="space-y-2">
                        <div className="font-semibold">Skill Choices (pick {skillChoice.count})</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Array.from({ length: skillChoice.count }).map((_, index) => (
                            <select
                              key={`skill-choice-${index}`}
                              value={skillChoices[index] || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                const newChoices = [...skillChoices];
                                newChoices[index] = value;
                                setSkillChoices(newChoices);
                              }}
                              className="w-full rounded border-gray-300 text-sm"
                            >
                              <option value="">Select skill</option>
                              {skillChoice.options.map((option) => (
                                <option
                                  key={`${option}-${index}`}
                                  value={option}
                                  disabled={skillChoices.includes(option) && skillChoices[index] !== option}
                                >
                                  {option}
                                </option>
                              ))}
                            </select>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  <div>
                    <p className="font-semibold">Class Features up to Level {classLevel}</p>
                    {selectedClassFeatures.length === 0 && (
                      <p className="text-sm text-gray-600">No class features listed up to this level.</p>
                    )}
                    {selectedClassFeatures.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {selectedClassFeatures.map((feature) => (
                          <div key={feature.id} className="rounded border border-gray-300 p-2 bg-white">
                            <p className="font-semibold">{feature.name}</p>
                            <p className="whitespace-pre-wrap">{feature.text || 'No description provided.'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!loadingClasses && !selectedClass && (
                <>
                  {classes.length === 0 && (
                    <p className="text-sm text-gray-600">No classes found for this mod.</p>
                  )}
                  <div className="space-y-2">
                    {classes.map((classRow) => (
                      <div key={classRow.id} className="rounded border border-gray-300 p-3 bg-gray-50 text-sm">
                        <button
                          onClick={() => setExpandedClassId((prev) => (prev === classRow.id ? null : classRow.id))}
                          className="font-semibold text-left w-full"
                        >
                          {classRow.name}
                        </button>

                        {expandedClassId === classRow.id && (
                          <div className="mt-2 space-y-2">
                            <p className="whitespace-pre-wrap">{classRow.description || 'No description provided.'}</p>
                            <button
                              onClick={() => {
                                setSelectedClass(classRow);
                                setExpandedClassId(null);
                                localStorage.setItem('dndmod_selected_class_id', String(classRow.id));
                              }}
                              className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Select Class
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeSection === 'stats' && (
            <div className="w-full max-w-3xl rounded-lg border border-gray-300 bg-white p-4 space-y-3">
              <h2 className="text-2xl font-bold text-gray-800">Ability Scores</h2>
              {raceAbilityBonusState.unresolved.length > 0 && (
                <p className="text-sm text-amber-700">
                  Race bonus choices are incomplete. Finish selecting choices in the Race tab.
                </p>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-800">Point Buy Remaining: {calculatePointsRemaining()} / 27</p>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                {statsList.map((stat) => {
                  const othersSpent = Object.entries(statValues).reduce((total, [key, val]) => {
                    if (key !== stat) {
                      total += pointCosts[val] || 0;
                    }
                    return total;
                  }, 0);

                  const raceBonus = raceAbilityBonus(stat);
                  const total = totalStatValue(stat);
                  const modifier = abilityModifier(total);

                  return (
                    <div key={stat} className="rounded border border-gray-300 p-2 bg-gray-50">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-semibold">{stat}</span>
                        <select
                          value={statValues[stat]}
                          onChange={(e) => setStatValues({ ...statValues, [stat]: e.target.value })}
                          className="rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                        >
                          {['8', '9', '10', '11', '12', '13', '14', '15'].map((value) => {
                            const optionCost = pointCosts[value] || 0;
                            const totalCost = othersSpent + optionCost;
                            const isDisabled = totalCost > 27;
                            const costLabel = value === '8' ? '' : ` (-${optionCost} Point${optionCost > 1 ? 's' : ''})`;

                            return (
                              <option key={`${stat}-${value}`} value={value} disabled={isDisabled}>
                                {value}{costLabel}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <p className="mt-1 text-xs text-gray-700">
                        Base {statValues[stat]} {raceBonus !== 0 ? `+ Race ${raceBonus > 0 ? '+' : ''}${raceBonus}` : ''} = Total {total} ({modifier >= 0 ? '+' : ''}{modifier})
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeSection === 'gear' && (
            <div className="w-full max-w-3xl rounded-lg border border-gray-300 bg-white p-4 space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">Gear & Spells</h2>

              <div>
                <h3 className="text-lg font-semibold text-gray-800">Equipment</h3>
                {equipmentOptions.length === 0 && (
                  <p className="text-sm text-gray-600">No equipment found for this mod.</p>
                )}
                {equipmentOptions.length > 0 && (
                  <div className="mt-2 max-h-72 overflow-auto border border-gray-300 rounded p-2 bg-gray-50 space-y-2">
                    {equipmentOptions.map((item) => {
                      const classRestrictions = normalizeList(item.allowedClasses).map((entry) => entry.toLowerCase());
                      const isAllowedForClass = !selectedClass || classRestrictions.length === 0 || classRestrictions.includes(selectedClass.name.toLowerCase());
                      if (!isAllowedForClass) return null;

                      return (
                        <label key={item.id} className="flex items-start gap-2 text-sm text-gray-800">
                          <input
                            type="checkbox"
                            checked={selectedEquipmentIds.includes(item.id)}
                            onChange={() => toggleEquipment(item.id)}
                          />
                          <span>
                            <span className="font-semibold">{item.name}</span>
                            {item.category ? ` (${item.category})` : ''}
                            {item.cost ? ` — ${item.cost}` : ''}
                            {item.description ? ` — ${item.description}` : ''}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800">Spells</h3>
                {selectedClassLevelData && (
                  <p className="text-sm text-gray-700">
                    Level limits: Cantrips {cantripLimit || '—'} / Spells Known {spellsKnownLimit || '—'}
                  </p>
                )}
                {filteredSpellOptions.length === 0 && (
                  <p className="text-sm text-gray-600">No spells found for this class/mod.</p>
                )}
                {filteredSpellOptions.length > 0 && (
                  <div className="mt-2 max-h-80 overflow-auto border border-gray-300 rounded p-2 bg-gray-50 space-y-2">
                    {filteredSpellOptions
                      .slice()
                      .sort((a, b) => a.spellLevel - b.spellLevel || a.name.localeCompare(b.name))
                      .map((spell) => {
                        const currentCharacterLevel = parseIntegerOrFallback(classLevel, 1);
                        const spellLevel = parseIntegerOrFallback(spell.spellLevel, 0);
                        if (spellLevel > currentCharacterLevel) return null;

                        const checked = selectedSpellIds.includes(spell.id);
                        return (
                          <label key={spell.id} className="flex items-start gap-2 text-sm text-gray-800">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSpell(spell.id)}
                            />
                            <span>
                              <span className="font-semibold">{spell.name}</span>
                              {` (Level ${spellLevel})`}
                              {spell.school ? ` — ${spell.school}` : ''}
                              {spell.castingTime ? ` — ${spell.castingTime}` : ''}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Inventory / Carrying Notes</label>
                <textarea
                  value={inventoryText}
                  onChange={(e) => setInventoryText(e.target.value)}
                  rows={4}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  placeholder="List coins, backpack contents, consumables, and tracked gear notes"
                />
              </div>
            </div>
          )}

          {activeSection === 'notes' && (
            <div className="w-full max-w-3xl rounded-lg border border-gray-300 bg-white p-4 space-y-3">
              <h2 className="text-2xl font-bold text-gray-800">Roleplay Notes</h2>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Personality Traits</label>
                <textarea value={personalityTraits} onChange={(e) => setPersonalityTraits(e.target.value)} rows={2} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Ideals</label>
                <textarea value={ideals} onChange={(e) => setIdeals(e.target.value)} rows={2} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Bonds</label>
                <textarea value={bonds} onChange={(e) => setBonds(e.target.value)} rows={2} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Flaws</label>
                <textarea value={flaws} onChange={(e) => setFlaws(e.target.value)} rows={2} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Backstory</label>
                <textarea value={backstory} onChange={(e) => setBackstory(e.target.value)} rows={4} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">General Notes</label>
                <textarea value={characterNotes} onChange={(e) => setCharacterNotes(e.target.value)} rows={5} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
              </div>
            </div>
          )}

          <div className="w-full max-w-3xl rounded-lg border border-gray-300 bg-white p-4 text-sm text-gray-800">
            <h3 className="text-lg font-semibold mb-2">Quick Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div><span className="font-semibold">Class:</span> {selectedClass?.name || '—'}</div>
              <div><span className="font-semibold">Level:</span> {classLevel}</div>
              <div><span className="font-semibold">Race:</span> {selectedRace?.name || '—'}</div>
              <div><span className="font-semibold">Background:</span> {selectedBackground?.name || '—'}</div>
              <div><span className="font-semibold">HP:</span> {currentHp || '—'} / {maxHp || '—'}</div>
              <div><span className="font-semibold">AC:</span> {armorClass || '—'}</div>
              <div><span className="font-semibold">Equipment Picks:</span> {selectedEquipmentIds.length}</div>
              <div><span className="font-semibold">Spell Picks:</span> {selectedSpellIds.length}</div>
              {selectedClassExtraEntries.map((entry) => (
                <div key={`summary-extra-${entry.fieldName}`}><span className="font-semibold">{entry.fieldName}:</span> {entry.value}</div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {statsList.map((stat) => {
                const total = totalStatValue(stat);
                const modifier = abilityModifier(total);
                return (
                  <div key={`summary-${stat}`} className="rounded border border-gray-300 px-2 py-1 bg-gray-50">
                    <span className="font-semibold">{statColumnMap[stat]}:</span> {total} ({modifier >= 0 ? '+' : ''}{modifier})
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
