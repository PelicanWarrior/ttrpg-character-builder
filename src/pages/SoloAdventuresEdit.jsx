import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AddNPCModal from './AddNPCModal';
import { supabase } from '../supabaseClient';

export default function SoloAdventuresEdit() {
  const navigate = useNavigate();
  const { adventureId } = useParams();
  const username = localStorage.getItem('username') || '';

  const [userId, setUserId] = useState(null);
  const [adventureTtrpgId, setAdventureTtrpgId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [firstPageId, setFirstPageId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [pages, setPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [pageError, setPageError] = useState('');
  const [selectedPageId, setSelectedPageId] = useState('');

  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageContent, setNewPageContent] = useState('');
  const [addingPage, setAddingPage] = useState(false);

  const [editingPageId, setEditingPageId] = useState('');
  const [editingPageTitle, setEditingPageTitle] = useState('');
  const [editingPageContent, setEditingPageContent] = useState('');
  const [savingPage, setSavingPage] = useState(false);

  const [choices, setChoices] = useState([]);
  const [loadingChoices, setLoadingChoices] = useState(false);
  const [choiceError, setChoiceError] = useState('');
  const [supportsChoiceSkillRouting, setSupportsChoiceSkillRouting] = useState(true);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [loadingSkillOptions, setLoadingSkillOptions] = useState(false);
  const [skillsError, setSkillsError] = useState('');
  const [availableBattleNpcs, setAvailableBattleNpcs] = useState([]);
  const [loadingBattleNpcs, setLoadingBattleNpcs] = useState(false);
  const [battleNpcError, setBattleNpcError] = useState('');
  const [battleNpcSystem, setBattleNpcSystem] = useState('');
  const [showCreateBattleNpcModal, setShowCreateBattleNpcModal] = useState(false);
  const [battleNpcCreationTarget, setBattleNpcCreationTarget] = useState('');
  const [battleNpcModalNpc, setBattleNpcModalNpc] = useState(null);

  const [newChoiceText, setNewChoiceText] = useState('');
  const [newChoiceHasSkillCheck, setNewChoiceHasSkillCheck] = useState(false);
  const [newChoiceSurpriseBattle, setNewChoiceSurpriseBattle] = useState(false);
  const [newChoiceBattle, setNewChoiceBattle] = useState(false);
  const [newChoiceBattleNpcIds, setNewChoiceBattleNpcIds] = useState([]);
  const [newChoiceSelectedBattleNpcId, setNewChoiceSelectedBattleNpcId] = useState('');
  const [newChoiceSkillName, setNewChoiceSkillName] = useState('');
  const [newChoiceDifficulty, setNewChoiceDifficulty] = useState('');
  const [newChoiceNextPageId, setNewChoiceNextPageId] = useState('');
  const [newChoiceSuccessPageId, setNewChoiceSuccessPageId] = useState('');
  const [newChoiceFailurePageId, setNewChoiceFailurePageId] = useState('');
  const [addingChoice, setAddingChoice] = useState(false);

  const [editingChoiceId, setEditingChoiceId] = useState('');
  const [editingChoiceText, setEditingChoiceText] = useState('');
  const [editingChoiceHasSkillCheck, setEditingChoiceHasSkillCheck] = useState(false);
  const [editingChoiceSurpriseBattle, setEditingChoiceSurpriseBattle] = useState(false);
  const [editingChoiceBattle, setEditingChoiceBattle] = useState(false);
  const [editingChoiceBattleNpcIds, setEditingChoiceBattleNpcIds] = useState([]);
  const [editingChoiceSelectedBattleNpcId, setEditingChoiceSelectedBattleNpcId] = useState('');
  const [editingChoiceSkillName, setEditingChoiceSkillName] = useState('');
  const [editingChoiceDifficulty, setEditingChoiceDifficulty] = useState('');
  const [editingChoiceNextPageId, setEditingChoiceNextPageId] = useState('');
  const [editingChoiceSuccessPageId, setEditingChoiceSuccessPageId] = useState('');
  const [editingChoiceFailurePageId, setEditingChoiceFailurePageId] = useState('');
  const [savingChoice, setSavingChoice] = useState(false);

  const isMissingSkillRoutingColumnsError = (err) => {
    const message = String(err?.message || '').toLowerCase();
    return (
      message.includes('success_page_id') ||
      message.includes('failure_page_id') ||
      message.includes('has_skill_check') ||
      message.includes('surprise_battle') ||
      message.includes('battle') ||
      message.includes('battle_npc_ids') ||
      message.includes('skill_name') ||
      message.includes('skill_difficulty')
    );
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

  const appendBattleNpcId = (selectedNpcId, setSelectedNpcId, setBattleNpcIds) => {
    const parsedNpcId = parseInt(selectedNpcId, 10);
    if (!Number.isFinite(parsedNpcId) || parsedNpcId <= 0) return;

    setBattleNpcIds((prev) => [...prev, parsedNpcId]);
    setSelectedNpcId('');
  };

  const removeBattleNpcIdAtIndex = (indexToRemove, setBattleNpcIds) => {
    setBattleNpcIds((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const getBattleNpcLabel = (npcId) => {
    const match = availableBattleNpcs.find((npc) => String(npc.id) === String(npcId));
    return match?.name || `NPC #${npcId}`;
  };

  const getBattleNpcById = (npcId) => availableBattleNpcs.find((npc) => String(npc.id) === String(npcId)) || null;

  const handleCreatedBattleNpc = (npc) => {
    const createdId = npc?.id;
    const createdName = String(npc?.Name || npc?.name || '').trim();

    if (!createdId) {
      setShowCreateBattleNpcModal(false);
      setBattleNpcCreationTarget('');
      return;
    }

    setAvailableBattleNpcs((prev) => {
      const normalizedNpc = {
        ...npc,
        id: createdId,
        name: createdName || `NPC #${createdId}`,
      };
      const withoutExisting = prev.filter((item) => String(item.id) !== String(createdId));

      return [...withoutExisting, normalizedNpc].sort((left, right) =>
        left.name.localeCompare(right.name)
      );
    });

    if (battleNpcCreationTarget === 'new') {
      setNewChoiceSelectedBattleNpcId(String(createdId));
    }

    if (battleNpcCreationTarget === 'edit') {
      setEditingChoiceSelectedBattleNpcId(String(createdId));
    }

    setShowCreateBattleNpcModal(false);
    setBattleNpcCreationTarget('');
    setBattleNpcModalNpc(null);
  };

  useEffect(() => {
    let active = true;

    const loadAdventure = async () => {
      if (!username) {
        navigate('/');
        return;
      }

      if (!adventureId) {
        setError('Adventure id is missing.');
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

      const { data: adventureData, error: adventureError } = await supabase
        .from('Solo_Adventures')
        .select('id, title, description, user_id, first_page_id, ttrpg_id')
        .eq('id', adventureId)
        .eq('user_id', userData.id)
        .single();

      if (!active) return;

      if (adventureError || !adventureData) {
        setError('Adventure not found or you do not have access.');
        setLoading(false);
        return;
      }

      setUserId(userData.id);
      setAdventureTtrpgId(adventureData.ttrpg_id || null);
      setTitle(adventureData.title || '');
      setDescription(adventureData.description || '');
      setFirstPageId(adventureData.first_page_id ? String(adventureData.first_page_id) : '');
      setLoading(false);
    };

    loadAdventure();

    return () => {
      active = false;
    };
  }, [adventureId, navigate, username]);

  useEffect(() => {
    let active = true;

    const loadPages = async () => {
      if (!adventureId || !userId) return;

      setLoadingPages(true);
      setPageError('');

      const { data, error: pagesErr } = await supabase
        .from('Solo_Adventure_Pages')
        .select('id, title, content, page_order')
        .eq('adventure_id', adventureId)
        .order('page_order', { ascending: true })
        .order('id', { ascending: true });

      if (!active) return;

      if (pagesErr) {
        setPageError(pagesErr.message || 'Failed to load pages.');
      } else {
        const list = data || [];
        setPages(list);

        if (list.length === 0) {
          setSelectedPageId('');
        } else if (!selectedPageId || !list.some((p) => String(p.id) === String(selectedPageId))) {
          if (firstPageId && list.some((p) => String(p.id) === String(firstPageId))) {
            setSelectedPageId(String(firstPageId));
          } else {
            setSelectedPageId(String(list[0].id));
          }
        }

        if (firstPageId && !list.some((p) => String(p.id) === String(firstPageId))) {
          setFirstPageId('');
        }
      }

      setLoadingPages(false);
    };

    loadPages();

    return () => {
      active = false;
    };
  }, [adventureId, userId, firstPageId, selectedPageId]);

  useEffect(() => {
    let active = true;

    const loadChoices = async () => {
      if (!selectedPageId) {
        setChoices([]);
        return;
      }

      setLoadingChoices(true);
      setChoiceError('');

      const { data, error: choicesErr } = await supabase
        .from('Solo_Adventure_Choices')
        .select(
          'id, page_id, choice_text, next_page_id, success_page_id, failure_page_id, has_skill_check, surprise_battle, battle, battle_npc_ids, skill_name, skill_difficulty, choice_order'
        )
        .eq('page_id', selectedPageId)
        .order('choice_order', { ascending: true })
        .order('id', { ascending: true });

      if (!active) return;

      if (choicesErr) {
        if (isMissingSkillRoutingColumnsError(choicesErr)) {
          const { data: fallbackData, error: fallbackErr } = await supabase
            .from('Solo_Adventure_Choices')
            .select('id, page_id, choice_text, next_page_id, choice_order')
            .eq('page_id', selectedPageId)
            .order('choice_order', { ascending: true })
            .order('id', { ascending: true });

          if (!active) return;

          if (fallbackErr) {
            setChoiceError(fallbackErr.message || 'Failed to load options.');
          } else {
            setSupportsChoiceSkillRouting(false);
            setChoices(
              (fallbackData || []).map((choice) => ({
                ...choice,
                has_skill_check: false,
                surprise_battle: false,
                battle: false,
                battle_npc_ids: [],
                skill_name: null,
                skill_difficulty: null,
                success_page_id: null,
                failure_page_id: null,
              }))
            );
          }
        } else {
          setChoiceError(choicesErr.message || 'Failed to load options.');
        }
      } else {
        setSupportsChoiceSkillRouting(true);
        setChoices(
          (data || []).map((choice) => ({
            ...choice,
            has_skill_check: !!choice.has_skill_check,
            surprise_battle: !!choice.surprise_battle,
            battle: !!choice.battle,
            battle_npc_ids: normalizeBattleNpcIds(choice.battle_npc_ids),
          }))
        );
      }

      setLoadingChoices(false);
    };

    loadChoices();

    return () => {
      active = false;
    };
  }, [selectedPageId]);

  useEffect(() => {
    let active = true;

    const loadBattleNpcOptions = async () => {
      if (!adventureTtrpgId) {
        setAvailableBattleNpcs([]);
        setBattleNpcSystem('');
        return;
      }

      setLoadingBattleNpcs(true);
      setBattleNpcError('');

      const { data: ttrpgData, error: ttrpgError } = await supabase
        .from('TTRPGs')
        .select('id, TTRPG_name, Initials')
        .eq('id', adventureTtrpgId)
        .single();

      if (!active) return;

      if (ttrpgError) {
        setBattleNpcError(ttrpgError.message || 'Failed to load NPC options.');
        setAvailableBattleNpcs([]);
        setBattleNpcSystem('');
        setLoadingBattleNpcs(false);
        return;
      }

      const upperInitials = String(ttrpgData?.Initials || '').toUpperCase();
      const ttrpgName = String(ttrpgData?.TTRPG_name || '');

      let npcQuery = null;

      if (upperInitials === 'SW' || /star\s*wars/i.test(ttrpgName)) {
        setBattleNpcSystem('SW');
        npcQuery = supabase
          .from('SW_campaign_NPC')
          .select('id, Name, Race, Description, PictureID, Brawn, Cunning, Presence, Agility, Intellect, Willpower, Force_Rating, Soak, Wound, Strain, Skills, Abilities, Force_Abilities, Equipment')
          .order('Name', { ascending: true });
      } else if (upperInitials === 'FA' || upperInitials === 'F' || /fallout/i.test(ttrpgName)) {
        setBattleNpcSystem('FA');
        npcQuery = supabase.from('Fa_campaign_NPC').select('id, Name').order('Name', { ascending: true });
      } else if (upperInitials === 'DND' || /dungeons?\s*&?\s*dragons/i.test(ttrpgName)) {
        setBattleNpcSystem('DND');
        npcQuery = supabase.from('DND_campaign_NPC').select('id, Name').order('Name', { ascending: true });
      }

      if (!npcQuery) {
        setAvailableBattleNpcs([]);
        setBattleNpcSystem('');
        setLoadingBattleNpcs(false);
        return;
      }

      const { data: npcData, error: npcError } = await npcQuery;

      if (!active) return;

      if (npcError) {
        setBattleNpcError(npcError.message || 'Failed to load NPC options.');
        setAvailableBattleNpcs([]);
      } else {
        setAvailableBattleNpcs(
          (npcData || []).map((npc) => ({
            ...npc,
            id: npc.id,
            name: npc.Name || `NPC #${npc.id}`,
          }))
        );
      }

      setLoadingBattleNpcs(false);
    };

    loadBattleNpcOptions();

    return () => {
      active = false;
    };
  }, [adventureTtrpgId]);

  useEffect(() => {
    let active = true;

    const querySkills = async (selectClause, orderColumn, filterColumn, filterValue) => {
      let query = supabase.from('skills').select(selectClause);
      if (filterColumn && filterValue !== null && filterValue !== undefined && filterValue !== '') {
        query = query.eq(filterColumn, filterValue);
      }
      query = query.order(orderColumn, { ascending: true });
      return query;
    };

    const normalizeSkillRows = (rows) =>
      (rows || [])
        .map((row) => String(row.skill || row.name || '').trim())
        .filter(Boolean);

    const runSkillQuery = async (filterColumn, filterValue) => {
      const skillResult = await querySkills('id, skill', 'skill', filterColumn, filterValue);
      if (!skillResult.error) {
        return { rows: normalizeSkillRows(skillResult.data), error: null };
      }

      const message = String(skillResult.error?.message || '').toLowerCase();
      if (!message.includes('skill')) {
        return { rows: [], error: skillResult.error };
      }

      const nameResult = await querySkills('id, name', 'name', filterColumn, filterValue);
      if (!nameResult.error) {
        return { rows: normalizeSkillRows(nameResult.data), error: null };
      }

      return { rows: [], error: nameResult.error };
    };

    const isMissingColumnError = (err) => {
      const msg = String(err?.message || '').toLowerCase();
      return msg.includes('column') && msg.includes('does not exist');
    };

    const loadSkillOptions = async () => {
      if (!adventureTtrpgId) {
        setAvailableSkills([]);
        return;
      }

      setLoadingSkillOptions(true);
      setSkillsError('');

      let ttrpgName = '';
      let ttrpgInitials = '';

      const { data: ttrpgData } = await supabase
        .from('TTRPGs')
        .select('id, TTRPG_name, Initials')
        .eq('id', adventureTtrpgId)
        .single();

      if (!active) return;

      ttrpgName = ttrpgData?.TTRPG_name || '';
      ttrpgInitials = ttrpgData?.Initials || '';

      const attempts = [
        { column: 'ttrpg_id', value: adventureTtrpgId },
        { column: 'TTRPG', value: adventureTtrpgId },
        { column: 'ttrpg', value: adventureTtrpgId },
        { column: 'ttrpg_initials', value: ttrpgInitials },
        { column: 'Initials', value: ttrpgInitials },
        { column: 'ttrpg_name', value: ttrpgName },
        { column: 'TTRPG_name', value: ttrpgName },
      ];

      let resolved = [];

      for (const attempt of attempts) {
        if (!attempt.value) continue;

        const result = await runSkillQuery(attempt.column, attempt.value);
        if (!active) return;

        if (result.error) {
          if (isMissingColumnError(result.error)) {
            continue;
          }

          setSkillsError(result.error.message || 'Failed to load skills.');
          setLoadingSkillOptions(false);
          return;
        }

        if (result.rows.length > 0) {
          resolved = result.rows;
          break;
        }
      }

      if (resolved.length === 0) {
        const fallback = await runSkillQuery(null, null);
        if (!active) return;

        if (fallback.error) {
          setSkillsError(fallback.error.message || 'Failed to load skills.');
          setAvailableSkills([]);
        } else {
          resolved = fallback.rows;
          setAvailableSkills(resolved);
        }
      } else {
        setAvailableSkills(resolved);
      }

      setLoadingSkillOptions(false);
    };

    loadSkillOptions();

    return () => {
      active = false;
    };
  }, [adventureTtrpgId]);

  useEffect(() => {
    if (supportsChoiceSkillRouting) return;

    setNewChoiceHasSkillCheck(false);
    setNewChoiceSurpriseBattle(false);
    setNewChoiceBattle(false);
    setNewChoiceBattleNpcIds([]);
    setNewChoiceSelectedBattleNpcId('');
    setNewChoiceSkillName('');
    setNewChoiceDifficulty('');
    setNewChoiceSuccessPageId('');
    setNewChoiceFailurePageId('');

    if (editingChoiceHasSkillCheck) {
      setEditingChoiceHasSkillCheck(false);
      setEditingChoiceSurpriseBattle(false);
      setEditingChoiceBattle(false);
      setEditingChoiceBattleNpcIds([]);
      setEditingChoiceSelectedBattleNpcId('');
      setEditingChoiceSkillName('');
      setEditingChoiceDifficulty('');
      setEditingChoiceSuccessPageId('');
      setEditingChoiceFailurePageId('');
    }
  }, [supportsChoiceSkillRouting, editingChoiceHasSkillCheck]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    if (!userId || !adventureId) {
      setError('Missing adventure context.');
      return;
    }

    setSaving(true);
    setError('');

    const { error: updateErr } = await supabase
      .from('Solo_Adventures')
      .update({
        title: title.trim(),
        description: description.trim() || null,
        first_page_id: firstPageId ? parseInt(firstPageId, 10) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adventureId)
      .eq('user_id', userId);

    setSaving(false);

    if (updateErr) {
      setError(updateErr.message || 'Failed to save adventure.');
      return;
    }

    setError('Adventure details saved.');
  };

  const handleAddPage = async () => {
    if (!newPageTitle.trim()) {
      setPageError('Page title is required.');
      return;
    }

    setAddingPage(true);
    setPageError('');

    const nextOrder = pages.length + 1;
    const { data, error: addErr } = await supabase
      .from('Solo_Adventure_Pages')
      .insert([
        {
          adventure_id: parseInt(adventureId, 10),
          title: newPageTitle.trim(),
          content: newPageContent.trim() || null,
          page_order: nextOrder,
        },
      ])
      .select('id, title, content, page_order')
      .single();

    setAddingPage(false);

    if (addErr || !data) {
      setPageError(addErr?.message || 'Failed to add page.');
      return;
    }

    const updatedPages = [...pages, data];
    setPages(updatedPages);
    setSelectedPageId(String(data.id));
    if (!firstPageId) setFirstPageId(String(data.id));
    setNewPageTitle('');
    setNewPageContent('');
  };

  const startEditPage = (page) => {
    setEditingPageId(String(page.id));
    setEditingPageTitle(page.title || '');
    setEditingPageContent(page.content || '');
  };

  const cancelEditPage = () => {
    setEditingPageId('');
    setEditingPageTitle('');
    setEditingPageContent('');
  };

  const handleSavePage = async () => {
    if (!editingPageId) return;
    if (!editingPageTitle.trim()) {
      setPageError('Page title is required.');
      return;
    }

    setSavingPage(true);
    setPageError('');

    const { error: saveErr } = await supabase
      .from('Solo_Adventure_Pages')
      .update({
        title: editingPageTitle.trim(),
        content: editingPageContent.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingPageId)
      .eq('adventure_id', adventureId);

    setSavingPage(false);

    if (saveErr) {
      setPageError(saveErr.message || 'Failed to save page.');
      return;
    }

    setPages((prev) =>
      prev.map((p) =>
        String(p.id) === String(editingPageId)
          ? { ...p, title: editingPageTitle.trim(), content: editingPageContent.trim() || null }
          : p
      )
    );
    cancelEditPage();
  };

  const handleDeletePage = async (pageId) => {
    if (!window.confirm('Delete this page and all its options?')) return;

    const { error: delErr } = await supabase
      .from('Solo_Adventure_Pages')
      .delete()
      .eq('id', pageId)
      .eq('adventure_id', adventureId);

    if (delErr) {
      setPageError(delErr.message || 'Failed to delete page.');
      return;
    }

    const remaining = pages.filter((p) => String(p.id) !== String(pageId));
    setPages(remaining);
    if (String(firstPageId) === String(pageId)) setFirstPageId('');
    if (String(selectedPageId) === String(pageId)) {
      setSelectedPageId(remaining.length ? String(remaining[0].id) : '');
    }
  };

  const resetNewChoiceForm = () => {
    setNewChoiceText('');
    setNewChoiceHasSkillCheck(false);
    setNewChoiceSurpriseBattle(false);
    setNewChoiceBattle(false);
    setNewChoiceBattleNpcIds([]);
    setNewChoiceSelectedBattleNpcId('');
    setNewChoiceSkillName('');
    setNewChoiceDifficulty('');
    setNewChoiceNextPageId('');
    setNewChoiceSuccessPageId('');
    setNewChoiceFailurePageId('');
  };

  const handleAddChoice = async () => {
    if (!selectedPageId) {
      setChoiceError('Select a page first.');
      return;
    }
    if (!newChoiceText.trim()) {
      setChoiceError('Option text is required.');
      return;
    }
    if (!supportsChoiceSkillRouting && newChoiceHasSkillCheck) {
      setChoiceError('Skill check fields are not available yet. Run the new SQL migration first.');
      return;
    }
    if (newChoiceHasSkillCheck && !newChoiceSkillName.trim()) {
      setChoiceError('Skill name is required when skill check is enabled.');
      return;
    }
    if ((newChoiceSurpriseBattle || newChoiceBattle) && newChoiceBattleNpcIds.length === 0) {
      setChoiceError('Select at least one NPC for battle options.');
      return;
    }

    setAddingChoice(true);
    setChoiceError('');

    const nextOrder = choices.length + 1;
    const payload = {
      page_id: parseInt(selectedPageId, 10),
      choice_text: newChoiceText.trim(),
      choice_order: nextOrder,
      next_page_id: newChoiceHasSkillCheck ? null : (newChoiceNextPageId ? parseInt(newChoiceNextPageId, 10) : null),
    };

    if (supportsChoiceSkillRouting) {
      payload.has_skill_check = newChoiceHasSkillCheck;
      payload.surprise_battle = !!newChoiceSurpriseBattle;
      payload.battle = !!newChoiceBattle;
      payload.battle_npc_ids = newChoiceSurpriseBattle || newChoiceBattle ? newChoiceBattleNpcIds : [];
      payload.skill_name = newChoiceHasSkillCheck ? newChoiceSkillName.trim() : null;
      payload.skill_difficulty = newChoiceHasSkillCheck ? newChoiceDifficulty.trim() || null : null;
      payload.success_page_id = newChoiceHasSkillCheck ? (newChoiceSuccessPageId ? parseInt(newChoiceSuccessPageId, 10) : null) : null;
      payload.failure_page_id = newChoiceHasSkillCheck ? (newChoiceFailurePageId ? parseInt(newChoiceFailurePageId, 10) : null) : null;
    }

    const selectClause = supportsChoiceSkillRouting
      ? 'id, page_id, choice_text, next_page_id, success_page_id, failure_page_id, has_skill_check, surprise_battle, battle, battle_npc_ids, skill_name, skill_difficulty, choice_order'
      : 'id, page_id, choice_text, next_page_id, choice_order';

    const { data, error: addErr } = await supabase
      .from('Solo_Adventure_Choices')
      .insert([payload])
      .select(selectClause)
      .single();

    setAddingChoice(false);

    if (addErr || !data) {
      setChoiceError(addErr?.message || 'Failed to add option.');
      return;
    }

    setChoices((prev) => [
      ...prev,
      {
        ...data,
        has_skill_check: supportsChoiceSkillRouting ? !!data.has_skill_check : false,
        surprise_battle: supportsChoiceSkillRouting ? !!data.surprise_battle : false,
        battle: supportsChoiceSkillRouting ? !!data.battle : false,
        battle_npc_ids: supportsChoiceSkillRouting ? normalizeBattleNpcIds(data.battle_npc_ids) : [],
        skill_name: supportsChoiceSkillRouting ? data.skill_name : null,
        skill_difficulty: supportsChoiceSkillRouting ? data.skill_difficulty : null,
        success_page_id: supportsChoiceSkillRouting ? data.success_page_id : null,
        failure_page_id: supportsChoiceSkillRouting ? data.failure_page_id : null,
      },
    ]);
    resetNewChoiceForm();
  };

  const startEditChoice = (choice) => {
    setEditingChoiceId(String(choice.id));
    setEditingChoiceText(choice.choice_text || '');
    setEditingChoiceHasSkillCheck(!!choice.has_skill_check);
    setEditingChoiceSurpriseBattle(!!choice.surprise_battle);
    setEditingChoiceBattle(!!choice.battle);
    setEditingChoiceBattleNpcIds(normalizeBattleNpcIds(choice.battle_npc_ids));
    setEditingChoiceSelectedBattleNpcId('');
    setEditingChoiceSkillName(choice.skill_name || '');
    setEditingChoiceDifficulty(choice.skill_difficulty || '');
    setEditingChoiceNextPageId(choice.next_page_id ? String(choice.next_page_id) : '');
    setEditingChoiceSuccessPageId(choice.success_page_id ? String(choice.success_page_id) : '');
    setEditingChoiceFailurePageId(choice.failure_page_id ? String(choice.failure_page_id) : '');
  };

  const cancelEditChoice = () => {
    setEditingChoiceId('');
    setEditingChoiceText('');
    setEditingChoiceHasSkillCheck(false);
    setEditingChoiceSurpriseBattle(false);
    setEditingChoiceBattle(false);
    setEditingChoiceBattleNpcIds([]);
    setEditingChoiceSelectedBattleNpcId('');
    setEditingChoiceSkillName('');
    setEditingChoiceDifficulty('');
    setEditingChoiceNextPageId('');
    setEditingChoiceSuccessPageId('');
    setEditingChoiceFailurePageId('');
  };

  const handleSaveChoice = async () => {
    if (!editingChoiceId) return;
    if (!editingChoiceText.trim()) {
      setChoiceError('Option text is required.');
      return;
    }
    if (!supportsChoiceSkillRouting && editingChoiceHasSkillCheck) {
      setChoiceError('Skill check fields are not available yet. Run the new SQL migration first.');
      return;
    }
    if (editingChoiceHasSkillCheck && !editingChoiceSkillName.trim()) {
      setChoiceError('Skill name is required when skill check is enabled.');
      return;
    }
    if ((editingChoiceSurpriseBattle || editingChoiceBattle) && editingChoiceBattleNpcIds.length === 0) {
      setChoiceError('Select at least one NPC for battle options.');
      return;
    }

    setSavingChoice(true);
    setChoiceError('');

    const payload = {
      choice_text: editingChoiceText.trim(),
      next_page_id: editingChoiceHasSkillCheck ? null : (editingChoiceNextPageId ? parseInt(editingChoiceNextPageId, 10) : null),
      updated_at: new Date().toISOString(),
    };

    if (supportsChoiceSkillRouting) {
      payload.has_skill_check = editingChoiceHasSkillCheck;
      payload.surprise_battle = !!editingChoiceSurpriseBattle;
      payload.battle = !!editingChoiceBattle;
      payload.battle_npc_ids = editingChoiceSurpriseBattle || editingChoiceBattle ? editingChoiceBattleNpcIds : [];
      payload.skill_name = editingChoiceHasSkillCheck ? editingChoiceSkillName.trim() : null;
      payload.skill_difficulty = editingChoiceHasSkillCheck ? editingChoiceDifficulty.trim() || null : null;
      payload.success_page_id = editingChoiceHasSkillCheck ? (editingChoiceSuccessPageId ? parseInt(editingChoiceSuccessPageId, 10) : null) : null;
      payload.failure_page_id = editingChoiceHasSkillCheck ? (editingChoiceFailurePageId ? parseInt(editingChoiceFailurePageId, 10) : null) : null;
    }

    const { error: saveErr } = await supabase
      .from('Solo_Adventure_Choices')
      .update(payload)
      .eq('id', editingChoiceId)
      .eq('page_id', selectedPageId);

    setSavingChoice(false);

    if (saveErr) {
      setChoiceError(saveErr.message || 'Failed to save option.');
      return;
    }

    setChoices((prev) =>
      prev.map((c) =>
        String(c.id) === String(editingChoiceId)
          ? {
              ...c,
              choice_text: editingChoiceText.trim(),
              has_skill_check: editingChoiceHasSkillCheck,
              surprise_battle: editingChoiceSurpriseBattle,
              battle: editingChoiceBattle,
              battle_npc_ids: editingChoiceSurpriseBattle || editingChoiceBattle ? [...editingChoiceBattleNpcIds] : [],
              skill_name: editingChoiceHasSkillCheck ? editingChoiceSkillName.trim() : null,
              skill_difficulty: editingChoiceHasSkillCheck ? editingChoiceDifficulty.trim() || null : null,
              next_page_id: editingChoiceHasSkillCheck ? null : (editingChoiceNextPageId ? parseInt(editingChoiceNextPageId, 10) : null),
              success_page_id: editingChoiceHasSkillCheck ? (editingChoiceSuccessPageId ? parseInt(editingChoiceSuccessPageId, 10) : null) : null,
              failure_page_id: editingChoiceHasSkillCheck ? (editingChoiceFailurePageId ? parseInt(editingChoiceFailurePageId, 10) : null) : null,
            }
          : c
      )
    );
    cancelEditChoice();
  };

  const handleDeleteChoice = async (choiceId) => {
    if (!window.confirm('Delete this option?')) return;

    const { error: delErr } = await supabase
      .from('Solo_Adventure_Choices')
      .delete()
      .eq('id', choiceId)
      .eq('page_id', selectedPageId);

    if (delErr) {
      setChoiceError(delErr.message || 'Failed to delete option.');
      return;
    }

    setChoices((prev) => prev.filter((c) => String(c.id) !== String(choiceId)));
  };

  const selectedPage = pages.find((p) => String(p.id) === String(selectedPageId));

  const pageTitleById = (pageId) => {
    const found = pages.find((p) => String(p.id) === String(pageId));
    return found ? found.title : 'No destination';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 via-slate-100 to-stone-200 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-4xl font-black tracking-wide text-gray-900">EDIT {title || 'SOLO ADVENTURE'}</h1>
          <button
            onClick={() => navigate('/solo-adventures/create')}
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
              <div className="rounded-3xl border-2 border-amber-500 bg-amber-200 p-6 shadow-sm">
                <label className="mb-3 block text-base font-bold text-gray-900" htmlFor="edit-adventure-title">
                  TITLE
                </label>
                <input
                  id="edit-adventure-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-2xl border-2 border-amber-800 bg-amber-50 px-5 py-3 text-base text-gray-900 placeholder-gray-500 shadow-sm outline-none transition focus:border-amber-500"
                />

                <label className="mb-3 mt-6 block text-base font-bold text-gray-900" htmlFor="edit-adventure-description">
                  DESCRIPTION
                </label>
                <textarea
                  id="edit-adventure-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="5"
                  className="w-full rounded-2xl border-2 border-emerald-800 bg-emerald-50 px-5 py-3 text-base text-gray-900 placeholder-gray-500 shadow-sm outline-none transition focus:border-emerald-500"
                />

                <label className="mb-3 mt-6 block text-base font-bold text-gray-900" htmlFor="edit-adventure-first-page">
                  FIRST PAGE
                </label>
                <select
                  id="edit-adventure-first-page"
                  value={firstPageId}
                  onChange={(e) => setFirstPageId(e.target.value)}
                  className="w-full rounded-2xl border-2 border-sky-800 bg-sky-50 px-5 py-3 text-base text-sky-950 shadow-sm outline-none transition focus:border-sky-500"
                >
                  <option value="">-- Select First Page --</option>
                  {pages.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.title}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="mt-6 w-full rounded-2xl bg-gray-900 px-5 py-3 text-base font-bold uppercase tracking-wide text-black transition hover:bg-gray-800 disabled:opacity-70"
                >
                  {saving ? 'Saving...' : 'Save Adventure'}
                </button>
              </div>

              <div className="rounded-3xl border-2 border-violet-500 bg-violet-200 p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900">ADVENTURE PAGES</h2>
                {loadingPages && <p className="mt-3 text-gray-700">Loading pages...</p>}
                {pageError && <p className="mt-3 font-semibold text-red-700">{pageError}</p>}

                <div className="mt-4 rounded-2xl border-2 border-indigo-300 bg-indigo-50 p-4">
                  <h3 className="text-lg font-bold text-gray-900">ADD PAGE</h3>
                  <input
                    type="text"
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    placeholder="Page title"
                    className="mt-3 w-full rounded-xl border-2 border-indigo-700 bg-white px-4 py-2 text-gray-900 outline-none"
                  />
                  <textarea
                    value={newPageContent}
                    onChange={(e) => setNewPageContent(e.target.value)}
                    placeholder="Page story text"
                    rows="4"
                    className="mt-3 w-full rounded-xl border-2 border-indigo-700 bg-white px-4 py-2 text-gray-900 outline-none"
                  />
                  <button
                    onClick={handleAddPage}
                    disabled={addingPage}
                    className="mt-3 rounded-xl bg-gray-900 px-4 py-2 font-bold uppercase tracking-wide text-black transition hover:bg-gray-800 disabled:opacity-70"
                  >
                    {addingPage ? 'Adding...' : 'Add Page'}
                  </button>
                </div>

                {!loadingPages && pages.length > 0 && (
                  <div className="mt-6 space-y-3">
                    {pages.map((page) => (
                      <div key={page.id} className="rounded-xl border-2 border-violet-400 bg-violet-50 p-4">
                        {String(editingPageId) === String(page.id) ? (
                          <div>
                            <input
                              type="text"
                              value={editingPageTitle}
                              onChange={(e) => setEditingPageTitle(e.target.value)}
                              className="w-full rounded-xl border-2 border-amber-700 bg-amber-50 px-4 py-2 text-gray-900 outline-none"
                            />
                            <textarea
                              value={editingPageContent}
                              onChange={(e) => setEditingPageContent(e.target.value)}
                              rows="4"
                              className="mt-3 w-full rounded-xl border-2 border-emerald-700 bg-emerald-50 px-4 py-2 text-gray-900 outline-none"
                            />
                            <div className="mt-3 flex gap-3">
                              <button
                                onClick={handleSavePage}
                                disabled={savingPage}
                                className="rounded-lg bg-green-600 px-4 py-2 font-bold uppercase text-black transition hover:bg-green-700 disabled:opacity-70"
                              >
                                {savingPage ? 'Saving...' : 'Save Page'}
                              </button>
                              <button
                                onClick={cancelEditPage}
                                className="rounded-lg bg-gray-600 px-4 py-2 font-bold uppercase text-black transition hover:bg-gray-700"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-bold text-gray-900">{page.title}</div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setSelectedPageId(String(page.id))}
                                  className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold uppercase text-black transition hover:bg-indigo-700"
                                >
                                  Open
                                </button>
                                <button
                                  onClick={() => startEditPage(page)}
                                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold uppercase text-black transition hover:bg-blue-700"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeletePage(page.id)}
                                  className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold uppercase text-black transition hover:bg-red-700"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            {page.content && (
                              <p className="text-sm text-gray-700">
                                {page.content.length > 180 ? `${page.content.slice(0, 180)}...` : page.content}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!loadingPages && pages.length === 0 && (
                  <p className="mt-4 text-gray-700">No pages yet. Add your first page above.</p>
                )}
              </div>

              <div className="rounded-3xl border-2 border-sky-500 bg-sky-200 p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900">PAGE OPTIONS</h2>
                {!selectedPageId && <p className="mt-3 text-gray-700">Select a page to manage options.</p>}
                {selectedPageId && (
                  <div>
                    <p className="mt-3 font-semibold text-gray-900">
                      Editing options for: {selectedPage?.title || 'Selected page'}
                    </p>

                    {choiceError && <p className="mt-3 font-semibold text-red-700">{choiceError}</p>}
                    {!supportsChoiceSkillRouting && (
                      <p className="mt-3 text-sm font-semibold text-amber-800">
                        Skill-check destinations are disabled until the choice migration is applied.
                      </p>
                    )}
                    {supportsChoiceSkillRouting && loadingSkillOptions && (
                      <p className="mt-3 text-sm text-gray-700">Loading skill list for this TTRPG...</p>
                    )}
                    {supportsChoiceSkillRouting && skillsError && (
                      <p className="mt-3 text-sm font-semibold text-red-700">{skillsError}</p>
                    )}
                    {supportsChoiceSkillRouting && !loadingSkillOptions && !skillsError && availableSkills.length === 0 && (
                      <p className="mt-3 text-sm font-semibold text-amber-800">No skills found for this TTRPG yet.</p>
                    )}
                    {supportsChoiceSkillRouting && battleNpcError && (
                      <p className="mt-3 text-sm font-semibold text-amber-800">{battleNpcError}</p>
                    )}
                    {loadingChoices && <p className="mt-3 text-gray-700">Loading options...</p>}

                    {!loadingChoices && (
                      <div className="mt-4 space-y-3">
                        {choices.map((choice) => (
                          <div key={choice.id} className="rounded-xl border-2 border-sky-400 bg-sky-50 p-4">
                            {String(editingChoiceId) === String(choice.id) ? (
                              <div>
                                <input
                                  type="text"
                                  value={editingChoiceText}
                                  onChange={(e) => setEditingChoiceText(e.target.value)}
                                  className="w-full rounded-xl border-2 border-amber-700 bg-amber-50 px-4 py-2 text-gray-900 outline-none"
                                />

                                {supportsChoiceSkillRouting && (
                                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm font-semibold text-gray-800">
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={editingChoiceHasSkillCheck}
                                        onChange={(e) => setEditingChoiceHasSkillCheck(e.target.checked)}
                                      />
                                      Add skill check to this option
                                    </label>
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={editingChoiceSurpriseBattle}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          setEditingChoiceSurpriseBattle(checked);
                                          if (checked) setEditingChoiceBattle(false);
                                        }}
                                      />
                                      Surprise Battle
                                    </label>
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={editingChoiceBattle}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          setEditingChoiceBattle(checked);
                                          if (checked) setEditingChoiceSurpriseBattle(false);
                                        }}
                                      />
                                      Battle
                                    </label>
                                  </div>
                                )}

                                {supportsChoiceSkillRouting && editingChoiceHasSkillCheck ? (
                                  <div className="mt-3 space-y-2">
                                    <select
                                      value={editingChoiceSkillName}
                                      onChange={(e) => setEditingChoiceSkillName(e.target.value)}
                                      className="w-full rounded-xl border-2 border-amber-700 bg-amber-50 px-4 py-2 text-gray-900 outline-none"
                                    >
                                      <option value="">-- Select Skill --</option>
                                      {availableSkills.map((skill) => (
                                        <option key={skill} value={skill}>
                                          {skill}
                                        </option>
                                      ))}
                                      {editingChoiceSkillName && !availableSkills.includes(editingChoiceSkillName) && (
                                        <option value={editingChoiceSkillName}>{editingChoiceSkillName}</option>
                                      )}
                                    </select>
                                    <input
                                      type="text"
                                      value={editingChoiceDifficulty}
                                      onChange={(e) => setEditingChoiceDifficulty(e.target.value)}
                                      placeholder="Difficulty (optional)"
                                      className="w-full rounded-xl border-2 border-amber-700 bg-amber-50 px-4 py-2 text-gray-900 outline-none"
                                    />
                                    <select
                                      value={editingChoiceSuccessPageId}
                                      onChange={(e) => setEditingChoiceSuccessPageId(e.target.value)}
                                      className="w-full rounded-xl border-2 border-sky-700 bg-white px-4 py-2 text-gray-900 outline-none"
                                    >
                                      <option value="">-- On Success --</option>
                                      {pages.map((p) => (
                                        <option key={p.id} value={String(p.id)}>
                                          {p.title}
                                        </option>
                                      ))}
                                    </select>
                                    <select
                                      value={editingChoiceFailurePageId}
                                      onChange={(e) => setEditingChoiceFailurePageId(e.target.value)}
                                      className="w-full rounded-xl border-2 border-sky-700 bg-white px-4 py-2 text-gray-900 outline-none"
                                    >
                                      <option value="">-- On Failure --</option>
                                      {pages.map((p) => (
                                        <option key={p.id} value={String(p.id)}>
                                          {p.title}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                ) : (
                                  <div className="mt-3 space-y-3">
                                    <select
                                      value={editingChoiceNextPageId}
                                      onChange={(e) => setEditingChoiceNextPageId(e.target.value)}
                                      className="w-full rounded-xl border-2 border-sky-700 bg-white px-4 py-2 text-gray-900 outline-none"
                                    >
                                      <option value="">-- Destination Page --</option>
                                      {pages.map((p) => (
                                        <option key={p.id} value={String(p.id)}>
                                          {p.title}
                                        </option>
                                      ))}
                                    </select>

                                    {(editingChoiceSurpriseBattle || editingChoiceBattle) && (
                                      <div className="space-y-2 rounded-xl border border-sky-300 bg-white p-3">
                                        <p className="text-sm font-semibold text-gray-900">Battle NPCs</p>
                                        <div className="flex flex-col gap-2 sm:flex-row">
                                          <select
                                            value={editingChoiceSelectedBattleNpcId}
                                            onChange={(e) => setEditingChoiceSelectedBattleNpcId(e.target.value)}
                                            disabled={loadingBattleNpcs || availableBattleNpcs.length === 0}
                                            className="flex-1 rounded-xl border-2 border-sky-700 bg-white px-4 py-2 text-gray-900 outline-none disabled:opacity-60"
                                          >
                                            <option value="">-- Select NPC --</option>
                                            {availableBattleNpcs.map((npc) => (
                                              <option key={npc.id} value={String(npc.id)}>
                                                {npc.name}
                                              </option>
                                            ))}
                                          </select>
                                          <button
                                            type="button"
                                            onClick={() => appendBattleNpcId(editingChoiceSelectedBattleNpcId, setEditingChoiceSelectedBattleNpcId, setEditingChoiceBattleNpcIds)}
                                            disabled={!editingChoiceSelectedBattleNpcId}
                                            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-bold uppercase text-black transition hover:bg-sky-700 disabled:opacity-60"
                                          >
                                            Add NPC
                                          </button>
                                          {battleNpcSystem === 'SW' && (
                                            <>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setBattleNpcCreationTarget('edit');
                                                  setBattleNpcModalNpc(null);
                                                  setShowCreateBattleNpcModal(true);
                                                }}
                                                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold uppercase text-black transition hover:bg-amber-600"
                                              >
                                                Create
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const selectedNpc = getBattleNpcById(editingChoiceSelectedBattleNpcId);
                                                  if (!selectedNpc) return;
                                                  setBattleNpcCreationTarget('edit');
                                                  setBattleNpcModalNpc(selectedNpc);
                                                  setShowCreateBattleNpcModal(true);
                                                }}
                                                disabled={!editingChoiceSelectedBattleNpcId}
                                                className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-bold uppercase text-black transition hover:bg-yellow-700 disabled:opacity-60"
                                              >
                                                Edit
                                              </button>
                                            </>
                                          )}
                                        </div>
                                        {loadingBattleNpcs && <p className="text-sm text-gray-700">Loading NPCs...</p>}
                                        {!loadingBattleNpcs && availableBattleNpcs.length === 0 && !battleNpcError && (
                                          <p className="text-sm text-amber-800">No NPC list is available for this TTRPG yet.</p>
                                        )}
                                        {editingChoiceBattleNpcIds.length > 0 && (
                                          <div className="space-y-2">
                                            {editingChoiceBattleNpcIds.map((npcId, index) => (
                                              <div key={`${npcId}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
                                                <span className="text-sm text-gray-900">{getBattleNpcLabel(npcId)}</span>
                                                <button
                                                  type="button"
                                                  onClick={() => removeBattleNpcIdAtIndex(index, setEditingChoiceBattleNpcIds)}
                                                  className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold uppercase text-black transition hover:bg-red-700"
                                                >
                                                  Remove
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="mt-3 flex gap-3">
                                  <button
                                    onClick={handleSaveChoice}
                                    disabled={savingChoice}
                                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold uppercase text-black transition hover:bg-green-700 disabled:opacity-70"
                                  >
                                    {savingChoice ? 'Saving...' : 'Save Option'}
                                  </button>
                                  <button
                                    onClick={cancelEditChoice}
                                    className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-bold uppercase text-black transition hover:bg-gray-700"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-gray-900">{choice.choice_text}</p>
                                  {supportsChoiceSkillRouting && choice.has_skill_check ? (
                                    <>
                                      <p className="text-sm text-gray-700">
                                        Skill Check: {choice.skill_name || 'Unnamed'}
                                        {choice.skill_difficulty ? ` (${choice.skill_difficulty})` : ''}
                                      </p>
                                      <p className="text-sm text-gray-700">On Success: {pageTitleById(choice.success_page_id)}</p>
                                      <p className="text-sm text-gray-700">On Failure: {pageTitleById(choice.failure_page_id)}</p>
                                    </>
                                  ) : (
                                    <p className="text-sm text-gray-700">Destination: {pageTitleById(choice.next_page_id)}</p>
                                  )}
                                  {!!choice.surprise_battle && <p className="text-sm text-gray-700">Mode: Surprise Battle</p>}
                                  {!!choice.battle && <p className="text-sm text-gray-700">Mode: Battle</p>}
                                  {!!choice.battle_npc_ids?.length && (
                                    <p className="text-sm text-gray-700">
                                      Battle NPCs: {choice.battle_npc_ids.map((npcId) => getBattleNpcLabel(npcId)).join(', ')}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => startEditChoice(choice)}
                                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold uppercase text-black transition hover:bg-blue-700"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteChoice(choice.id)}
                                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold uppercase text-black transition hover:bg-red-700"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 rounded-xl border-2 border-sky-400 bg-white p-4">
                      <h3 className="font-bold text-gray-900">ADD OPTION</h3>
                      <input
                        type="text"
                        value={newChoiceText}
                        onChange={(e) => setNewChoiceText(e.target.value)}
                        placeholder="Option text shown to player"
                        className="mt-3 w-full rounded-xl border-2 border-sky-700 bg-sky-50 px-4 py-2 text-gray-900 outline-none"
                      />

                      {supportsChoiceSkillRouting && (
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm font-semibold text-gray-800">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={newChoiceHasSkillCheck}
                              onChange={(e) => setNewChoiceHasSkillCheck(e.target.checked)}
                            />
                            Add skill check to this option
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={newChoiceSurpriseBattle}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setNewChoiceSurpriseBattle(checked);
                                if (checked) setNewChoiceBattle(false);
                              }}
                            />
                            Surprise Battle
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={newChoiceBattle}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setNewChoiceBattle(checked);
                                if (checked) setNewChoiceSurpriseBattle(false);
                              }}
                            />
                            Battle
                          </label>
                        </div>
                      )}

                      {supportsChoiceSkillRouting && newChoiceHasSkillCheck ? (
                        <div className="mt-3 space-y-2">
                          <select
                            value={newChoiceSkillName}
                            onChange={(e) => setNewChoiceSkillName(e.target.value)}
                            className="w-full rounded-xl border-2 border-amber-700 bg-amber-50 px-4 py-2 text-gray-900 outline-none"
                          >
                            <option value="">-- Select Skill --</option>
                            {availableSkills.map((skill) => (
                              <option key={skill} value={skill}>
                                {skill}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={newChoiceDifficulty}
                            onChange={(e) => setNewChoiceDifficulty(e.target.value)}
                            placeholder="Difficulty (optional)"
                            className="w-full rounded-xl border-2 border-amber-700 bg-amber-50 px-4 py-2 text-gray-900 outline-none"
                          />
                          <select
                            value={newChoiceSuccessPageId}
                            onChange={(e) => setNewChoiceSuccessPageId(e.target.value)}
                            className="w-full rounded-xl border-2 border-sky-700 bg-sky-50 px-4 py-2 text-gray-900 outline-none"
                          >
                            <option value="">-- On Success --</option>
                            {pages.map((p) => (
                              <option key={p.id} value={String(p.id)}>
                                {p.title}
                              </option>
                            ))}
                          </select>
                          <select
                            value={newChoiceFailurePageId}
                            onChange={(e) => setNewChoiceFailurePageId(e.target.value)}
                            className="w-full rounded-xl border-2 border-sky-700 bg-sky-50 px-4 py-2 text-gray-900 outline-none"
                          >
                            <option value="">-- On Failure --</option>
                            {pages.map((p) => (
                              <option key={p.id} value={String(p.id)}>
                                {p.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="mt-3 space-y-3">
                          <select
                            value={newChoiceNextPageId}
                            onChange={(e) => setNewChoiceNextPageId(e.target.value)}
                            className="w-full rounded-xl border-2 border-sky-700 bg-sky-50 px-4 py-2 text-gray-900 outline-none"
                          >
                            <option value="">-- Destination Page --</option>
                            {pages.map((p) => (
                              <option key={p.id} value={String(p.id)}>
                                {p.title}
                              </option>
                            ))}
                          </select>

                          {(newChoiceSurpriseBattle || newChoiceBattle) && (
                            <div className="space-y-2 rounded-xl border border-sky-300 bg-sky-50 p-3">
                              <p className="text-sm font-semibold text-gray-900">Battle NPCs</p>
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <select
                                  value={newChoiceSelectedBattleNpcId}
                                  onChange={(e) => setNewChoiceSelectedBattleNpcId(e.target.value)}
                                  disabled={loadingBattleNpcs || availableBattleNpcs.length === 0}
                                  className="flex-1 rounded-xl border-2 border-sky-700 bg-white px-4 py-2 text-gray-900 outline-none disabled:opacity-60"
                                >
                                  <option value="">-- Select NPC --</option>
                                  {availableBattleNpcs.map((npc) => (
                                    <option key={npc.id} value={String(npc.id)}>
                                      {npc.name}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => appendBattleNpcId(newChoiceSelectedBattleNpcId, setNewChoiceSelectedBattleNpcId, setNewChoiceBattleNpcIds)}
                                  disabled={!newChoiceSelectedBattleNpcId}
                                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-bold uppercase text-black transition hover:bg-sky-700 disabled:opacity-60"
                                >
                                  Add NPC
                                </button>
                                {battleNpcSystem === 'SW' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setBattleNpcCreationTarget('new');
                                        setBattleNpcModalNpc(null);
                                        setShowCreateBattleNpcModal(true);
                                      }}
                                      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold uppercase text-black transition hover:bg-amber-600"
                                    >
                                      Create
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const selectedNpc = getBattleNpcById(newChoiceSelectedBattleNpcId);
                                        if (!selectedNpc) return;
                                        setBattleNpcCreationTarget('new');
                                        setBattleNpcModalNpc(selectedNpc);
                                        setShowCreateBattleNpcModal(true);
                                      }}
                                      disabled={!newChoiceSelectedBattleNpcId}
                                      className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-bold uppercase text-black transition hover:bg-yellow-700 disabled:opacity-60"
                                    >
                                      Edit
                                    </button>
                                  </>
                                )}
                              </div>
                              {loadingBattleNpcs && <p className="text-sm text-gray-700">Loading NPCs...</p>}
                              {!loadingBattleNpcs && availableBattleNpcs.length === 0 && !battleNpcError && (
                                <p className="text-sm text-amber-800">No NPC list is available for this TTRPG yet.</p>
                              )}
                              {newChoiceBattleNpcIds.length > 0 && (
                                <div className="space-y-2">
                                  {newChoiceBattleNpcIds.map((npcId, index) => (
                                    <div key={`${npcId}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-sky-200 bg-white px-3 py-2">
                                      <span className="text-sm text-gray-900">{getBattleNpcLabel(npcId)}</span>
                                      <button
                                        type="button"
                                        onClick={() => removeBattleNpcIdAtIndex(index, setNewChoiceBattleNpcIds)}
                                        className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold uppercase text-black transition hover:bg-red-700"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        onClick={handleAddChoice}
                        disabled={addingChoice}
                        className="mt-3 rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold uppercase text-black transition hover:bg-gray-800 disabled:opacity-70"
                      >
                        {addingChoice ? 'Adding...' : 'Add Option'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <AddNPCModal
        isOpen={showCreateBattleNpcModal}
        onClose={() => {
          setShowCreateBattleNpcModal(false);
          setBattleNpcCreationTarget('');
          setBattleNpcModalNpc(null);
        }}
        onSave={handleCreatedBattleNpc}
        campaignId={null}
        npcToEdit={battleNpcModalNpc}
      />
    </div>
  );
}
