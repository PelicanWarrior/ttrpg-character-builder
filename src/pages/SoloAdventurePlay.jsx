import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DicePoolPopup from './DicePoolPopup';

const MANEUVER_EFFECT_DESCRIPTIONS = {
  'maneuver:aim': 'Adds a boost die to your next attack.',
  'maneuver:take-cover': 'Adds a setback die to incoming ranged attacks until your next turn.',
};

export default function SoloAdventurePlay() {
  const navigate = useNavigate();
  const { adventureId } = useParams();
  const [searchParams] = useSearchParams();
  const characterId = searchParams.get('characterId') || '';
  const requestedPageId = searchParams.get('pageId') || '';
  const username = localStorage.getItem('username') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adventure, setAdventure] = useState(null);
  const [ttrpg, setTtrpg] = useState(null);
  const [character, setCharacter] = useState(null);
  const woundMaxBaseRef = useRef(0);
  const strainMaxBaseRef = useRef(0);
  const [firstPage, setFirstPage] = useState(null);
  const [characterFaceErrored, setCharacterFaceErrored] = useState(false);
  const [characterSoak, setCharacterSoak] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [choices, setChoices] = useState([]);
  const [loadingChoices, setLoadingChoices] = useState(false);
  const [choicesError, setChoicesError] = useState('');
  const [battlePopupChoice, setBattlePopupChoice] = useState(null);
  const [battleEnemies, setBattleEnemies] = useState([]);
  const [loadingBattleEnemies, setLoadingBattleEnemies] = useState(false);
  const [battleEnemiesError, setBattleEnemiesError] = useState('');
  const [battleInitiativeOrder, setBattleInitiativeOrder] = useState([]);
  const [pendingEnemyInitiative, setPendingEnemyInitiative] = useState([]);
  const [initiativeChoiceId, setInitiativeChoiceId] = useState(null);
  const [battleActionOptions, setBattleActionOptions] = useState([]);
  const [selectedBattleAction, setSelectedBattleAction] = useState('');
  const [maneuverSlotsUsed, setManeuverSlotsUsed] = useState(0);
  const [actionSlotUsed, setActionSlotUsed] = useState(false);
  const [usedManeuverValues, setUsedManeuverValues] = useState([]);
  const [battleLog, setBattleLog] = useState([]);
  const [attackTargetId, setAttackTargetId] = useState('');
  const [pendingAimBoost, setPendingAimBoost] = useState(false);
  const [pendingCoverSetback, setPendingCoverSetback] = useState(false);
  const [activeAttack, setActiveAttack] = useState(null);
  const [enemyTurnResult, setEnemyTurnResult] = useState(null);
  const [battleWon, setBattleWon] = useState(false);
  const [enemyAimBoosts, setEnemyAimBoosts] = useState({});
  const [enemyAimUsed, setEnemyAimUsed] = useState({});
  const processingEnemyTurnRef = useRef(false);
  const enemyTurnPlanRef = useRef(null);
  const [dicePopup, setDicePopup] = useState(null);
  const [activeSkillChoice, setActiveSkillChoice] = useState(null);
  const [swSkillStats, setSwSkillStats] = useState({});
  const initials = (ttrpg?.Initials || '').toUpperCase();
  const isSW = initials === 'SW';

  const getCharacterTableName = (ttrpgInitials) => {
    if (!ttrpgInitials) return null;
    return `${ttrpgInitials}_player_characters`;
  };

  const getUserIdColumnName = (ttrpgInitials) => {
    const initials = (ttrpgInitials || '').toUpperCase();
    if (initials === 'DND' || initials === 'MM') return 'User_ID';
    return 'user_number';
  };

  const getCharacterSelectFields = (ttrpgInitials) => {
    const initials = (ttrpgInitials || '').toUpperCase();
    if (initials === 'SW') {
      return 'id, name, race, career, spec, picture, brawn, agility, intellect, cunning, willpower, presence, skills_rank, talents, wound_threshold, wound_current, strain_threshold, strain_current';
    }
    if (initials === 'FA') return 'id, name, race, level';
    if (initials === 'MM') return 'id, name, hero_name, origin, rank';
    if (initials === 'DND') return 'id, Name, Class, Str, Dex, Con, Int, Wis, Cha';
    if (initials === 'WWW') return 'id, name';
    return 'id, name';
  };

  const resolveCharacterFaceUrl = (characterRow, ttrpgInitials) => {
    const rawFace = characterRow?.picture ?? characterRow?.Picture ?? characterRow?.avatar ?? characterRow?.image_url ?? '';
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

  const resolveSwNpcFaceUrl = (npcRow) => {
    const rawFace = npcRow?.PictureID ?? npcRow?.picture ?? npcRow?.Picture;
    if (rawFace === null || rawFace === undefined || rawFace === '') return '';

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

    if (/^\d+$/.test(value)) {
      return `/SW_Pictures/Picture ${value} Face.png`;
    }

    return `/${value.replace(/^\/+/, '')}`;
  };

  const normalizeBattleNpcIds = (value) => {
    let raw = value;

    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed) return [];

      try {
        raw = JSON.parse(trimmed);
      } catch {
        raw = trimmed.split(',');
      }
    }

    if (!Array.isArray(raw)) return [];

    return raw
      .map((item) => parseInt(item, 10))
      .filter((item) => Number.isFinite(item) && item > 0);
  };

  useEffect(() => {
    let active = true;

    const loadPlayPage = async () => {
      if (!username) {
        navigate('/');
        return;
      }

      if (!adventureId || !characterId) {
        setError('Adventure or character is missing.');
        setLoading(false);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('user')
        .select('id')
        .eq('username', username)
        .single();

      if (!active) return;

      if (userError || !userData) {
        setError('Failed to load user details.');
        setLoading(false);
        return;
      }

      setCurrentUserId(userData.id);

      const { data: adventureData, error: adventureError } = await supabase
        .from('Solo_Adventures')
        .select('id, title, description, user_id, ttrpg_id, first_page_id')
        .eq('id', adventureId)
        .eq('user_id', userData.id)
        .single();

      if (!active) return;

      if (adventureError || !adventureData) {
        setError('Adventure not found or access denied.');
        setLoading(false);
        return;
      }

      const { data: ttrpgData, error: ttrpgError } = await supabase
        .from('TTRPGs')
        .select('id, TTRPG_name, Initials')
        .eq('id', adventureData.ttrpg_id)
        .single();

      if (!active) return;

      if (ttrpgError || !ttrpgData) {
        setError('Failed to load TTRPG details.');
        setLoading(false);
        return;
      }

      const charTable = getCharacterTableName(ttrpgData.Initials);
      const userIdColumn = getUserIdColumnName(ttrpgData.Initials);

      if (!charTable) {
        setError('Character table is unknown for this TTRPG.');
        setLoading(false);
        return;
      }

      const { data: characterData, error: characterError } = await supabase
        .from(charTable)
        .select(getCharacterSelectFields(ttrpgData.Initials))
        .eq('id', characterId)
        .eq(userIdColumn, userData.id)
        .single();

      if (!active) return;

      if (characterError || !characterData) {
        setError('Character not found or access denied.');
        setLoading(false);
        return;
      }

      const initials = (ttrpgData.Initials || '').toUpperCase();
      let calculatedSoak = null;
      let derivedBattleActionOptions = [];
      if (initials === 'SW') {
        const baseSoak = Number(characterData.brawn) || 0;
        calculatedSoak = baseSoak;

        const cleanedTalentNames = String(characterData.talents || '')
          .split(',')
          .map((token) => token.trim())
          .filter(Boolean)
          .map((token) => token.replace(/\s*\(.*\)$/, '').trim());

        const uniqueAbilityNames = [...new Set(cleanedTalentNames.filter(Boolean))];

        const { data: abilityRows, error: abilityErr } = uniqueAbilityNames.length > 0
          ? await supabase
              .from('SW_abilities')
              .select('ability, activation')
              .in('ability', uniqueAbilityNames)
          : { data: [], error: null };

        if (abilityErr) {
          console.error('Failed to load SW ability activation metadata:', abilityErr);
        }

        const activeAbilityNameSet = new Set(
          (abilityRows || [])
            .filter((row) => {
              const activation = String(row?.activation || '').trim().toLowerCase();
              return activation && !activation.includes('passive');
            })
            .map((row) => String(row?.ability || '').trim().toLowerCase())
            .filter(Boolean)
        );

        const abilityActivationByName = (abilityRows || []).reduce((acc, row) => {
          const name = String(row?.ability || '').trim().toLowerCase();
          if (!name) return acc;
          acc[name] = String(row?.activation || '').trim().toLowerCase();
          return acc;
        }, {});

        const abilityCounts = cleanedTalentNames.reduce((acc, abilityName) => {
            const normalized = String(abilityName || '').trim().toLowerCase();
            if (!normalized || !activeAbilityNameSet.has(normalized)) return acc;
            if (!acc[normalized]) {
              acc[normalized] = { name: abilityName, rank: 0 };
            }
            acc[normalized].rank += 1;
            return acc;
          }, {});

        const abilityOptions = Object.values(abilityCounts)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((entry) => ({
            value: `ability:${entry.name.toLowerCase()}`,
            label: `${(abilityActivationByName[String(entry.name || '').toLowerCase()] || '').includes('action') ? 'Action' : 'Ability'}: ${entry.name}${entry.rank > 1 ? ` (x${entry.rank})` : ''}`,
          }));

        const { data: equippedRows, error: equippedError } = await supabase
          .from('SW_character_equipment')
          .select('equipmentID, equipped')
          .eq('characterID', characterData.id)
          .eq('equipped', true);

        if (!equippedError) {
          const equippedIds = [...new Set((equippedRows || []).map((row) => row.equipmentID).filter(Boolean))];
          if (equippedIds.length > 0) {
            const { data: equippedItems, error: itemsError } = await supabase
              .from('SW_equipment')
              .select('id, name, skill, damage, critical, soak, skills(skill)')
              .in('id', equippedIds);

            if (!itemsError) {
              const armorSoak = (equippedItems || []).reduce((sum, item) => sum + (Number(item.soak) || 0), 0);
              calculatedSoak = Math.max(0, baseSoak + armorSoak);

              const weaponOptions = (equippedItems || [])
                .filter((item) =>
                  (item?.name && String(item.name).trim())
                  && (item?.skill || Number(item?.damage) > 0 || Number(item?.critical) > 0)
                )
                .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
                .map((item) => {
                  const rawName = String(item.name || '').trim();
                  const displayName = rawName
                    .replace(/\s*\(\d+\)\s*$/, '')
                    .replace(/\s+\d+\s*$/, '')
                    .trim();
                  const skillText = String(item.skills?.skill || '').trim();
                  const showSkillText = /[a-z]/i.test(skillText);

                  return {
                    value: `weapon:${item.id}`,
                    label: `Action: ${displayName}${showSkillText ? ` (${skillText})` : ''}`,
                    skill: showSkillText ? skillText : '',
                    damage: Number(item.damage) || 0,
                    critical: Number(item.critical) || 0,
                    weaponName: displayName,
                  };
                });

              derivedBattleActionOptions = [...abilityOptions, ...weaponOptions];
            }
          }
        }

        if (derivedBattleActionOptions.length === 0) {
          derivedBattleActionOptions = abilityOptions;
        }

        const maneuverOptions = [
          { value: 'maneuver:aim', label: 'Maneuver: Aim' },
          { value: 'maneuver:take-cover', label: 'Maneuver: Take Cover' },
        ];

        derivedBattleActionOptions = [...maneuverOptions, ...derivedBattleActionOptions];
      } else {
        derivedBattleActionOptions = [];
      }

      let pageData = null;

      const parsedRequestedPageId = Number(requestedPageId);
      if (Number.isFinite(parsedRequestedPageId) && parsedRequestedPageId > 0) {
        const { data: requestedPageData } = await supabase
          .from('Solo_Adventure_Pages')
          .select('id, title, content, page_order')
          .eq('id', parsedRequestedPageId)
          .eq('adventure_id', adventureData.id)
          .maybeSingle();

        pageData = requestedPageData || null;
      }

      if (!pageData && adventureData.first_page_id) {
        const { data: primaryPageData } = await supabase
          .from('Solo_Adventure_Pages')
          .select('id, title, content, page_order')
          .eq('id', adventureData.first_page_id)
          .eq('adventure_id', adventureData.id)
          .single();

        pageData = primaryPageData || null;
      }

      if (!pageData) {
        const { data: fallbackPageData } = await supabase
          .from('Solo_Adventure_Pages')
          .select('id, title, content, page_order')
          .eq('adventure_id', adventureData.id)
          .order('page_order', { ascending: true })
          .order('id', { ascending: true })
          .limit(1)
          .maybeSingle();

        pageData = fallbackPageData || null;
      }

      if (!active) return;

      setAdventure(adventureData);
      setTtrpg(ttrpgData);
      setCharacter(characterData);
      woundMaxBaseRef.current = Number(characterData.wound_threshold) || Number(characterData.wound_current) || 0;
      strainMaxBaseRef.current = Number(characterData.strain_threshold) || Number(characterData.strain_current) || 0;
      setCharacterSoak(calculatedSoak);
      setBattleActionOptions(derivedBattleActionOptions);
      setSelectedBattleAction('');
      setFirstPage(pageData);
      setLoading(false);
    };

    loadPlayPage();

    return () => {
      active = false;
    };
  }, [adventureId, characterId, navigate, requestedPageId, username]);

  useEffect(() => {
    let active = true;

    const loadChoicesForCurrentPage = async () => {
      if (!firstPage?.id) {
        setChoices([]);
        setChoicesError('');
        return;
      }

      setLoadingChoices(true);
      setChoicesError('');

      const { data, error: choiceErr } = await supabase
        .from('Solo_Adventure_Choices')
        .select('id, page_id, choice_text, next_page_id, success_page_id, failure_page_id, has_skill_check, surprise_battle, battle, battle_npc_ids, skill_name, skill_difficulty, choice_order')
        .eq('page_id', firstPage.id)
        .order('choice_order', { ascending: true })
        .order('id', { ascending: true });

      if (!active) return;

      if (choiceErr) {
        setChoices([]);
        setChoicesError(choiceErr.message || 'Failed to load choices.');
        setLoadingChoices(false);
        return;
      }

      setChoices(
        (data || []).map((choice) => ({
          ...choice,
          surprise_battle: !!choice.surprise_battle,
          battle: !!choice.battle,
          battle_npc_ids: normalizeBattleNpcIds(choice.battle_npc_ids),
        }))
      );
      setLoadingChoices(false);
    };

    loadChoicesForCurrentPage();

    return () => {
      active = false;
    };
  }, [firstPage?.id]);

  useEffect(() => {
    let active = true;

    const loadBattleEnemies = async () => {
      const initialsValue = (ttrpg?.Initials || '').toUpperCase();
      const activeBattleChoice = battlePopupChoice;
      const orderedNpcIds = normalizeBattleNpcIds(activeBattleChoice?.battle_npc_ids);

      if (initialsValue !== 'SW' || !activeBattleChoice) {
        setBattleEnemies([]);
        setBattleEnemiesError('');
        setLoadingBattleEnemies(false);
        return;
      }
      const uniqueNpcIds = [...new Set(orderedNpcIds)];

      if (uniqueNpcIds.length === 0) {
        setBattleEnemies([]);
        setBattleEnemiesError('');
        setLoadingBattleEnemies(false);
        return;
      }

      setLoadingBattleEnemies(true);
      setBattleEnemiesError('');

      const { data, error: npcError } = await supabase
        .from('SW_campaign_NPC')
        .select('id, Name, PictureID, Wound, Strain, Soak, Presence, Willpower, Skills, Abilities')
        .in('id', uniqueNpcIds);

      if (!active) return;

      if (npcError) {
        setBattleEnemies([]);
        setBattleEnemiesError(npcError.message || 'Failed to load battle enemies.');
        setLoadingBattleEnemies(false);
        return;
      }

      const byId = new Map((data || []).map((row) => [row.id, row]));
      const nameOccurrences = {};
      orderedNpcIds.forEach((npcId) => {
        const row = byId.get(npcId);
        const baseName = row?.Name || `NPC #${npcId}`;
        nameOccurrences[baseName] = (nameOccurrences[baseName] || 0) + 1;
      });

      const nameCounters = {};
      const resolvedEnemies = orderedNpcIds.map((npcId, index) => {
        const row = byId.get(npcId);
        const baseName = row?.Name || `NPC #${npcId}`;
        let displayName = baseName;
        if (nameOccurrences[baseName] > 1) {
          nameCounters[baseName] = (nameCounters[baseName] || 0) + 1;
          displayName = `${baseName} #${nameCounters[baseName]}`;
        }

        return {
          key: `${npcId}-${index}`,
          id: npcId,
          name: displayName,
          face: resolveSwNpcFaceUrl(row),
          woundCurrent: Number(row?.Wound) || 0,
          woundMax: Number(row?.Wound) || 0,
          strainCurrent: Number(row?.Strain) || 0,
          strainMax: Number(row?.Strain) || 0,
          soak: Number(row?.Soak) || 0,
          presence: Number(row?.Presence) || 0,
          willpower: Number(row?.Willpower) || 0,
          skills: row?.Skills || '',
          abilities: row?.Abilities || '',
        };
      });

      setBattleEnemies(resolvedEnemies);
      setLoadingBattleEnemies(false);
    };

    loadBattleEnemies();

    return () => {
      active = false;
    };
  }, [battlePopupChoice, ttrpg?.Initials]);

  useEffect(() => {
    let active = true;

    const loadSwSkills = async () => {
      if ((ttrpg?.Initials || '').toUpperCase() !== 'SW') {
        setSwSkillStats({});
        return;
      }

      const { data, error: skillErr } = await supabase
        .from('skills')
        .select('skill, stat');

      if (!active) return;

      if (skillErr) {
        console.error('Failed loading SW skills for solo checks:', skillErr);
        setSwSkillStats({});
        return;
      }

      const statMap = {};
      (data || []).forEach((row) => {
        const name = String(row.skill || '').trim().toLowerCase();
        const stat = String(row.stat || '').trim().toLowerCase();
        if (name && stat && !statMap[name]) {
          statMap[name] = stat;
        }
      });
      setSwSkillStats(statMap);
    };

    loadSwSkills();

    return () => {
      active = false;
    };
  }, [ttrpg?.Initials]);

  useEffect(() => {
    setBattleInitiativeOrder([]);
    setPendingEnemyInitiative([]);
    setInitiativeChoiceId(null);
    setSelectedBattleAction('');
    setManeuverSlotsUsed(0);
    setActionSlotUsed(false);
    setUsedManeuverValues([]);
    setBattleLog([]);
    setAttackTargetId('');
    setPendingAimBoost(false);
    setPendingCoverSetback(false);
    setActiveAttack(null);
    setEnemyTurnResult(null);
    setBattleWon(false);
    setEnemyAimBoosts({});
    setEnemyAimUsed({});
    processingEnemyTurnRef.current = false;
    enemyTurnPlanRef.current = null;
  }, [battlePopupChoice?.id]);

  useEffect(() => {
    if (!battlePopupChoice || !isSW) return;
    if (loadingBattleEnemies) return;
    if (initiativeChoiceId === battlePopupChoice.id) return;

    if (battleEnemiesError) return;

    let active = true;

    const startInitiative = async () => {
      try {
        setBattleInitiativeOrder([]);

        const { data: diceRows, error: diceErr } = await supabase
          .from('SW_dice')
          .select('*');

        if (diceErr) {
          throw new Error(diceErr.message || 'Failed loading SW dice table.');
        }

        const diceTable = {};
        (diceRows || []).forEach((dieRow) => {
          const key = String(dieRow.colour || '').toUpperCase();
          if (!key) return;
          diceTable[key] = collectDieSides(dieRow);
        });

        const parseRanks = (raw) => String(raw || '')
          .split(',')
          .map((token) => token.trim().toLowerCase())
          .filter(Boolean)
          .reduce((acc, skillName) => {
            acc[skillName] = (acc[skillName] || 0) + 1;
            return acc;
          }, {});

        const resolveSkillStatName = async (skillName, fallbackStat) => {
          const key = String(skillName || '').trim().toLowerCase();
          if (!key) return fallbackStat;

          const { data: skillRow, error: skillErr } = await supabase
            .from('skills')
            .select('stat')
            .ilike('skill', key)
            .limit(1)
            .maybeSingle();

          if (skillErr) {
            return fallbackStat;
          }

          const statName = String(skillRow?.stat || '').trim().toLowerCase();
          return statName || fallbackStat;
        };

        const buildPool = (statValue, rankValue) => {
          const safeStat = Math.max(0, Number(statValue) || 0);
          const safeRank = Math.max(0, Number(rankValue) || 0);
          const totalDice = Math.max(safeStat, safeRank);
          const upgradedDice = Math.min(safeStat, safeRank);
          return 'Y'.repeat(upgradedDice) + 'G'.repeat(Math.max(0, totalDice - upgradedDice));
        };

        const rollDie = (color) => {
          const key = String(color || '').toUpperCase();
          const sides = (diceTable?.[key] || []).filter((value) => value && String(value).trim() !== '');
          if (sides.length === 0) return 'Blank';
          return sides[Math.floor(Math.random() * sides.length)] || 'Blank';
        };

        const countWord = (results, word) => (results || []).reduce((acc, result) => {
          const matches = String(result || '').toLowerCase().match(new RegExp(word, 'g'));
          return acc + (matches ? matches.length : 0);
        }, 0);

        const parseInitiative = (results) => ({
          successes: countWord(results, 'success') + countWord(results, 'triumph'),
          advantages: countWord(results, 'advantage'),
        });

        const enemySkillName = battlePopupChoice.surprise_battle ? 'vigilance' : 'cool';
        const enemyFallbackStat = enemySkillName === 'vigilance' ? 'willpower' : 'presence';
        const enemyStatName = await resolveSkillStatName(enemySkillName, enemyFallbackStat);
        const playerStatName = await resolveSkillStatName('cool', 'presence');

        const enemyInitiativeEntries = battleEnemies.map((enemy) => {
          const npcRanks = parseRanks(enemy.skills);
          const enemyRank = npcRanks[enemySkillName] || 0;
          const enemyStat = Number(enemy?.[enemyStatName]) || Number(enemy?.[enemyFallbackStat]) || 0;
          const pool = buildPool(enemyStat, enemyRank);
          const enemyAbilityNames = parseAbilityNames(enemy?.abilities || '');
          const enemyBoostCount = getAbilityBoostCountForSkill(enemyAbilityNames, enemySkillName);
          const rolledResults = [
            ...pool.split('').filter(Boolean).map((letter) => rollDie(letter)),
            ...Array.from({ length: enemyBoostCount }, () => rollDie('B')),
          ];
          const parsed = parseInitiative(rolledResults);
          return {
            id: enemy.key,
            side: 'NPC',
            name: enemy.name,
            skill: enemySkillName,
            pool,
            successes: parsed.successes,
            advantages: parsed.advantages,
          };
        });

        const playerRanks = parseRanks(character?.skills_rank || '');
        const playerStat = Number(character?.[playerStatName]) || Number(character?.presence) || 0;
        const playerPool = buildPool(playerStat, playerRanks.cool || 0);
        const playerAbilityNames = parseAbilityNames(character?.talents || '');
        const playerBoostCount = getAbilityBoostCountForSkill(playerAbilityNames, 'cool');

        if (!playerPool) {
          throw new Error('Could not build player initiative dice pool for Cool.');
        }

        if (!active) return;
        setInitiativeChoiceId(battlePopupChoice.id);
        // Store enemy initiative first, then prompt player roll.
        setPendingEnemyInitiative(enemyInitiativeEntries);
        setDicePopup({
          pool: playerPool,
          details: playerPool.split('').map((color) => ({ color, name: '' })),
          boosts: buildBoostDice(playerBoostCount),
          setbacks: [],
          difficulty: 0,
          difficultyLocked: true,
          isForceRoll: false,
          label: 'Initiative Roll (COOL)',
        });
      } catch (err) {
        console.error('Failed to initialize battle initiative:', err);
        if (!active) return;
        setPendingEnemyInitiative([]);
        setInitiativeChoiceId(null);
      } finally {
        // No-op: battle initiative loader UI removed.
      }
    };

    startInitiative();

    return () => {
      active = false;
    };
  }, [battlePopupChoice, battleEnemies, battleEnemiesError, loadingBattleEnemies, initiativeChoiceId, isSW, character]);

  const loadPageById = async (pageId) => {
    if (!pageId || !adventure?.id) return false;

    const { data, error: pageError } = await supabase
      .from('Solo_Adventure_Pages')
      .select('id, title, content, page_order')
      .eq('id', pageId)
      .eq('adventure_id', adventure.id)
      .maybeSingle();

    if (pageError || !data) {
      console.error('Failed loading target page:', pageError);
      return false;
    }

    setFirstPage(data);
    return data;
  };

  const autoSaveProgress = async (pageId) => {
    if (!currentUserId || !adventure || !character || !ttrpg) return;

    const payload = {
      user_id: currentUserId,
      adventure_id: adventure.id,
      character_id: character.id,
      ttrpg_id: ttrpg.id,
      current_page_id: pageId || firstPage?.id || null,
      character_name: character.name || character.Name || 'Character',
      adventure_title: adventure.title || 'Solo Adventure',
      updated_at: new Date().toISOString(),
    };

    const { error: saveError } = await supabase
      .from('Solo_Adventure_Saves')
      .upsert(payload, { onConflict: 'user_id,adventure_id,character_id' });

    if (saveError) {
      console.error('Auto-save failed for solo adventure progress:', saveError);
    }
  };

  const parseSwSkillRanks = () => {
    const raw = character?.skills_rank || '';
    if (!raw) return {};

    return String(raw)
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean)
      .reduce((acc, skillName) => {
        const key = skillName.toLowerCase();
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
  };

  const parseAbilityNames = (rawValue) => String(rawValue || '')
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => token.replace(/\s*\(.*\)$/, '').trim().toLowerCase());

  const getAbilityBoostCountForSkill = (abilityNames, skillName) => {
    const normalizedSkill = String(skillName || '').trim().toLowerCase();
    if (!normalizedSkill) return 0;

    const names = Array.isArray(abilityNames) ? abilityNames : [];
    const hasAcuteSenses = names.includes('acute senses') || names.includes('accute senses');

    if (hasAcuteSenses && (normalizedSkill === 'perception' || normalizedSkill === 'vigilance')) {
      return 1;
    }

    return 0;
  };

  const buildBoostDice = (count) => Array.from({ length: Math.max(0, Number(count) || 0) }, () => ({
    color: 'B',
    name: 'Boost',
  }));

  const collectDieSides = (row) => {
    const available = [];
    if (!row) return available;

    for (let side = 1; side <= 12; side += 1) {
      const variants = [`side_${side}`, `side${side}`, `Side${side}`, `Side ${side}`, `side ${side}`];
      for (const key of variants) {
        if (Object.prototype.hasOwnProperty.call(row, key) && row[key] != null) {
          available.push(row[key]);
          break;
        }
      }
    }

    return available.filter((value) => value && String(value).trim() !== '');
  };

  const sortInitiativeOrder = (entries) => {
    const withIndex = (entries || []).map((entry, index) => ({ ...entry, sortIndex: index }));
    withIndex.sort((a, b) => {
      if (b.successes !== a.successes) return b.successes - a.successes;
      if (b.advantages !== a.advantages) return b.advantages - a.advantages;
      if (a.side !== b.side) {
        if (a.side === 'PC' && b.side === 'NPC') return -1;
        if (a.side === 'NPC' && b.side === 'PC') return 1;
      }
      return a.sortIndex - b.sortIndex;
    });

    return withIndex.map((entry) => {
      const cleaned = { ...entry };
      delete cleaned.sortIndex;
      return cleaned;
    });
  };

  const getSwSkillDicePool = (skillName) => {
    const key = String(skillName || '').trim().toLowerCase();
    if (!key) return '';

    const statName = swSkillStats[key];
    if (!statName) return '';

    const statValue = Number(character?.[statName]) || 0;
    const rankMap = parseSwSkillRanks();
    const rankValue = rankMap[key] || 0;

    let dicePool = 'G'.repeat(Math.max(0, statValue));
    if (rankValue > 0) {
      const yCount = Math.min(rankValue, dicePool.length);
      const upgraded = dicePool.split('');
      for (let i = 0; i < yCount; i += 1) {
        upgraded[i] = 'Y';
      }
      dicePool = upgraded.join('');
    }

    return dicePool;
  };

  const parseDifficultyToValue = (difficulty) => {
    const text = String(difficulty || '').trim().toLowerCase();
    if (!text) return 0;

    const numeric = parseInt(text, 10);
    if (!Number.isNaN(numeric)) return Math.max(0, Math.min(5, numeric));

    if (text.includes('easy')) return 1;
    if (text.includes('average') || text.includes('medium')) return 2;
    if (text.includes('hard')) return 3;
    if (text.includes('daunting')) return 4;
    if (text.includes('formidable')) return 5;
    return 0;
  };

  const handleChooseChoice = async (choice) => {
    if (!choice) return;

    const isBattleChoice = !!choice.surprise_battle || !!choice.battle;
    if (isBattleChoice) {
      setBattlePopupChoice(choice);
      return;
    }

    const isSwSkillCheck = isSW && !!choice.has_skill_check;
    if (isSwSkillCheck) {
      const pool = getSwSkillDicePool(choice.skill_name);
      if (!pool) {
        alert(`No dice pool could be generated for skill "${choice.skill_name || 'Unknown'}".`);
        return;
      }

      const playerAbilityNames = parseAbilityNames(character?.talents || '');
      const abilityBoostCount = getAbilityBoostCountForSkill(playerAbilityNames, choice.skill_name);

      setActiveSkillChoice(choice);
      setDicePopup({
        pool,
        details: pool.split('').map((color) => ({ color, name: '' })),
        boosts: buildBoostDice(abilityBoostCount),
        setbacks: [],
        difficulty: parseDifficultyToValue(choice.skill_difficulty),
        difficultyLocked: true,
        isForceRoll: false,
        label: `${choice.skill_name || 'Skill'} Check`,
      });
      return;
    }

    const fallbackTarget = choice.next_page_id || choice.success_page_id || choice.failure_page_id;
    if (!fallbackTarget) {
      alert('This choice has no destination page set.');
      return;
    }

    const loadedPage = await loadPageById(fallbackTarget);
    if (loadedPage?.id) {
      await autoSaveProgress(loadedPage.id);
    }
  };

  const handleSkillCheckContinue = async (netSuccess) => {
    if (!activeSkillChoice) return;

    const succeeded = Number(netSuccess) >= 1;
    const targetPageId = succeeded
      ? activeSkillChoice.success_page_id || activeSkillChoice.next_page_id
      : activeSkillChoice.failure_page_id || activeSkillChoice.next_page_id;

    setActiveSkillChoice(null);

    if (!targetPageId) {
      alert('This skill check choice is missing a destination page.');
      return;
    }

    const loadedPage = await loadPageById(targetPageId);
    if (loadedPage?.id) {
      await autoSaveProgress(loadedPage.id);
    }
  };

  const handleDicePopupResult = async (netSuccess, netAdvantage) => {
    if (activeAttack) {
      const successes = Math.max(0, Number(netSuccess) || 0);
      const hit = successes >= 1;
      const damageDealt = hit ? Math.max(0, activeAttack.damage + successes - (activeAttack.targetSoak || 0)) : 0;

      setBattleEnemies((prev) =>
        prev.map((enemy) =>
          String(enemy.key) === String(activeAttack.targetKey)
            ? { ...enemy, woundCurrent: Math.max(0, enemy.woundCurrent - damageDealt) }
            : enemy
        )
      );

      setBattleLog((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${prev.length}`,
          side: 'PC',
          text: hit
            ? `${activeAttack.weaponName} hit ${activeAttack.targetName} for ${damageDealt} damage.`
            : `${activeAttack.weaponName} missed ${activeAttack.targetName}.`,
          kind: 'action',
          maneuverKey: null,
        },
      ]);

      setActiveAttack(null);
      return;
    }

    if (pendingEnemyInitiative.length > 0 || (battlePopupChoice && initiativeChoiceId === battlePopupChoice.id)) {
      const playerEntry = {
        id: 'player',
        side: 'PC',
        name: character?.name || character?.Name || 'Player',
        skill: 'cool',
        pool: dicePopup?.pool || '',
        successes: Math.max(0, Number(netSuccess) || 0),
        advantages: Math.max(0, Number(netAdvantage) || 0),
      };

      const order = sortInitiativeOrder([playerEntry, ...pendingEnemyInitiative]);
      setBattleInitiativeOrder(order);
      setPendingEnemyInitiative([]);
      return;
    }

    await handleSkillCheckContinue(netSuccess);
  };

  const renderEnergyBar = (label, currentValue, maxValue, colorClass) => {
    const max = Number(maxValue) || 0;
    if (max <= 0) return null;

    const current = Math.max(0, Number(currentValue) || 0);
    const clamped = Math.min(current, max);
    const width = Math.max(0, Math.min(100, (clamped / max) * 100));

    return (
      <div>
        <div className="mb-1 flex items-center justify-between text-xs font-semibold text-gray-700">
          <span>{label}</span>
          <span>{clamped} / {max}</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full border border-gray-300 bg-gray-200">
          <div className={`h-full ${colorClass}`} style={{ width: `${width}%` }} />
        </div>
      </div>
    );
  };

  const characterFace = resolveCharacterFaceUrl(character, ttrpg?.Initials);
  const rangeColumns = ['Engaged', 'Short', 'Medium', 'Long', 'Extreme'];
  const playerRangeColumns = [...rangeColumns].reverse();
  const woundThreshold = Number(character?.wound_threshold) || 0;
  const strainThreshold = Number(character?.strain_threshold) || 0;
  const woundCurrent = Number(character?.wound_current ?? woundThreshold) || 0;
  const strainCurrent = Number(character?.strain_current ?? strainThreshold) || 0;
  const woundMax = Math.max(woundThreshold, woundMaxBaseRef.current);
  const strainMax = Math.max(strainThreshold, strainMaxBaseRef.current);
  const isPlayersTurn = battleInitiativeOrder.length > 0 && battleInitiativeOrder[0]?.side === 'PC';
  const selectedBattleActionOption = battleActionOptions.find((option) => option.value === selectedBattleAction) || null;
  const selectedBattleActionLabel = selectedBattleActionOption?.label || 'Choose Action / Maneuver';
  const isManeuverSelected = selectedBattleAction.startsWith('maneuver:');
  const isWeaponSelected = selectedBattleAction.startsWith('weapon:');
  const isActionSelected = !!selectedBattleAction && !isManeuverSelected;
  const willTakeStrain = !!selectedBattleAction && maneuverSlotsUsed + (actionSlotUsed ? 1 : 0) === 2;
  const confirmButtonLabel = `${selectedBattleActionLabel}${willTakeStrain ? ' (Take 1 Strain)' : ''}`;
  const canConfirmBattleAction =
    !!selectedBattleAction &&
    (isManeuverSelected ? maneuverSlotsUsed < 2 && !usedManeuverValues.includes(selectedBattleAction) : !actionSlotUsed) &&
    (!isWeaponSelected || !!attackTargetId);

  const consumeSlotAndStrain = async () => {
    if (isManeuverSelected) {
      setManeuverSlotsUsed((prev) => Math.min(2, prev + 1));
      setUsedManeuverValues((prev) => [...prev, selectedBattleAction]);
    } else if (selectedBattleAction) {
      setActionSlotUsed(true);
    }

    if (!willTakeStrain || !characterId) return;

    let updatedStrainCurrent = null;
    setCharacter((prev) => {
      if (!prev) return prev;
      const currentStrain = Number(prev.strain_current ?? strainThreshold) || 0;
      updatedStrainCurrent = Math.max(0, currentStrain - 1);
      return { ...prev, strain_current: updatedStrainCurrent };
    });

    if (updatedStrainCurrent === null) return;

    const { error: strainErr } = await supabase
      .from('SW_player_characters')
      .update({ strain_current: updatedStrainCurrent })
      .eq('id', characterId);

    if (strainErr) console.error('Error updating strain_current:', strainErr);
  };

  const startWeaponAttack = async () => {
    const weaponOption = selectedBattleActionOption;
    const targetEnemy = battleEnemies.find((enemy) => String(enemy.key) === String(attackTargetId));
    if (!weaponOption || !targetEnemy) return;

    const skillPool = getSwSkillDicePool(weaponOption.skill) || '';
    if (!skillPool) {
      alert(`No dice pool could be generated for skill "${weaponOption.skill || 'Unknown'}".`);
      return;
    }

    const playerAbilityNames = parseAbilityNames(character?.talents || '');
    const abilityBoostCount = getAbilityBoostCountForSkill(playerAbilityNames, weaponOption.skill);
    const totalBoosts = abilityBoostCount + (pendingAimBoost ? 1 : 0);

    setActiveAttack({
      targetKey: targetEnemy.key,
      targetName: targetEnemy.name,
      weaponName: weaponOption.weaponName || weaponOption.label,
      damage: weaponOption.damage || 0,
      targetSoak: targetEnemy.soak || 0,
    });

    setDicePopup({
      pool: skillPool,
      details: skillPool.split('').map((color) => ({ color, name: '' })),
      boosts: buildBoostDice(totalBoosts),
      setbacks: [],
      difficulty: 1,
      difficultyLocked: true,
      isForceRoll: false,
      label: `Attack: ${weaponOption.weaponName || ''} vs ${targetEnemy.name}`,
    });

    if (pendingAimBoost) {
      setPendingAimBoost(false);
      setBattleLog((prev) => prev.filter((entry) => entry.maneuverKey !== 'maneuver:aim'));
    }

    await consumeSlotAndStrain();

    setSelectedBattleAction('');
    setAttackTargetId('');
  };

  const handleConfirmBattleAction = async () => {
    if (isWeaponSelected) {
      await startWeaponAttack();
      return;
    }

    const confirmedActionValue = selectedBattleAction;
    const confirmedActionLabel = selectedBattleActionLabel;
    const confirmedIsManeuver = isManeuverSelected;
    const willBecomeAimBoost = confirmedActionValue === 'maneuver:aim';
    const willBecomeCoverSetback = confirmedActionValue === 'maneuver:take-cover';

    await consumeSlotAndStrain();

    if (confirmedActionValue) {
      const effectText = MANEUVER_EFFECT_DESCRIPTIONS[confirmedActionValue] || null;
      const labelOnly = confirmedActionLabel.replace(/^(Maneuver|Action|Ability):\s*/i, '');
      setBattleLog((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${prev.length}`,
          side: 'PC',
          text: effectText ? `${labelOnly}: ${effectText}` : confirmedActionLabel,
          kind: confirmedIsManeuver ? 'maneuver' : 'action',
          maneuverKey: confirmedIsManeuver ? confirmedActionValue : null,
        },
      ]);
    }

    if (willBecomeAimBoost) setPendingAimBoost(true);
    if (willBecomeCoverSetback) setPendingCoverSetback(true);

    setSelectedBattleAction('');
  };

  const handleEndTurn = () => {
    setManeuverSlotsUsed(0);
    setActionSlotUsed(false);
    setUsedManeuverValues([]);
    setSelectedBattleAction('');
    setAttackTargetId('');
    setBattleLog((prev) => prev.filter((entry) => entry.kind !== 'action'));

    setBattleInitiativeOrder((prev) => (prev.length > 1 ? [...prev.slice(1), prev[0]] : prev));
  };

  useEffect(() => {
    if (!battlePopupChoice) return;
    if (battleWon) return;
    if (loadingBattleEnemies) return;
    if (battleEnemies.length === 0) return;

    const allDefeated = battleEnemies.every((enemy) => (Number(enemy.woundCurrent) || 0) <= 0);
    if (allDefeated) setBattleWon(true);
  }, [battleEnemies, battlePopupChoice, battleWon, loadingBattleEnemies]);

  const handleBattleWonContinue = async () => {
    const destinationPageId =
      battlePopupChoice?.next_page_id || battlePopupChoice?.success_page_id || battlePopupChoice?.failure_page_id;

    setBattleWon(false);
    setBattlePopupChoice(null);

    if (destinationPageId) {
      const loadedPage = await loadPageById(destinationPageId);
      if (loadedPage?.id) {
        await autoSaveProgress(loadedPage.id);
      }
    }
  };

  const handleAcknowledgeEnemyTurn = () => {
    const plan = enemyTurnPlanRef.current;
    setEnemyTurnResult(null);

    if (plan && plan.steps[plan.stepIndex] !== 'done' && plan.stepIndex < plan.steps.length - 1) {
      plan.stepIndex += 1;
      enemyTurnPlanRef.current = plan;
      runEnemyTurnStep();
      return;
    }

    enemyTurnPlanRef.current = null;
    processingEnemyTurnRef.current = false;
    setBattleInitiativeOrder((prev) => (prev.length > 1 ? [...prev.slice(1), prev[0]] : prev));
  };

  const runEnemyTurnStep = (currentActorForNewTurn) => {
    let plan = enemyTurnPlanRef.current;

    if (!plan) {
      const actor = currentActorForNewTurn;
      const enemy = battleEnemies.find((item) => String(item.key) === String(actor.id));
      const enemyName = enemy?.name || actor.name || 'Enemy';

      if (!enemy || enemy.woundCurrent <= 0) {
        enemyTurnPlanRef.current = { enemyKey: actor.id, enemyName, steps: ['done'], stepIndex: 0 };
        setEnemyTurnResult({ message: `${enemyName} is down and cannot act.` });
        return;
      }

      const alreadyAimed = !!enemyAimUsed[enemy.key];
      const hasAimBoost = !!enemyAimBoosts[enemy.key];
      const wantsToAim = !alreadyAimed && !hasAimBoost && Math.random() < 0.5;

      plan = {
        enemyKey: enemy.key,
        enemyName,
        steps: wantsToAim ? ['maneuver', 'attack'] : ['attack'],
        stepIndex: 0,
      };
      enemyTurnPlanRef.current = plan;
    }

    const enemy = battleEnemies.find((item) => String(item.key) === String(plan.enemyKey));
    const enemyName = plan.enemyName;
    const step = plan.steps[plan.stepIndex];

    if (step === 'done') return;

    if (step === 'maneuver') {
      setEnemyAimUsed((prev) => ({ ...prev, [plan.enemyKey]: true }));
      setEnemyAimBoosts((prev) => ({ ...prev, [plan.enemyKey]: true }));
      setEnemyTurnResult({ message: `${enemyName} takes aim, gaining a boost die for their next attack.` });
      return;
    }

    if (step === 'attack') {
      if (!enemy || enemy.woundCurrent <= 0) {
        setEnemyTurnResult({ message: `${enemyName} is down and cannot act.` });
        return;
      }

      const rollSimpleSuccesses = () => {
        const roll = Math.random();
        if (roll < 0.15) return 0;
        if (roll < 0.55) return 1;
        if (roll < 0.85) return 2;
        return 3;
      };

      const hasAimBoost = !!enemyAimBoosts[plan.enemyKey];
      let successes = rollSimpleSuccesses();
      if (hasAimBoost && Math.random() < 0.5) successes += 1;

      const usedCover = pendingCoverSetback && Math.random() < 0.5;
      if (usedCover) successes = Math.max(0, successes - 1);

      const hit = successes >= 1;
      const soakValue = Number(characterSoak ?? character?.brawn) || 0;
      const damageDealt = hit ? Math.max(0, 2 + successes - soakValue) : 0;

      if (hasAimBoost) {
        setEnemyAimBoosts((prev) => ({ ...prev, [plan.enemyKey]: false }));
      }

      if (pendingCoverSetback) {
        setPendingCoverSetback(false);
        setBattleLog((prev) => prev.filter((entry) => entry.maneuverKey !== 'maneuver:take-cover'));
      }

      if (hit && damageDealt > 0) {
        setCharacter((prev) => {
          if (!prev) return prev;
          const currentWound = Number(prev.wound_current ?? woundThreshold) || 0;
          const nextWound = Math.max(0, currentWound - damageDealt);
          return { ...prev, wound_current: nextWound };
        });

        if (characterId) {
          supabase
            .from('SW_player_characters')
            .update({ wound_current: Math.max(0, woundCurrent - damageDealt) })
            .eq('id', characterId)
            .then(({ error }) => {
              if (error) console.error('Error updating wound_current:', error);
            });
        }
      }

      const playerName = character?.name || character?.Name || 'you';
      setEnemyTurnResult({
        message: hit
          ? `${enemyName} attacks ${playerName} for ${damageDealt} damage.${usedCover ? ' (Reduced by cover)' : ''}`
          : `${enemyName} attacks ${playerName} but misses.${usedCover ? ' (Cover helped)' : ''}`,
      });
    }
  };

  useEffect(() => {
    if (!battlePopupChoice) return;
    if (battleInitiativeOrder.length === 0) return;
    if (enemyTurnResult) return;
    if (processingEnemyTurnRef.current) return;

    const currentActor = battleInitiativeOrder[0];
    if (!currentActor || currentActor.side === 'PC') return;

    processingEnemyTurnRef.current = true;
    runEnemyTurnStep(currentActor);
  }, [
    battleInitiativeOrder,
    battlePopupChoice,
    enemyTurnResult,
    battleEnemies,
    enemyAimBoosts,
    enemyAimUsed,
    pendingCoverSetback,
    characterSoak,
    character,
    characterId,
    woundThreshold,
    woundCurrent,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 via-slate-100 to-stone-200 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-4xl font-black tracking-wide text-gray-900">{adventure?.title || 'SOLO ADVENTURE'}</h1>
          <button
            onClick={() => navigate('/solo-adventures')}
            className="rounded-xl border-2 border-gray-900 bg-white px-5 py-3 text-sm font-bold uppercase tracking-wide text-black shadow-sm transition hover:bg-gray-100"
          >
            Back
          </button>
        </div>

        <div className="rounded-3xl border-4 border-gray-900 bg-white p-8 shadow-2xl">
          {loading && <p className="text-lg text-gray-700">Loading adventure...</p>}
          {!loading && error && <p className="text-lg font-semibold text-red-700">{error}</p>}

          {!loading && !error && (
            <div className="space-y-6">
              <div className="rounded-2xl border-2 border-sky-400 bg-sky-50 p-4">
                <h2 className="mb-3 text-xl font-bold text-gray-900">Character</h2>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="w-full sm:w-40">
                    {characterFace && !characterFaceErrored ? (
                      <img
                        src={characterFace}
                        alt={`${character?.name || character?.Name || 'Character'} portrait`}
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
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 text-2xl font-bold text-gray-900">{character?.name || character?.Name}</div>
                        <div className="space-y-1 text-base text-gray-700">
                          {character?.race && <div><span className="font-semibold">Race:</span> {character.race}</div>}
                          {character?.career && <div><span className="font-semibold">Career:</span> {character.career}</div>}
                          {character?.spec && <div><span className="font-semibold">Spec:</span> {character.spec}</div>}
                          {character?.Class && <div><span className="font-semibold">Class:</span> {character.Class}</div>}
                          {character?.level && <div><span className="font-semibold">Level:</span> {character.level}</div>}
                          {character?.hero_name && <div><span className="font-semibold">Hero:</span> {character.hero_name}</div>}
                          {character?.origin && <div><span className="font-semibold">Origin:</span> {character.origin}</div>}
                          {character?.rank && <div><span className="font-semibold">Rank:</span> {character.rank}</div>}
                          {ttrpg?.TTRPG_name && <div><span className="font-semibold">System:</span> {ttrpg.TTRPG_name}</div>}
                        </div>
                      </div>

                      {isSW && (
                        <div className="w-full md:ml-4 md:max-w-[420px]">
                          <div className="space-y-2 rounded-xl border border-sky-200 bg-white/70 p-3">
                            <h3 className="text-sm font-bold uppercase tracking-wide text-sky-900">Main Stats</h3>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-800 sm:grid-cols-3">
                              <div><span className="font-semibold">Brawn:</span> {Number(character?.brawn) || 0}</div>
                              <div><span className="font-semibold">Agility:</span> {Number(character?.agility) || 0}</div>
                              <div><span className="font-semibold">Intellect:</span> {Number(character?.intellect) || 0}</div>
                              <div><span className="font-semibold">Cunning:</span> {Number(character?.cunning) || 0}</div>
                              <div><span className="font-semibold">Willpower:</span> {Number(character?.willpower) || 0}</div>
                              <div><span className="font-semibold">Presence:</span> {Number(character?.presence) || 0}</div>
                            </div>

                            <h3 className="pt-1 text-sm font-bold uppercase tracking-wide text-sky-900">Combat</h3>
                            <div className="grid grid-cols-1 gap-y-1 text-sm text-gray-800 sm:grid-cols-2 sm:gap-x-4">
                              <div><span className="font-semibold">Wound:</span> {woundCurrent} / {woundMax}</div>
                              <div><span className="font-semibold">Soak:</span> {characterSoak ?? (Number(character?.brawn) || 0)}</div>
                              <div><span className="font-semibold">Strain:</span> {strainCurrent} / {strainMax}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4">
                <h2 className="mb-2 text-xl font-bold text-gray-900">Page {firstPage?.page_order || 1}</h2>
                {!firstPage && <p className="text-base text-gray-700">No pages found for this adventure yet.</p>}
                {firstPage && (
                  <div>
                    <h3 className="mb-2 text-lg font-bold text-gray-900">{firstPage.title}</h3>
                    <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-800">{firstPage.content || 'No content yet.'}</p>

                    <div className="mt-6 border-t border-amber-200 pt-4">
                      <h4 className="mb-3 text-lg font-bold text-gray-900">Choices</h4>
                      {loadingChoices && <p className="text-sm text-gray-700">Loading choices...</p>}
                      {!loadingChoices && choicesError && (
                        <p className="text-sm font-semibold text-red-700">{choicesError}</p>
                      )}
                      {!loadingChoices && !choicesError && choices.length === 0 && (
                        <p className="text-sm text-gray-700">No choices available for this page.</p>
                      )}
                      {!loadingChoices && !choicesError && choices.length > 0 && (
                        <div className="space-y-3">
                          {choices.map((choice) => {
                            const isBattleChoice = !!choice.surprise_battle || !!choice.battle;
                            const isSwSkillCheck = isSW && !!choice.has_skill_check;
                            const skillPool = isSwSkillCheck ? getSwSkillDicePool(choice.skill_name) : '';
                            const canUseChoice = isBattleChoice || !isSwSkillCheck || Boolean(skillPool);

                            return (
                              <div key={choice.id} className="rounded-xl border border-amber-300 bg-white p-3">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="min-w-0 flex-1">
                                    <div className="text-base text-gray-900">{choice.choice_text || 'Untitled choice'}</div>
                                    {choice.has_skill_check && (
                                      <div className="mt-1 text-xs font-semibold text-amber-800">
                                        Skill Check: {choice.skill_name || 'Unknown'}
                                        {choice.skill_difficulty ? ` (${choice.skill_difficulty})` : ''}
                                      </div>
                                    )}
                                  </div>

                                  <div className="sm:ml-4 sm:flex-shrink-0">
                                    <button
                                      onClick={() => handleChooseChoice(choice)}
                                      disabled={!canUseChoice}
                                      className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {isBattleChoice ? 'Battle' : (isSwSkillCheck ? `Dice Pool: ${skillPool}` : 'Choose')}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {dicePopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-fit max-w-[calc(100vw-2rem)] rounded-2xl border-2 border-gray-900 bg-white p-4 shadow-2xl">
            <DicePoolPopup
              dicePopup={dicePopup}
              setDicePopup={setDicePopup}
              onUseResult={handleDicePopupResult}
              fromSkillCheck
              actionLabel={
                activeAttack
                  ? (parsedRoll) => {
                      const successes = Math.max(0, Number(parsedRoll?.netSuccess) || 0);
                      if (successes < 1) return 'Attack Missed';
                      const dmg = Math.max(0, activeAttack.damage + successes - (activeAttack.targetSoak || 0));
                      return `Deal ${dmg} Damage`;
                    }
                  : pendingEnemyInitiative.length > 0 || (battlePopupChoice && initiativeChoiceId === battlePopupChoice.id)
                  ? 'Set Initiative'
                  : 'Continue'
              }
              hideRollAgain={
                !!activeAttack ||
                pendingEnemyInitiative.length > 0 ||
                (battlePopupChoice && initiativeChoiceId === battlePopupChoice.id)
              }
              simplified
            />
          </div>
        </div>
      )}

      {enemyTurnResult && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl border-2 border-gray-900 bg-white p-6 shadow-2xl">
            <h3 className="mb-3 text-lg font-bold text-gray-900">Enemy Turn</h3>
            <p className="mb-4 text-sm text-gray-800">{enemyTurnResult.message}</p>
            <button
              type="button"
              onClick={handleAcknowledgeEnemyTurn}
              className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-gray-800"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {battleWon && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl border-2 border-gray-900 bg-white p-6 text-center shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-gray-900">Battle Won</h3>
            <button
              type="button"
              onClick={handleBattleWonContinue}
              className="w-full rounded-lg bg-green-700 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-green-800"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {battlePopupChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-6xl rounded-2xl border-2 border-gray-900 bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Battle Setup</h3>
                <p className="text-sm text-gray-700">{battlePopupChoice.choice_text || 'Battle choice'}</p>
                {isPlayersTurn && (
                  <p className="mt-1 text-sm font-bold uppercase tracking-wide text-green-700">Your Turn</p>
                )}
              </div>
              <button
                onClick={() => setBattlePopupChoice(null)}
                className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-gray-800"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-bold uppercase tracking-wide text-red-900">Player Side</p>
                <div className="grid grid-cols-5 gap-2">
                  {playerRangeColumns.map((range) => (
                    <div key={`popup-player-${range}`} className="rounded-lg border border-red-200 bg-red-50 p-2">
                      <div className="mb-2 text-center text-xs font-bold uppercase text-red-800">{range}</div>
                      {range === 'Short' ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="rounded-lg">
                            {characterFace && !characterFaceErrored ? (
                              <img
                                src={characterFace}
                                alt={`${character?.name || character?.Name || 'Player'} face`}
                                className="h-14 w-14 rounded-lg border border-gray-300 object-cover"
                                onError={() => setCharacterFaceErrored(true)}
                              />
                            ) : (
                              <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-gray-400 bg-gray-100 text-[10px] font-semibold uppercase text-gray-500">
                                No Face
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="h-14" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-bold uppercase tracking-wide text-red-900">Enemy Side</p>
                <div className="grid grid-cols-5 gap-2">
                  {rangeColumns.map((range) => (
                    <div key={`popup-enemy-${range}`} className="rounded-lg border border-red-200 bg-red-50 p-2">
                      <div className="mb-2 text-center text-xs font-bold uppercase text-red-800">{range}</div>
                      {range === 'Short' ? (
                        <div className="flex min-h-14 flex-wrap gap-1">
                          {loadingBattleEnemies && (
                            <div className="text-[11px] text-gray-600">Loading...</div>
                          )}
                          {!loadingBattleEnemies && battleEnemiesError && (
                            <div className="text-[11px] font-semibold text-red-700">{battleEnemiesError}</div>
                          )}
                          {!loadingBattleEnemies && !battleEnemiesError && battleEnemies.length === 0 && (
                            <div className="text-[11px] text-gray-600">No enemies</div>
                          )}
                          {!loadingBattleEnemies && !battleEnemiesError && battleEnemies.map((enemy) => (
                            <div key={enemy.key} className="flex flex-col items-center">
                              <div className="group relative rounded-lg">
                                {enemy.face ? (
                                  <img
                                    src={enemy.face}
                                    alt={enemy.name}
                                    className="h-12 w-12 rounded-lg border border-gray-300 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-gray-400 bg-gray-100 text-[10px] font-semibold uppercase text-gray-500">
                                    NPC
                                  </div>
                                )}
                                <div className="pointer-events-none absolute -bottom-6 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] text-white group-hover:block">
                                  {enemy.name}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-14" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-red-900">
                  {character?.name || character?.Name || 'Player'}
                </h4>
                <div className="flex flex-col gap-3 md:flex-row md:items-start">
                  <div className="flex-1 space-y-3">
                    {renderEnergyBar('Wound', woundCurrent, woundMax, 'bg-red-500')}
                    {strainMax > 0 && renderEnergyBar('Strain', strainCurrent, strainMax, 'bg-blue-500')}
                    {battleLog.filter((entry) => entry.side === 'PC').length > 0 && (
                      <div className="space-y-1 border-t border-red-200 pt-2">
                        {battleLog
                          .filter((entry) => entry.side === 'PC')
                          .map((entry) => (
                            <p key={entry.id} className="text-[11px] text-gray-700">
                              {entry.text}
                            </p>
                          ))}
                      </div>
                    )}
                  </div>
                  <div className="w-full rounded-lg border border-red-100 bg-white p-2 md:w-64">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-red-900">
                      1 Action / 1 Maneauver Left
                    </p>
                    <div className="mb-2 flex gap-2">
                      {[0, 1].map((idx) => {
                        const used = maneuverSlotsUsed > idx;
                        const flashing = !used && isManeuverSelected && maneuverSlotsUsed === idx;
                        return (
                          <div
                            key={`maneuver-box-${idx}`}
                            className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 text-sm font-bold uppercase ${
                              used
                                ? 'border-gray-400 bg-gray-300 text-gray-500'
                                : flashing
                                ? 'animate-pulse border-yellow-500 bg-yellow-300 text-yellow-900'
                                : 'border-red-300 bg-white text-red-900'
                            }`}
                          >
                            M
                          </div>
                        );
                      })}
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 text-sm font-bold uppercase ${
                          actionSlotUsed
                            ? 'border-gray-400 bg-gray-300 text-gray-500'
                            : isActionSelected
                            ? 'animate-pulse border-yellow-500 bg-yellow-300 text-yellow-900'
                            : 'border-red-300 bg-white text-red-900'
                        }`}
                      >
                        A
                      </div>
                    </div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-red-900">
                      Action / Maneuver
                    </label>
                    {(maneuverSlotsUsed < 2 || !actionSlotUsed) && (
                      <>
                        <select
                          value={selectedBattleAction}
                          onChange={(event) => {
                            setSelectedBattleAction(event.target.value);
                            setAttackTargetId('');
                          }}
                          className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-800"
                          disabled={battleActionOptions.length === 0}
                        >
                          <option value="">Select Ability or Action</option>
                          {battleActionOptions.map((option) => {
                            const isManeuverOption = option.value.startsWith('maneuver:');
                            const isDisabled = isManeuverOption
                              ? maneuverSlotsUsed >= 2 || usedManeuverValues.includes(option.value)
                              : actionSlotUsed;
                            return (
                              <option key={option.value} value={option.value} disabled={isDisabled}>
                                {option.label}
                              </option>
                            );
                          })}
                        </select>
                        {battleActionOptions.length === 0 && (
                          <p className="mt-1 text-[10px] text-gray-600">No abilities or actions found.</p>
                        )}
                        {isWeaponSelected && (
                          <div className="mt-2">
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-red-900">
                              Target
                            </label>
                            <select
                              value={attackTargetId}
                              onChange={(event) => setAttackTargetId(event.target.value)}
                              className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-800"
                              disabled={battleEnemies.length === 0}
                            >
                              <option value="">Select Target</option>
                              {battleEnemies.map((enemy) => (
                                <option key={enemy.key} value={enemy.key}>
                                  {enemy.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <button
                          type="button"
                          disabled={!canConfirmBattleAction}
                          className="mt-2 w-full rounded bg-red-700 px-2 py-1.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                          onClick={handleConfirmBattleAction}
                        >
                          {confirmButtonLabel}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="mt-2 w-full rounded bg-gray-700 px-2 py-1.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-gray-800"
                      onClick={handleEndTurn}
                    >
                      End Turn
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-red-900">Enemies</h4>
                {loadingBattleEnemies && <div className="text-sm text-gray-700">Loading enemy stats...</div>}
                {!loadingBattleEnemies && battleEnemiesError && (
                  <div className="text-sm font-semibold text-red-700">{battleEnemiesError}</div>
                )}
                {!loadingBattleEnemies && !battleEnemiesError && battleEnemies.length === 0 && (
                  <div className="text-sm text-gray-700">No enemies</div>
                )}
                {!loadingBattleEnemies && !battleEnemiesError && battleEnemies.length > 0 && (
                  <div className="space-y-3">
                    {battleEnemies.map((enemy) => {
                      const isTargeted = isWeaponSelected && String(attackTargetId) === String(enemy.key);
                      return (
                        <div
                          key={`enemy-stats-${enemy.key}`}
                          className={`rounded-lg border p-2 ${
                            isTargeted ? 'animate-pulse border-yellow-500 bg-yellow-100' : 'border-red-100 bg-white'
                          }`}
                        >
                          <div className="mb-1 text-xs font-bold uppercase tracking-wide text-red-900">{enemy.name}</div>
                          <div className="space-y-2">
                            {renderEnergyBar('Wound', enemy.woundCurrent, enemy.woundMax, 'bg-red-500')}
                            {enemy.strainMax > 0 &&
                              renderEnergyBar('Strain', enemy.strainCurrent, enemy.strainMax, 'bg-blue-500')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
