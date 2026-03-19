import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const USER_COLUMNS = ['User_ID', 'user_number', 'user_id', 'userID', 'playerID'];
const CHARACTER_NAME_COLUMNS = ['name', 'Name', 'character_name', 'CharacterName', 'character', 'Character'];

const normalizeInitials = (row) => {
  if (row?.initials) return String(row.initials).toUpperCase();
  const words = String(row?.name || '').trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => (word[0] || '').toUpperCase()).join('');
};

const getCharacterName = (row) => {
  for (const key of CHARACTER_NAME_COLUMNS) {
    const value = row?.[key];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return `Character ${row?.id ?? ''}`.trim();
};

const getCharacterSubtitle = (row) => {
  const parts = [];
  if (row?.class_name) parts.push(row.class_name);
  if (row?.Class_ProfSkills) parts.push('Class Skills Set');
  if (row?.career) parts.push(row.career);
  if (row?.spec) parts.push(row.spec);
  if (row?.race) parts.push(row.race);
  if (row?.Class) parts.push(`Class ${row.Class}`);
  return parts.join(' • ');
};

const getCharacterClass = (row) => {
  if (row?.class_name) return String(row.class_name);
  if (row?.career && row?.spec) return `${row.career} - ${row.spec}`;
  if (row?.career) return String(row.career);
  if (row?.ClassName) return String(row.ClassName);
  if (row?.Class != null && String(row.Class).trim()) return String(row.Class);
  return '';
};

const getCharacterRace = (row) => {
  if (row?.race != null && String(row.race).trim()) return String(row.race);
  if (row?.Race != null && String(row.Race).trim()) return String(row.Race);
  return '';
};

const getCharacterPicture = (row, isSW) => {
  if (isSW && (typeof row?.picture === 'number' || String(row?.picture || '').trim())) {
    const pictureIndex = Number.isNaN(Number(row.picture)) ? 0 : Number(row.picture);
    return `/SW_Pictures/Picture ${pictureIndex} Face.png`;
  }

  const possibleKeys = ['picture', 'Picture', 'image', 'image_url', 'avatar', 'Avatar', 'portrait'];
  for (const key of possibleKeys) {
    const value = row?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  return '';
};

const isMissingColumnError = (error) => {
  if (!error) return false;
  if (error.code === '42703') return true;
  const message = String(error.message || '').toLowerCase();
  return message.includes('column') && message.includes('does not exist');
};

const isMissingRelationError = (error) => {
  if (!error) return false;
  if (error.code === '42P01') return true;
  const message = String(error.message || '').toLowerCase();
  return message.includes('relation') && message.includes('does not exist');
};

const sanitizeInteger = (value, fallback = 0) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return fallback;
  return numeric;
};

const isStarWarsSystem = (systemRow) => {
  if (!systemRow) return false;
  const initials = normalizeInitials(systemRow);
  return initials === 'SW' || /star\s*wars/i.test(systemRow.name || '');
};

const isFalloutInitials = (initials) => {
  const normalized = String(initials || '').toUpperCase();
  return normalized === 'FA' || normalized === 'F';
};

const countSkillRanksFromCsv = (skillsRankCsv) => {
  if (!skillsRankCsv) return {};
  return String(skillsRankCsv)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((accumulator, skillName) => {
      accumulator[skillName] = (accumulator[skillName] || 0) + 1;
      return accumulator;
    }, {});
};

const parseSwRollResults = (poolResultsArray, diffResultsArray) => {
  const counts = {
    success: 0,
    failure: 0,
    triumph: 0,
    despair: 0,
    advantage: 0,
    threat: 0,
  };

  const parseResultText = (text) => {
    if (!text) return;
    const lc = String(text).toLowerCase();

    const successMatches = lc.match(/success/g);
    const failureMatches = lc.match(/failure/g);
    const triumphMatches = lc.match(/triumph/g);
    const despairMatches = lc.match(/despair/g);
    const advantageMatches = lc.match(/advantage/g);
    const threatMatches = lc.match(/threat/g);

    if (successMatches) counts.success += successMatches.length;
    if (failureMatches) counts.failure += failureMatches.length;
    if (triumphMatches) counts.triumph += triumphMatches.length;
    if (despairMatches) counts.despair += despairMatches.length;
    if (advantageMatches) counts.advantage += advantageMatches.length;
    if (threatMatches) counts.threat += threatMatches.length;
  };

  (poolResultsArray || []).forEach((result) => parseResultText(result));
  (diffResultsArray || []).forEach((result) => parseResultText(result));

  const totalSuccess = counts.success + counts.triumph;
  const totalFailure = counts.failure + counts.despair;

  const netSuccess = Math.max(0, totalSuccess - totalFailure);
  const netFailure = Math.max(0, totalFailure - totalSuccess);
  const netAdvantage = Math.max(0, counts.advantage - counts.threat);
  const netThreat = Math.max(0, counts.threat - counts.advantage);

  return {
    counts,
    netSuccess,
    netFailure,
    netAdvantage,
    netThreat,
    totalSuccess,
    totalFailure,
  };
};

const getSwDieFaces = async (colour, cache) => {
  if (cache[colour]) return cache[colour];

  const { data: singleRow, error: singleErr } = await supabase
    .from('SW_dice')
    .select('*')
    .eq('colour', colour)
    .maybeSingle();

  let available = [];
  if (!singleErr && singleRow) {
    for (let side = 1; side <= 12; side++) {
      const variants = [`side${side}`, `Side${side}`, `Side ${side}`, `side ${side}`];
      for (const key of variants) {
        if (Object.prototype.hasOwnProperty.call(singleRow, key) && singleRow[key] != null) {
          available.push(singleRow[key]);
          break;
        }
      }
    }
  }

  if (available.length === 0) {
    const { data: rows } = await supabase
      .from('SW_dice')
      .select('side, result')
      .eq('colour', colour)
      .in('side', Array.from({ length: 12 }, (_, index) => index + 1));

    if (rows && rows.length > 0) {
      available = rows.map((row) => row.result).filter((result) => result != null);
    }
  }

  cache[colour] = available;
  return available;
};

const getCharacterStatValue = (characterRow, statName) => {
  if (!characterRow || !statName) return 0;
  const lower = String(statName).toLowerCase();
  const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
  const raw = characterRow[lower] ?? characterRow[capitalized] ?? 0;
  const numeric = Number(raw);
  return Number.isNaN(numeric) ? 0 : Math.max(0, numeric);
};

export default function SoloAdventure() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [systems, setSystems] = useState([]);

  const [activeTab, setActiveTab] = useState('play');

  const [selectedSystemId, setSelectedSystemId] = useState('');
  const [availableCharacters, setAvailableCharacters] = useState([]);
  const [characterLoadError, setCharacterLoadError] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState('');
  const [availableAdventures, setAvailableAdventures] = useState([]);
  const [selectedAdventureId, setSelectedAdventureId] = useState('');

  const [graphNodesById, setGraphNodesById] = useState({});
  const [graphChoicesByNodeId, setGraphChoicesByNodeId] = useState({});
  const [activeNodeId, setActiveNodeId] = useState(null);
  const [runId, setRunId] = useState(null);
  const [runPath, setRunPath] = useState([]);
  const [runCompleted, setRunCompleted] = useState(false);
  const [lastSkillCheck, setLastSkillCheck] = useState(null);

  const [builderAdventures, setBuilderAdventures] = useState([]);
  const [builderSelectedAdventureId, setBuilderSelectedAdventureId] = useState('__new__');
  const [builderAdventureTitle, setBuilderAdventureTitle] = useState('');
  const [builderAdventureDescription, setBuilderAdventureDescription] = useState('');
  const [builderAdventureSystemId, setBuilderAdventureSystemId] = useState('');
  const [builderAdventurePublished, setBuilderAdventurePublished] = useState(false);
  const [savingAdventure, setSavingAdventure] = useState(false);

  const [builderNodes, setBuilderNodes] = useState([]);
  const [builderSelectedNodeId, setBuilderSelectedNodeId] = useState('__new__');
  const [builderNodeTitle, setBuilderNodeTitle] = useState('');
  const [builderNodeContent, setBuilderNodeContent] = useState('');
  const [builderNodeOrder, setBuilderNodeOrder] = useState('0');
  const [builderNodeIsStart, setBuilderNodeIsStart] = useState(false);
  const [savingNode, setSavingNode] = useState(false);

  const [builderChoices, setBuilderChoices] = useState([]);
  const [builderSelectedChoiceId, setBuilderSelectedChoiceId] = useState('__new__');
  const [builderChoiceText, setBuilderChoiceText] = useState('');
  const [builderChoiceNextNodeId, setBuilderChoiceNextNodeId] = useState('');
  const [builderChoiceRequiresCheck, setBuilderChoiceRequiresCheck] = useState(false);
  const [builderChoiceCheckSkill, setBuilderChoiceCheckSkill] = useState('');
  const [builderChoiceCheckDifficulty, setBuilderChoiceCheckDifficulty] = useState('2');
  const [builderChoiceFailureNodeId, setBuilderChoiceFailureNodeId] = useState('');
  const [builderSkillOptions, setBuilderSkillOptions] = useState([]);
  const [builderSkillOptionsLoading, setBuilderSkillOptionsLoading] = useState(false);
  const [builderSkillOptionsHint, setBuilderSkillOptionsHint] = useState('');
  const [builderChoiceOrder, setBuilderChoiceOrder] = useState('0');
  const [savingChoice, setSavingChoice] = useState(false);

  const selectedSystem = useMemo(
    () => systems.find((row) => String(row.id) === String(selectedSystemId)) || null,
    [systems, selectedSystemId]
  );

  const selectedCharacter = useMemo(
    () => availableCharacters.find((row) => String(row.id) === String(selectedCharacterId)) || null,
    [availableCharacters, selectedCharacterId]
  );

  const selectedAdventure = useMemo(
    () => availableAdventures.find((row) => String(row.id) === String(selectedAdventureId)) || null,
    [availableAdventures, selectedAdventureId]
  );

  const builderSelectedSystem = useMemo(
    () => systems.find((row) => String(row.id) === String(builderAdventureSystemId)) || null,
    [systems, builderAdventureSystemId]
  );

  const builderSkillOptionsForSelect = useMemo(() => {
    const options = [...builderSkillOptions];
    if (builderChoiceCheckSkill && !options.includes(builderChoiceCheckSkill)) {
      options.unshift(builderChoiceCheckSkill);
    }
    return options;
  }, [builderSkillOptions, builderChoiceCheckSkill]);

  const currentNode = activeNodeId ? graphNodesById[activeNodeId] : null;
  const currentNodeChoices = activeNodeId ? (graphChoicesByNodeId[activeNodeId] || []) : [];

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const resetPlayState = () => {
    setGraphNodesById({});
    setGraphChoicesByNodeId({});
    setActiveNodeId(null);
    setRunId(null);
    setRunPath([]);
    setRunCompleted(false);
    setLastSkillCheck(null);
  };

  const resetBuilderAdventureForm = () => {
    setBuilderSelectedAdventureId('__new__');
    setBuilderAdventureTitle('');
    setBuilderAdventureDescription('');
    setBuilderAdventureSystemId('');
    setBuilderAdventurePublished(false);
    setBuilderNodes([]);
    resetBuilderNodeForm();
    setBuilderChoices([]);
    resetBuilderChoiceForm();
  };

  const resetBuilderNodeForm = () => {
    setBuilderSelectedNodeId('__new__');
    setBuilderNodeTitle('');
    setBuilderNodeContent('');
    setBuilderNodeOrder('0');
    setBuilderNodeIsStart(false);
  };

  const resetBuilderChoiceForm = () => {
    setBuilderSelectedChoiceId('__new__');
    setBuilderChoiceText('');
    setBuilderChoiceNextNodeId('');
    setBuilderChoiceRequiresCheck(false);
    setBuilderChoiceCheckSkill('');
    setBuilderChoiceCheckDifficulty('2');
    setBuilderChoiceFailureNodeId('');
    setBuilderChoiceOrder('0');
  };

  const fetchSkillNamesFromTable = useCallback(async (tableName, candidateColumns) => {
    for (const columnName of candidateColumns) {
      const { data, error: queryError } = await supabase
        .from(tableName)
        .select(columnName)
        .order(columnName, { ascending: true });

      if (queryError) {
        if (isMissingColumnError(queryError)) continue;
        if (isMissingRelationError(queryError)) {
          return { values: [], tableMissing: true, usedColumn: null };
        }
        return { values: [], error: queryError, usedColumn: null };
      }

      const values = Array.from(new Set((data || [])
        .map((row) => row?.[columnName])
        .filter((value) => value != null && String(value).trim())
        .map((value) => String(value).trim()))).sort((left, right) => left.localeCompare(right));

      return { values, usedColumn: columnName };
    }

    return { values: [], usedColumn: null };
  }, []);

  const loadBuilderSkillOptions = useCallback(async (systemRow) => {
    if (!systemRow) {
      setBuilderSkillOptions([]);
      setBuilderSkillOptionsHint('');
      return;
    }

    setBuilderSkillOptionsLoading(true);
    setBuilderSkillOptions([]);
    setBuilderSkillOptionsHint('');

    try {
      if (isStarWarsSystem(systemRow)) {
        const result = await fetchSkillNamesFromTable('skills', ['skill', 'SkillName', 'name']);
        if (result.error) throw result.error;
        if (result.tableMissing) {
          setBuilderSkillOptionsHint('Star Wars skills table was not found.');
          return;
        }
        setBuilderSkillOptions(result.values);
        setBuilderSkillOptionsHint(result.values.length > 0 ? 'Loaded from skills table.' : 'No skills found in skills table.');
        return;
      }

      if (systemRow.dndMod) {
        const result = await fetchSkillNamesFromTable('DND_Skills', ['SkillName', 'skill', 'name']);
        if (result.error) throw result.error;
        if (result.tableMissing) {
          setBuilderSkillOptionsHint('DND_Skills table was not found.');
          return;
        }
        setBuilderSkillOptions(result.values);
        setBuilderSkillOptionsHint(result.values.length > 0 ? 'Loaded from DND_Skills table.' : 'No skills found in DND_Skills table.');
        return;
      }

      setBuilderSkillOptionsHint('This system does not have a skills table yet.');
    } catch (loadError) {
      console.error('Failed to load builder skill options:', loadError);
      setBuilderSkillOptionsHint('Failed to load skills for this system.');
    } finally {
      setBuilderSkillOptionsLoading(false);
    }
  }, [fetchSkillNamesFromTable]);

  const loadCurrentUser = async () => {
    const username = localStorage.getItem('username');
    if (!username) {
      setUserId(null);
      setIsAdmin(false);
      return;
    }

    const { data, error: userError } = await supabase
      .from('user')
      .select('id, admin')
      .eq('username', username)
      .maybeSingle();

    if (userError) throw userError;

    setUserId(data?.id ?? null);
    setIsAdmin(Boolean(data?.admin));
  };

  const loadSystems = useCallback(async () => {
    const { data, error: systemError } = await supabase
      .from('TTRPGs')
      .select('id, TTRPG_name, show, DND_Mod, Custom_System, Initials')
      .order('TTRPG_name', { ascending: true });

    if (systemError) throw systemError;

    const mapped = (data || []).map((row) => ({
      id: row.id,
      name: row.TTRPG_name,
      show: Boolean(row.show),
      dndMod: Boolean(row.DND_Mod),
      customSystem: Boolean(row.Custom_System),
      initials: row.Initials || '',
    }));

    const visible = isAdmin ? mapped : mapped.filter((row) => row.show);
    setSystems(visible);

    if (visible.length > 0) {
      setSelectedSystemId((prev) => {
        if (prev && visible.some((row) => String(row.id) === String(prev))) return prev;
        return String(visible[0].id);
      });
    }
  }, [isAdmin]);

  const tryLoadByUserColumn = useCallback(async (tableName, columnName, currentUserId, ttrpgId = null) => {
    let query = supabase.from(tableName).select('*').eq(columnName, currentUserId).order('id', { ascending: true });
    if (ttrpgId != null) query = query.eq('TTRPG', ttrpgId);
    return query;
  }, []);

  const loadCharactersForSystem = useCallback(async (systemRow, currentUserId) => {
    setCharacterLoadError('');
    setAvailableCharacters([]);
    setSelectedCharacterId('');

    if (!systemRow) return;

    const initials = normalizeInitials(systemRow);
    const isSW = initials === 'SW' || /star\s*wars/i.test(systemRow.name || '');
    const tableName = systemRow.dndMod
      ? 'DND_player_character'
      : isSW
        ? 'SW_player_characters'
        : isFalloutInitials(initials)
          ? 'Fa_player_characters'
          : `${initials}_player_characters`;

    let rows = null;
    let lastError = null;

    for (const userColumn of USER_COLUMNS) {
      const { data, error: queryError } = await tryLoadByUserColumn(
        tableName,
        userColumn,
        currentUserId,
        systemRow.dndMod ? systemRow.id : null
      );

      if (queryError) {
        if (isMissingColumnError(queryError)) {
          lastError = queryError;
          continue;
        }
        if (isMissingRelationError(queryError)) {
          setCharacterLoadError(`${tableName} is missing. Create this table to use characters here.`);
          return;
        }
        lastError = queryError;
        continue;
      }

      rows = data || [];
      break;
    }

    if (rows == null) {
      let fallbackQuery = supabase.from(tableName).select('*').order('id', { ascending: true });
      if (systemRow.dndMod) fallbackQuery = fallbackQuery.eq('TTRPG', systemRow.id);
      const { data, error: fallbackError } = await fallbackQuery;

      if (fallbackError) {
        if (isMissingRelationError(fallbackError)) {
          setCharacterLoadError(`${tableName} is missing. Create this table to use characters here.`);
          return;
        }
        setCharacterLoadError('Could not load characters for this system.');
        return;
      }

      rows = (data || []).filter((row) => USER_COLUMNS.some((column) => String(row?.[column]) === String(currentUserId)));
      if (rows.length === 0 && lastError) {
        setCharacterLoadError('No matching user column was found on this character table.');
      }
    }

    const normalized = (rows || [])
      .filter((row) => row?.id != null)
      .map((row) => ({
        id: row.id,
        name: getCharacterName(row),
        subtitle: getCharacterSubtitle(row),
        classLabel: getCharacterClass(row),
        raceLabel: getCharacterRace(row),
        pictureSrc: getCharacterPicture(row, isSW),
        raw: row,
      }));

    setAvailableCharacters(normalized);
    if (normalized.length > 0) {
      setSelectedCharacterId(String(normalized[0].id));
    }
  }, [tryLoadByUserColumn]);

  const loadAdventuresForSystem = useCallback(async (systemId) => {
    setAvailableAdventures([]);
    setSelectedAdventureId('');

    if (!systemId) return;

    let query = supabase
      .from('Solo_Adventures')
      .select('id, Title, Description, TTRPG, Is_Published, Created_By, updated_at')
      .eq('TTRPG', Number(systemId))
      .order('Title', { ascending: true });

    if (!isAdmin) query = query.eq('Is_Published', true);

    const { data, error: adventureError } = await query;
    if (adventureError) {
      setError('Failed to load solo adventures. Run the Solo Adventure migration in SQL first.');
      return;
    }

    const rows = data || [];
    setAvailableAdventures(rows);
    if (rows.length > 0) setSelectedAdventureId(String(rows[0].id));
  }, [isAdmin]);

  const loadAdventureGraph = async (adventureId) => {
    const { data: nodes, error: nodeError } = await supabase
      .from('Solo_Adventure_Nodes')
      .select('id, Adventure_ID, Node_Title, Node_Content, Display_Order, Is_Start')
      .eq('Adventure_ID', Number(adventureId))
      .order('Display_Order', { ascending: true })
      .order('id', { ascending: true });

    if (nodeError) throw nodeError;

    const nodeList = nodes || [];
    if (nodeList.length === 0) {
      throw new Error('This adventure has no pages yet.');
    }

    const nodeIds = nodeList.map((node) => node.id);
    const fullChoiceSelect = 'id, Node_ID, Choice_Text, Next_Node_ID, Check_Enabled, Check_Skill, Check_Difficulty, Check_Failure_Next_Node_ID, Display_Order';
    const fallbackChoiceSelect = 'id, Node_ID, Choice_Text, Next_Node_ID, Display_Order';

    let choices = [];
    const { data: fullChoices, error: fullChoiceError } = await supabase
      .from('Solo_Adventure_Choices')
      .select(fullChoiceSelect)
      .in('Node_ID', nodeIds)
      .order('Display_Order', { ascending: true })
      .order('id', { ascending: true });

    if (fullChoiceError) {
      if (!isMissingColumnError(fullChoiceError)) throw fullChoiceError;

      const { data: fallbackChoices, error: fallbackChoiceError } = await supabase
        .from('Solo_Adventure_Choices')
        .select(fallbackChoiceSelect)
        .in('Node_ID', nodeIds)
        .order('Display_Order', { ascending: true })
        .order('id', { ascending: true });

      if (fallbackChoiceError) throw fallbackChoiceError;

      choices = (fallbackChoices || []).map((choice) => ({
        ...choice,
        Check_Enabled: false,
        Check_Skill: null,
        Check_Difficulty: 0,
        Check_Failure_Next_Node_ID: null,
      }));
    } else {
      choices = fullChoices || [];
    }

    const nodesById = {};
    nodeList.forEach((node) => {
      nodesById[node.id] = node;
    });

    const choicesByNode = {};
    choices.forEach((choice) => {
      if (!choicesByNode[choice.Node_ID]) choicesByNode[choice.Node_ID] = [];
      choicesByNode[choice.Node_ID].push(choice);
    });

    const startNode = nodeList.find((node) => node.Is_Start) || nodeList[0];

    return {
      startNode,
      nodesById,
      choicesByNode,
    };
  };

  const runSwSkillCheck = async (characterRow, skillName, difficulty) => {
    const normalizedSkillName = String(skillName || '').trim();
    if (!normalizedSkillName) {
      return { error: 'This choice requires a skill name.' };
    }

    const parsedDifficulty = Math.max(0, sanitizeInteger(difficulty, 0));
    if (parsedDifficulty < 1) {
      return { error: 'Difficulty must be at least 1 for a skill check.' };
    }

    const { data: skillsData, error: skillError } = await supabase
      .from('skills')
      .select('skill, stat');

    if (skillError) {
      return { error: 'Failed to load Star Wars skills for the check.' };
    }

    const matchedSkill = (skillsData || []).find(
      (row) => String(row.skill || '').trim().toLowerCase() === normalizedSkillName.toLowerCase()
    );

    if (!matchedSkill) {
      return { error: `Skill "${normalizedSkillName}" was not found in the Star Wars skills table.` };
    }

    const skillRanks = countSkillRanksFromCsv(characterRow?.skills_rank);
    const rank = skillRanks[matchedSkill.skill] || skillRanks[normalizedSkillName] || 0;
    const baseStat = getCharacterStatValue(characterRow, matchedSkill.stat);

    let dicePool = 'G'.repeat(baseStat);
    if (rank > 0) {
      const yCount = Math.min(rank, dicePool.length);
      const poolChars = dicePool.split('');
      for (let index = 0; index < yCount; index++) {
        poolChars[index] = 'Y';
      }
      dicePool = poolChars.join('');
    }

    const dieFacesCache = {};
    const poolResults = [];
    for (const colour of dicePool.split('')) {
      const available = await getSwDieFaces(colour, dieFacesCache);
      poolResults.push(available.length > 0 ? available[Math.floor(Math.random() * available.length)] : '—');
    }

    const diffResults = [];
    for (let index = 0; index < parsedDifficulty; index++) {
      const available = await getSwDieFaces('P', dieFacesCache);
      diffResults.push(available.length > 0 ? available[Math.floor(Math.random() * available.length)] : '—');
    }

    const summary = parseSwRollResults(poolResults, diffResults);
    const passed = summary.netSuccess > 0;

    return {
      skill: matchedSkill.skill,
      difficulty: parsedDifficulty,
      dicePool,
      poolResults,
      diffResults,
      summary,
      passed,
    };
  };

  const startAdventureRun = async () => {
    clearMessages();

    if (!selectedSystem || !selectedCharacter || !selectedAdventure) {
      setError('Choose a system, character, and adventure before starting.');
      return;
    }

    try {
      const graph = await loadAdventureGraph(selectedAdventure.id);
      const pathStart = [{ nodeId: graph.startNode.id, at: new Date().toISOString() }];

      setGraphNodesById(graph.nodesById);
      setGraphChoicesByNodeId(graph.choicesByNode);
      setActiveNodeId(graph.startNode.id);
      setRunPath(pathStart);
      setRunCompleted(false);
      setLastSkillCheck(null);

      const payload = {
        Adventure_ID: selectedAdventure.id,
        Node_ID: graph.startNode.id,
        Character_ID: selectedCharacter.id,
        Character_Name: selectedCharacter.name,
        TTRPG: selectedSystem.id,
        User_ID: userId,
        Path: pathStart,
        Completed: false,
      };

      const { data, error: insertError } = await supabase
        .from('Solo_Adventure_Runs')
        .insert([payload])
        .select('id')
        .maybeSingle();

      if (insertError) {
        setRunId(null);
      } else {
        setRunId(data?.id ?? null);
      }
    } catch (runError) {
      console.error('Failed to start adventure run:', runError);
      setError(runError?.message || 'Failed to start this adventure.');
    }
  };

  const choosePath = async (choice) => {
    if (!choice) return;

    let nextNodeId = choice.Next_Node_ID;
    let skillCheckSummary = null;

    if (!choice.Check_Enabled) {
      setLastSkillCheck(null);
    }

    if (choice.Check_Enabled) {
      if (!isStarWarsSystem(selectedSystem)) {
        setError('Skill checks are currently supported for Star Wars adventures only.');
        return;
      }

      const result = await runSwSkillCheck(selectedCharacter?.raw, choice.Check_Skill, choice.Check_Difficulty);
      if (result?.error) {
        setError(result.error);
        return;
      }

      setError('');
      setLastSkillCheck(result);
      skillCheckSummary = {
        skill: result.skill,
        difficulty: result.difficulty,
        passed: result.passed,
        netSuccess: result.summary.netSuccess,
        netFailure: result.summary.netFailure,
      };

      nextNodeId = result.passed ? choice.Next_Node_ID : choice.Check_Failure_Next_Node_ID;
    }

    const timestamp = new Date().toISOString();
    const nextPath = [
      ...runPath,
      {
        nodeId: activeNodeId,
        choiceId: choice.id,
        nextNodeId,
        ...(skillCheckSummary ? { skillCheck: skillCheckSummary } : {}),
        at: timestamp,
      },
    ];

    if (nextNodeId == null || !graphNodesById[nextNodeId]) {
      setRunPath(nextPath);
      setRunCompleted(true);
      setActiveNodeId(null);

      if (runId != null) {
        await supabase
          .from('Solo_Adventure_Runs')
          .update({
            Node_ID: null,
            Path: nextPath,
            Completed: true,
          })
          .eq('id', runId);
      }
      return;
    }

    setRunPath(nextPath);
    setActiveNodeId(nextNodeId);

    if (runId != null) {
      await supabase
        .from('Solo_Adventure_Runs')
        .update({
          Node_ID: nextNodeId,
          Path: nextPath,
          Completed: false,
        })
        .eq('id', runId);
    }
  };

  const loadBuilderAdventures = async () => {
    const { data, error: loadError } = await supabase
      .from('Solo_Adventures')
      .select('id, Title, Description, TTRPG, Is_Published, Created_By, updated_at')
      .order('updated_at', { ascending: false });

    if (loadError) throw loadError;
    setBuilderAdventures(data || []);
  };

  const loadBuilderNodes = async (adventureId) => {
    if (!adventureId || adventureId === '__new__') {
      setBuilderNodes([]);
      resetBuilderNodeForm();
      setBuilderChoices([]);
      resetBuilderChoiceForm();
      return;
    }

    const { data, error: nodeError } = await supabase
      .from('Solo_Adventure_Nodes')
      .select('id, Adventure_ID, Node_Title, Node_Content, Display_Order, Is_Start')
      .eq('Adventure_ID', Number(adventureId))
      .order('Display_Order', { ascending: true })
      .order('id', { ascending: true });

    if (nodeError) throw nodeError;
    setBuilderNodes(data || []);
    resetBuilderNodeForm();
    setBuilderChoices([]);
    resetBuilderChoiceForm();
  };

  const loadBuilderChoices = async (nodeId) => {
    if (!nodeId || nodeId === '__new__') {
      setBuilderChoices([]);
      resetBuilderChoiceForm();
      return;
    }

    const fullChoiceSelect = 'id, Node_ID, Choice_Text, Next_Node_ID, Check_Enabled, Check_Skill, Check_Difficulty, Check_Failure_Next_Node_ID, Display_Order';
    const fallbackChoiceSelect = 'id, Node_ID, Choice_Text, Next_Node_ID, Display_Order';

    const { data: fullData, error: fullChoiceError } = await supabase
      .from('Solo_Adventure_Choices')
      .select(fullChoiceSelect)
      .eq('Node_ID', Number(nodeId))
      .order('Display_Order', { ascending: true })
      .order('id', { ascending: true });

    if (!fullChoiceError) {
      setBuilderChoices(fullData || []);
      resetBuilderChoiceForm();
      return;
    }

    if (!isMissingColumnError(fullChoiceError)) throw fullChoiceError;

    const { data: fallbackData, error: fallbackChoiceError } = await supabase
      .from('Solo_Adventure_Choices')
      .select(fallbackChoiceSelect)
      .eq('Node_ID', Number(nodeId))
      .order('Display_Order', { ascending: true })
      .order('id', { ascending: true });

    if (fallbackChoiceError) throw fallbackChoiceError;

    setBuilderChoices((fallbackData || []).map((choice) => ({
      ...choice,
      Check_Enabled: false,
      Check_Skill: null,
      Check_Difficulty: 0,
      Check_Failure_Next_Node_ID: null,
    })));
    resetBuilderChoiceForm();
  };

  const handleSelectBuilderAdventure = async (value) => {
    clearMessages();
    setBuilderSelectedAdventureId(value);

    if (value === '__new__') {
      setBuilderAdventureTitle('');
      setBuilderAdventureDescription('');
      setBuilderAdventureSystemId('');
      setBuilderAdventurePublished(false);
      await loadBuilderNodes('__new__');
      return;
    }

    const selected = builderAdventures.find((row) => String(row.id) === String(value));
    if (!selected) return;

    setBuilderAdventureTitle(selected.Title || '');
    setBuilderAdventureDescription(selected.Description || '');
    setBuilderAdventureSystemId(selected.TTRPG != null ? String(selected.TTRPG) : '');
    setBuilderAdventurePublished(Boolean(selected.Is_Published));
    await loadBuilderNodes(selected.id);
  };

  const handleSaveAdventure = async () => {
    clearMessages();
    if (!builderAdventureTitle.trim()) {
      setError('Adventure title is required.');
      return;
    }
    if (!builderAdventureSystemId) {
      setError('Select a system for this adventure.');
      return;
    }

    setSavingAdventure(true);
    try {
      const payload = {
        Title: builderAdventureTitle.trim(),
        Description: builderAdventureDescription.trim(),
        TTRPG: Number(builderAdventureSystemId),
        Is_Published: builderAdventurePublished,
        Created_By: userId,
      };

      if (builderSelectedAdventureId === '__new__') {
        const { data, error: insertError } = await supabase
          .from('Solo_Adventures')
          .insert([payload])
          .select('id')
          .single();

        if (insertError) throw insertError;

        await loadBuilderAdventures();
        await handleSelectBuilderAdventure(String(data.id));
        setSuccess('Adventure created. You can now add pages and choices.');
      } else {
        const { error: updateError } = await supabase
          .from('Solo_Adventures')
          .update(payload)
          .eq('id', Number(builderSelectedAdventureId));

        if (updateError) throw updateError;

        await loadBuilderAdventures();
        setSuccess('Adventure updated.');
      }
    } catch (saveError) {
      console.error('Failed to save adventure:', saveError);
      setError('Failed to save adventure.');
    } finally {
      setSavingAdventure(false);
    }
  };

  const handleDeleteAdventure = async () => {
    clearMessages();
    if (builderSelectedAdventureId === '__new__') return;
    if (!confirm('Delete this adventure and all of its pages and choices?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('Solo_Adventures')
        .delete()
        .eq('id', Number(builderSelectedAdventureId));

      if (deleteError) throw deleteError;
      await loadBuilderAdventures();
      resetBuilderAdventureForm();
      setSuccess('Adventure deleted.');
    } catch (deleteErr) {
      console.error('Failed to delete adventure:', deleteErr);
      setError('Failed to delete adventure.');
    }
  };

  const handleSelectBuilderNode = async (value) => {
    clearMessages();
    setBuilderSelectedNodeId(value);

    if (value === '__new__') {
      resetBuilderNodeForm();
      await loadBuilderChoices('__new__');
      return;
    }

    const selected = builderNodes.find((row) => String(row.id) === String(value));
    if (!selected) return;

    setBuilderNodeTitle(selected.Node_Title || '');
    setBuilderNodeContent(selected.Node_Content || '');
    setBuilderNodeOrder(String(selected.Display_Order ?? 0));
    setBuilderNodeIsStart(Boolean(selected.Is_Start));
    await loadBuilderChoices(selected.id);
  };

  const handleSaveNode = async () => {
    clearMessages();

    if (builderSelectedAdventureId === '__new__') {
      setError('Save the adventure first, then add pages.');
      return;
    }

    if (!builderNodeContent.trim()) {
      setError('Page content is required.');
      return;
    }

    setSavingNode(true);
    try {
      if (builderNodeIsStart) {
        const { error: clearStartError } = await supabase
          .from('Solo_Adventure_Nodes')
          .update({ Is_Start: false })
          .eq('Adventure_ID', Number(builderSelectedAdventureId));

        if (clearStartError) throw clearStartError;
      }

      const payload = {
        Adventure_ID: Number(builderSelectedAdventureId),
        Node_Title: builderNodeTitle.trim(),
        Node_Content: builderNodeContent,
        Display_Order: sanitizeInteger(builderNodeOrder, 0),
        Is_Start: builderNodeIsStart,
      };

      if (builderSelectedNodeId === '__new__') {
        const { data, error: insertError } = await supabase
          .from('Solo_Adventure_Nodes')
          .insert([payload])
          .select('id')
          .single();

        if (insertError) throw insertError;
        await loadBuilderNodes(builderSelectedAdventureId);
        await handleSelectBuilderNode(String(data.id));
        setSuccess('Page created.');
      } else {
        const { error: updateError } = await supabase
          .from('Solo_Adventure_Nodes')
          .update(payload)
          .eq('id', Number(builderSelectedNodeId));

        if (updateError) throw updateError;
        await loadBuilderNodes(builderSelectedAdventureId);
        await handleSelectBuilderNode(String(builderSelectedNodeId));
        setSuccess('Page updated.');
      }
    } catch (saveError) {
      console.error('Failed to save node:', saveError);
      setError('Failed to save page.');
    } finally {
      setSavingNode(false);
    }
  };

  const handleDeleteNode = async () => {
    clearMessages();
    if (builderSelectedNodeId === '__new__') return;
    if (!confirm('Delete this page and its choices?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('Solo_Adventure_Nodes')
        .delete()
        .eq('id', Number(builderSelectedNodeId));

      if (deleteError) throw deleteError;
      await loadBuilderNodes(builderSelectedAdventureId);
      setSuccess('Page deleted.');
    } catch (deleteError) {
      console.error('Failed to delete node:', deleteError);
      setError('Failed to delete page.');
    }
  };

  const handleSelectBuilderChoice = (value) => {
    clearMessages();
    setBuilderSelectedChoiceId(value);

    if (value === '__new__') {
      resetBuilderChoiceForm();
      return;
    }

    const selected = builderChoices.find((row) => String(row.id) === String(value));
    if (!selected) return;

    setBuilderChoiceText(selected.Choice_Text || '');
    setBuilderChoiceNextNodeId(selected.Next_Node_ID != null ? String(selected.Next_Node_ID) : '');
    setBuilderChoiceRequiresCheck(Boolean(selected.Check_Enabled));
    setBuilderChoiceCheckSkill(selected.Check_Skill || '');
    setBuilderChoiceCheckDifficulty(String(selected.Check_Difficulty ?? 2));
    setBuilderChoiceFailureNodeId(selected.Check_Failure_Next_Node_ID != null ? String(selected.Check_Failure_Next_Node_ID) : '');
    setBuilderChoiceOrder(String(selected.Display_Order ?? 0));
  };

  const handleSaveChoice = async () => {
    clearMessages();

    if (builderSelectedNodeId === '__new__') {
      setError('Select a page before adding choices.');
      return;
    }

    if (!builderChoiceText.trim()) {
      setError('Choice text is required.');
      return;
    }

    if (builderChoiceRequiresCheck && !builderChoiceCheckSkill.trim()) {
      setError('Skill name is required when a check is enabled.');
      return;
    }

    const checkDifficulty = Math.max(0, sanitizeInteger(builderChoiceCheckDifficulty, 0));
    if (builderChoiceRequiresCheck && checkDifficulty < 1) {
      setError('Skill check difficulty must be at least 1.');
      return;
    }

    setSavingChoice(true);
    try {
      const payload = {
        Node_ID: Number(builderSelectedNodeId),
        Choice_Text: builderChoiceText.trim(),
        Next_Node_ID: builderChoiceNextNodeId ? Number(builderChoiceNextNodeId) : null,
        Check_Enabled: builderChoiceRequiresCheck,
        Check_Skill: builderChoiceRequiresCheck ? builderChoiceCheckSkill.trim() : null,
        Check_Difficulty: builderChoiceRequiresCheck ? checkDifficulty : 0,
        Check_Failure_Next_Node_ID: builderChoiceRequiresCheck && builderChoiceFailureNodeId ? Number(builderChoiceFailureNodeId) : null,
        Display_Order: sanitizeInteger(builderChoiceOrder, 0),
      };

      if (builderSelectedChoiceId === '__new__') {
        const { data, error: insertError } = await supabase
          .from('Solo_Adventure_Choices')
          .insert([payload])
          .select('id')
          .single();

        if (insertError) throw insertError;
        await loadBuilderChoices(builderSelectedNodeId);
        handleSelectBuilderChoice(String(data.id));
        setSuccess('Choice created.');
      } else {
        const { error: updateError } = await supabase
          .from('Solo_Adventure_Choices')
          .update(payload)
          .eq('id', Number(builderSelectedChoiceId));

        if (updateError) throw updateError;
        await loadBuilderChoices(builderSelectedNodeId);
        handleSelectBuilderChoice(String(builderSelectedChoiceId));
        setSuccess('Choice updated.');
      }
    } catch (saveError) {
      console.error('Failed to save choice:', saveError);
      setError('Failed to save choice.');
    } finally {
      setSavingChoice(false);
    }
  };

  const handleDeleteChoice = async () => {
    clearMessages();
    if (builderSelectedChoiceId === '__new__') return;
    if (!confirm('Delete this choice?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('Solo_Adventure_Choices')
        .delete()
        .eq('id', Number(builderSelectedChoiceId));

      if (deleteError) throw deleteError;
      await loadBuilderChoices(builderSelectedNodeId);
      setSuccess('Choice deleted.');
    } catch (deleteError) {
      console.error('Failed to delete choice:', deleteError);
      setError('Failed to delete choice.');
    }
  };

  useEffect(() => {
    const init = async () => {
      clearMessages();
      setLoading(true);

      try {
        await loadCurrentUser();
      } catch (initError) {
        console.error('Failed to load user for solo adventure:', initError);
        setError('Could not load your user profile.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const refreshSystems = async () => {
      if (loading) return;
      try {
        await loadSystems();
      } catch (systemError) {
        console.error('Failed to load systems for solo adventure:', systemError);
        setError('Could not load TTRPG systems.');
      }
    };

    refreshSystems();
  }, [loading, loadSystems]);

  useEffect(() => {
    const refreshPlaySelectors = async () => {
      if (!selectedSystem || userId == null) return;
      resetPlayState();
      clearMessages();

      await loadCharactersForSystem(selectedSystem, userId);
      await loadAdventuresForSystem(selectedSystem.id);
    };

    refreshPlaySelectors();
  }, [selectedSystem, userId, loadCharactersForSystem, loadAdventuresForSystem]);

  useEffect(() => {
    const refreshBuilder = async () => {
      if (!isAdmin) return;
      try {
        await loadBuilderAdventures();
      } catch (builderError) {
        console.error('Failed to load builder adventures:', builderError);
        setError('Failed to load adventure builder data.');
      }
    };

    refreshBuilder();
  }, [isAdmin]);

  useEffect(() => {
    if (!builderChoiceRequiresCheck) {
      setBuilderSkillOptions([]);
      setBuilderSkillOptionsHint('');
      setBuilderSkillOptionsLoading(false);
      return;
    }

    const refreshSkillOptions = async () => {
      await loadBuilderSkillOptions(builderSelectedSystem);
    };

    refreshSkillOptions();
  }, [builderChoiceRequiresCheck, builderSelectedSystem, loadBuilderSkillOptions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 px-4 py-8">
        <div className="mx-auto max-w-6xl rounded-xl border border-gray-300 bg-white p-6 shadow">
          <p className="text-sm text-gray-700">Loading solo adventures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto w-full max-w-6xl rounded-xl border border-gray-300 bg-white p-6 shadow">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Solo Adventure</h1>
          <button
            onClick={() => navigate('/select-ttrpg')}
            className="rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-800"
          >
            Back
          </button>
        </div>

        {error && <p className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {success && <p className="mb-3 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>}

        <div className="mb-4 flex gap-3">
          <button
            onClick={() => { clearMessages(); setActiveTab('play'); }}
            className={`rounded px-4 py-2 font-semibold ${activeTab === 'play' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          >
            Play
          </button>
          {isAdmin && (
            <button
              onClick={() => { clearMessages(); setActiveTab('builder'); }}
              className={`rounded px-4 py-2 font-semibold ${activeTab === 'builder' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              Builder
            </button>
          )}
        </div>

        {activeTab === 'play' && (
          <div className="space-y-4">
            <div className="rounded border border-gray-300 bg-gray-50 p-4">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Start a Solo Adventure</h2>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">System</label>
                  <select
                    value={selectedSystemId}
                    onChange={(e) => setSelectedSystemId(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2"
                  >
                    {systems.map((system) => (
                      <option key={system.id} value={String(system.id)}>{system.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Your Character</label>
                  <select
                    value={selectedCharacterId}
                    onChange={(e) => setSelectedCharacterId(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2"
                  >
                    <option value="">-- Select Character --</option>
                    {availableCharacters.map((character) => (
                      <option key={character.id} value={String(character.id)}>{character.name}</option>
                    ))}
                  </select>
                  {characterLoadError && <p className="mt-1 text-xs text-red-700">{characterLoadError}</p>}
                  {!characterLoadError && availableCharacters.length === 0 && (
                    <p className="mt-1 text-xs text-gray-600">No characters found for this system.</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Adventure</label>
                  <select
                    value={selectedAdventureId}
                    onChange={(e) => setSelectedAdventureId(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2"
                  >
                    <option value="">-- Select Adventure --</option>
                    {availableAdventures.map((adventure) => (
                      <option key={adventure.id} value={String(adventure.id)}>{adventure.Title}</option>
                    ))}
                  </select>
                  {availableAdventures.length === 0 && (
                    <p className="mt-1 text-xs text-gray-600">No solo adventures available for this system yet.</p>
                  )}
                </div>
              </div>

              {selectedCharacter && (
                <div
                  className="mt-4 rounded-xl border-2 border-red-600 p-4"
                  style={{ backgroundColor: '#000000' }}
                >
                  <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
                    <div style={{ flexShrink: 0 }}>
                      {selectedCharacter.pictureSrc ? (
                        <img
                          src={selectedCharacter.pictureSrc}
                          alt={selectedCharacter.name}
                          className="rounded object-contain"
                          style={{ width: '80px', height: '100px' }}
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="100"%3E%3Crect fill="%23333" width="80" height="100"/%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <div
                          className="rounded"
                          style={{ width: '80px', height: '100px', backgroundColor: '#333333' }}
                        />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 220 }}>
                      <h3 className="text-lg font-bold" style={{ color: '#ffffff' }}>{selectedCharacter.name}</h3>
                      <p className="text-sm" style={{ color: '#dddddd' }}>
                        Class: {selectedCharacter.classLabel || 'Unknown'}
                      </p>
                      <p className="text-sm" style={{ color: '#999999' }}>
                        Race: {selectedCharacter.raceLabel || 'Unknown'}
                      </p>
                      {selectedCharacter.subtitle && (
                        <p className="mt-1 text-xs" style={{ color: '#aaaaaa' }}>{selectedCharacter.subtitle}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedAdventure?.Description && (
                <p className="mt-2 whitespace-pre-wrap rounded border border-gray-200 bg-white p-3 text-sm text-gray-700">
                  {selectedAdventure.Description}
                </p>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  onClick={startAdventureRun}
                  className="rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
                >
                  Start Adventure
                </button>
                <button
                  onClick={() => {
                    resetPlayState();
                    clearMessages();
                  }}
                  className="rounded bg-gray-500 px-4 py-2 font-semibold text-white hover:bg-gray-600"
                >
                  Reset
                </button>
              </div>
            </div>

            {(currentNode || runCompleted) && (
              <div className="rounded border border-gray-300 bg-gray-50 p-4">
                {currentNode && (
                  <>
                    <h2 className="mb-2 text-xl font-bold text-gray-900">
                      {currentNode.Node_Title || 'Adventure Page'}
                    </h2>
                    <p className="whitespace-pre-wrap rounded border border-gray-200 bg-white p-4 text-sm text-gray-800">
                      {currentNode.Node_Content}
                    </p>

                    <div className="mt-4 space-y-2">
                      {lastSkillCheck && (
                        <div className="rounded border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
                          <div className="font-semibold">
                            Last Check: {lastSkillCheck.skill} vs Difficulty {lastSkillCheck.difficulty} — {lastSkillCheck.passed ? 'Success' : 'Failure'}
                          </div>
                          <div className="text-xs mt-1">
                            Net Success: {lastSkillCheck.summary.netSuccess} | Net Failure: {lastSkillCheck.summary.netFailure}
                          </div>
                        </div>
                      )}

                      {currentNodeChoices.length > 0 ? (
                        currentNodeChoices.map((choice) => (
                          <button
                            key={choice.id}
                            onClick={() => choosePath(choice)}
                            className="block w-full rounded border border-indigo-600 bg-indigo-50 px-3 py-2 text-left font-medium text-indigo-700 hover:bg-indigo-100"
                          >
                            {choice.Choice_Text}
                            {choice.Check_Enabled && (
                              <span className="block text-xs text-indigo-900 mt-1">
                                Skill Check: {choice.Check_Skill || 'Unknown Skill'} (Difficulty {choice.Check_Difficulty || 0})
                              </span>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                          This page has no choices, so your run has ended.
                        </div>
                      )}
                    </div>
                  </>
                )}

                {runCompleted && (
                  <div className="rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
                    Adventure complete. You reached an ending.
                  </div>
                )}

                {runPath.length > 0 && (
                  <div className="mt-4">
                    <h3 className="mb-1 text-sm font-semibold text-gray-700">Path History</h3>
                    <p className="rounded border border-gray-200 bg-white p-2 text-xs text-gray-600">
                      Steps: {runPath.length}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'builder' && isAdmin && (
          <div className="space-y-6">
            <div className="rounded border border-gray-300 bg-gray-50 p-4">
              <h2 className="mb-3 text-xl font-semibold text-gray-900">Adventure Builder</h2>

              <label className="mb-1 block text-sm font-medium text-gray-700">Existing Adventure</label>
              <select
                value={builderSelectedAdventureId}
                onChange={(e) => handleSelectBuilderAdventure(e.target.value)}
                className="mb-3 w-full rounded border border-gray-300 px-3 py-2"
              >
                <option value="__new__">-- Create New Adventure --</option>
                {builderAdventures.map((adventure) => (
                  <option key={adventure.id} value={String(adventure.id)}>
                    {adventure.Title} {adventure.Is_Published ? '(Published)' : '(Draft)'}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
                  <input
                    value={builderAdventureTitle}
                    onChange={(e) => setBuilderAdventureTitle(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    placeholder="Adventure title"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">System</label>
                  <select
                    value={builderAdventureSystemId}
                    onChange={(e) => setBuilderAdventureSystemId(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2"
                  >
                    <option value="">-- Select System --</option>
                    {systems.map((system) => (
                      <option key={system.id} value={String(system.id)}>{system.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="mb-1 mt-3 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={builderAdventureDescription}
                onChange={(e) => setBuilderAdventureDescription(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2"
                rows={3}
              />

              <label className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={builderAdventurePublished}
                  onChange={(e) => setBuilderAdventurePublished(e.target.checked)}
                />
                Published (visible in Play mode)
              </label>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleSaveAdventure}
                  disabled={savingAdventure}
                  className="rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                >
                  {savingAdventure ? 'Saving...' : 'Save Adventure'}
                </button>
                {builderSelectedAdventureId !== '__new__' && (
                  <button
                    onClick={handleDeleteAdventure}
                    className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                  >
                    Delete Adventure
                  </button>
                )}
                <button
                  onClick={resetBuilderAdventureForm}
                  className="rounded bg-gray-500 px-4 py-2 font-semibold text-white hover:bg-gray-600"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded border border-gray-300 bg-gray-50 p-4">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">Pages / Nodes</h3>

                <label className="mb-1 block text-sm font-medium text-gray-700">Existing Page</label>
                <select
                  value={builderSelectedNodeId}
                  onChange={(e) => handleSelectBuilderNode(e.target.value)}
                  className="mb-3 w-full rounded border border-gray-300 px-3 py-2"
                  disabled={builderSelectedAdventureId === '__new__'}
                >
                  <option value="__new__">-- Create New Page --</option>
                  {builderNodes.map((node) => (
                    <option key={node.id} value={String(node.id)}>
                      {node.Is_Start ? '[START] ' : ''}{node.Node_Title || `Page ${node.id}`}
                    </option>
                  ))}
                </select>

                <label className="mb-1 block text-sm font-medium text-gray-700">Page Title</label>
                <input
                  value={builderNodeTitle}
                  onChange={(e) => setBuilderNodeTitle(e.target.value)}
                  className="mb-3 w-full rounded border border-gray-300 px-3 py-2"
                  placeholder="Optional title"
                  disabled={builderSelectedAdventureId === '__new__'}
                />

                <label className="mb-1 block text-sm font-medium text-gray-700">Page Content</label>
                <textarea
                  value={builderNodeContent}
                  onChange={(e) => setBuilderNodeContent(e.target.value)}
                  className="mb-3 w-full rounded border border-gray-300 px-3 py-2"
                  rows={6}
                  placeholder="Write the narrative content for this page"
                  disabled={builderSelectedAdventureId === '__new__'}
                />

                <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Display Order</label>
                    <input
                      type="number"
                      value={builderNodeOrder}
                      onChange={(e) => setBuilderNodeOrder(e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      disabled={builderSelectedAdventureId === '__new__'}
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 self-end text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={builderNodeIsStart}
                      onChange={(e) => setBuilderNodeIsStart(e.target.checked)}
                      disabled={builderSelectedAdventureId === '__new__'}
                    />
                    Start Page
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveNode}
                    disabled={savingNode || builderSelectedAdventureId === '__new__'}
                    className="rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                  >
                    {savingNode ? 'Saving...' : 'Save Page'}
                  </button>
                  {builderSelectedNodeId !== '__new__' && (
                    <button
                      onClick={handleDeleteNode}
                      className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                    >
                      Delete Page
                    </button>
                  )}
                  <button
                    onClick={resetBuilderNodeForm}
                    className="rounded bg-gray-500 px-4 py-2 font-semibold text-white hover:bg-gray-600"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="rounded border border-gray-300 bg-gray-50 p-4">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">Choices</h3>

                <label className="mb-1 block text-sm font-medium text-gray-700">Existing Choice</label>
                <select
                  value={builderSelectedChoiceId}
                  onChange={(e) => handleSelectBuilderChoice(e.target.value)}
                  className="mb-3 w-full rounded border border-gray-300 px-3 py-2"
                  disabled={builderSelectedNodeId === '__new__'}
                >
                  <option value="__new__">-- Create New Choice --</option>
                  {builderChoices.map((choice) => (
                    <option key={choice.id} value={String(choice.id)}>
                      {choice.Choice_Text}{choice.Check_Enabled ? ' [Skill Check]' : ''}
                    </option>
                  ))}
                </select>

                <label className="mb-1 block text-sm font-medium text-gray-700">Choice Text</label>
                <input
                  value={builderChoiceText}
                  onChange={(e) => setBuilderChoiceText(e.target.value)}
                  className="mb-3 w-full rounded border border-gray-300 px-3 py-2"
                  placeholder="e.g. Enter the cave"
                  disabled={builderSelectedNodeId === '__new__'}
                />

                <label className="mb-1 block text-sm font-medium text-gray-700">Go To Page</label>
                <select
                  value={builderChoiceNextNodeId}
                  onChange={(e) => setBuilderChoiceNextNodeId(e.target.value)}
                  className="mb-3 w-full rounded border border-gray-300 px-3 py-2"
                  disabled={builderSelectedNodeId === '__new__'}
                >
                  <option value="">-- End Adventure (no next page) --</option>
                  {builderNodes.map((node) => (
                    <option key={node.id} value={String(node.id)}>
                      {node.Node_Title || `Page ${node.id}`}
                    </option>
                  ))}
                </select>

                <label className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={builderChoiceRequiresCheck}
                    onChange={(e) => setBuilderChoiceRequiresCheck(e.target.checked)}
                    disabled={builderSelectedNodeId === '__new__'}
                  />
                  Requires Skill Check
                </label>

                {builderChoiceRequiresCheck && (
                  <>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Skill</label>
                    <select
                      value={builderChoiceCheckSkill}
                      onChange={(e) => setBuilderChoiceCheckSkill(e.target.value)}
                      className="mb-2 w-full rounded border border-gray-300 px-3 py-2"
                      disabled={builderSelectedNodeId === '__new__' || builderSkillOptionsLoading || builderSkillOptionsForSelect.length === 0}
                    >
                      <option value="">-- Select Skill --</option>
                      {builderSkillOptionsForSelect.map((skillName) => (
                        <option key={skillName} value={skillName}>{skillName}</option>
                      ))}
                    </select>
                    {builderSkillOptionsLoading && (
                      <p className="mb-2 text-xs text-gray-600">Loading skills...</p>
                    )}
                    {!builderSkillOptionsLoading && builderSkillOptionsHint && (
                      <p className="mb-2 text-xs text-gray-600">{builderSkillOptionsHint}</p>
                    )}

                    <label className="mb-1 block text-sm font-medium text-gray-700">Difficulty</label>
                    <input
                      type="number"
                      min="1"
                      value={builderChoiceCheckDifficulty}
                      onChange={(e) => setBuilderChoiceCheckDifficulty(e.target.value)}
                      className="mb-3 w-full rounded border border-gray-300 px-3 py-2"
                      disabled={builderSelectedNodeId === '__new__'}
                    />

                    <label className="mb-1 block text-sm font-medium text-gray-700">On Failure Go To Page</label>
                    <select
                      value={builderChoiceFailureNodeId}
                      onChange={(e) => setBuilderChoiceFailureNodeId(e.target.value)}
                      className="mb-3 w-full rounded border border-gray-300 px-3 py-2"
                      disabled={builderSelectedNodeId === '__new__'}
                    >
                      <option value="">-- End Adventure (no next page) --</option>
                      {builderNodes.map((node) => (
                        <option key={node.id} value={String(node.id)}>
                          {node.Node_Title || `Page ${node.id}`}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                <label className="mb-1 block text-sm font-medium text-gray-700">Display Order</label>
                <input
                  type="number"
                  value={builderChoiceOrder}
                  onChange={(e) => setBuilderChoiceOrder(e.target.value)}
                  className="mb-3 w-full rounded border border-gray-300 px-3 py-2"
                  disabled={builderSelectedNodeId === '__new__'}
                />

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveChoice}
                    disabled={savingChoice || builderSelectedNodeId === '__new__'}
                    className="rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                  >
                    {savingChoice ? 'Saving...' : 'Save Choice'}
                  </button>
                  {builderSelectedChoiceId !== '__new__' && (
                    <button
                      onClick={handleDeleteChoice}
                      className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                    >
                      Delete Choice
                    </button>
                  )}
                  <button
                    onClick={resetBuilderChoiceForm}
                    className="rounded bg-gray-500 px-4 py-2 font-semibold text-white hover:bg-gray-600"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
