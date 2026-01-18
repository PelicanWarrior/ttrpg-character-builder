import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { DragHandle } from '../assets/DragHandle';
import DicePoolPopup from './DicePoolPopup';

export default function SWNotes() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  const campaignName = decodeURIComponent(searchParams.get('campaignName') || '');

  const [showAddPlaceForm, setShowAddPlaceForm] = useState(false);
  const [addPlaceButtonPos, setAddPlaceButtonPos] = useState({ top: 0, left: 0 });
  const [showAddNPCForm, setShowAddNPCForm] = useState(false);
  const [placeName, setPlaceName] = useState('');
  const [description, setDescription] = useState('');
  const [partOfPlace, setPartOfPlace] = useState('');
  const [existingPlaces, setExistingPlaces] = useState([]);
  const [topLevelPlaces, setTopLevelPlaces] = useState([]);
  const [selectedHierarchy, setSelectedHierarchy] = useState([]); // Array of place objects going down
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState([]); // Notes with Order column
  const [npcs, setNpcs] = useState([]); // NPCs from SW_campaign_NPC table
  const [selectedNPC, setSelectedNPC] = useState(null); // Currently selected NPC to display details
  const [draggedNote, setDraggedNote] = useState(null);
  const [editingPlaceId, setEditingPlaceId] = useState(null);
  const [editingPlaceData, setEditingPlaceData] = useState({});
  const [showDropdown, setShowDropdown] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [uploadingPictureId, setUploadingPictureId] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [showInlineAddNote, setShowInlineAddNote] = useState(null); // ID of place to add note to
  const [inlinePlaceName, setInlinePlaceName] = useState('');
  const [inlineDescription, setInlineDescription] = useState('');
  const [showInlineAddNPC, setShowInlineAddNPC] = useState(null); // ID of place to add NPC to
  const [deleteConfirmation, setDeleteConfirmation] = useState(null); // ID of place to delete
  const [deleting, setDeleting] = useState(false);

  // NPC form state
  const [npcName, setNpcName] = useState('');
  const [npcRaceId, setNpcRaceId] = useState('');
  const [npcDescription, setNpcDescription] = useState('');
  const [npcBrawn, setNpcBrawn] = useState('');
  const [npcCunning, setNpcCunning] = useState('');
  const [npcPresence, setNpcPresence] = useState('');
  const [npcAgility, setNpcAgility] = useState('');
  const [npcIntellect, setNpcIntellect] = useState('');
  const [npcWillpower, setNpcWillpower] = useState('');
  const [npcSoak, setNpcSoak] = useState('');
  const [npcWound, setNpcWound] = useState('');
  const [npcStrain, setNpcStrain] = useState('');
  const [npcPlaceId, setNpcPlaceId] = useState('');

  // Lookup lists
  const [raceList, setRaceList] = useState([]);
  const [skillsList, setSkillsList] = useState([]);
  const [abilitiesList, setAbilitiesList] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [abilityDescriptions, setAbilityDescriptions] = useState({}); // Map of ability name to description

  // Selected multi-selects
  const [selectedSkills, setSelectedSkills] = useState([]); // names
  const [selectedAbilities, setSelectedAbilities] = useState([]); // abilities strings
  const [selectedEquipment, setSelectedEquipment] = useState([]); // names


  // Admin and permissions
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadPicturesEnabled, setUploadPicturesEnabled] = useState(false);

  // Helper: can the current user upload pictures?
  const canUploadPictures = () => isAdmin || uploadPicturesEnabled;

  // NPC dropdown and edit state
  const [showNPCDropdown, setShowNPCDropdown] = useState(null); // ID of NPC with open dropdown
  const [npcDropdownPos, setNpcDropdownPos] = useState({ top: 0, left: 0 });
  const [editingNPCId, setEditingNPCId] = useState(null); // ID of NPC being edited
  const [deletingNPCId, setDeletingNPCId] = useState(null); // ID of NPC to delete
  const [savingNPC, setSavingNPC] = useState(false);

  // Add Existing NPC state
  const [showAddExistingNPC, setShowAddExistingNPC] = useState(null); // ID of place to add existing NPC to
  const [existingNPCsList, setExistingNPCsList] = useState([]); // List of NPCs for current player
  const [selectedExistingNPC, setSelectedExistingNPC] = useState(null); // Currently selected NPC to add
  const [addExistingNPCPos, setAddExistingNPCPos] = useState({ top: 0, left: 0 });

  // Add Existing Note state
  const [showAddExistingNote, setShowAddExistingNote] = useState(null); // ID of place to add existing note to
  const [existingNotesList, setExistingNotesList] = useState([]); // List of notes with Part_of_Place = 0
  const [selectedExistingNote, setSelectedExistingNote] = useState(null); // Currently selected note to add
  const [addExistingNotePos, setAddExistingNotePos] = useState({ top: 0, left: 0 });


  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('SW_campaign_notes')
        .select('id, Place_Name, Order, Part_of_Place, Description, PictureID')
        .eq('CampaignID', campaignId)
        .or('Part_of_Place.eq.0,Part_of_Place.is.null')
        .order('Order', { ascending: true });
      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error('Failed to load notes:', err);
    }
  };

  useEffect(() => {
    if (campaignId) {
      loadPlaces();
      loadNotes();
      loadNPCs();
      loadPermissions();
    }
  }, [campaignId]);



  const loadPermissions = async () => {
    try {
      // Use localStorage-based login system
      const username = localStorage.getItem('username');
      if (!username) {
        console.warn('No user logged in (localStorage.username missing)');
        return;
      }
      // Check if user is admin

      // Use username from localStorage to check admin
      const { data: userData, error: adminError } = await supabase
        .from('user')
        .select('admin')
        .eq('username', username)
        .single();

      if (adminError) {
        console.warn('Failed to load admin status:', adminError.message);
        return;
      }

      setIsAdmin(userData?.admin === true);

      // Fetch Upload Pictures setting
      const { data: adminControl, error: controlError } = await supabase
        .from('Admin_Control')
        .select('Upload_pictures')
        .eq('id', 1)
        .single();

      if (controlError) {
        console.warn('Failed to load upload pictures setting:', controlError.message);
        return;
      }

      setUploadPicturesEnabled(adminControl?.Upload_pictures === true);
    } catch (err) {
      console.error('Failed to load permissions:', err);
    }
  };

  // Load lookups when opening Add NPC (both top-level and inline)
  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [racesRes, skillsRes, abilitiesRes, equipmentRes] = await Promise.all([
          supabase.from('races').select('id, name').order('name', { ascending: true }),
          supabase.from('skills').select('id, skill').order('skill'),
          supabase.from('SW_abilities').select('id, ability').order('ability'),
          supabase.from('SW_equipment').select('id, name').order('name'),
        ]);

        if (racesRes.error) throw racesRes.error;
        if (skillsRes.error) throw skillsRes.error;
        if (abilitiesRes.error) throw abilitiesRes.error;
        if (equipmentRes.error) throw equipmentRes.error;

        setRaceList(racesRes.data || []);
        setSkillsList(skillsRes.data || []);
        setAbilitiesList(abilitiesRes.data || []);
        setEquipmentList(equipmentRes.data || []);
      } catch (err) {
        console.error('Failed to load NPC lookups:', err);
      }
    };

    if (showAddNPCForm || showInlineAddNPC) {
      loadLookups();
    }
  }, [showAddNPCForm, showInlineAddNPC]);

  const loadPlaces = async () => {
    try {
      const { data, error } = await supabase
        .from('SW_campaign_notes')
        .select('id, Place_Name, Description, Part_of_Place, Order, PictureID')
        .eq('CampaignID', campaignId)
        .order('Order', { ascending: true });
      if (error) throw error;

      setExistingPlaces(data || []);

      // Filter top-level places (Part_of_Place = 0 or null)
      const topLevel = (data || []).filter(p => p.Part_of_Place === 0 || p.Part_of_Place === null);
      setTopLevelPlaces(topLevel);
    } catch (err) {
      console.error('Failed to load places:', err);
    }
  };

  const loadNPCs = async () => {
    try {
      const { data, error } = await supabase
        .from('SW_campaign_NPC')
        .select('id, Name, Race, Part_of_Place, Description, PictureID, Brawn, Cunning, Presence, Agility, Intellect, Willpower, Soak, Wound, Strain, Skills, Abilities, races(name)')
        .eq('CampaignID', campaignId);
      if (error) throw error;

      setNpcs(data || []);
    } catch (err) {
      console.error('Failed to load NPCs:', err);
    }
  };

  const loadExistingNPCsForPlayer = async () => {
    try {
      // Step 1: Get the playerID from SW_campaign where id = campaignId
      const { data: campaignData, error: campaignError } = await supabase
        .from('SW_campaign')
        .select('playerID')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;
      const playerId = campaignData?.playerID;

      if (!playerId) {
        console.warn('No player ID found for this campaign');
        setExistingNPCsList([]);
        return;
      }

      // Step 2: Get all campaigns where playerID matches
      const { data: playerCampaigns, error: campaignsError } = await supabase
        .from('SW_campaign')
        .select('id')
        .eq('playerID', playerId);

      if (campaignsError) throw campaignsError;

      const campaignIds = playerCampaigns?.map(c => c.id) || [];

      if (campaignIds.length === 0) {
        setExistingNPCsList([]);
        return;
      }

      // Step 3: Get all NPCs from SW_campaign_NPC where CampaignID matches any of the campaign IDs
      const { data: playerNPCs, error: npcError } = await supabase
        .from('SW_campaign_NPC')
        .select('id, Name, Race, Description, Brawn, Cunning, Presence, Agility, Intellect, Willpower, Soak, Wound, Strain, Skills, Abilities, Part_of_Place, races(name)')
        .in('CampaignID', campaignIds);

      if (npcError) throw npcError;

      setExistingNPCsList(playerNPCs || []);
    } catch (err) {
      console.error('Failed to load existing NPCs:', err);
      console.error('Error details:', err);
    }
  };

  const loadExistingNotesForCampaign = async () => {
    try {
      // Get all notes for the current campaign (regardless of Part_of_Place value)
      const { data: notes, error: notesError } = await supabase
        .from('SW_campaign_notes')
        .select('id, Place_Name, Description, PictureID, Part_of_Place')
        .eq('CampaignID', campaignId)
        .order('Place_Name', { ascending: true });

      if (notesError) throw notesError;

      setExistingNotesList(notes || []);
    } catch (err) {
      console.error('Failed to load existing notes:', err);
      console.error('Error details:', err);
    }
  };

  const loadAbilityDescriptions = async (abilities) => {
    if (!abilities || !abilities.trim()) return;
    try {
      const abilityNames = abilities.split(',').map(a => a.trim());
      const { data, error } = await supabase
        .from('SW_abilities')
        .select('ability, description')
        .in('ability', abilityNames);
      if (error) throw error;

      const descMap = {};
      (data || []).forEach(row => {
        descMap[row.ability] = row.description || '';
      });
      setAbilityDescriptions(descMap);
    } catch (err) {
      console.error('Failed to load ability descriptions:', err);
    }
  };

  const handleDragStart = (place, e) => {
    setDraggedNote(place);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (targetPlace, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedNote || draggedNote.id === targetPlace.id) {
      setDraggedNote(null);
      return;
    }

    try {
      const draggedOrder = draggedNote.Order;
      const targetOrder = targetPlace.Order;

      // Determine the direction of the move
      const isMovingUp = draggedOrder > targetOrder;

      // Get all items that need to be reordered
      const itemsToUpdate = [];

      if (isMovingUp) {
        // Moving up: shift items down between target and dragged
        // Example: Moving item with Order 5 to position of Order 2
        // Items with Order 2, 3, 4 should become 3, 4, 5
        for (let i = targetOrder; i < draggedOrder; i++) {
          const item = topLevelPlaces.find(p => p.Order === i);
          if (item) {
            itemsToUpdate.push({ id: item.id, newOrder: i + 1 });
          }
        }
        // Dragged item gets the target order
        itemsToUpdate.push({ id: draggedNote.id, newOrder: targetOrder });
      } else {
        // Moving down: shift items up between dragged and target
        // Example: Moving item with Order 2 to position of Order 5
        // Items with Order 3, 4, 5 should become 2, 3, 4
        for (let i = draggedOrder + 1; i <= targetOrder; i++) {
          const item = topLevelPlaces.find(p => p.Order === i);
          if (item) {
            itemsToUpdate.push({ id: item.id, newOrder: i - 1 });
          }
        }
        // Dragged item gets the target order
        itemsToUpdate.push({ id: draggedNote.id, newOrder: targetOrder });
      }

      // Update all items in the database
      await Promise.all(
        itemsToUpdate.map(item =>
          supabase
            .from('SW_campaign_notes')
            .update({ Order: item.newOrder })
            .eq('id', item.id)
        )
      );

      // Reload places to reflect changes
      await refreshCurrentLevel();

      // After reordering, fetch all top-level places and renumber them sequentially
      const { data: allTopLevelPlaces, error: fetchError } = await supabase
        .from('SW_campaign_notes')
        .select('id, Place_Name, Description, Part_of_Place, Order, PictureID')
        .eq('Part_of_Place', 0)
        .eq('CampaignID', parseInt(campaignId, 10))
        .order('Order', { ascending: true });

      if (fetchError) throw fetchError;

      // Renumber all top-level places sequentially
      const renumberUpdates = (allTopLevelPlaces || []).map((item, index) => ({
        id: item.id,
        newOrder: index + 1
      }));

      await Promise.all(
        renumberUpdates.map(item =>
          supabase
            .from('SW_campaign_notes')
            .update({ Order: item.newOrder })
            .eq('id', item.id)
        )
      );

      // Reload places to reflect changes
      await loadNotes();
      setDraggedNote(null);
    } catch (err) {
      console.error('Failed to reorder places:', err);
      alert('Failed to reorder places');
    }
  };

  const handleSelectTopLevel = (place) => {
    // Start a new hierarchy path from this top-level place
    setSelectedHierarchy([place]);
    // Close the NPC box when selecting a new place
    setSelectedNPC(null);
  };

  const handleEditPlace = (place) => {
    setEditingPlaceId(place.id);
    setEditingPlaceData({
      Place_Name: place.Place_Name,
      Description: place.Description,
    });
    setShowDropdown(null);
  };

  const handleSaveEditedPlace = async () => {
    if (!editingPlaceData.Place_Name.trim()) {
      alert('Place Name is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('SW_campaign_notes')
        .update({
          Place_Name: editingPlaceData.Place_Name.trim(),
          Description: editingPlaceData.Description.trim(),
        })
        .eq('id', editingPlaceId);

      if (error) throw error;

      alert('Place updated successfully!');
      setEditingPlaceId(null);
      setEditingPlaceData({});
      await refreshSingleNote(editingPlaceId);
    } catch (err) {
      console.error('Failed to save place:', err);
      alert('Failed to save place: ' + err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingPlaceId(null);
    setEditingPlaceData({});
  };

  const refreshSingleNote = async (noteId) => {
    // Refresh just a single note without reloading the entire level
    try {
      const { data, error } = await supabase
        .from('SW_campaign_notes')
        .select('id, Place_Name, Description, Part_of_Place, Order, PictureID')
        .eq('id', noteId)
        .single();

      if (error) throw error;

      // Update the note in selectedHierarchy
      setSelectedHierarchy(prev => {
        const updated = [...prev];
        const lastItem = updated[updated.length - 1];

        if (lastItem && lastItem.id === noteId) {
          // If the note being refreshed is the last item in hierarchy, update it
          updated[updated.length - 1] = {
            ...lastItem,
            ...data
          };
        } else if (lastItem && lastItem.children) {
          // Otherwise, update it in the children array
          lastItem.children = lastItem.children.map(child =>
            child.id === noteId ? { ...child, ...data } : child
          );
        }

        return updated;
      });
    } catch (err) {
      console.error('Failed to refresh single note:', err);
    }
  };

  const refreshNoteAndChildren = async (noteId) => {
    // Refresh a note and all its children
    try {
      // Fetch the parent note to get its Part_of_Place field (which contains comma-separated child IDs)
      const { data: parentNote, error: parentError } = await supabase
        .from('SW_campaign_notes')
        .select('id, Place_Name, Description, Part_of_Place, Order, PictureID')
        .eq('id', noteId)
        .single();

      if (parentError) throw parentError;

      // Get the child IDs from the parent's Part_of_Place field
      let childIds = [];
      if (parentNote.Part_of_Place) {
        childIds = parentNote.Part_of_Place.toString().split(',').map(id => parseInt(id.trim(), 10));
      }

      // Fetch all children using their IDs
      let childrenData = [];
      if (childIds.length > 0) {
        const { data, error: childrenError } = await supabase
          .from('SW_campaign_notes')
          .select('id, Place_Name, Description, Part_of_Place, Order, PictureID')
          .in('id', childIds)
          .order('Order', { ascending: true });

        if (childrenError) throw childrenError;
        childrenData = data || [];
      }

      // Update existingPlaces with the parent and its children
      setExistingPlaces(prev => {
        const updated = [...prev];
        // Remove the parent note and all its old children
        const filtered = updated.filter(p => p.id !== noteId && !childIds.includes(p.id));
        // Add the updated parent note
        filtered.push(parentNote);
        // Add the new children
        if (childrenData.length > 0) {
          filtered.push(...childrenData);
        }
        return filtered;
      });

      // Also update the note itself if it's in the hierarchy
      setSelectedHierarchy(prev => {
        const updated = [...prev];
        const noteIndex = updated.findIndex(p => p.id === noteId);
        if (noteIndex !== -1) {
          updated[noteIndex] = parentNote;
        }
        return updated;
      });
    } catch (err) {
      console.error('Failed to refresh note and children:', err);
    }
  };

  const refreshCurrentLevel = async () => {
    // Refresh only the current level of notes without reloading the entire page
    try {
      if (selectedHierarchy.length === 0) {
        // Top level - reload top level notes
        await loadNotes();
      } else {
        // Get the parent place ID
        const parentId = selectedHierarchy[selectedHierarchy.length - 1].id;

        // Fetch child notes of the current parent
        const { data, error } = await supabase
          .from('SW_campaign_notes')
          .select('id, Place_Name, Description, Part_of_Place, Order, PictureID')
          .eq('Part_of_Place', parentId)
          .order('Order', { ascending: true });

        if (error) throw error;

        // Update the last item in selectedHierarchy with fresh data
        setSelectedHierarchy(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            children: data || []
          };
          return updated;
        });
      }
    } catch (err) {
      console.error('Failed to refresh current level:', err);
    }
  };

  const handleDeletePlace = async (placeId) => {
    setDeleting(true);
    try {
      // First, find all child notes (notes where Part_of_Place = placeId)
      const { data: childNotes, error: fetchError } = await supabase
        .from('SW_campaign_notes')
        .select('id')
        .eq('Part_of_Place', placeId);

      if (fetchError) throw fetchError;

      // Delete all child notes first
      if (childNotes && childNotes.length > 0) {
        const childIds = childNotes.map(note => note.id);
        const { error: deleteChildError } = await supabase
          .from('SW_campaign_notes')
          .delete()
          .in('id', childIds);

        if (deleteChildError) throw deleteChildError;
      }

      // Delete the parent note
      const { error: deleteError } = await supabase
        .from('SW_campaign_notes')
        .delete()
        .eq('id', placeId);

      if (deleteError) throw deleteError;

      // Update existingPlaces to remove the deleted note and its children
      setExistingPlaces(prev => {
        const childIds = childNotes ? childNotes.map(note => note.id) : [];
        const filtered = prev.filter(p => p.id !== placeId && !childIds.includes(p.id));
        return filtered;
      });

      // Update topLevelPlaces to remove the deleted note if it's a top-level note
      setTopLevelPlaces(prev => {
        const filtered = prev.filter(p => p.id !== placeId);
        return filtered;
      });

      // Update selectedHierarchy to remove the deleted note if it's in the hierarchy
      setSelectedHierarchy(prev => {
        const updated = prev.filter(p => p.id !== placeId);
        return updated;
      });

      alert('Note and all associated notes deleted successfully!');
      setDeleteConfirmation(null);
    } catch (err) {
      console.error('Failed to delete place:', err);
      alert('Failed to delete place: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleUploadPicture = async (place) => {
    // Get the username from localStorage
    const username = localStorage.getItem('username');
    if (!username) {
      alert('User not logged in');
      return;
    }

    // Get the user ID from the database
    const { data: userData, error: userError } = await supabase
      .from('user')
      .select('id')
      .eq('username', username)
      .single();

    if (userError || !userData) {
      alert('Failed to get user information');
      return;
    }

    const userId = userData.id;

    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.png';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file is PNG
      if (!file.name.toLowerCase().endsWith('.png')) {
        alert('Please select a PNG file');
        return;
      }

      try {
        // Step 1: Upload the file to the server's SW_Pictures directory
        const formData = new FormData();
        formData.append('file', file);
        formData.append('placeId', place.id);
        formData.append('userId', userId);

        const uploadResponse = await fetch('http://localhost:3001/SW_Pictures/api/upload-picture', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          alert('Failed to upload picture: ' + (errorData.error || uploadResponse.statusText));
          return;
        }

        await uploadResponse.json();

        alert('Picture uploaded successfully!');
        setShowDropdown(null);
        // Refresh parent note so user sees the new picture immediately
        await refreshSingleNote(place.id);
      } catch (err) {
        console.error('Error uploading picture:', err);
        alert('Error uploading picture: ' + err.message);
      }
    };

    fileInput.click();
  };

  const handleSelectPlace = (place, parentIndex) => {
    // Replace any deeper panels after parentIndex and append new selection
    const newHierarchy = selectedHierarchy.slice(0, parentIndex + 1);
    newHierarchy.push(place);
    setSelectedHierarchy(newHierarchy);
    // Close the NPC box when selecting a new place
    setSelectedNPC(null);
  };

  const handleBackPanel = () => {
    // Remove the last item from hierarchy
    setSelectedHierarchy(selectedHierarchy.slice(0, -1));
  };

  const getChildPlaces = (parentId) => {
    // Find all notes where Part_of_Place equals parentId (or contains parentId in comma-separated list)
    const children = existingPlaces.filter(p => {
      if (!p.Part_of_Place) return false;

      // Handle both single ID and comma-separated IDs
      const parentIds = p.Part_of_Place.toString().split(',').map(id => parseInt(id.trim(), 10));
      return parentIds.includes(parentId);
    });

    return children;
  };

  const getNPCsForPlace = (placeId) => {
    // NPCs have Part_of_Place field that may contain comma-separated IDs
    // We need to find NPCs where placeId is in the Part_of_Place field
    const result = npcs.filter(npc => {
      if (!npc.Part_of_Place) return false;
      const placeIds = npc.Part_of_Place.toString().split(',').map(id => parseInt(id.trim(), 10));
      return placeIds.includes(placeId);
    });
    return result;
  };

  const handleSavePlace = async () => {
    if (!placeName.trim()) {
      alert('Place Name is required');
      return;
    }

    setSaving(true);
    try {
      // Get the max Order value from all campaigns
      const { data: allNotes, error: fetchError } = await supabase
        .from('SW_campaign_notes')
        .select('Order')
        .order('Order', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('Error fetching max order:', fetchError);
        alert('Failed to fetch order information: ' + fetchError.message);
        return;
      }

      // Calculate the next order number
      const nextOrder = (allNotes && allNotes.length > 0 && allNotes[0].Order)
        ? allNotes[0].Order + 1
        : 1;

      const payload = {
        Place_Name: placeName.trim(),
        Description: description.trim(),
        Part_of_Place: partOfPlace ? parseInt(partOfPlace, 10) : 0,
        CampaignID: parseInt(campaignId, 10),
        Order: nextOrder,
      };

      const { data, error } = await supabase
        .from('SW_campaign_notes')
        .insert([payload])
        .select();

      if (error) {
        console.error('Error saving place:', error);
        alert('Failed to save place: ' + error.message);
        return;
      }

      alert('Place saved successfully!');

      // Update existingPlaces and topLevelPlaces with the new note
      if (data && data.length > 0) {
        const newNote = data[0];
        setExistingPlaces(prev => [...prev, newNote]);
        // Only add to topLevelPlaces if it's a top-level note (Part_of_Place is null)
        if (!newNote.Part_of_Place) {
          setTopLevelPlaces(prev => [...prev, newNote]);
        }
      }

      setPlaceName('');
      setDescription('');
      setPartOfPlace('');
      setShowAddPlaceForm(false);
    } catch (err) {
      console.error('Error saving place:', err);
      alert('Failed to save place');
    } finally {
      setSaving(false);
    }
  };

  const resetNPCForm = () => {
    setNpcName('');
    setNpcRaceId('');
    setNpcDescription('');
    setNpcBrawn('');
    setNpcCunning('');
    setNpcPresence('');
    setNpcAgility('');
    setNpcIntellect('');
    setNpcWillpower('');
    setNpcSoak('');
    setNpcWound('');
    setNpcStrain('');
    setNpcPlaceId('');
    setSelectedSkills([]);
    setSelectedAbilities([]);
    setSelectedEquipment([]);
  };

  const populateNPCFormForEdit = (npc) => {
    setNpcName(npc.Name || '');
    setNpcRaceId(npc.Race ? String(npc.Race) : '');
    setNpcDescription(npc.Description || '');
    setNpcBrawn(npc.Brawn ? String(npc.Brawn) : '');
    setNpcCunning(npc.Cunning ? String(npc.Cunning) : '');
    setNpcPresence(npc.Presence ? String(npc.Presence) : '');
    setNpcAgility(npc.Agility ? String(npc.Agility) : '');
    setNpcIntellect(npc.Intellect ? String(npc.Intellect) : '');
    setNpcWillpower(npc.Willpower ? String(npc.Willpower) : '');
    setNpcSoak(npc.Soak ? String(npc.Soak) : '');
    setNpcWound(npc.Wound ? String(npc.Wound) : '');
    setNpcStrain(npc.Strain ? String(npc.Strain) : '');
    setNpcPlaceId(npc.Part_of_Place ? String(npc.Part_of_Place) : '');
    setSelectedSkills(npc.Skills ? npc.Skills.split(',').map(s => s.trim()) : []);
    setSelectedAbilities(npc.Abilities ? npc.Abilities.split(',').map(a => a.trim()) : []);
    setSelectedEquipment(npc.Equipment ? npc.Equipment.split(',').map(e => e.trim()) : []);
  };

  const addToList = (value, list, setter) => {
    if (!value) return;
    // Allow duplicates - just add the value
    setter([...list, value]);
  };

  const removeFromList = (value, list, setter) => {
    // Remove only the first occurrence of the value
    const index = list.indexOf(value);
    if (index > -1) {
      setter([...list.slice(0, index), ...list.slice(index + 1)]);
    }
  };

  const handleSaveNPC = async () => {
    if (!npcName.trim()) {
      alert('NPC Name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        Name: npcName.trim(),
        Race: npcRaceId ? parseInt(npcRaceId, 10) : null,
        Description: npcDescription.trim(),
        Brawn: npcBrawn ? parseInt(npcBrawn, 10) : null,
        Cunning: npcCunning ? parseInt(npcCunning, 10) : null,
        Presence: npcPresence ? parseInt(npcPresence, 10) : null,
        Agility: npcAgility ? parseInt(npcAgility, 10) : null,
        Intellect: npcIntellect ? parseInt(npcIntellect, 10) : null,
        Willpower: npcWillpower ? parseInt(npcWillpower, 10) : null,
        Skills: selectedSkills.join(','),
        Abilities: selectedAbilities.join(','),
        Equipment: selectedEquipment.join(','),
        Part_of_Place: npcPlaceId ? parseInt(npcPlaceId, 10) : null,
        CampaignID: campaignId ? parseInt(campaignId, 10) : null,
      };

      const { error } = await supabase
        .from('SW_campaign_NPC')
        .insert([payload]);

      if (error) {
        console.error('Error saving NPC:', error);
        alert('Failed to save NPC: ' + error.message);
        return;
      }

      alert('NPC saved successfully!');
      // Refresh parent note so user sees the change immediately
      if (npcPlaceId) {
        await refreshSingleNote(Number(npcPlaceId));
      }
      resetNPCForm();
      setShowAddNPCForm(false);
      await loadNPCs();
    } catch (err) {
      console.error('Error saving NPC:', err);
      alert('Failed to save NPC');
    } finally {
      setSavingNPC(false);
    }
  };

  const handleEditNPC = (npc) => {
    populateNPCFormForEdit(npc);
    setEditingNPCId(npc.id);
    setShowNPCDropdown(null);
  };

  const handleSaveEditedNPC = async () => {
    if (!npcName.trim()) {
      alert('NPC Name is required');
      return;
    }
    setSavingNPC(true);
    try {
      const payload = {
        Name: npcName.trim(),
        Race: npcRaceId ? parseInt(npcRaceId, 10) : null,
        Description: npcDescription.trim(),
        Brawn: npcBrawn ? parseInt(npcBrawn, 10) : null,
        Cunning: npcCunning ? parseInt(npcCunning, 10) : null,
        Presence: npcPresence ? parseInt(npcPresence, 10) : null,
        Agility: npcAgility ? parseInt(npcAgility, 10) : null,
        Intellect: npcIntellect ? parseInt(npcIntellect, 10) : null,
        Willpower: npcWillpower ? parseInt(npcWillpower, 10) : null,
        Soak: npcSoak ? parseInt(npcSoak, 10) : null,
        Wound: npcWound ? parseInt(npcWound, 10) : null,
        Strain: npcStrain ? parseInt(npcStrain, 10) : null,
        Skills: selectedSkills.join(','),
        Abilities: selectedAbilities.join(','),
        Equipment: selectedEquipment.join(','),
      };

      const { error } = await supabase
        .from('SW_campaign_NPC')
        .update(payload)
        .eq('id', editingNPCId);

      if (error) {
        console.error('Error updating NPC:', error);
        alert('Failed to update NPC: ' + error.message);
        return;
      }

      alert('NPC updated successfully!');
      setEditingNPCId(null);
      resetNPCForm();
      await loadNPCs();
      setSelectedNPC(null);
    } catch (err) {
      console.error('Error updating NPC:', err);
      alert('Failed to update NPC');
    } finally {
      setSavingNPC(false);
    }
  };

  const handleDeleteNPC = async (npcId) => {
    if (!window.confirm('Are you sure you want to delete this NPC?')) {
      return;
    }
    setSavingNPC(true);
    try {
      const { error } = await supabase
        .from('SW_campaign_NPC')
        .delete()
        .eq('id', npcId);

      if (error) {
        console.error('Error deleting NPC:', error);
        alert('Failed to delete NPC: ' + error.message);
        return;
      }

      alert('NPC deleted successfully!');
      setSelectedNPC(null);
      resetNPCForm();
      await loadNPCs();
    } catch (err) {
      console.error('Error deleting NPC:', err);
      alert('Failed to delete NPC');
    } finally {
      setSavingNPC(false);
    }
  };

  const loadSkills = async () => {
    try {
      const { data, error } = await supabase.from('skills').select('id, skill').order('skill');
      if (error) throw error;
      setSkillsList(data || []);
    } catch (err) {
      console.error('Failed to load skills:', err);
    }
  };

  // Load skills on mount and when campaignId changes
  useEffect(() => {
    if (campaignId) {
      loadSkills();
    }
  }, [campaignId]);

  // Dice pool click-to-roll popup state
  const [dicePopup, setDicePopup] = useState(null);

  // Handler for dice pool click
  const handleDicePoolClick = (e, pool, label) => {
    if (!pool) return;
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    let x = rect.left + window.scrollX;
    let y = rect.bottom + window.scrollY + 8;
    setDicePopup({ pool, x, y, label });
  };

  // Refs for scrolling notes and NPCs into view
  const noteRefs = useRef({});
  const npcRefs = useRef({});

  // Scroll to selected note/NPC when selected
  useEffect(() => {
    if (selectedNPC && npcRefs.current[selectedNPC.id]) {
      npcRefs.current[selectedNPC.id].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedNPC]);

  // Optionally, scroll to a selected note if you have a selectedNoteId state

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="py-10 px-4 border-b border-gray-300">
        <h1 className="text-3xl font-bold mb-2 text-center">{campaignName}</h1>
        <p className="text-gray-600 mb-8 text-center">My Notes</p>

        <div className="flex gap-3 justify-center mb-8">
          <button
            onClick={() => navigate('/select-ttrpg')}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Select TTRPG
          </button>
          <button
            onClick={() => navigate('/SW_campaign')}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          >
            Back to My Campaigns
          </button>
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setAddPlaceButtonPos({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
              });
              setShowAddPlaceForm(true);
            }}
            className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition font-bold"
          >
            Add Note
          </button>
        </div>
      </div>

      {showAddPlaceForm && (
        <div
          style={{
            position: 'fixed',
            top: `${addPlaceButtonPos.top}px`,
            left: `${addPlaceButtonPos.left}px`,
            backgroundColor: '#d1d5db',
            padding: '12px',
            borderRadius: '6px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            minWidth: '400px',
          }}
        >
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-lg font-bold mb-3 text-gray-800">Add a Note</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Place Name</label>
                <input
                  type="text"
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSavePlace}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition font-bold disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setPlaceName('');
                    setDescription('');
                    setPartOfPlace('');
                    setShowAddPlaceForm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-400 text-white text-xs rounded hover:bg-gray-500 transition font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddNPCForm && (
        <div className="p-6 bg-gray-100 border-b border-gray-300">
          <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg border border-gray-300">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Add NPC (Legacy)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NPC</label>
                <input
                  type="text"
                  value={npcName}
                  onChange={(e) => setNpcName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Race</label>
                <select
                  value={npcRaceId}
                  onChange={(e) => setNpcRaceId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Select Race --</option>
                  {raceList.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={npcDescription}
                  onChange={(e) => setNpcDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>

              {/* Attributes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brawn</label>
                <input type="number" value={npcBrawn} onChange={(e) => setNpcBrawn(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cunning</label>
                <input type="number" value={npcCunning} onChange={(e) => setNpcCunning(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Presence</label>
                <input type="number" value={npcPresence} onChange={(e) => setNpcPresence(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agility</label>
                <input type="number" value={npcAgility} onChange={(e) => setNpcAgility(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intellect</label>
                <input type="number" value={npcIntellect} onChange={(e) => setNpcIntellect(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Willpower</label>
                <input type="number" value={npcWillpower} onChange={(e) => setNpcWillpower(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" />
              </div>

              {/* Skills multi-select */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                <div className="flex gap-2">
                  <select id="npc-skill-select" className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500">
                    <option value="">-- Select Skill --</option>
                    {skillsList.map((s) => (
                      <option key={s.id} value={s.skill}>{s.skill}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('npc-skill-select');
                      addToList(el.value, selectedSkills, setSelectedSkills);
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >Add</button>
                </div>
                {selectedSkills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 overflow-hidden">
                    {selectedSkills.map((s, idx) => (
                      <span key={`skill-${idx}`} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded flex-shrink-0">
                        {s}
                        <button onClick={() => removeFromList(s, selectedSkills, setSelectedSkills)} className="text-blue-700 hover:text-blue-900">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Abilities multi-select */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Abilities</label>
                <div className="flex gap-2">
                  <select id="npc-ability-select" className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500">
                    <option value="">-- Select Ability --</option>
                    {abilitiesList.map((a) => (
                      <option key={a.id} value={a.ability}>{a.ability}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('npc-ability-select');
                      addToList(el.value, selectedAbilities, setSelectedAbilities);
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >Add</button>
                </div>
                {selectedAbilities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 overflow-hidden">
                    {selectedAbilities.map((a, idx) => (
                      <span key={`ability-${idx}`} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded flex-shrink-0">
                        {a}
                        <button onClick={() => removeFromList(a, selectedAbilities, setSelectedAbilities)} className="text-green-700 hover:text-green-900">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Equipment multi-select */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipment</label>
                <div className="flex gap-2">
                  <select id="npc-equipment-select" className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500">
                    <option value="">-- Select Equipment --</option>
                    {equipmentList.map((e) => (
                      <option key={e.id} value={e.name}>{e.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('npc-equipment-select');
                      addToList(el.value, selectedEquipment, setSelectedEquipment);
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >Add</button>
                </div>
                {selectedEquipment.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 overflow-hidden">
                    {selectedEquipment.map((e, idx) => (
                      <span key={`equipment-${idx}`} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded flex-shrink-0">
                        {e}
                        <button onClick={() => removeFromList(e, selectedEquipment, setSelectedEquipment)} className="text-purple-700 hover:text-purple-900">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Part of Place */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Part of Place</label>
                <select
                  value={npcPlaceId}
                  onChange={(e) => setNpcPlaceId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- None --</option>
                  {existingPlaces.map((p) => (
                    <option key={p.id} value={p.id}>{p.Place_Name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSaveNPC}
                disabled={saving}
                className="flex-1 px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition font-bold disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => { resetNPCForm(); setShowAddNPCForm(false); }}
                className="flex-1 px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 gap-0 bg-white overflow-x-auto overflow-y-visible">
        {/* Panel 1: Top-Level Places */}
        <div className="shrink-0 w-56 bg-gray-50 border-r border-gray-300 p-2 overflow-y-auto flex flex-col relative">
          <h2 className="text-sm font-bold mb-2 text-gray-800">Places</h2>
          {notes.length > 0 ? (
            <div className="space-y-1">
              {notes.map((place) => (
                <div
                  key={place.id}
                  draggable
                  onDragStart={(e) => handleDragStart(place, e)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(place, e)}
                  className="flex items-center gap-1"
                >
                  <button
                    onClick={() => handleSelectTopLevel(place)}
                    className={`flex-1 text-left px-2 py-1 rounded text-sm bg-white text-gray-800 hover:bg-blue-50 border transition truncate ${
                      draggedNote?.id === place.id
                        ? 'bg-blue-200 border-blue-400 opacity-50'
                        : 'border-gray-300'
                    }`}
                  >
                    {place.Place_Name}
                  </button>
                  <div
                    className="cursor-move"
                    onMouseDown={(e) => {
                      // Allow drag to start from the handle
                      e.stopPropagation();
                    }}
                  >
                    <DragHandle />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-xs italic">No top-level places yet</p>
          )}
        </div>

        {/* Dynamic Panels for Selected Hierarchy */}
        {selectedHierarchy.map((place, index) => {
          const childPlaces = getChildPlaces(place.id);
          return (
            <div key={place.id} className="flex shrink-0">
              <div className="w-[28rem] bg-white border-r border-gray-300 p-2 overflow-y-auto flex flex-col relative">
              {/* Back Button and Dropdown Menu */}
              <div className="flex items-center justify-between mb-2 relative z-20">
                {index === 0 && selectedHierarchy.length > 0 && (
                  <button
                    onClick={handleBackPanel}
                    className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500 transition"
                  >
                    ← Back
                  </button>
                )}
                <div className="ml-auto">
                  <button
                    onClick={(e) => {
                      if (showDropdown === place.id) {
                        setShowDropdown(null);
                      } else {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDropdownPos({
                          top: rect.bottom + window.scrollY,
                          left: rect.right - 160 + window.scrollX,
                        });
                        setShowDropdown(place.id);
                      }
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-800 text-xs rounded hover:bg-gray-400 transition"
                  >
                    ⋮
                  </button>
                </div>
              </div>



              {/* Inline Add Note Form - appears to the right of the dropdown */}
              {showInlineAddNote === place.id && (
                <div
                  style={{
                    position: 'fixed',
                    top: `${dropdownPos.top}px`,
                    left: `${dropdownPos.left + 160}px`,
                    backgroundColor: '#d1d5db',
                    padding: '12px',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    zIndex: 9999,
                    minWidth: '300px',
                  }}
                >
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm">Add Note to {place.Place_Name}</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Place Name</label>
                        <input
                          type="text"
                          value={inlinePlaceName}
                          onChange={(e) => setInlinePlaceName(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                          placeholder="Enter place name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={inlineDescription}
                          onChange={(e) => setInlinePlaceName(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                          rows={3}
                          placeholder="Enter description"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            if (!inlinePlaceName.trim()) {
                              alert('Place Name is required');
                              return;
                            }

                            try {
                              const payload = {
                                Place_Name: inlinePlaceName.trim(),
                                Description: inlineDescription.trim(),
                                Part_of_Place: place.id,
                                CampaignID: parseInt(campaignId, 10),
                              };

                              const { error } = await supabase
                                .from('SW_campaign_notes')
                                .insert([payload]);

                              if (error) throw error;

                              setShowInlineAddNote(null);
                              setInlinePlaceName('');
                              setInlineDescription('');

                              alert('Note added successfully!');
                              await loadPlaces();
                            } catch (err) {
                              alert('Error saving note: ' + err.message);
                            }
                          }}
                          className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition font-bold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setShowInlineAddNote(null);
                            setInlinePlaceName('');
                            setInlineDescription('');
                          }}
                          className="flex-1 px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500 transition font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Mode */}
              {editingPlaceId === place.id ? (
                <div className="mb-2 p-2 bg-yellow-50 rounded-lg border border-yellow-300">
                  <div className="mb-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Place Name</label>
                    <input
                      type="text"
                      value={editingPlaceData.Place_Name}
                      onChange={(e) => setEditingPlaceData({ ...editingPlaceData, Place_Name: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                    <textarea
                      value={editingPlaceData.Description}
                      onChange={(e) => setEditingPlaceData({ ...editingPlaceData, Description: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEditedPlace}
                      className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Place Description at Top */
                <div className="mb-2 p-2 bg-gray-100 rounded-lg border border-gray-300">
                  <h3 className="font-bold text-gray-800 mb-1 text-sm">{place.Place_Name}</h3>
                  <p className="text-gray-700 text-xs whitespace-pre-wrap break-words">{place.Description}</p>
                </div>
              )}

              {/* Notes as Buttons */}
              {childPlaces.length > 0 ? (
                <>
                  <h4 className="text-xs font-bold mb-1 text-gray-800">Notes</h4>
                  <div className="space-y-1">
                    {childPlaces.map((child) => (
                      <div
                        key={child.id}
                        draggable
                        onDragStart={(e) => handleDragStart(child, e)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(child, e)}
                      >
                        <button
                          ref={el => noteRefs.current[child.id] = el}
                          onClick={() => {
                            handleSelectPlace(child, index);
                            setTimeout(() => {
                              if (noteRefs.current[child.id]) {
                                noteRefs.current[child.id].scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }, 0);
                          }}
                          className={`w-full text-left px-2 py-1 rounded text-sm bg-blue-50 text-gray-800 hover:bg-blue-100 border border-blue-300 transition truncate ${
                            draggedNote?.id === child.id
                              ? 'bg-blue-200 border-blue-400 opacity-50'
                              : ''
                          }`}
                        >
                          {child.Place_Name}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-xs italic">No notes</p>
              )}

              {/* NPCs Section */}
              {getNPCsForPlace(place.id).length > 0 ? (
                <>
                  <h4 className="text-xs font-bold mb-1 text-gray-800 mt-3">NPCs</h4>
                  <div className="space-y-1">
                    {getNPCsForPlace(place.id).map((npc) => (
                      <button
                        key={npc.id}
                        ref={el => npcRefs.current[npc.id] = el}
                        onClick={() => {
                          setSelectedNPC(npc);
                          loadAbilityDescriptions(npc.Abilities);
                          setTimeout(() => {
                            if (npcRefs.current[npc.id]) {
                              npcRefs.current[npc.id].scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                          }, 0);
                        }}
                        className="w-full text-left px-2 py-1 rounded text-sm bg-purple-50 text-gray-800 hover:bg-purple-100 border border-purple-300 transition truncate"
                      >
                        <div className="font-semibold">{npc.Name}</div>
                        {npc.races && <div className="text-xs text-gray-600">Race: {npc.races.name}</div>}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-xs italic mt-3">No NPCs</p>
              )}
              </div>

              {/* Picture Box - Only show if this is the last item in hierarchy and has a picture AND no NPC is selected */}
              {index === selectedHierarchy.length - 1 && place.PictureID && !selectedNPC && (
                <div className="shrink-0 w-64 h-80 bg-gray-50 border-r border-gray-300 p-1 flex flex-col items-center justify-center overflow-hidden" style={{ width: '256px', height: '320px', minWidth: '256px', minHeight: '320px' }}>
                  <img
                    src={`/SW_Pictures/Picture ${place.PictureID}.png`}
                    alt={place.Place_Name}
                    className="w-full h-full object-contain"
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* NPC Details Column - Show when an NPC is selected */}
        {selectedNPC && (
          <div className="flex shrink-0">
            {/* NPC Details Panel */}
            <div className="w-[28rem] bg-white border-r border-gray-300 p-4 overflow-y-auto flex flex-col">
              {/* Header with Dropdown and Close Button */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-800">{selectedNPC.Name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      if (showNPCDropdown === selectedNPC.id) {
                        setShowNPCDropdown(null);
                      } else {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setNpcDropdownPos({
                          top: rect.bottom + window.scrollY,
                          left: rect.left - 100 + window.scrollX,
                        });
                        setShowNPCDropdown(selectedNPC.id);
                      }
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-800 text-xs rounded hover:bg-gray-400 transition"
                  >
                    ⋮
                  </button>
                  <button
                    onClick={() => setSelectedNPC(null)}
                    className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500 transition"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              {/* NPC Dropdown Menu */}
              {showNPCDropdown === selectedNPC.id && !editingNPCId && (
                <div
                  className="fixed bg-white border border-gray-300 rounded shadow-lg z-50 w-40"
                  style={{
                    top: `${npcDropdownPos.top}px`,
                    left: `${npcDropdownPos.left}px`,
                  }}
                >
                  {/* Add Picture to Database (Admin only) */}
                  {isAdmin && (
                    <button
                      onClick={async () => {
                        try {
                          // 1. Insert new row into SW_pictures with user_ID
                          const userId = localStorage.getItem('userId') || localStorage.getItem('userid') || localStorage.getItem('user_id');
                          if (!userId) {
                            alert('User ID not found in localStorage.');
                            return;
                          }
                          const { data: pictureRow, error: pictureError } = await supabase
                            .from('SW_pictures')
                            .insert([{ user_ID: userId }])
                            .select('id')
                            .single();
                          if (pictureError || !pictureRow?.id) {
                            alert('Failed to create picture row: ' + (pictureError?.message || 'Unknown error'));
                            return;
                          }
                          // 2. Update NPC's PictureID
                          const { error: npcError } = await supabase
                            .from('SW_campaign_NPC')
                            .update({ PictureID: pictureRow.id })
                            .eq('id', selectedNPC.id);
                          if (npcError) {
                            alert('Failed to update NPC with new PictureID: ' + npcError.message);
                            return;
                          }
                          // 3. Show message
                          alert(`Picture ${pictureRow.id} has been created, upload Picture.`);
                          setShowNPCDropdown(null);
                          await loadNPCs();
                        } catch (err) {
                          alert('Error adding picture: ' + err.message);
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition border-b border-gray-300"
                    >
                      Add Picture to Database
                    </button>
                  )}
                  <button
                    onClick={() => handleEditNPC(selectedNPC)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-blue-50 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        // Get the current place ID from the hierarchy
                        const currentPlace = selectedHierarchy[selectedHierarchy.length - 1];
                        const currentPlaceId = currentPlace?.id;

                        if (!currentPlaceId) {
                          alert('Could not determine current place');
                          return;
                        }

                        // Get the current Part_of_Place value
                        const currentPartOfPlace = selectedNPC.Part_of_Place || '';

                        if (!currentPartOfPlace) {
                          alert('NPC is not assigned to any place');
                          return;
                        }

                        // Split the comma-separated IDs and filter out the current place ID
                        const placeIds = currentPartOfPlace.toString().split(',').map(id => parseInt(id.trim(), 10));
                        const updatedPlaceIds = placeIds.filter(id => id !== currentPlaceId);

                        // Create the new Part_of_Place value
                        const newPartOfPlace = updatedPlaceIds.length > 0 ? updatedPlaceIds.join(',') : null;

                        // Update the NPC's Part_of_Place field
                        const { error: updateError } = await supabase
                          .from('SW_campaign_NPC')
                          .update({ Part_of_Place: newPartOfPlace })
                          .eq('id', selectedNPC.id);

                        if (updateError) throw updateError;

                        alert('NPC removed from place successfully!');
                        setShowNPCDropdown(null);
                        setSelectedNPC(null);
                        await loadNPCs();
                      } catch (err) {
                        alert('Error removing NPC from place: ' + err.message);
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition border-t border-gray-300"
                  >
                    Remove from {selectedHierarchy[selectedHierarchy.length - 1]?.Place_Name || 'Place'}
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteNPC(selectedNPC.id);
                      setShowNPCDropdown(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition border-t border-gray-300"
                  >
                    Delete
                  </button>
                </div>
              )}

              {/* Edit NPC Form */}
              {editingNPCId === selectedNPC.id && (
                <div className="mb-4 p-3 bg-gray-100 rounded border border-gray-300">
                  <h4 className="text-sm font-bold text-gray-800 mb-3">Edit NPC</h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={npcName}
                        onChange={(e) => setNpcName(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Race</label>
                      <select
                        value={npcRaceId}
                        onChange={(e) => setNpcRaceId(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Select Race --</option>
                        {raceList.map((race) => (
                          <option key={race.id} value={race.id}>{race.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={npcDescription}
                        onChange={(e) => setNpcDescription(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        rows="2"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Brawn</label>
                        <input type="number" value={npcBrawn} onChange={(e) => setNpcBrawn(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Cunning</label>
                        <input type="number" value={npcCunning} onChange={(e) => setNpcCunning(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Presence</label>
                        <label className="block font-medium text-gray-700 mb-1">Agility</label>
                        <input type="number" value={npcAgility} onChange={(e) => setNpcAgility(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Intellect</label>
                        <input type="number" value={npcIntellect} onChange={(e) => setNpcIntellect(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Willpower</label>
                        <input type="number" value={npcWillpower} onChange={(e) => setNpcWillpower(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Soak</label>
                        <input type="number" value={npcSoak} onChange={(e) => setNpcSoak(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Wound</label>
                        <input type="number" value={npcWound} onChange={(e) => setNpcWound(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Strain</label>
                        <input type="number" value={npcStrain} onChange={(e) => setNpcStrain(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                    </div>

                    {/* Skills in Edit Mode */}
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Skills</label>
                      <div className="flex gap-2">
                        <select id="edit-npc-skill-select" className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500">
                          <option value="">-- Select Skill --</option>
                          {skillsList.map((skill) => (
                            <option key={skill.id} value={skill.name}>{skill.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById('edit-npc-skill-select');
                            addToList(el.value, selectedSkills, setSelectedSkills);
                            el.value = '';
                          }}
                          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >Add</button>
                      </div>
                      {selectedSkills.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2 overflow-hidden">
                          {selectedSkills.map((s, idx) => (
                            <span key={`edit-skill-${idx}`} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded flex-shrink-0">
                              {s}
                              <button onClick={() => removeFromList(s, selectedSkills, setSelectedSkills)} className="text-blue-700 hover:text-blue-900">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Abilities in Edit Mode */}
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Abilities</label>
                      <div className="flex gap-2">
                        <select id="edit-npc-ability-select" className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500">
                          <option value="">-- Select Ability --</option>
                          {abilitiesList.map((a) => (
                            <option key={a.id} value={a.ability}>{a.ability}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById('edit-npc-ability-select');
                            addToList(el.value, selectedAbilities, setSelectedAbilities);
                            el.value = '';
                          }}
                          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >Add</button>
                      </div>
                      {selectedAbilities.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2 overflow-hidden">
                          {selectedAbilities.map((a, idx) => (
                            <span key={`edit-ability-${idx}`} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded flex-shrink-0">
                              {a}
                              <button onClick={() => removeFromList(a, selectedAbilities, setSelectedAbilities)} className="text-green-700 hover:text-green-900">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleSaveEditedNPC}
                        disabled={savingNPC}
                        className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition disabled:opacity-60"
                      >
                        {savingNPC ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingNPCId(null);
                          resetNPCForm();
                        }}
                        className="flex-1 px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Race, Picture, and Description */}
              {!editingNPCId && (
                <>
                  <div className="mb-4" style={{ overflow: 'hidden' }}>
                    {(() => {
                      console.log('NPC PictureID:', selectedNPC.PictureID, 'for NPC:', selectedNPC.Name);
                      if (selectedNPC.PictureID) {
                        return (
                          <img
                            src={`/SW_Pictures/Picture ${selectedNPC.PictureID}.png`}
                            alt={selectedNPC.Name}
                            className="rounded"
                            style={{ width: '200px', height: '240px', float: 'right', marginLeft: '1rem', marginBottom: '1rem', objectFit: 'contain', display: 'block' }}
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        );
                      }
                      return null;
                    })()}
                    {selectedNPC.races && <p className="text-sm text-gray-600 mb-1">Race: {selectedNPC.races.name}</p>}
                    {selectedNPC.Description && (
                      <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">{selectedNPC.Description}</p>
                    )}
                  </div>

                  {/* Attributes section hidden */}

                  {/* Skills section hidden */}

                  {/* Abilities section remains */}
                  {selectedNPC.Abilities && selectedNPC.Abilities.trim() && (
                    <div className="mb-4">
                      <h4 className="text-xs font-bold text-gray-800 mb-2 border-b border-gray-800 pb-1">Abilities</h4>
                      <div className="space-y-2">
                        {selectedNPC.Abilities.split(',')
                          .map(a => a.trim())
                          .sort((a, b) => a.localeCompare(b))
                          .map((abilityName, idx) => {
                            const description = abilityDescriptions[abilityName];
                            return (
                              <div key={idx} className="text-xs">
                                <div className="font-semibold text-gray-800 border-b border-gray-800 inline-block pb-0.5">{abilityName}</div>
                                {description && <div className="text-gray-600 text-xs mt-1">{description}</div>}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Skills & Dice Pool Panel */}
            <div className="w-[24rem] bg-gray-50 border-r border-gray-300 p-4 overflow-y-auto flex flex-col">
              <h4 className="font-bold text-md text-gray-800 mb-2">Skills & Dice Pool</h4>
              <table className="w-full text-xs border border-gray-300 rounded">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-2 py-1 border">Skill</th>
                    <th className="px-2 py-1 border">Dice Pool</th>
                  </tr>
                </thead>
                <tbody>
                  {skillsList.map(skillObj => {
                    const skillStatMap = {
                      Astrogation: 'Intellect', Athletics: 'Brawn', Brawl: 'Brawn', Charm: 'Presence', Coercion: 'Willpower', Computers: 'Intellect', Cool: 'Presence', Coordination: 'Agility', 'Core Worlds': 'Intellect', Deception: 'Cunning', Discipline: 'Willpower', Education: 'Intellect', Gunnery: 'Agility', Leadership: 'Presence', Lightsaber: 'Brawn', Lore: 'Intellect', Mechanics: 'Intellect', Medicine: 'Intellect', Melee: 'Brawn', Negotiation: 'Presence', 'Outer Rim': 'Intellect', Perception: 'Cunning', 'Piloting-Planetary': 'Agility', 'Piloting-Space': 'Agility', 'Ranged-Heavy': 'Agility', 'Ranged-Light': 'Agility', Resilience: 'Brawn', Skulduggery: 'Cunning', Stealth: 'Agility', Streetwise: 'Cunning', Survival: 'Cunning', Underworld: 'Intellect', Vigilance: 'Willpower', Warfare: 'Intellect', Xenology: 'Intellect',
                    };
                    const skillName = skillObj.skill;
                    const statName = skillStatMap[skillName] || '';
                    const statValue = parseInt(selectedNPC[statName], 10) || 0;
                    // Count skill rank from NPC's Skills string
                    let rank = 0;
                    if (selectedNPC.Skills) {
                      const skillsArr = selectedNPC.Skills.split(',').map(s => s.trim());
                      rank = skillsArr.filter(s => s === skillName).length;
                    }
                    // Dice pool: upgrade greens to yellows for each rank
                    let dicePool = 'G'.repeat(statValue);
                    if (rank > 0) {
                      const yCount = Math.min(rank, dicePool.length);
                      dicePool = dicePool.split('');
                      for (let i = 0; i < yCount; i++) {
                        dicePool[i] = 'Y';
                      }
                      dicePool = dicePool.join('');
                    }
                    return (
                      <tr key={skillName}>
                        <td className="px-2 py-1 border">{skillName}</td>
                        <td className="px-2 py-1 border font-mono">
                          {dicePool && dicePool !== '-' ? (
                            <button
                              className="px-2 py-1 bg-gray-200 rounded hover:bg-yellow-200 transition font-mono"
                              onClick={e => handleDicePoolClick(e, dicePool, skillName)}
                              style={{ cursor: 'pointer' }}
                            >
                              {dicePool}
                            </button>
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal - small box below dropdown menu */}
      {deleteConfirmation && (
        <div
          style={{
            position: 'fixed',
            top: `${dropdownPos.top + 160}px`,
            left: `${dropdownPos.left}px`,
            backgroundColor: '#d1d5db',
            padding: '12px',
            borderRadius: '6px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            minWidth: '300px',
          }}
        >
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-800 mb-2">Delete Note</h3>
            <p className="text-xs text-gray-700 mb-4">
              Are you sure you want to delete <strong>{selectedHierarchy.find(p => p.id === deleteConfirmation)?.Place_Name || 'this note'}</strong> and all notes associated with this?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDeletePlace(deleteConfirmation)}
                disabled={deleting}
                className="flex-1 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition font-bold disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setDeleteConfirmation(null)}
                disabled={deleting}
                className="flex-1 px-3 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500 transition font-bold disabled:opacity-60"
              >
                No, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Add NPC Form - appears to the right of the dropdown */}
      {showInlineAddNPC && (
        <div
          style={{
            position: 'fixed',
            top: `${dropdownPos.top}px`,
            left: `${dropdownPos.left + 160}px`,
            backgroundColor: '#d1d5db',
            padding: '12px',
            borderRadius: '6px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            minWidth: '400px',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-bold text-gray-800 mb-3 text-sm">Add NPC to {selectedHierarchy.find(p => p.id === showInlineAddNPC)?.Place_Name || 'Place'}</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">NPC Name</label>
                <input
                  type="text"
                  value={npcName}
                  onChange={(e) => setNpcName(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Enter NPC name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Race</label>
                <select
                  value={npcRaceId}
                  onChange={(e) => setNpcRaceId(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Select Race --</option>
                  {raceList.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={npcDescription}
                  onChange={(e) => setNpcDescription(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  rows={2}
                  placeholder="Enter description"
                />
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Brawn</label>
                  <input
                    type="number"
                    value={npcBrawn}
                    onChange={(e) => setNpcBrawn(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cunning</label>
                  <input
                    type="number"
                    value={npcCunning}
                    onChange={(e) => setNpcCunning(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Presence</label>
                  <input
                    type="number"
                    value={npcPresence}
                    onChange={(e) => setNpcPresence(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Agility</label>
                  <input
                    type="number"
                    value={npcAgility}
                    onChange={(e) => setNpcAgility(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Intellect</label>
                  <input
                    type="number"
                    value={npcIntellect}
                    onChange={(e) => setNpcIntellect(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Willpower</label>
                  <input
                    type="number"
                    value={npcWillpower}
                    onChange={(e) => setNpcWillpower(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Soak, Wound, Strain Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Soak</label>
                  <input
                    type="number"
                    value={npcSoak}
                    onChange={(e) => setNpcSoak(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Wound</label>
                  <input
                    type="number"
                    value={npcWound}
                    onChange={(e) => setNpcWound(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Strain</label>
                  <input
                    type="number"
                    value={npcStrain}
                    onChange={(e) => setNpcStrain(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Skills multi-select */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Skills</label>
                <div className="flex gap-2">
                  <select id="inline-npc-skill-select" className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500">
                    <option value="">-- Select Skill --</option>
                    {skillsList.map((s) => (
                      <option key={s.id} value={s.skill}>{s.skill}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('inline-npc-skill-select');
                      addToList(el.value, selectedSkills, setSelectedSkills);
                    }}
                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >Add</button>
                </div>
                {selectedSkills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1 overflow-hidden">
                    {selectedSkills.map((s, idx) => (
                      <span key={`skill-${idx}`} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded flex-shrink-0">
                        {s}
                        <button onClick={() => removeFromList(s, selectedSkills, setSelectedSkills)} className="text-blue-700 hover:text-blue-900">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Abilities multi-select */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Abilities</label>
                <div className="flex gap-2">
                  <select id="inline-npc-ability-select" className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500">
                    <option value="">-- Select Ability --</option>
                    {abilitiesList.map((a) => (
                      <option key={a.id} value={a.ability}>{a.ability}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('inline-npc-ability-select');
                      addToList(el.value, selectedAbilities, setSelectedAbilities);
                    }}
                    className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  >Add</button>
                </div>
                {selectedAbilities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1 overflow-hidden">
                    {selectedAbilities.map((a, idx) => (
                      <span key={`ability-${idx}`} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded flex-shrink-0">
                        {a}
                        <button onClick={() => removeFromList(a, selectedAbilities, setSelectedAbilities)} className="text-green-700 hover:text-green-900">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!npcName.trim()) {
                      alert('NPC Name is required');
                      return;
                    }

                    try {
                      const payload = {
                        Name: npcName.trim(),
                        Race: npcRaceId ? parseInt(npcRaceId, 10) : null,
                        Description: npcDescription.trim(),
                        Brawn: npcBrawn ? parseInt(npcBrawn, 10) : null,
                        Cunning: npcCunning ? parseInt(npcCunning, 10) : null,
                        Presence: npcPresence ? parseInt(npcPresence, 10) : null,
                        Agility: npcAgility ? parseInt(npcAgility, 10) : null,
                        Intellect: npcIntellect ? parseInt(npcIntellect, 10) : null,
                        Willpower: npcWillpower ? parseInt(npcWillpower, 10) : null,
                        Soak: npcSoak ? parseInt(npcSoak, 10) : null,
                        Wound: npcWound ? parseInt(npcWound, 10) : null,
                        Strain: npcStrain ? parseInt(npcStrain, 10) : null,
                        Skills: selectedSkills.join(','),
                        Abilities: selectedAbilities.join(','),
                        Part_of_Place: showInlineAddNPC,
                        CampaignID: parseInt(campaignId, 10),
                      };

                      const { error } = await supabase
                        .from('SW_campaign_NPC')
                        .insert([payload]);

                      if (error) throw error;

                      setShowInlineAddNPC(null);
                      resetNPCForm();
                      alert('NPC added successfully!');
                      await loadNPCs();
                    } catch (err) {
                      alert('Error saving NPC: ' + err.message);
                    }
                  }}
                  className="flex-1 px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition font-bold"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowInlineAddNPC(null);
                    resetNPCForm();
                  }}
                  className="flex-1 px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Existing NPC Panel */}
      {showAddExistingNPC && (
        <div
          style={{
            position: 'fixed',
            top: `${addExistingNPCPos.top}px`,
            left: `${addExistingNPCPos.left + 160}px`,
            backgroundColor: '#d1d5db',
            padding: '12px',
            borderRadius: '6px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            minWidth: '400px',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <div className="bg-white rounded-lg p-4 flex flex-col" style={{ maxHeight: 'none' }}>
            <h4 className="font-bold text-gray-800 mb-3 text-sm">Add Existing NPC</h4>

            {/* NPC Selection Dropdown */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">Select NPC</label>
              <select
                value={selectedExistingNPC?.id || ''}
                onChange={(e) => {
                  const npc = existingNPCsList.find(n => n.id === parseInt(e.target.value, 10));
                  setSelectedExistingNPC(npc || null);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Select an NPC --</option>
                {existingNPCsList.map((npc) => (
                  <option key={npc.id} value={npc.id}>
                    {npc.Name} {npc.races ? `(${npc.races.name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* NPC Preview - Scrollable */}
            {selectedExistingNPC && (
              <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-300 text-xs space-y-2 overflow-y-auto" style={{ maxHeight: '300px' }}>
                <div>
                  <span className="font-semibold text-gray-800">{selectedExistingNPC.Name}</span>
                  {selectedExistingNPC.races && <span className="text-gray-600 ml-2">({selectedExistingNPC.races.name})</span>}
                </div>

                {selectedExistingNPC.Description && (
                  <div className="text-gray-700 whitespace-pre-wrap break-words">{selectedExistingNPC.Description}</div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-semibold">Brawn:</span> {selectedExistingNPC.Brawn ?? '-'}
                  </div>
                  <div>
                    <span className="font-semibold">Cunning:</span> {selectedExistingNPC.Cunning ?? '-'}
                  </div>
                  <div>
                    <span className="font-semibold">Presence:</span> {selectedExistingNPC.Presence ?? '-'}
                  </div>
                  <div>
                    <span className="font-semibold">Agility:</span> {selectedExistingNPC.Agility ?? '-'}
                  </div>
                  <div>
                    <span className="font-semibold">Intellect:</span> {selectedExistingNPC.Intellect ?? '-'}
                  </div>
                  <div>
                    <span className="font-semibold">Willpower:</span> {selectedExistingNPC.Willpower ?? '-'}
                  </div>
                  <div>
                    <span className="font-semibold">Soak:</span> {selectedExistingNPC.Soak ?? '-'}
                  </div>
                  <div>
                    <span className="font-semibold">Wound:</span> {selectedExistingNPC.Wound ?? '-'}
                  </div>
                  <div>
                    <span className="font-semibold">Strain:</span> {selectedExistingNPC.Strain ?? '-'}
                  </div>
                </div>

                {selectedExistingNPC.Skills && selectedExistingNPC.Skills.trim() && (
                  <div>
                    <span className="font-semibold">Skills:</span> {selectedExistingNPC.Skills}
                  </div>
                )}

                {selectedExistingNPC.Abilities && selectedExistingNPC.Abilities.trim() && (
                  <div>
                    <span className="font-semibold">Abilities:</span> {selectedExistingNPC.Abilities}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons - Right under dropdown */}
            <div className="flex gap-2 pt-2 border-t border-gray-300">
              <button
                onClick={async () => {
                  if (!selectedExistingNPC) {
                    alert('Please select an NPC');
                    return;
                  }

                  try {
                    // Get the current Part_of_Place value
                    const currentPartOfPlace = selectedExistingNPC.Part_of_Place || '';

                    // Append the new place ID with comma separation
                    const newPartOfPlace = currentPartOfPlace
                      ? `${currentPartOfPlace},${showAddExistingNPC}`
                      : String(showAddExistingNPC);

                    // Update the NPC's Part_of_Place field
                    const { error: updateError } = await supabase
                      .from('SW_campaign_NPC')
                      .update({ Part_of_Place: newPartOfPlace })
                      .eq('id', selectedExistingNPC.id);

                    if (updateError) throw updateError;

                    alert('NPC added successfully!');
                    setShowAddExistingNPC(null);
                    setSelectedExistingNPC(null);
                    await loadNPCs();
                    await loadExistingNPCsForPlayer();
                  } catch (err) {
                    alert('Error adding NPC: ' + err.message);
                  }
                }}
                className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition font-bold"
              >
                Add NPC
              </button>
              <button
                onClick={() => {
                  setShowAddExistingNPC(null);
                  setSelectedExistingNPC(null);
                }}
                className="flex-1 px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Existing Note Panel */}
      {showAddExistingNote && (
        <div
          style={{
            position: 'fixed',
            top: `${addExistingNotePos.top}px`,
            left: `${addExistingNotePos.left + 160}px`,
            backgroundColor: '#d1d5db',
            padding: '12px',
            borderRadius: '6px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            minWidth: '400px',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-bold text-gray-800 mb-3 text-sm">Add Existing Note</h4>

            {/* Note Selection Dropdown */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">Select Note</label>
              <select
                value={selectedExistingNote?.id || ''}
                onChange={(e) => {
                  const note = existingNotesList.find(n => n.id === parseInt(e.target.value, 10));
                  setSelectedExistingNote(note || null);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Select a Note --</option>
                {existingNotesList.map((note) => (
                  <option key={note.id} value={note.id}>
                    {note.Place_Name}
                  </option>
                ))}
              </select>
            </div>

            {/* Note Preview */}
            {selectedExistingNote && (
              <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-300 text-xs space-y-2">
                <div>
                  <span className="font-semibold text-gray-800">{selectedExistingNote.Place_Name}</span>
                </div>

                {selectedExistingNote.Description && (
                  <div className="text-gray-700 whitespace-pre-wrap break-words">{selectedExistingNote.Description}</div>
                )}

                {selectedExistingNote.PictureID && (
                  <div className="text-gray-600">
                    <span className="font-semibold">Picture ID:</span> {selectedExistingNote.PictureID}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!selectedExistingNote) {
                    alert('Please select a note');
                    return;
                  }

                  try {
                    // Get the current Part_of_Place value from the note
                    const currentPartOfPlace = selectedExistingNote.Part_of_Place || '';

                    // Append the current place ID with comma separation
                    const newPartOfPlace = currentPartOfPlace
                      ? `${currentPartOfPlace},${showAddExistingNote}`
                      : String(showAddExistingNote);

                    // Update the note's Part_of_Place field
                    const { error: updateError } = await supabase
                      .from('SW_campaign_notes')
                      .update({ Part_of_Place: newPartOfPlace })
                      .eq('id', selectedExistingNote.id);

                    if (updateError) throw updateError;

                    alert('Note added successfully!');
                    setShowAddExistingNote(null);
                    setSelectedExistingNote(null);
                    await loadPlaces();
                    await loadExistingNotesForCampaign();
                  } catch (err) {
                    alert('Error adding note: ' + err.message);
                  }
                }}
                className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition font-bold"
              >
                Add Note
              </button>
              <button
                onClick={() => {
                  setShowAddExistingNote(null);
                  setSelectedExistingNote(null);
                }}
                className="flex-1 px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown Menu - Rendered at root level to avoid overflow clipping */}
      {showDropdown && selectedHierarchy.find(p => p.id === showDropdown) && (
        <div
          className="fixed bg-white border border-gray-300 rounded shadow-lg z-50 w-40"
          style={{
            top: `${dropdownPos.top}px`,
            left: `${dropdownPos.left}px`,
          }}
        >
          {(() => {
            const place = selectedHierarchy.find(p => p.id === showDropdown);
            if (!place) return null;

            // Get the parent place name if it exists
            const currentPlaceIndex = selectedHierarchy.findIndex(p => p.id === place.id);
            const parentPlace = currentPlaceIndex > 0 ? selectedHierarchy[currentPlaceIndex - 1] : null;

            return (
              <>
                <button
                  onClick={() => handleEditPlace(place)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-blue-50 transition"
                >
                  Edit
                </button>
                {canUploadPictures() && (
                  <button
                    onClick={() => handleUploadPicture(place)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-blue-50 transition border-t border-gray-300"
                  >
                    Upload Picture
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowInlineAddNote(place.id);
                    setInlinePlaceName('');
                    setInlineDescription('');
                    setShowDropdown(null);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-blue-50 transition border-t border-gray-300"
                >
                  Add Note
                </button>
                <button
                  onClick={() => {
                    setShowInlineAddNPC(place.id);
                    setShowDropdown(null);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-purple-50 transition border-t border-gray-300"
                >
                  Add NPC
                </button>
                <button
                  onClick={async (e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setAddExistingNPCPos({
                      top: rect.bottom + window.scrollY,
                      left: rect.left + window.scrollX,
                    });
                    setShowAddExistingNPC(place.id);
                    setSelectedExistingNPC(null);
                    setShowDropdown(null);
                    await loadExistingNPCsForPlayer();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-purple-50 transition border-t border-gray-300"
                >
                  Add Existing NPC
                </button>
                <button
                  onClick={async (e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setAddExistingNotePos({
                      top: rect.bottom + window.scrollY,
                      left: rect.left + window.scrollX,
                    });
                    setShowAddExistingNote(place.id);
                    setSelectedExistingNote(null);
                    setShowDropdown(null);
                    await loadExistingNotesForCampaign();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-blue-50 transition border-t border-gray-300"
                >
                  Add Existing Note
                </button>
                {parentPlace && (
                  <button
                    onClick={async () => {
                      try {
                        // Get the parent place ID (the one before the current place in the hierarchy)
                        const currentPlaceIndex = selectedHierarchy.findIndex(p => p.id === place.id);

                        if (currentPlaceIndex <= 0) {
                          alert('This is a top-level place and cannot be removed from a parent');
                          return;
                        }

                        const parentPlaceId = selectedHierarchy[currentPlaceIndex - 1].id;
                        const parentPlace = selectedHierarchy[currentPlaceIndex - 1];

                        // Ask for confirmation
                        if (!window.confirm(`Are you sure you want to remove "${place.Place_Name}" from "${parentPlace.Place_Name}"?`)) {
                          return;
                        }

                        // Get the current Part_of_Place value
                        const currentPartOfPlace = place.Part_of_Place || '';

                        console.log('Current place.id:', place.id);
                        console.log('Parent place ID to remove:', parentPlaceId);
                        console.log('Current Part_of_Place:', currentPartOfPlace, 'type:', typeof currentPartOfPlace);

                        if (!currentPartOfPlace) {
                          alert('This note is not part of any place');
                          return;
                        }

                        // Split the comma-separated IDs and filter out the parent place ID
                        const placeIds = currentPartOfPlace.toString().split(',').map(id => parseInt(id.trim(), 10));
                        console.log('Parsed placeIds:', placeIds);

                        const updatedPlaceIds = placeIds.filter(id => id !== parentPlaceId);
                        console.log('Updated placeIds after filter:', updatedPlaceIds);

                        // Create the new Part_of_Place value
                        const newPartOfPlace = updatedPlaceIds.length > 0 ? updatedPlaceIds.join(',') : null;
                        console.log('New Part_of_Place to set:', newPartOfPlace);

                        // Update the note's Part_of_Place field
                        const { error: updateError } = await supabase
                          .from('SW_campaign_notes')
                          .update({ Part_of_Place: newPartOfPlace })
                          .eq('id', place.id);

                        if (updateError) throw updateError;

                        alert('Note removed from place successfully!');
                        setShowDropdown(null);
                        await loadPlaces();
                      } catch (err) {
                        alert('Error removing note from place: ' + err.message);
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition border-t border-gray-300"
                  >
                    Remove from {parentPlace.Place_Name}
                  </button>
                )}
                <button
                  onClick={() => {
                    setDeleteConfirmation(place.id);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition border-t border-gray-300"
                >
                  Delete
                </button>
              </>
            );
          })()}
        </div>
      )}
      {/* Dice Pool Popup - MATCH SWCharacterOverview */}
      {dicePopup && (
        <DicePoolPopup
          dicePopup={dicePopup}
          setDicePopup={setDicePopup}
          selectedNPC={selectedNPC}
        />
      )}

    // DicePoolPopup component (copied and adapted from SWCharacterOverview)
    </div>
  );
}
