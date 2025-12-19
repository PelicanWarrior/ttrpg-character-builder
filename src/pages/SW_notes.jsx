import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { DragHandle } from '../assets/DragHandle';

export default function SWNotes() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  const campaignName = decodeURIComponent(searchParams.get('campaignName') || '');

  const [showAddPlaceForm, setShowAddPlaceForm] = useState(false);
  const [showAddNPCForm, setShowAddNPCForm] = useState(false);
  const [placeName, setPlaceName] = useState('');
  const [description, setDescription] = useState('');
  const [partOfPlace, setPartOfPlace] = useState('');
  const [existingPlaces, setExistingPlaces] = useState([]);
  const [topLevelPlaces, setTopLevelPlaces] = useState([]);
  const [selectedHierarchy, setSelectedHierarchy] = useState([]); // Array of place objects going down
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState([]); // Notes with Order column
  const [draggedNote, setDraggedNote] = useState(null);
  const [editingPlaceId, setEditingPlaceId] = useState(null);
  const [editingPlaceData, setEditingPlaceData] = useState({});
  const [showDropdown, setShowDropdown] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [uploadingPictureId, setUploadingPictureId] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(null);

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
  const [npcPlaceId, setNpcPlaceId] = useState('');

  // Lookup lists
  const [raceList, setRaceList] = useState([]);
  const [skillsList, setSkillsList] = useState([]);
  const [abilitiesList, setAbilitiesList] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);

  // Selected multi-selects
  const [selectedSkills, setSelectedSkills] = useState([]); // names
  const [selectedAbilities, setSelectedAbilities] = useState([]); // abilities strings
  const [selectedEquipment, setSelectedEquipment] = useState([]); // names

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('SW_campaign_notes')
        .select('id, Place_Name, Order')
        .eq('CampaignID', campaignId)
        .is('Part_of_Place', null)
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
    }
  }, [campaignId]);

  // Load lookups when opening Add NPC
  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [racesRes, skillsRes, abilitiesRes, equipmentRes] = await Promise.all([
          supabase.from('races').select('id, name').order('name', { ascending: true }),
          supabase.from('skills').select('id, name').order('name'),
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

    if (showAddNPCForm) {
      loadLookups();
    }
  }, [showAddNPCForm]);

  const loadPlaces = async () => {
    try {
      const { data, error } = await supabase
        .from('SW_campaign_notes')
        .select('id, Place_Name, Description, Part_of_Place, Order, PictureID')
        .eq('CampaignID', campaignId)
        .order('Order', { ascending: true });
      if (error) throw error;

      setExistingPlaces(data || []);

      // Filter top-level places (Part_of_Place is null)
      const topLevel = (data || []).filter(p => !p.Part_of_Place);
      setTopLevelPlaces(topLevel);
    } catch (err) {
      console.error('Failed to load places:', err);
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
      // Swap the Order values
      const draggedOrder = draggedNote.Order;
      const targetOrder = targetPlace.Order;

      console.log(`Swapping: ${draggedNote.Place_Name} (Order: ${draggedOrder}) with ${targetPlace.Place_Name} (Order: ${targetOrder})`);

      // Update both places in the database
      await Promise.all([
        supabase
          .from('SW_campaign_notes')
          .update({ Order: targetOrder })
          .eq('id', draggedNote.id),
        supabase
          .from('SW_campaign_notes')
          .update({ Order: draggedOrder })
          .eq('id', targetPlace.id),
      ]);

      // Reload places to reflect changes
      await loadPlaces();
      setDraggedNote(null);
    } catch (err) {
      console.error('Failed to reorder places:', err);
      alert('Failed to reorder places');
    }
  };

  const handleSelectTopLevel = (place) => {
    // Start a new hierarchy path from this top-level place
    setSelectedHierarchy([place]);
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
      await loadPlaces();
    } catch (err) {
      console.error('Failed to save place:', err);
      alert('Failed to save place: ' + err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingPlaceId(null);
    setEditingPlaceData({});
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

        const uploadResponse = await fetch('/SW_Pictures/api/upload-picture', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          alert('Failed to upload picture: ' + (errorData.error || uploadResponse.statusText));
          return;
        }

        const result = await uploadResponse.json();
        console.log('Picture uploaded successfully:', result);

        alert('Picture uploaded successfully!');
        setShowDropdown(null);
        await loadPlaces();
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
  };

  const handleBackPanel = () => {
    // Remove the last item from hierarchy
    setSelectedHierarchy(selectedHierarchy.slice(0, -1));
  };

  const getChildPlaces = (parentId) => {
    return existingPlaces.filter(p => p.Part_of_Place === parentId);
  };

  const handleSavePlace = async () => {
    if (!placeName.trim()) {
      alert('Place Name is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        Place_Name: placeName.trim(),
        Description: description.trim(),
        Part_of_Place: partOfPlace ? parseInt(partOfPlace, 10) : null,
        CampaignID: parseInt(campaignId, 10),
      };

      const { error } = await supabase
        .from('SW_campaign_notes')
        .insert([payload]);

      if (error) {
        console.error('Error saving place:', error);
        alert('Failed to save place: ' + error.message);
        return;
      }

      alert('Place saved successfully!');
      setPlaceName('');
      setDescription('');
      setPartOfPlace('');
      setShowAddPlaceForm(false);
      await loadPlaces();
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
    setNpcPlaceId('');
    setSelectedSkills([]);
    setSelectedAbilities([]);
    setSelectedEquipment([]);
  };

  const addToList = (value, list, setter) => {
    if (!value) return;
    if (list.includes(value)) return;
    setter([...list, value]);
  };

  const removeFromList = (value, list, setter) => {
    setter(list.filter((v) => v !== value));
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
      resetNPCForm();
      setShowAddNPCForm(false);
    } catch (err) {
      console.error('Error saving NPC:', err);
      alert('Failed to save NPC');
    } finally {
      setSaving(false);
    }
  };

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
            onClick={() => setShowAddPlaceForm(true)}
            className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition font-bold"
          >
            Add Note
          </button>
          <button
            onClick={() => setShowAddNPCForm(true)}
            className="px-6 py-3 bg-purple-600 text-white rounded hover:bg-purple-700 transition font-bold"
          >
            Add NPC
          </button>
        </div>
      </div>

      {showAddPlaceForm && (
        <div className="p-6 bg-gray-100 border-b border-gray-300">
          <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg border border-gray-300">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Add a Note</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Place Name</label>
                <input
                  type="text"
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Part of Place</label>
                <select
                  value={partOfPlace}
                  onChange={(e) => setPartOfPlace(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- None --</option>
                  {existingPlaces.map((place) => (
                    <option key={place.id} value={place.id}>{place.Place_Name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSavePlace}
                  disabled={saving}
                  className="flex-1 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-bold disabled:opacity-60"
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
                  className="flex-1 px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition font-bold"
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
            <h3 className="text-xl font-bold mb-4 text-gray-800">Add NPC</h3>
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
                      <option key={s.id} value={s.name}>{s.name}</option>
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
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedSkills.map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded">
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
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedAbilities.map((a) => (
                      <span key={a} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded">
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
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedEquipment.map((e) => (
                      <span key={e} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded">
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
          {topLevelPlaces.length > 0 ? (
            <div className="space-y-1">
              {topLevelPlaces.map((place) => (
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

              {/* Dropdown Menu - Positioned outside the scrollable container */}
              {showDropdown === place.id && (
                <div
                  className="fixed bg-white border border-gray-300 rounded shadow-lg z-50 w-40"
                  style={{
                    top: `${dropdownPos.top}px`,
                    left: `${dropdownPos.left}px`,
                  }}
                >
                  <button
                    onClick={() => handleEditPlace(place)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-blue-50 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleUploadPicture(place)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-blue-50 transition border-t border-gray-300"
                  >
                    Upload Picture
                  </button>
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
                      <button
                        key={child.id}
                        onClick={() => handleSelectPlace(child, index)}
                        className="w-full text-left px-2 py-1 rounded text-sm bg-blue-50 text-gray-800 hover:bg-blue-100 border border-blue-300 transition truncate"
                      >
                        {child.Place_Name}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-xs italic">No notes</p>
              )}
              </div>

              {/* Picture Box - Only show if this is the last item in hierarchy and has a picture */}
              {index === selectedHierarchy.length - 1 && place.PictureID && (
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
      </div>
    </div>
  );
}
