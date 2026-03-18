import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';

const parseList = (value) => String(value || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const parseModNames = (value) => String(value || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const rowMatchesMod = (rowMod, targetMod) => {
  const normalizedTarget = String(targetMod || '').trim().toLowerCase();
  if (!normalizedTarget) return true;
  const mods = parseModNames(rowMod).map((item) => item.toLowerCase());
  if (mods.length === 0) return false;
  return mods.includes(normalizedTarget);
};

const toIntOrNull = (value) => {
  const parsed = parseInt(String(value || '').trim(), 10);
  return Number.isNaN(parsed) ? null : parsed;
};



export default function DNDNotes() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const campaignId = searchParams.get('campaignId');
  const campaignName = decodeURIComponent(searchParams.get('campaignName') || '');
  const mod = searchParams.get('mod') || '';
  const ttrpgId = searchParams.get('ttrpgId') || '';

  const [playerId, setPlayerId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadPicturesEnabled, setUploadPicturesEnabled] = useState(false);

  const [places, setPlaces] = useState([]);
  const [npcs, setNpcs] = useState([]);
  const [raceList, setRaceList] = useState([]);
  const [abilitiesList, setAbilitiesList] = useState([]);
  const [abilityDescriptions, setAbilityDescriptions] = useState({});
  const [equipmentList, setEquipmentList] = useState([]);

  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [selectedNpcId, setSelectedNpcId] = useState(null);

  const [showAddPlaceForm, setShowAddPlaceForm] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState('');
  const [newPlaceDescription, setNewPlaceDescription] = useState('');
  const [newPlaceParentId, setNewPlaceParentId] = useState('0');

  const [editPlaceName, setEditPlaceName] = useState('');
  const [editPlaceDescription, setEditPlaceDescription] = useState('');

  const [showAddNpcForm, setShowAddNpcForm] = useState(false);
  const [newNpcName, setNewNpcName] = useState('');
  const [newNpcRaceId, setNewNpcRaceId] = useState('');
  const [newNpcDescription, setNewNpcDescription] = useState('');
  const [newNpcStrength, setNewNpcStrength] = useState('');
  const [newNpcDexterity, setNewNpcDexterity] = useState('');
  const [newNpcConstitution, setNewNpcConstitution] = useState('');
  const [newNpcIntelligence, setNewNpcIntelligence] = useState('');
  const [newNpcWisdom, setNewNpcWisdom] = useState('');
  const [newNpcCharisma, setNewNpcCharisma] = useState('');
  const [newNpcParentId, setNewNpcParentId] = useState('0');
  const [newNpcSkills, setNewNpcSkills] = useState([]);
  const [newNpcAbilities, setNewNpcAbilities] = useState([]);
  const [newNpcEquipment, setNewNpcEquipment] = useState([]);

  const [editNpcName, setEditNpcName] = useState('');
  const [editNpcRaceId, setEditNpcRaceId] = useState('');
  const [editNpcDescription, setEditNpcDescription] = useState('');
  const [editNpcStrength, setEditNpcStrength] = useState('');
  const [editNpcDexterity, setEditNpcDexterity] = useState('');
  const [editNpcConstitution, setEditNpcConstitution] = useState('');
  const [editNpcIntelligence, setEditNpcIntelligence] = useState('');
  const [editNpcWisdom, setEditNpcWisdom] = useState('');
  const [editNpcCharisma, setEditNpcCharisma] = useState('');
  const [editNpcParentId, setEditNpcParentId] = useState('0');
  const [editNpcSkills, setEditNpcSkills] = useState([]);
  const [editNpcAbilities, setEditNpcAbilities] = useState([]);
  const [editNpcEquipment, setEditNpcEquipment] = useState([]);

  const [busy, setBusy] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [rowMenuPlaceId, setRowMenuPlaceId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [editingPlaceId, setEditingPlaceId] = useState(null);
  const [showInlineAddNote, setShowInlineAddNote] = useState(false);
  const [showAddExistingNpc, setShowAddExistingNpc] = useState(false);
  const [showAddExistingNote, setShowAddExistingNote] = useState(false);
  const [selectedExistingNpcId, setSelectedExistingNpcId] = useState('');
  const [selectedExistingNoteId, setSelectedExistingNoteId] = useState('');

  const [showTimeline, setShowTimeline] = useState(false);
  const [timelineText, setTimelineText] = useState('');
  const [savingTimeline, setSavingTimeline] = useState(false);

  const placeFileInputRef = useRef(null);
  const npcFileInputRef = useRef(null);
  const columnsContainerRef = useRef(null);
  const activePlaceColumnRef = useRef(null);
  const addNpcPanelRef = useRef(null);
  const activeNpcPanelRef = useRef(null);

  const selectedPlace = useMemo(
    () => places.find((place) => String(place.id) === String(selectedPlaceId)) || null,
    [places, selectedPlaceId]
  );

  const selectedNpc = useMemo(
    () => npcs.find((npc) => String(npc.id) === String(selectedNpcId)) || null,
    [npcs, selectedNpcId]
  );

  const placeById = useMemo(() => {
    const map = {};
    places.forEach((place) => {
      map[place.id] = place;
    });
    return map;
  }, [places]);

  const selectedPlaceParent = useMemo(() => {
    if (!selectedPlace) return null;
    const parentId = Number(selectedPlace.Part_of_Place || 0);
    if (!parentId) return null;
    return placeById[parentId] || null;
  }, [selectedPlace, placeById]);

  const canUploadPictures = () => isAdmin || uploadPicturesEnabled;

  const raceMap = useMemo(() => {
    const map = {};
    raceList.forEach((row) => {
      map[row.id] = row.RaceName || 'Unknown Race';
    });
    return map;
  }, [raceList]);

  const orderedPlaces = useMemo(() => {
    const byParent = new Map();
    places.forEach((place) => {
      const parentKey = place.Part_of_Place == null ? 0 : Number(place.Part_of_Place);
      if (!byParent.has(parentKey)) {
        byParent.set(parentKey, []);
      }
      byParent.get(parentKey).push(place);
    });

    byParent.forEach((list) => {
      list.sort((a, b) => {
        const orderDiff = Number(a.Order || 0) - Number(b.Order || 0);
        if (orderDiff !== 0) return orderDiff;
        return String(a.Place_Name || '').localeCompare(String(b.Place_Name || ''));
      });
    });

    const flattened = [];
    const walk = (parentId, depth) => {
      const children = byParent.get(parentId) || [];
      children.forEach((child) => {
        flattened.push({ ...child, __depth: depth });
        walk(Number(child.id), depth + 1);
      });
    };

    walk(0, 0);
    return flattened;
  }, [places]);

  const topLevelPlaces = useMemo(() => (
    places
      .filter((place) => {
        const parentId = place.Part_of_Place == null ? 0 : Number(place.Part_of_Place);
        return parentId === 0;
      })
      .sort((a, b) => {
        const orderDiff = Number(a.Order || 0) - Number(b.Order || 0);
        if (orderDiff !== 0) return orderDiff;
        return String(a.Place_Name || '').localeCompare(String(b.Place_Name || ''));
      })
  ), [places]);

  const childPlacesByParent = useMemo(() => {
    const map = {};
    places.forEach((place) => {
      const parentId = place.Part_of_Place == null ? 0 : Number(place.Part_of_Place);
      if (!map[parentId]) map[parentId] = [];
      map[parentId].push(place);
    });

    Object.keys(map).forEach((parentKey) => {
      const parentId = Number(parentKey);
      map[parentId] = map[parentId]
        .filter((place) => Number(place.id) !== parentId)
        .sort((a, b) => {
          const orderDiff = Number(a.Order || 0) - Number(b.Order || 0);
          if (orderDiff !== 0) return orderDiff;
          return String(a.Place_Name || '').localeCompare(String(b.Place_Name || ''));
        });
    });

    return map;
  }, [places]);

  const npcsByParent = useMemo(() => {
    const map = {};
    npcs.forEach((npc) => {
      const parentId = npc.Part_of_Place == null ? 0 : Number(npc.Part_of_Place);
      if (!map[parentId]) map[parentId] = [];
      map[parentId].push(npc);
    });

    Object.keys(map).forEach((parentKey) => {
      map[Number(parentKey)] = map[Number(parentKey)]
        .sort((a, b) => String(a.Name || '').localeCompare(String(b.Name || '')));
    });

    return map;
  }, [npcs]);

  const selectedPlacePath = useMemo(() => {
    if (!selectedPlace) return [];

    const path = [];
    const visited = new Set();
    let cursor = selectedPlace;

    while (cursor && !visited.has(cursor.id)) {
      path.unshift(cursor);
      visited.add(cursor.id);
      const parentId = cursor.Part_of_Place == null ? 0 : Number(cursor.Part_of_Place);
      if (!parentId) break;
      cursor = placeById[parentId] || null;
    }

    return path;
  }, [selectedPlace, placeById]);

  const availableExistingNpcs = useMemo(() => (
    npcs
      .filter((npc) => Number(npc.Part_of_Place || 0) === 0)
      .sort((a, b) => String(a.Name || '').localeCompare(String(b.Name || '')))
  ), [npcs]);

  const availableExistingNotes = useMemo(() => (
    places
      .filter((place) => Number(place.Part_of_Place || 0) === 0)
      .filter((place) => !selectedPlace || Number(place.id) !== Number(selectedPlace.id))
      .sort((a, b) => String(a.Place_Name || '').localeCompare(String(b.Place_Name || '')))
  ), [places, selectedPlace]);

  const loadPermissions = async () => {
    const username = localStorage.getItem('username');
    if (!username) return;

    const [{ data: userData, error: userError }, { data: adminControl, error: controlError }] = await Promise.all([
      supabase
        .from('user')
        .select('id, admin')
        .eq('username', username)
        .single(),
      supabase
        .from('Admin_Control')
        .select('Upload_pictures')
        .eq('id', 1)
        .single(),
    ]);

    if (!userError && userData) {
      setPlayerId(userData.id);
      setIsAdmin(userData.admin === true);
    }

    if (!controlError && adminControl) {
      setUploadPicturesEnabled(adminControl.Upload_pictures === true);
    }
  };

  const loadLookups = async () => {
    const [{ data: races }, { data: abilities }, { data: equipment }] = await Promise.all([
      supabase
        .from('DND_Races')
        .select('id, RaceName, DNDMod')
        .order('RaceName', { ascending: true }),
      supabase
        .from('DND_ClassFeatures')
        .select('id, FeatureName, FeatureText')
        .order('FeatureName', { ascending: true }),
      supabase
        .from('DND_Equipment')
        .select('id, ItemName, DNDMod')
        .order('ItemName', { ascending: true }),
    ]);

    setRaceList((races || []).filter((row) => rowMatchesMod(row.DNDMod, mod)));
    setAbilitiesList(abilities || []);

    const abilityDescMap = {};
    (abilities || []).forEach((row) => {
      abilityDescMap[row.FeatureName] = row.FeatureText || '';
    });
    setAbilityDescriptions(abilityDescMap);

    setEquipmentList((equipment || []).filter((row) => rowMatchesMod(row.DNDMod, mod)));
  };

  const loadPlaces = async () => {
    if (!campaignId) return;
    const { data, error } = await supabase
      .from('DND_campaign_notes')
      .select('id, CampaignID, Place_Name, Description, Part_of_Place, Order, PictureID')
      .eq('CampaignID', campaignId)
      .order('Order', { ascending: true });

    if (error) {
      console.error('Failed loading DND campaign notes:', error);
      setPlaces([]);
      return;
    }

    setPlaces(data || []);
  };

  const loadNpcs = async () => {
    if (!campaignId) return;
    const { data, error } = await supabase
      .from('DND_campaign_NPC')
      .select('id, CampaignID, Name, Race, Part_of_Place, Description, PictureID, Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma, Skills, Abilities, Equipment')
      .eq('CampaignID', campaignId);

    if (error) {
      console.error('Failed loading DND campaign NPCs:', error);
      setNpcs([]);
      return;
    }

    setNpcs(data || []);
  };

  useEffect(() => {
    if (!campaignId) return;
    const init = async () => {
      await Promise.all([loadPermissions(), loadLookups(), loadPlaces(), loadNpcs()]);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, mod]);

  useEffect(() => {
    setShowDropdown(false);
    setRowMenuPlaceId(null);
    setShowInlineAddNote(false);
    setShowAddNpcForm(false);
    setShowAddExistingNpc(false);
    setShowAddExistingNote(false);
    setSelectedExistingNpcId('');
    setSelectedExistingNoteId('');
    setEditingPlaceId(null);

    if (!selectedPlace) {
      setEditPlaceName('');
      setEditPlaceDescription('');
      return;
    }
    setEditPlaceName(selectedPlace.Place_Name || '');
    setEditPlaceDescription(selectedPlace.Description || '');
  }, [selectedPlace]);

  useEffect(() => {
    if (!selectedNpc) {
      setEditNpcName('');
      setEditNpcRaceId('');
      setEditNpcDescription('');
      setEditNpcStrength('');
      setEditNpcDexterity('');
      setEditNpcConstitution('');
      setEditNpcIntelligence('');
      setEditNpcWisdom('');
      setEditNpcCharisma('');
      setEditNpcParentId('0');
      setEditNpcSkills([]);
      setEditNpcAbilities([]);
      setEditNpcEquipment([]);
      return;
    }

    setEditNpcName(selectedNpc.Name || '');
    setEditNpcRaceId(selectedNpc.Race != null ? String(selectedNpc.Race) : '');
    setEditNpcDescription(selectedNpc.Description || '');
    setEditNpcStrength(selectedNpc.Strength != null ? String(selectedNpc.Strength) : '');
    setEditNpcDexterity(selectedNpc.Dexterity != null ? String(selectedNpc.Dexterity) : '');
    setEditNpcConstitution(selectedNpc.Constitution != null ? String(selectedNpc.Constitution) : '');
    setEditNpcIntelligence(selectedNpc.Intelligence != null ? String(selectedNpc.Intelligence) : '');
    setEditNpcWisdom(selectedNpc.Wisdom != null ? String(selectedNpc.Wisdom) : '');
    setEditNpcCharisma(selectedNpc.Charisma != null ? String(selectedNpc.Charisma) : '');
    setEditNpcParentId(selectedNpc.Part_of_Place != null ? String(selectedNpc.Part_of_Place) : '0');
    setEditNpcSkills(parseList(selectedNpc.Skills));
    setEditNpcAbilities(parseList(selectedNpc.Abilities));
    setEditNpcEquipment(parseList(selectedNpc.Equipment));
  }, [selectedNpc]);

  useEffect(() => {
    if (!selectedPlacePath.length) return;
    if (!activePlaceColumnRef.current) return;

    activePlaceColumnRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'end',
    });
  }, [selectedPlacePath.length, selectedPlaceId]);

  useEffect(() => {
    if (!selectedNpcId) return;
    if (!activeNpcPanelRef.current) return;

    activeNpcPanelRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'end',
    });
  }, [selectedNpcId]);

  useEffect(() => {
    if (!showAddNpcForm) return;
    if (!addNpcPanelRef.current) return;

    addNpcPanelRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'end',
    });
  }, [showAddNpcForm]);

  useEffect(() => {
    if (selectedPlaceId != null) {
      setShowTimeline(false);
    }
  }, [selectedPlaceId]);

  useEffect(() => {
    if (!previewImage) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setPreviewImage(null);
        setPreviewZoom(1);
        return;
      }

      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        setPreviewZoom((prev) => Math.min(4, Number((prev + 0.25).toFixed(2))));
        return;
      }

      if (event.key === '-') {
        event.preventDefault();
        setPreviewZoom((prev) => Math.max(0.5, Number((prev - 0.25).toFixed(2))));
        return;
      }

      if (event.key === '0') {
        event.preventDefault();
        setPreviewZoom(1);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [previewImage]);

  const addToList = (value, listSetter) => {
    const normalized = String(value || '').trim();
    if (!normalized) return;
    listSetter((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
  };

  const removeFromList = (value, listSetter) => {
    listSetter((prev) => prev.filter((item) => item !== value));
  };

  const openImagePreview = (src, alt) => {
    if (!src) return;
    setPreviewZoom(1);
    setPreviewImage({ src, alt: alt || 'Preview image' });
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
    setPreviewZoom(1);
  };

  const zoomPreviewIn = () => {
    setPreviewZoom((prev) => Math.min(4, Number((prev + 0.25).toFixed(2))));
  };

  const zoomPreviewOut = () => {
    setPreviewZoom((prev) => Math.max(0.5, Number((prev - 0.25).toFixed(2))));
  };

  const resetPreviewZoom = () => {
    setPreviewZoom(1);
  };

  const getPictureUrl = (pictureId) => `/F_Pictures/Picture ${pictureId}.png?t=${Date.now()}`;

  const toggleRowPlaceMenu = (place) => {
    if (!place) return;
    setSelectedPlaceId(place.id);
    setSelectedNpcId(null);
    setShowDropdown(false);
    setRowMenuPlaceId((prev) => (Number(prev) === Number(place.id) ? null : place.id));
  };

  const handleMenuAction = async (action) => {
    if (!selectedPlace) return;

    if (action === 'edit') {
      setEditingPlaceId(selectedPlace.id);
      setShowDropdown(false);
      setRowMenuPlaceId(null);
      return;
    }

    if (action === 'upload') {
      setShowDropdown(false);
      setRowMenuPlaceId(null);
      placeFileInputRef.current?.click();
      return;
    }

    if (action === 'add-note') {
      setShowInlineAddNote((prev) => !prev);
      setShowAddNpcForm(false);
      setShowAddExistingNpc(false);
      setShowAddExistingNote(false);
      setNewPlaceParentId(String(selectedPlace.id));
      setShowDropdown(false);
      setRowMenuPlaceId(null);
      return;
    }

    if (action === 'add-npc') {
      setShowAddNpcForm((prev) => !prev);
      setSelectedNpcId(null);
      setShowInlineAddNote(false);
      setShowAddExistingNpc(false);
      setShowAddExistingNote(false);
      setNewNpcParentId(String(selectedPlace.id));
      setShowDropdown(false);
      setRowMenuPlaceId(null);
      return;
    }

    if (action === 'add-existing-npc') {
      setShowAddExistingNpc((prev) => !prev);
      setShowInlineAddNote(false);
      setShowAddNpcForm(false);
      setShowAddExistingNote(false);
      setShowDropdown(false);
      setRowMenuPlaceId(null);
      return;
    }

    if (action === 'add-existing-note') {
      setShowAddExistingNote((prev) => !prev);
      setShowInlineAddNote(false);
      setShowAddNpcForm(false);
      setShowAddExistingNpc(false);
      setShowDropdown(false);
      setRowMenuPlaceId(null);
      return;
    }

    if (action === 'delete') {
      setShowDropdown(false);
      setRowMenuPlaceId(null);
      await handleDeletePlace();
    }
  };

  const handleAttachExistingNpc = async () => {
    if (!selectedPlace || !selectedExistingNpcId) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from('DND_campaign_NPC')
        .update({ Part_of_Place: selectedPlace.id })
        .eq('id', selectedExistingNpcId)
        .eq('CampaignID', campaignId);

      if (error) throw error;
      setSelectedExistingNpcId('');
      setShowAddExistingNpc(false);
      await loadNpcs();
    } catch (err) {
      console.error('Failed adding existing NPC to place:', err);
      alert('Failed to add existing NPC.');
    } finally {
      setBusy(false);
    }
  };

  const handleAttachExistingNote = async () => {
    if (!selectedPlace || !selectedExistingNoteId) return;
    setBusy(true);
    try {
      const siblingOrders = places
        .filter((place) => Number(place.Part_of_Place || 0) === Number(selectedPlace.id))
        .map((place) => Number(place.Order || 0));
      const nextOrder = siblingOrders.length > 0 ? Math.max(...siblingOrders) + 1 : 1;

      const { error } = await supabase
        .from('DND_campaign_notes')
        .update({
          Part_of_Place: selectedPlace.id,
          Order: nextOrder,
        })
        .eq('id', selectedExistingNoteId)
        .eq('CampaignID', campaignId);

      if (error) throw error;
      setSelectedExistingNoteId('');
      setShowAddExistingNote(false);
      await loadPlaces();
    } catch (err) {
      console.error('Failed adding existing note to place:', err);
      alert('Failed to add existing note.');
    } finally {
      setBusy(false);
    }
  };

  const handleAddPlace = async () => {
    if (!newPlaceName.trim()) {
      alert('Place name is required.');
      return;
    }

    setBusy(true);
    try {
      const parentId = newPlaceParentId === '0' ? 0 : toIntOrNull(newPlaceParentId);
      const siblingOrders = places
        .filter((place) => {
          const p = place.Part_of_Place == null ? 0 : Number(place.Part_of_Place);
          return p === (parentId || 0);
        })
        .map((place) => Number(place.Order || 0));
      const nextOrder = siblingOrders.length > 0 ? Math.max(...siblingOrders) + 1 : 1;

      const { error } = await supabase
        .from('DND_campaign_notes')
        .insert([
          {
            CampaignID: parseInt(campaignId, 10),
            Place_Name: newPlaceName.trim(),
            Description: newPlaceDescription || null,
            Part_of_Place: parentId || 0,
            Order: nextOrder,
          },
        ]);

      if (error) throw error;

      setNewPlaceName('');
      setNewPlaceDescription('');
      setNewPlaceParentId('0');
      setShowAddPlaceForm(false);
      setShowInlineAddNote(false);
      await loadPlaces();
    } catch (err) {
      console.error('Failed adding DND place:', err);
      alert('Failed to add place.');
    } finally {
      setBusy(false);
    }
  };

  const handleSavePlace = async () => {
    if (!selectedPlace) return;

    setBusy(true);
    try {
      const { error } = await supabase
        .from('DND_campaign_notes')
        .update({
          Place_Name: editPlaceName,
          Description: editPlaceDescription,
        })
        .eq('id', selectedPlace.id);

      if (error) throw error;
      await loadPlaces();
    } catch (err) {
      console.error('Failed saving DND place:', err);
      alert('Failed to save place.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeletePlace = async () => {
    if (!selectedPlace) return;

    const childPlaceCount = places.filter((place) => Number(place.Part_of_Place || 0) === Number(selectedPlace.id)).length;
    const childNpcCount = npcs.filter((npc) => Number(npc.Part_of_Place || 0) === Number(selectedPlace.id)).length;

    if (childPlaceCount > 0 || childNpcCount > 0) {
      alert('Move or delete child places/NPCs before deleting this place.');
      return;
    }

    if (!confirm(`Delete place "${selectedPlace.Place_Name}"?`)) return;

    setBusy(true);
    try {
      const { error } = await supabase
        .from('DND_campaign_notes')
        .delete()
        .eq('id', selectedPlace.id);

      if (error) throw error;
      setSelectedPlaceId(null);
      await loadPlaces();
    } catch (err) {
      console.error('Failed deleting DND place:', err);
      alert('Failed to delete place.');
    } finally {
      setBusy(false);
    }
  };

  const resetNewNpcForm = () => {
    setNewNpcName('');
    setNewNpcRaceId('');
    setNewNpcDescription('');
    setNewNpcStrength('');
    setNewNpcDexterity('');
    setNewNpcConstitution('');
    setNewNpcIntelligence('');
    setNewNpcWisdom('');
    setNewNpcCharisma('');
    setNewNpcParentId(selectedPlace ? String(selectedPlace.id) : '0');
    setNewNpcSkills([]);
    setNewNpcAbilities([]);
    setNewNpcEquipment([]);
  };

  const handleAddNpc = async () => {
    if (!newNpcName.trim()) {
      alert('NPC name is required.');
      return;
    }

    setBusy(true);
    try {
      const payload = {
        CampaignID: parseInt(campaignId, 10),
        Name: newNpcName.trim(),
        Race: toIntOrNull(newNpcRaceId),
        Part_of_Place: newNpcParentId === '0' ? 0 : toIntOrNull(newNpcParentId),
        Description: newNpcDescription || null,
        Strength: toIntOrNull(newNpcStrength),
        Dexterity: toIntOrNull(newNpcDexterity),
        Constitution: toIntOrNull(newNpcConstitution),
        Intelligence: toIntOrNull(newNpcIntelligence),
        Wisdom: toIntOrNull(newNpcWisdom),
        Charisma: toIntOrNull(newNpcCharisma),
        Skills: newNpcSkills.join(', '),
        Abilities: newNpcAbilities.join(', '),
        Equipment: newNpcEquipment.join(', '),
      };

      const { error } = await supabase
        .from('DND_campaign_NPC')
        .insert([payload]);

      if (error) throw error;

      resetNewNpcForm();
      setShowAddNpcForm(false);
      await loadNpcs();
    } catch (err) {
      console.error('Failed adding DND NPC:', err);
      alert('Failed to add NPC.');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveNpc = async () => {
    if (!selectedNpc) return;

    setBusy(true);
    try {
      const payload = {
        Name: editNpcName,
        Race: toIntOrNull(editNpcRaceId),
        Part_of_Place: editNpcParentId === '0' ? 0 : toIntOrNull(editNpcParentId),
        Description: editNpcDescription || null,
        Strength: toIntOrNull(editNpcStrength),
        Dexterity: toIntOrNull(editNpcDexterity),
        Constitution: toIntOrNull(editNpcConstitution),
        Intelligence: toIntOrNull(editNpcIntelligence),
        Wisdom: toIntOrNull(editNpcWisdom),
        Charisma: toIntOrNull(editNpcCharisma),
        Skills: editNpcSkills.join(', '),
        Abilities: editNpcAbilities.join(', '),
        Equipment: editNpcEquipment.join(', '),
      };

      const { error } = await supabase
        .from('DND_campaign_NPC')
        .update(payload)
        .eq('id', selectedNpc.id);

      if (error) throw error;
      await loadNpcs();
    } catch (err) {
      console.error('Failed saving DND NPC:', err);
      alert('Failed to save NPC.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteNpc = async () => {
    if (!selectedNpc) return;
    if (!confirm(`Delete NPC "${selectedNpc.Name}"?`)) return;

    setBusy(true);
    try {
      const { error } = await supabase
        .from('DND_campaign_NPC')
        .delete()
        .eq('id', selectedNpc.id);

      if (error) throw error;
      setSelectedNpcId(null);
      await loadNpcs();
    } catch (err) {
      console.error('Failed deleting DND NPC:', err);
      alert('Failed to delete NPC.');
    } finally {
      setBusy(false);
    }
  };

  const uploadPlacePicture = async (file) => {
    if (!selectedPlace || !playerId) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('placeId', String(selectedPlace.id));
    formData.append('userId', String(playerId));

    let response;
    try {
      response = await fetch('/F_Pictures/api/upload-picture', {
        method: 'POST',
        body: formData,
      });
    } catch (err) {
      throw new Error('Upload service is offline. Start backend with "npm run dev:full" (or "npm run server").');
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed uploading place picture');
    }

    await loadPlaces();
  };

  const uploadNpcPicture = async (file) => {
    if (!selectedNpc || !playerId) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('npcId', String(selectedNpc.id));
    formData.append('userId', String(playerId));

    let response;
    try {
      response = await fetch('/F_Pictures/api/upload-npc-picture', {
        method: 'POST',
        body: formData,
      });
    } catch (err) {
      throw new Error('Upload service is offline. Start backend with "npm run dev:full" (or "npm run server").');
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed uploading NPC picture');
    }

    await loadNpcs();
  };

  const loadTimeline = async () => {
    const { data, error } = await supabase
      .from('DND_campaign')
      .select('timeline')
      .eq('id', campaignId)
      .single();
    if (error) { console.error('Failed loading timeline:', error); return; }
    setTimelineText(data?.timeline || '');
  };

  const renderChips = (items, onRemove) => (
    <div className="flex flex-wrap gap-2 mt-2">
      {items.map((item) => (
        <span key={item} className="inline-flex items-center gap-1 rounded bg-gray-200 px-2 py-1 text-xs text-gray-800">
          {item}
          <button
            type="button"
            onClick={() => onRemove(item)}
            className="text-red-600 font-bold"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-200 text-slate-800 p-6">
      <input
        ref={placeFileInputRef}
        type="file"
        accept="image/png"
        style={{ display: 'none' }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          try {
            setBusy(true);
            await uploadPlacePicture(file);
            alert('Place picture uploaded successfully!');
          } catch (err) {
            console.error(err);
            alert(err.message || 'Failed uploading place picture');
          } finally {
            setBusy(false);
          }
        }}
      />

      <input
        ref={npcFileInputRef}
        type="file"
        accept="image/png"
        style={{ display: 'none' }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          try {
            setBusy(true);
            await uploadNpcPicture(file);
            alert('NPC picture uploaded successfully!');
          } catch (err) {
            console.error(err);
            alert(err.message || 'Failed uploading NPC picture');
          } finally {
            setBusy(false);
          }
        }}
      />

      <div className="max-w-full mx-auto">
        <h1 className="text-5xl font-extrabold text-slate-700 mb-2">{campaignName || 'Campaign Notes'}</h1>
        <p className="text-center text-slate-600 mb-3">My Notes</p>

        <div className="flex justify-center gap-3 mb-2 flex-wrap">
          <button
            onClick={() => navigate('/select-ttrpg')}
            className="px-4 py-2 rounded bg-gray-100 border border-gray-300 font-semibold hover:bg-gray-200"
          >
            Select TTRPG
          </button>
          <button
            onClick={() => navigate(`/DND_campaign?mod=${encodeURIComponent(mod)}&ttrpgId=${encodeURIComponent(ttrpgId)}`)}
            className="px-4 py-2 rounded bg-gray-100 border border-gray-300 font-semibold hover:bg-gray-200"
          >
            Back to My Campaigns
          </button>
        </div>

        <div className="flex justify-center gap-3 mb-4 flex-wrap">
          <button
            onClick={() => {
              if (selectedPlace) {
                setShowInlineAddNote((prev) => !prev);
                setShowAddNpcForm(false);
                setShowAddExistingNpc(false);
                setShowAddExistingNote(false);
                setNewPlaceParentId(String(selectedPlace.id));
              } else {
                setShowAddPlaceForm((prev) => !prev);
                setNewPlaceParentId('0');
              }
            }}
            className="px-5 py-2 rounded bg-gray-100 border border-gray-300 font-semibold hover:bg-gray-200"
          >
            Add Note
          </button>
          <button
            onClick={() => {
              setShowAddNpcForm((prev) => !prev);
              setSelectedNpcId(null);
              setShowInlineAddNote(false);
              setShowAddExistingNpc(false);
              setShowAddExistingNote(false);
              setNewNpcParentId(selectedPlace ? String(selectedPlace.id) : '0');
            }}
            className="px-5 py-2 rounded bg-gray-100 border border-gray-300 font-semibold hover:bg-gray-200"
          >
            Add NPC
          </button>
        </div>

        <div className="border border-slate-500 bg-white min-h-[640px]">
          <div className="flex min-h-[640px] overflow-x-auto" ref={columnsContainerRef}>
            <div className="w-[290px] shrink-0 border-r border-slate-400">
              <h2 className="text-3xl font-bold px-4 py-3 border-b border-slate-300">Places</h2>

              {showAddPlaceForm && (
                <div className="p-3 border-b border-slate-300 bg-gray-50">
                  <input
                    type="text"
                    value={newPlaceName}
                    onChange={(e) => setNewPlaceName(e.target.value)}
                    placeholder="Note/Place name"
                    className="w-full mb-2 px-3 py-2 rounded border border-slate-300"
                  />
                  <textarea
                    value={newPlaceDescription}
                    onChange={(e) => setNewPlaceDescription(e.target.value)}
                    placeholder="Description"
                    rows={3}
                    className="w-full mb-2 px-3 py-2 rounded border border-slate-300"
                  />
                  <button
                    onClick={handleAddPlace}
                    disabled={busy}
                    className="w-full px-3 py-2 rounded bg-blue-700 text-white font-bold hover:bg-blue-800 disabled:opacity-60"
                  >
                    Save Note
                  </button>
                </div>
              )}

              <div className="max-h-[560px] overflow-auto py-2">
                {String(campaignId) === '1' && (
                  <div className="relative px-1 mb-1">
                    <button
                      onClick={async () => {
                        setShowTimeline(true);
                        setSelectedPlaceId(null);
                        setSelectedNpcId(null);
                        setShowDropdown(false);
                        setRowMenuPlaceId(null);
                        await loadTimeline();
                      }}
                      className={`w-full text-left px-3 py-2 text-lg rounded ${showTimeline ? 'bg-gray-200 font-bold' : 'hover:bg-gray-100'}`}
                    >
                      Timeline
                    </button>
                  </div>
                )}
                {topLevelPlaces.map((place) => {
                  const inPath = selectedPlacePath.some((pathPlace) => String(pathPlace.id) === String(place.id));
                  return (
                    <div key={place.id} className="relative px-1 mb-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedPlaceId(place.id);
                            setSelectedNpcId(null);
                            setShowDropdown(false);
                            setRowMenuPlaceId(null);
                          }}
                          className={`flex-1 text-left px-3 py-2 text-lg rounded ${inPath ? 'bg-gray-200 font-bold' : 'hover:bg-gray-100'}`}
                        >
                          {place.Place_Name}
                        </button>
                        <button
                          onClick={() => toggleRowPlaceMenu(place)}
                          className="w-8 h-8 rounded border border-slate-300 text-lg leading-none hover:bg-gray-100"
                          aria-label={`Open menu for ${place.Place_Name}`}
                        >
                          ⋮
                        </button>
                      </div>

                      {Number(rowMenuPlaceId) === Number(place.id) && (
                        <div className="absolute right-full top-0 mr-2 w-64 bg-white border border-slate-300 shadow-xl z-30 text-sm">
                          <button onClick={() => handleMenuAction('edit')} className="w-full text-left px-3 py-2 hover:bg-gray-100">Edit</button>
                          {canUploadPictures() && (
                            <button onClick={() => handleMenuAction('upload')} className="w-full text-left px-3 py-2 hover:bg-gray-100">Upload Picture</button>
                          )}
                          <button onClick={() => handleMenuAction('add-note')} className="w-full text-left px-3 py-2 hover:bg-gray-100">Add Note</button>
                          <button onClick={() => handleMenuAction('add-npc')} className="w-full text-left px-3 py-2 hover:bg-gray-100">Add NPC</button>
                          <button onClick={() => handleMenuAction('add-existing-npc')} className="w-full text-left px-3 py-2 hover:bg-gray-100">Add Existing NPC</button>
                          <button onClick={() => handleMenuAction('add-existing-note')} className="w-full text-left px-3 py-2 hover:bg-gray-100">Add Existing Note</button>
                          <button onClick={() => handleMenuAction('delete')} className="w-full text-left px-3 py-2 text-red-700 hover:bg-red-50">Delete</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedPlacePath.length === 0 ? (
              showTimeline ? (
                <div className="min-w-[620px] flex-1 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-slate-700">Timeline</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch('/F_Pictures/api/write-timeline', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ text: timelineText }),
                            });
                            if (!res.ok) throw new Error('Server error');
                          } catch {
                            alert('Export failed. Make sure the dev server is running.');
                          }
                        }}
                        className="px-3 py-1 rounded bg-slate-600 text-white text-sm font-semibold hover:bg-slate-700"
                      >
                        Export
                      </button>
                      <button
                        onClick={async () => {
                          setSavingTimeline(true);
                          await supabase.from('DND_campaign').update({ timeline: timelineText }).eq('id', campaignId);
                          setSavingTimeline(false);
                        }}
                        disabled={savingTimeline}
                        className="px-3 py-1 rounded bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-60"
                      >
                        {savingTimeline ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={timelineText}
                    onChange={(e) => setTimelineText(e.target.value)}
                    className="w-full h-[500px] p-3 text-slate-800 bg-white border border-slate-300 rounded resize-none focus:outline-none focus:border-amber-500 text-sm leading-relaxed"
                    placeholder="Write your timeline here…"
                  />
                </div>
              ) : (
                <div className="min-w-[620px] flex-1 p-4">
                  <h3 className="text-2xl font-bold text-slate-700">Top Level</h3>
                  <p className="text-slate-600 mt-1">Select a note/place from the left panel.</p>
                </div>
              )
            ) : (
              <>
                {selectedPlacePath.map((place, columnIndex) => {
                  const isLastColumn = columnIndex === selectedPlacePath.length - 1;
                  const childPlaces = childPlacesByParent[Number(place.id)] || [];
                  const placeNpcs = npcsByParent[Number(place.id)] || [];

                  return (
                    <div
                      key={`column-${place.id}`}
                      className="w-[620px] shrink-0 border-r border-slate-300"
                      ref={isLastColumn ? activePlaceColumnRef : null}
                    >
                      <div className="flex items-center border-b border-slate-300 px-4 py-2 min-h-[48px]">
                        {isLastColumn && (
                          <>
                            <button
                              onClick={() => {
                                if (selectedPlaceParent) {
                                  setSelectedPlaceId(selectedPlaceParent.id);
                                } else {
                                  setSelectedPlaceId(null);
                                }
                                setSelectedNpcId(null);
                              }}
                              className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                            >
                              ← Back
                            </button>

                            <div className="ml-auto relative">
                              <button
                                onClick={() => {
                                  setRowMenuPlaceId(null);
                                  setShowDropdown((prev) => !prev);
                                }}
                                className="w-9 h-9 rounded border border-slate-500 text-xl leading-none hover:bg-gray-100"
                              >
                                ⋮
                              </button>
                              {showDropdown && (
                                <div className="absolute right-full top-0 mr-2 w-64 bg-white border border-slate-300 shadow-xl z-20 text-sm">
                                  <button onClick={() => handleMenuAction('edit')} className="w-full text-left px-3 py-2 hover:bg-gray-100">Edit</button>
                                  {canUploadPictures() && (
                                    <button onClick={() => handleMenuAction('upload')} className="w-full text-left px-3 py-2 hover:bg-gray-100">Upload Picture</button>
                                  )}
                                  <button onClick={() => handleMenuAction('add-note')} className="w-full text-left px-3 py-2 hover:bg-gray-100">Add Note</button>
                                  <button onClick={() => handleMenuAction('add-npc')} className="w-full text-left px-3 py-2 hover:bg-gray-100">Add NPC</button>
                                  <button onClick={() => handleMenuAction('add-existing-npc')} className="w-full text-left px-3 py-2 hover:bg-gray-100">Add Existing NPC</button>
                                  <button onClick={() => handleMenuAction('add-existing-note')} className="w-full text-left px-3 py-2 hover:bg-gray-100">Add Existing Note</button>
                                  <button onClick={() => handleMenuAction('delete')} className="w-full text-left px-3 py-2 text-red-700 hover:bg-red-50">Delete</button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="p-4 space-y-4">
                        {isLastColumn && editingPlaceId === place.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editPlaceName}
                              onChange={(e) => setEditPlaceName(e.target.value)}
                              className="w-full px-3 py-2 rounded border border-slate-300 text-lg font-bold"
                            />
                            <textarea
                              value={editPlaceDescription}
                              onChange={(e) => setEditPlaceDescription(e.target.value)}
                              rows={6}
                              className="w-full px-3 py-2 rounded border border-slate-300"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  await handleSavePlace();
                                  setEditingPlaceId(null);
                                }}
                                className="px-4 py-2 rounded bg-blue-700 text-white font-bold hover:bg-blue-800"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingPlaceId(null)}
                                className="px-4 py-2 rounded bg-gray-200 border border-gray-300 font-bold hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h3 className="text-3xl font-bold text-slate-800 mb-2">{place.Place_Name}</h3>
                            {place.PictureID && (
                              <div className="mb-3" style={{ width: '100%', maxWidth: '100%' }}>
                                <img
                                  src={getPictureUrl(place.PictureID)}
                                  alt={place.Place_Name}
                                  role="button"
                                  tabIndex={0}
                                  title="Click to enlarge"
                                  style={{
                                    width: '100%',
                                    maxWidth: '100%',
                                    height: 'auto',
                                    maxHeight: '340px',
                                    objectFit: 'cover',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '0.375rem',
                                    cursor: 'zoom-in',
                                  }}
                                  onClick={() => openImagePreview(getPictureUrl(place.PictureID), place.Place_Name)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      openImagePreview(getPictureUrl(place.PictureID), place.Place_Name);
                                    }
                                  }}
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              </div>
                            )}
                            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{place.Description || 'No description yet.'}</p>
                          </div>
                        )}

                        {isLastColumn && showInlineAddNote && selectedPlace && (
                          <div className="rounded border border-slate-300 p-3 bg-gray-50">
                            <h4 className="font-bold mb-2">Add Child Note</h4>
                            <input
                              type="text"
                              value={newPlaceName}
                              onChange={(e) => setNewPlaceName(e.target.value)}
                              placeholder="Note/Place name"
                              className="w-full mb-2 px-3 py-2 rounded border border-slate-300"
                            />
                            <textarea
                              value={newPlaceDescription}
                              onChange={(e) => setNewPlaceDescription(e.target.value)}
                              placeholder="Description"
                              rows={3}
                              className="w-full mb-2 px-3 py-2 rounded border border-slate-300"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  setNewPlaceParentId(String(selectedPlace.id));
                                  await handleAddPlace();
                                }}
                                disabled={busy}
                                className="px-3 py-2 rounded bg-blue-700 text-white font-bold hover:bg-blue-800 disabled:opacity-60"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setShowInlineAddNote(false)}
                                className="px-3 py-2 rounded bg-gray-200 border border-gray-300 font-bold hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {isLastColumn && showAddExistingNote && selectedPlace && (
                          <div className="rounded border border-slate-300 p-3 bg-gray-50">
                            <h4 className="font-bold mb-2">Add Existing Note</h4>
                            <select
                              value={selectedExistingNoteId}
                              onChange={(e) => setSelectedExistingNoteId(e.target.value)}
                              className="w-full mb-2 px-3 py-2 rounded border border-slate-300"
                            >
                              <option value="">-- Select Note --</option>
                              {availableExistingNotes.map((existingPlace) => (
                                <option key={`existing-note-${existingPlace.id}`} value={existingPlace.id}>{existingPlace.Place_Name}</option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <button
                                onClick={handleAttachExistingNote}
                                disabled={busy || !selectedExistingNoteId}
                                className="px-3 py-2 rounded bg-blue-700 text-white font-bold hover:bg-blue-800 disabled:opacity-60"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => {
                                  setShowAddExistingNote(false);
                                  setSelectedExistingNoteId('');
                                }}
                                className="px-3 py-2 rounded bg-gray-200 border border-gray-300 font-bold hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {isLastColumn && showAddExistingNpc && selectedPlace && (
                          <div className="rounded border border-slate-300 p-3 bg-gray-50">
                            <h4 className="font-bold mb-2">Add Existing NPC</h4>
                            <select
                              value={selectedExistingNpcId}
                              onChange={(e) => setSelectedExistingNpcId(e.target.value)}
                              className="w-full mb-2 px-3 py-2 rounded border border-slate-300"
                            >
                              <option value="">-- Select NPC --</option>
                              {availableExistingNpcs.map((npc) => (
                                <option key={`existing-npc-${npc.id}`} value={npc.id}>{npc.Name}</option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <button
                                onClick={handleAttachExistingNpc}
                                disabled={busy || !selectedExistingNpcId}
                                className="px-3 py-2 rounded bg-blue-700 text-white font-bold hover:bg-blue-800 disabled:opacity-60"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => {
                                  setShowAddExistingNpc(false);
                                  setSelectedExistingNpcId('');
                                }}
                                className="px-3 py-2 rounded bg-gray-200 border border-gray-300 font-bold hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {(childPlaces.length > 0 || placeNpcs.length > 0) && (
                          <div className={`grid grid-cols-1 ${childPlaces.length > 0 && placeNpcs.length > 0 ? 'md:grid-cols-2' : ''} gap-4`}>
                            {childPlaces.length > 0 && (
                              <div>
                                <h3 className="font-bold mb-2 text-slate-700">Child Notes</h3>
                                <div className="space-y-2">
                                  {childPlaces.map((childPlace) => (
                                    <div key={`child-place-${place.id}-${childPlace.id}`} className="relative">
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => {
                                            setSelectedPlaceId(childPlace.id);
                                            setSelectedNpcId(null);
                                            setShowDropdown(false);
                                            setRowMenuPlaceId(null);
                                          }}
                                          className="flex-1 text-left px-3 py-2 rounded bg-gray-100 border border-gray-300 hover:bg-gray-200"
                                        >
                                          {childPlace.Place_Name}
                                        </button>
                                        <button
                                          onClick={() => toggleRowPlaceMenu(childPlace)}
                                          className="w-8 h-8 rounded border border-slate-300 text-lg leading-none hover:bg-gray-100"
                                          aria-label={`Open menu for ${childPlace.Place_Name}`}
                                        >
                                          ⋮
                                        </button>
                                      </div>

                                      {Number(rowMenuPlaceId) === Number(childPlace.id) && (
                                        <div className="absolute right-full top-0 mr-2 w-64 bg-white border border-slate-300 shadow-xl z-30 text-sm">
                                          <button onClick={() => handleMenuAction('edit')} className="w-full text-left px-3 py-2 hover:bg-gray-100">Edit</button>
                                          {canUploadPictures() && (
                                            <button onClick={() => handleMenuAction('upload')} className="w-full text-left px-3 py-2 hover:bg-gray-100">Upload Picture</button>
                                          )}
                                          <button onClick={() => handleMenuAction('add-note')} className="w-full text-left px-3 py-2 hover:bg-gray-100">Add Note</button>
                                          <button onClick={() => handleMenuAction('add-npc')} className="w-full text-left px-3 py-2 hover:bg-gray-100">Add NPC</button>
                                          <button onClick={() => handleMenuAction('add-existing-npc')} className="w-full text-left px-3 py-2 hover:bg-gray-100">Add Existing NPC</button>
                                          <button onClick={() => handleMenuAction('add-existing-note')} className="w-full text-left px-3 py-2 hover:bg-gray-100">Add Existing Note</button>
                                          <button onClick={() => handleMenuAction('delete')} className="w-full text-left px-3 py-2 text-red-700 hover:bg-red-50">Delete</button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {placeNpcs.length > 0 && (
                              <div>
                                <h3 className="font-bold mb-2 text-slate-700">NPCs Here</h3>
                                <div className="space-y-2">
                                  {placeNpcs.map((npc) => (
                                    <button
                                      key={`npc-for-place-${place.id}-${npc.id}`}
                                      onClick={() => setSelectedNpcId(npc.id)}
                                      className={`w-full text-left px-3 py-2 rounded border ${String(selectedNpcId) === String(npc.id) ? 'bg-blue-100 border-blue-400' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'}`}
                                    >
                                      {npc.Name} {npc.Race ? `(${raceMap[npc.Race] || 'Unknown Race'})` : ''}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {showAddNpcForm && (
              <div className="w-[620px] shrink-0 p-4 bg-gray-50 border-l border-slate-300" ref={addNpcPanelRef}>
                <h3 className="text-lg font-bold mb-2 text-slate-800">New NPC{selectedPlace ? ` in ${selectedPlace.Place_Name}` : ''}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newNpcName}
                    onChange={(e) => setNewNpcName(e.target.value)}
                    placeholder="NPC Name"
                    className="px-3 py-2 rounded border border-slate-300"
                  />
                  <select
                    value={newNpcRaceId}
                    onChange={(e) => setNewNpcRaceId(e.target.value)}
                    className="px-3 py-2 rounded border border-slate-300"
                  >
                    <option value="">-- Race --</option>
                    {raceList.map((race) => (
                      <option key={race.id} value={race.id}>{race.RaceName}</option>
                    ))}
                  </select>
                  <select
                    value={newNpcParentId}
                    onChange={(e) => setNewNpcParentId(e.target.value)}
                    className="px-3 py-2 rounded border border-slate-300"
                  >
                    <option value="0">Top Level</option>
                    {orderedPlaces.map((parentPlace) => (
                      <option key={`npc-parent-${parentPlace.id}`} value={parentPlace.id}>{parentPlace.Place_Name}</option>
                    ))}
                  </select>
                  <textarea
                    value={newNpcDescription}
                    onChange={(e) => setNewNpcDescription(e.target.value)}
                    placeholder="Description"
                    rows={2}
                    className="md:col-span-2 px-3 py-2 rounded border border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  <input type="number" value={newNpcStrength} onChange={(e) => setNewNpcStrength(e.target.value)} placeholder="Strength" className="px-3 py-2 rounded border border-slate-300" />
                  <input type="number" value={newNpcDexterity} onChange={(e) => setNewNpcDexterity(e.target.value)} placeholder="Dexterity" className="px-3 py-2 rounded border border-slate-300" />
                  <input type="number" value={newNpcConstitution} onChange={(e) => setNewNpcConstitution(e.target.value)} placeholder="Constitution" className="px-3 py-2 rounded border border-slate-300" />
                  <input type="number" value={newNpcIntelligence} onChange={(e) => setNewNpcIntelligence(e.target.value)} placeholder="Intelligence" className="px-3 py-2 rounded border border-slate-300" />
                  <input type="number" value={newNpcWisdom} onChange={(e) => setNewNpcWisdom(e.target.value)} placeholder="Wisdom" className="px-3 py-2 rounded border border-slate-300" />
                  <input type="number" value={newNpcCharisma} onChange={(e) => setNewNpcCharisma(e.target.value)} placeholder="Charisma" className="px-3 py-2 rounded border border-slate-300" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Skills</label>
                    <input
                      type="text"
                      placeholder="Type skill and press Enter"
                      className="w-full px-3 py-2 rounded border border-slate-300"
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return;
                        e.preventDefault();
                        addToList(e.currentTarget.value, setNewNpcSkills);
                        e.currentTarget.value = '';
                      }}
                    />
                    {renderChips(newNpcSkills, (item) => removeFromList(item, setNewNpcSkills))}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">Abilities</label>
                    <select
                      onChange={(e) => {
                        addToList(e.target.value, setNewNpcAbilities);
                        e.target.value = '';
                      }}
                      className="w-full px-3 py-2 rounded border border-slate-300"
                      defaultValue=""
                    >
                      <option value="">-- Select Ability --</option>
                      {abilitiesList.map((ability) => (
                        <option key={ability.id} value={ability.FeatureName}>{ability.FeatureName}</option>
                      ))}
                    </select>
                    {renderChips(newNpcAbilities, (item) => removeFromList(item, setNewNpcAbilities))}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">Equipment</label>
                    <select
                      onChange={(e) => {
                        addToList(e.target.value, setNewNpcEquipment);
                        e.target.value = '';
                      }}
                      className="w-full px-3 py-2 rounded border border-slate-300"
                      defaultValue=""
                    >
                      <option value="">-- Select Equipment --</option>
                      {equipmentList.map((equipment) => (
                        <option key={equipment.id} value={equipment.ItemName}>{equipment.ItemName}</option>
                      ))}
                    </select>
                    {renderChips(newNpcEquipment, (item) => removeFromList(item, setNewNpcEquipment))}
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleAddNpc}
                    disabled={busy}
                    className="px-4 py-2 bg-blue-700 text-white rounded font-bold hover:bg-blue-800 disabled:opacity-60"
                  >
                    Save NPC
                  </button>
                  <button
                    onClick={() => {
                      setShowAddNpcForm(false);
                      resetNewNpcForm();
                    }}
                    className="px-4 py-2 bg-gray-200 border border-gray-300 rounded font-bold hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {selectedNpc && (
              <div className="w-[620px] shrink-0 p-4 bg-gray-50 border-l border-slate-300" ref={activeNpcPanelRef}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-slate-800">Edit NPC</h3>
                  <div className="flex gap-2">
                    <button onClick={handleSaveNpc} disabled={busy} className="px-3 py-1 bg-blue-700 text-white rounded text-sm font-bold hover:bg-blue-800 disabled:opacity-60">Save NPC</button>
                    <button onClick={handleDeleteNpc} disabled={busy} className="px-3 py-1 bg-red-700 text-white rounded text-sm font-bold hover:bg-red-800 disabled:opacity-60">Delete NPC</button>
                    {canUploadPictures() && (
                      <button onClick={() => npcFileInputRef.current?.click()} disabled={busy} className="px-3 py-1 bg-green-700 text-white rounded text-sm font-bold hover:bg-green-800 disabled:opacity-60">Upload NPC Picture</button>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  {selectedNpc.PictureID && (
                    <div style={{ float: 'right', width: 'min(46%, 280px)', minWidth: '220px', marginLeft: '12px', marginBottom: '12px' }}>
                      <img
                        src={getPictureUrl(selectedNpc.PictureID)}
                        alt={selectedNpc.Name}
                        role="button"
                        tabIndex={0}
                        title="Click to enlarge"
                        style={{
                          width: '100%',
                          maxWidth: '100%',
                          height: 'auto',
                          maxHeight: '340px',
                          objectFit: 'cover',
                          border: '1px solid #cbd5e1',
                          borderRadius: '0.375rem',
                          cursor: 'zoom-in',
                        }}
                        onClick={() => openImagePreview(getPictureUrl(selectedNpc.PictureID), selectedNpc.Name)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openImagePreview(getPictureUrl(selectedNpc.PictureID), selectedNpc.Name);
                          }
                        }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <input type="text" value={editNpcName} onChange={(e) => setEditNpcName(e.target.value)} className="px-3 py-2 rounded border border-slate-300" placeholder="NPC Name" style={{ width: '100%' }} />
                      <select value={editNpcRaceId} onChange={(e) => setEditNpcRaceId(e.target.value)} className="px-3 py-2 rounded border border-slate-300" style={{ width: '100%' }}>
                        <option value="">-- Race --</option>
                        {raceList.map((race) => (
                          <option key={`edit-race-${race.id}`} value={race.id}>{race.RaceName}</option>
                        ))}
                      </select>
                      <select value={editNpcParentId} onChange={(e) => setEditNpcParentId(e.target.value)} className="px-3 py-2 rounded border border-slate-300" style={{ width: '100%' }}>
                        <option value="0">Top Level</option>
                        {orderedPlaces.map((place) => (
                          <option key={`edit-parent-${place.id}`} value={place.id}>{place.Place_Name}</option>
                        ))}
                      </select>
                      <textarea value={editNpcDescription} onChange={(e) => setEditNpcDescription(e.target.value)} rows={2} className="md:col-span-2 px-3 py-2 rounded border border-slate-300" placeholder="Description" style={{ gridColumn: '1 / -1', width: '100%' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', marginTop: '8px' }}>
                      <input type="number" value={editNpcStrength} onChange={(e) => setEditNpcStrength(e.target.value)} placeholder="Strength" className="px-3 py-2 rounded border border-slate-300" style={{ width: '100%' }} />
                      <input type="number" value={editNpcDexterity} onChange={(e) => setEditNpcDexterity(e.target.value)} placeholder="Dexterity" className="px-3 py-2 rounded border border-slate-300" style={{ width: '100%' }} />
                      <input type="number" value={editNpcConstitution} onChange={(e) => setEditNpcConstitution(e.target.value)} placeholder="Constitution" className="px-3 py-2 rounded border border-slate-300" style={{ width: '100%' }} />
                      <input type="number" value={editNpcIntelligence} onChange={(e) => setEditNpcIntelligence(e.target.value)} placeholder="Intelligence" className="px-3 py-2 rounded border border-slate-300" style={{ width: '100%' }} />
                      <input type="number" value={editNpcWisdom} onChange={(e) => setEditNpcWisdom(e.target.value)} placeholder="Wisdom" className="px-3 py-2 rounded border border-slate-300" style={{ width: '100%' }} />
                      <input type="number" value={editNpcCharisma} onChange={(e) => setEditNpcCharisma(e.target.value)} placeholder="Charisma" className="px-3 py-2 rounded border border-slate-300" style={{ width: '100%' }} />
                    </div>
                  </div>

                  {selectedNpc.PictureID && <div style={{ clear: 'both' }} />}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Skills</label>
                    <input
                      type="text"
                      placeholder="Type skill and press Enter"
                      className="w-full px-3 py-2 rounded border border-slate-300"
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return;
                        e.preventDefault();
                        addToList(e.currentTarget.value, setEditNpcSkills);
                        e.currentTarget.value = '';
                      }}
                    />
                    {renderChips(editNpcSkills, (item) => removeFromList(item, setEditNpcSkills))}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">Abilities</label>
                    <select
                      onChange={(e) => {
                        addToList(e.target.value, setEditNpcAbilities);
                        e.target.value = '';
                      }}
                      className="w-full px-3 py-2 rounded border border-slate-300"
                      defaultValue=""
                    >
                      <option value="">-- Select Ability --</option>
                      {abilitiesList.map((ability) => (
                        <option key={`edit-ability-${ability.id}`} value={ability.FeatureName}>{ability.FeatureName}</option>
                      ))}
                    </select>
                    {renderChips(editNpcAbilities, (item) => removeFromList(item, setEditNpcAbilities))}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">Equipment</label>
                    <select
                      onChange={(e) => {
                        addToList(e.target.value, setEditNpcEquipment);
                        e.target.value = '';
                      }}
                      className="w-full px-3 py-2 rounded border border-slate-300"
                      defaultValue=""
                    >
                      <option value="">-- Select Equipment --</option>
                      {equipmentList.map((equipment) => (
                        <option key={`edit-equipment-${equipment.id}`} value={equipment.ItemName}>{equipment.ItemName}</option>
                      ))}
                    </select>
                    {renderChips(editNpcEquipment, (item) => removeFromList(item, setEditNpcEquipment))}
                  </div>
                </div>

                {editNpcAbilities.length > 0 && (
                  <div className="mt-4 rounded border border-slate-300 p-3 bg-white">
                    <h4 className="font-bold mb-2 text-slate-800">Ability Descriptions</h4>
                    <div className="space-y-2 text-sm text-slate-700">
                      {editNpcAbilities.map((abilityName) => (
                        <div key={`ability-desc-${abilityName}`}>
                          <p className="font-semibold text-slate-900">{abilityName}</p>
                          <p>{abilityDescriptions[abilityName] || 'No description available.'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {previewImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483647,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={closeImagePreview}
        >
          <div
            style={{
              position: 'relative',
              width: '620px',
              maxWidth: '92vw',
              borderRadius: '0.5rem',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: 'rgba(15, 23, 42, 0.95)',
              padding: '12px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                zIndex: 1,
              }}
            >
              <button
                onClick={zoomPreviewOut}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '0.375rem',
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                aria-label="Zoom out"
              >
                -
              </button>
              <button
                onClick={resetPreviewZoom}
                style={{
                  minWidth: '56px',
                  height: '32px',
                  borderRadius: '0.375rem',
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '0 8px',
                }}
                aria-label="Reset zoom"
              >
                {Math.round(previewZoom * 100)}%
              </button>
              <button
                onClick={zoomPreviewIn}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '0.375rem',
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                aria-label="Zoom in"
              >
                +
              </button>
            </div>
            <button
              onClick={closeImagePreview}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '36px',
                height: '36px',
                borderRadius: '0.375rem',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                background: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              aria-label="Close image preview"
            >
              X
            </button>
            <div
              style={{
                maxHeight: '80vh',
                borderRadius: '0.375rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                overflow: 'auto',
                marginTop: '40px',
              }}
              onWheel={(e) => {
                e.preventDefault();
                if (e.deltaY < 0) {
                  zoomPreviewIn();
                } else {
                  zoomPreviewOut();
                }
              }}
            >
              <img
                src={previewImage.src}
                alt={previewImage.alt}
                style={{
                  display: 'block',
                  width: `${Math.round(previewZoom * 100)}%`,
                  maxWidth: 'none',
                  minWidth: '40%',
                  height: 'auto',
                  objectFit: 'contain',
                  margin: '0 auto',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
