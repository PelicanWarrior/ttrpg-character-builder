import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function SoloAdventuresEdit() {
  const navigate = useNavigate();
  const { adventureId } = useParams();
  const username = localStorage.getItem('username') || '';

  const [userId, setUserId] = useState(null);
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

  const [newChoiceText, setNewChoiceText] = useState('');
  const [newChoiceNextPageId, setNewChoiceNextPageId] = useState('');
  const [addingChoice, setAddingChoice] = useState(false);

  const [editingChoiceId, setEditingChoiceId] = useState('');
  const [editingChoiceText, setEditingChoiceText] = useState('');
  const [editingChoiceNextPageId, setEditingChoiceNextPageId] = useState('');
  const [savingChoice, setSavingChoice] = useState(false);

  const [skillChecksByChoice, setSkillChecksByChoice] = useState({});
  const [loadingSkillChecks, setLoadingSkillChecks] = useState(false);
  const [skillCheckError, setSkillCheckError] = useState('');
  const [newSkillCheckByChoice, setNewSkillCheckByChoice] = useState({});

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
        .select('id, title, description, user_id, first_page_id')
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
        .select('id, page_id, choice_text, next_page_id, choice_order')
        .eq('page_id', selectedPageId)
        .order('choice_order', { ascending: true })
        .order('id', { ascending: true });

      if (!active) return;

      if (choicesErr) {
        setChoiceError(choicesErr.message || 'Failed to load choices.');
      } else {
        setChoices(data || []);
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

    const loadSkillChecks = async () => {
      if (!choices.length) {
        setSkillChecksByChoice({});
        return;
      }

      setLoadingSkillChecks(true);
      setSkillCheckError('');

      const choiceIds = choices.map((c) => c.id);
      const { data, error: checksErr } = await supabase
        .from('Solo_Adventure_Choice_Skill_Checks')
        .select('id, choice_id, skill_name, difficulty, success_text, failure_text, check_order')
        .in('choice_id', choiceIds)
        .order('check_order', { ascending: true })
        .order('id', { ascending: true });

      if (!active) return;

      if (checksErr) {
        setSkillCheckError(checksErr.message || 'Failed to load skill checks.');
        setLoadingSkillChecks(false);
        return;
      }

      const grouped = {};
      for (const row of data || []) {
        const key = String(row.choice_id);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(row);
      }

      setSkillChecksByChoice(grouped);
      setLoadingSkillChecks(false);
    };

    loadSkillChecks();

    return () => {
      active = false;
    };
  }, [choices]);

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
    if (!window.confirm('Delete this page and all its choices?')) return;

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

  const handleAddChoice = async () => {
    if (!selectedPageId) {
      setChoiceError('Select a page first.');
      return;
    }
    if (!newChoiceText.trim()) {
      setChoiceError('Choice text is required.');
      return;
    }

    setAddingChoice(true);
    setChoiceError('');

    const nextOrder = choices.length + 1;
    const { data, error: addErr } = await supabase
      .from('Solo_Adventure_Choices')
      .insert([
        {
          page_id: parseInt(selectedPageId, 10),
          choice_text: newChoiceText.trim(),
          next_page_id: newChoiceNextPageId ? parseInt(newChoiceNextPageId, 10) : null,
          choice_order: nextOrder,
        },
      ])
      .select('id, page_id, choice_text, next_page_id, choice_order')
      .single();

    setAddingChoice(false);

    if (addErr || !data) {
      setChoiceError(addErr?.message || 'Failed to add choice.');
      return;
    }

    setChoices((prev) => [...prev, data]);
    setNewChoiceText('');
    setNewChoiceNextPageId('');
  };

  const startEditChoice = (choice) => {
    setEditingChoiceId(String(choice.id));
    setEditingChoiceText(choice.choice_text || '');
    setEditingChoiceNextPageId(choice.next_page_id ? String(choice.next_page_id) : '');
  };

  const cancelEditChoice = () => {
    setEditingChoiceId('');
    setEditingChoiceText('');
    setEditingChoiceNextPageId('');
  };

  const handleSaveChoice = async () => {
    if (!editingChoiceId) return;
    if (!editingChoiceText.trim()) {
      setChoiceError('Choice text is required.');
      return;
    }

    setSavingChoice(true);
    setChoiceError('');

    const { error: saveErr } = await supabase
      .from('Solo_Adventure_Choices')
      .update({
        choice_text: editingChoiceText.trim(),
        next_page_id: editingChoiceNextPageId ? parseInt(editingChoiceNextPageId, 10) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingChoiceId)
      .eq('page_id', selectedPageId);

    setSavingChoice(false);

    if (saveErr) {
      setChoiceError(saveErr.message || 'Failed to save choice.');
      return;
    }

    setChoices((prev) =>
      prev.map((c) =>
        String(c.id) === String(editingChoiceId)
          ? {
              ...c,
              choice_text: editingChoiceText.trim(),
              next_page_id: editingChoiceNextPageId ? parseInt(editingChoiceNextPageId, 10) : null,
            }
          : c
      )
    );
    cancelEditChoice();
  };

  const handleDeleteChoice = async (choiceId) => {
    if (!window.confirm('Delete this choice?')) return;

    const { error: delErr } = await supabase
      .from('Solo_Adventure_Choices')
      .delete()
      .eq('id', choiceId)
      .eq('page_id', selectedPageId);

    if (delErr) {
      setChoiceError(delErr.message || 'Failed to delete choice.');
      return;
    }

    setChoices((prev) => prev.filter((c) => String(c.id) !== String(choiceId)));
  };

  const getSkillCheckDraft = (choiceId) => {
    const key = String(choiceId);
    return (
      newSkillCheckByChoice[key] || {
        skill_name: '',
        difficulty: '',
        success_text: '',
        failure_text: '',
      }
    );
  };

  const updateSkillCheckDraft = (choiceId, field, value) => {
    const key = String(choiceId);
    const current = getSkillCheckDraft(choiceId);
    setNewSkillCheckByChoice((prev) => ({
      ...prev,
      [key]: {
        ...current,
        [field]: value,
      },
    }));
  };

  const handleAddSkillCheck = async (choiceId) => {
    const key = String(choiceId);
    const draft = getSkillCheckDraft(choiceId);

    if (!draft.skill_name.trim()) {
      setSkillCheckError('Skill name is required for a skill check.');
      return;
    }

    setSkillCheckError('');
    const nextOrder = (skillChecksByChoice[key] || []).length + 1;

    const { data, error: addErr } = await supabase
      .from('Solo_Adventure_Choice_Skill_Checks')
      .insert([
        {
          choice_id: parseInt(choiceId, 10),
          skill_name: draft.skill_name.trim(),
          difficulty: draft.difficulty.trim() || null,
          success_text: draft.success_text.trim() || null,
          failure_text: draft.failure_text.trim() || null,
          check_order: nextOrder,
        },
      ])
      .select('id, choice_id, skill_name, difficulty, success_text, failure_text, check_order')
      .single();

    if (addErr || !data) {
      setSkillCheckError(addErr?.message || 'Failed to add skill check.');
      return;
    }

    setSkillChecksByChoice((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), data],
    }));

    setNewSkillCheckByChoice((prev) => ({
      ...prev,
      [key]: {
        skill_name: '',
        difficulty: '',
        success_text: '',
        failure_text: '',
      },
    }));
  };

  const handleDeleteSkillCheck = async (choiceId, checkId) => {
    if (!window.confirm('Delete this skill check?')) return;

    const { error: delErr } = await supabase
      .from('Solo_Adventure_Choice_Skill_Checks')
      .delete()
      .eq('id', checkId)
      .eq('choice_id', choiceId);

    if (delErr) {
      setSkillCheckError(delErr.message || 'Failed to delete skill check.');
      return;
    }

    const key = String(choiceId);
    setSkillChecksByChoice((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((c) => String(c.id) !== String(checkId)),
    }));
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

              {error && !loading && <p className="mt-4 text-base font-semibold text-red-700">{error}</p>}
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
                    {skillCheckError && <p className="mt-3 font-semibold text-red-700">{skillCheckError}</p>}
                    {loadingChoices && <p className="mt-3 text-gray-700">Loading options...</p>}
                    {loadingSkillChecks && <p className="mt-3 text-gray-700">Loading skill checks...</p>}

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
                                <select
                                  value={editingChoiceNextPageId}
                                  onChange={(e) => setEditingChoiceNextPageId(e.target.value)}
                                  className="mt-3 w-full rounded-xl border-2 border-sky-700 bg-white px-4 py-2 text-gray-900 outline-none"
                                >
                                  <option value="">-- No destination --</option>
                                  {pages.map((p) => (
                                    <option key={p.id} value={String(p.id)}>
                                      {p.title}
                                    </option>
                                  ))}
                                </select>
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
                                  <p className="text-sm text-gray-700">Goes to: {pageTitleById(choice.next_page_id)}</p>

                                  <div className="mt-2 rounded-lg border border-sky-300 bg-white p-3">
                                    <p className="text-xs font-bold uppercase text-gray-800">Skill Checks</p>
                                    {(skillChecksByChoice[String(choice.id)] || []).length === 0 && (
                                      <p className="mt-1 text-xs text-gray-600">No skill checks for this option.</p>
                                    )}
                                    {(skillChecksByChoice[String(choice.id)] || []).map((check) => (
                                      <div key={check.id} className="mt-2 flex items-start justify-between gap-3 rounded border border-sky-200 bg-sky-50 p-2">
                                        <div>
                                          <p className="text-xs font-semibold text-gray-900">
                                            {check.skill_name}
                                            {check.difficulty ? ` (${check.difficulty})` : ''}
                                          </p>
                                          {check.success_text && (
                                            <p className="text-xs text-green-700">Success: {check.success_text}</p>
                                          )}
                                          {check.failure_text && (
                                            <p className="text-xs text-red-700">Failure: {check.failure_text}</p>
                                          )}
                                        </div>
                                        <button
                                          onClick={() => handleDeleteSkillCheck(choice.id, check.id)}
                                          className="rounded bg-red-600 px-2 py-1 text-xs font-bold uppercase text-black hover:bg-red-700"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    ))}

                                    <div className="mt-2 rounded border border-sky-200 bg-white p-2">
                                      <input
                                        type="text"
                                        value={getSkillCheckDraft(choice.id).skill_name}
                                        onChange={(e) => updateSkillCheckDraft(choice.id, 'skill_name', e.target.value)}
                                        placeholder="Skill name (e.g. Stealth)"
                                        className="w-full rounded border border-sky-400 bg-sky-50 px-2 py-1 text-xs text-gray-900 outline-none"
                                      />
                                      <input
                                        type="text"
                                        value={getSkillCheckDraft(choice.id).difficulty}
                                        onChange={(e) => updateSkillCheckDraft(choice.id, 'difficulty', e.target.value)}
                                        placeholder="Difficulty (optional)"
                                        className="mt-2 w-full rounded border border-sky-400 bg-sky-50 px-2 py-1 text-xs text-gray-900 outline-none"
                                      />
                                      <input
                                        type="text"
                                        value={getSkillCheckDraft(choice.id).success_text}
                                        onChange={(e) => updateSkillCheckDraft(choice.id, 'success_text', e.target.value)}
                                        placeholder="Success text (optional)"
                                        className="mt-2 w-full rounded border border-sky-400 bg-sky-50 px-2 py-1 text-xs text-gray-900 outline-none"
                                      />
                                      <input
                                        type="text"
                                        value={getSkillCheckDraft(choice.id).failure_text}
                                        onChange={(e) => updateSkillCheckDraft(choice.id, 'failure_text', e.target.value)}
                                        placeholder="Failure text (optional)"
                                        className="mt-2 w-full rounded border border-sky-400 bg-sky-50 px-2 py-1 text-xs text-gray-900 outline-none"
                                      />
                                      <button
                                        onClick={() => handleAddSkillCheck(choice.id)}
                                        className="mt-2 rounded bg-indigo-600 px-2 py-1 text-xs font-bold uppercase text-black hover:bg-indigo-700"
                                      >
                                        Add Skill Check
                                      </button>
                                    </div>
                                  </div>
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
                      <select
                        value={newChoiceNextPageId}
                        onChange={(e) => setNewChoiceNextPageId(e.target.value)}
                        className="mt-3 w-full rounded-xl border-2 border-sky-700 bg-sky-50 px-4 py-2 text-gray-900 outline-none"
                      >
                        <option value="">-- No destination --</option>
                        {pages.map((p) => (
                          <option key={p.id} value={String(p.id)}>
                            {p.title}
                          </option>
                        ))}
                      </select>
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
    </div>
  );
}
