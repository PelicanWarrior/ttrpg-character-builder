import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const parseCsv = (value) => String(value || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

export default function UnifiedTTRPGAdmin() {
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [availableCustomTtrpgs, setAvailableCustomTtrpgs] = useState([]);

  const [existingClasses, setExistingClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('__new__');
  const [selectedClassTtrpgIds, setSelectedClassTtrpgIds] = useState([]);
  const [className, setClassName] = useState('');
  const [classDescription, setClassDescription] = useState('');
  const [savingClass, setSavingClass] = useState(false);

  const [existingFields, setExistingFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState('__new__');
  const [selectedFieldTtrpgIds, setSelectedFieldTtrpgIds] = useState([]);
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [fieldOptions, setFieldOptions] = useState('');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldOrder, setFieldOrder] = useState('0');
  const [fieldDescription, setFieldDescription] = useState('');
  const [savingField, setSavingField] = useState(false);

  const ttrpgNameById = useMemo(() => {
    const map = new Map();
    availableCustomTtrpgs.forEach((row) => map.set(row.id, row.TTRPG_name));
    return map;
  }, [availableCustomTtrpgs]);

  const ttrpgNamesToIds = (namesValue) => {
    const names = parseCsv(namesValue);
    return names
      .map((name) => availableCustomTtrpgs.find((row) => row.TTRPG_name === name)?.id)
      .filter((id) => id != null);
  };

  const selectedTtrpgIdsToNames = (ids) => ids
    .map((id) => ttrpgNameById.get(id))
    .filter(Boolean)
    .join(',');

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const resetClassForm = () => {
    setSelectedClassId('__new__');
    setSelectedClassTtrpgIds([]);
    setClassName('');
    setClassDescription('');
  };

  const resetFieldForm = () => {
    setSelectedFieldId('__new__');
    setSelectedFieldTtrpgIds([]);
    setFieldName('');
    setFieldType('text');
    setFieldOptions('');
    setFieldRequired(false);
    setFieldOrder('0');
    setFieldDescription('');
  };

  const loadCustomSystems = async () => {
    const { data, error: loadError } = await supabase
      .from('TTRPGs')
      .select('id, TTRPG_name')
      .eq('Custom_System', true)
      .order('TTRPG_name');

    if (loadError) throw loadError;
    setAvailableCustomTtrpgs(data || []);
  };

  const loadClasses = async () => {
    const { data, error: loadError } = await supabase
      .from('WWW_Classes')
      .select('id, ClassName, Description, TTRPGs')
      .order('ClassName');

    if (loadError) throw loadError;
    setExistingClasses(data || []);
  };

  const loadFields = async () => {
    const { data, error: loadError } = await supabase
      .from('WWW_CustomFields')
      .select('id, FieldName, FieldType, FieldOptions, Required, DisplayOrder, Description, TTRPGs')
      .order('DisplayOrder', { ascending: true })
      .order('FieldName', { ascending: true });

    if (loadError) throw loadError;
    setExistingFields(data || []);
  };

  useEffect(() => {
    const loadAll = async () => {
      clearMessages();
      try {
        await Promise.all([loadCustomSystems(), loadClasses(), loadFields()]);
      } catch (err) {
        console.error('Failed to load WWW admin data:', err);
        setError('Failed to load WWW settings. Run the WWW migration if needed.');
      }
    };

    loadAll();
  }, []);

  const handleClassSelect = (value) => {
    setSelectedClassId(value);
    clearMessages();

    if (value === '__new__') {
      resetClassForm();
      return;
    }

    const selected = existingClasses.find((row) => String(row.id) === String(value));
    if (!selected) return;

    setClassName(selected.ClassName || '');
    setClassDescription(selected.Description || '');
    setSelectedClassTtrpgIds(ttrpgNamesToIds(selected.TTRPGs));
  };

  const handleFieldSelect = (value) => {
    setSelectedFieldId(value);
    clearMessages();

    if (value === '__new__') {
      resetFieldForm();
      return;
    }

    const selected = existingFields.find((row) => String(row.id) === String(value));
    if (!selected) return;

    setFieldName(selected.FieldName || '');
    setFieldType(selected.FieldType || 'text');
    setFieldOptions(selected.FieldOptions || '');
    setFieldRequired(Boolean(selected.Required));
    setFieldOrder(String(selected.DisplayOrder ?? 0));
    setFieldDescription(selected.Description || '');
    setSelectedFieldTtrpgIds(ttrpgNamesToIds(selected.TTRPGs));
  };

  const handleSaveClass = async () => {
    clearMessages();
    if (!className.trim()) {
      setError('Class name is required.');
      return;
    }

    setSavingClass(true);
    try {
      const payload = {
        ClassName: className.trim(),
        Description: classDescription.trim(),
        TTRPGs: selectedTtrpgIdsToNames(selectedClassTtrpgIds),
      };

      if (selectedClassId === '__new__') {
        const { error: insertError } = await supabase.from('WWW_Classes').insert([payload]);
        if (insertError) throw insertError;
      } else {
        const { error: updateError } = await supabase
          .from('WWW_Classes')
          .update(payload)
          .eq('id', selectedClassId);
        if (updateError) throw updateError;
      }

      await loadClasses();
      resetClassForm();
      setSuccess('WWW class saved.');
    } catch (err) {
      console.error('Failed to save WWW class:', err);
      setError('Failed to save WWW class.');
    } finally {
      setSavingClass(false);
    }
  };

  const handleDeleteClass = async () => {
    clearMessages();
    if (selectedClassId === '__new__') return;
    if (!confirm('Delete this class?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('WWW_Classes')
        .delete()
        .eq('id', selectedClassId);
      if (deleteError) throw deleteError;

      await loadClasses();
      resetClassForm();
      setSuccess('WWW class deleted.');
    } catch (err) {
      console.error('Failed to delete WWW class:', err);
      setError('Failed to delete WWW class. It may be referenced by characters.');
    }
  };

  const handleSaveField = async () => {
    clearMessages();
    if (!fieldName.trim()) {
      setError('Field name is required.');
      return;
    }

    setSavingField(true);
    try {
      const payload = {
        FieldName: fieldName.trim(),
        FieldType: fieldType,
        FieldOptions: fieldType === 'select' ? fieldOptions.trim() : null,
        Required: fieldRequired,
        DisplayOrder: Number.isNaN(Number(fieldOrder)) ? 0 : Number(fieldOrder),
        Description: fieldDescription.trim(),
        TTRPGs: selectedTtrpgIdsToNames(selectedFieldTtrpgIds),
      };

      if (selectedFieldId === '__new__') {
        const { error: insertError } = await supabase.from('WWW_CustomFields').insert([payload]);
        if (insertError) throw insertError;
      } else {
        const { error: updateError } = await supabase
          .from('WWW_CustomFields')
          .update(payload)
          .eq('id', selectedFieldId);
        if (updateError) throw updateError;
      }

      await loadFields();
      resetFieldForm();
      setSuccess('WWW custom field saved.');
    } catch (err) {
      console.error('Failed to save WWW custom field:', err);
      setError('Failed to save WWW custom field.');
    } finally {
      setSavingField(false);
    }
  };

  const handleDeleteField = async () => {
    clearMessages();
    if (selectedFieldId === '__new__') return;
    if (!confirm('Delete this custom field?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('WWW_CustomFields')
        .delete()
        .eq('id', selectedFieldId);
      if (deleteError) throw deleteError;

      await loadFields();
      resetFieldForm();
      setSuccess('WWW custom field deleted.');
    } catch (err) {
      console.error('Failed to delete WWW custom field:', err);
      setError('Failed to delete WWW custom field.');
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="mx-auto w-full max-w-5xl rounded-xl border border-gray-300 bg-gray-50 p-6 shadow">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">World Wide Wrestling Admin</h1>
          <button
            onClick={() => navigate('/settings')}
            className="rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-800"
          >
            Back to Settings
          </button>
        </div>

        {error && <p className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {success && <p className="mb-3 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded border border-gray-300 bg-white p-4">
            <h2 className="mb-3 text-xl font-semibold">WWW Classes</h2>

            <label className="mb-2 block text-sm font-medium text-gray-700">Existing Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassSelect(e.target.value)}
              className="mb-3 w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="__new__">-- Create New Class --</option>
              {existingClasses.map((row) => (
                <option key={row.id} value={String(row.id)}>{row.ClassName}</option>
              ))}
            </select>

            <label className="mb-2 block text-sm font-medium text-gray-700">Applicable TTRPGs</label>
            <select
              multiple
              value={selectedClassTtrpgIds.map(String)}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map((option) => Number(option.value));
                setSelectedClassTtrpgIds(selected.filter((value) => !Number.isNaN(value)));
              }}
              className="mb-3 w-full rounded border border-gray-300 px-3 py-2"
              size={Math.min(Math.max(availableCustomTtrpgs.length, 3), 6)}
            >
              {availableCustomTtrpgs.map((row) => (
                <option key={row.id} value={String(row.id)}>{row.TTRPG_name}</option>
              ))}
            </select>

            <label className="mb-2 block text-sm font-medium text-gray-700">Class Name</label>
            <input
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="mb-3 w-full rounded border border-gray-300 px-3 py-2"
              placeholder="e.g. Technician"
            />

            <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={classDescription}
              onChange={(e) => setClassDescription(e.target.value)}
              className="mb-3 w-full rounded border border-gray-300 px-3 py-2"
              rows={4}
            />

            <div className="flex gap-2">
              <button
                onClick={handleSaveClass}
                disabled={savingClass}
                className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-60"
              >
                {savingClass ? 'Saving...' : 'Save Class'}
              </button>
              {selectedClassId !== '__new__' && (
                <button
                  onClick={handleDeleteClass}
                  className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                  Delete
                </button>
              )}
              <button
                onClick={resetClassForm}
                className="rounded bg-gray-400 px-4 py-2 text-white hover:bg-gray-500"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="rounded border border-gray-300 bg-white p-4">
            <h2 className="mb-3 text-xl font-semibold">WWW Custom Fields</h2>

            <label className="mb-2 block text-sm font-medium text-gray-700">Existing Field</label>
            <select
              value={selectedFieldId}
              onChange={(e) => handleFieldSelect(e.target.value)}
              className="mb-3 w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="__new__">-- Create New Field --</option>
              {existingFields.map((row) => (
                <option key={row.id} value={String(row.id)}>{row.FieldName}</option>
              ))}
            </select>

            <label className="mb-2 block text-sm font-medium text-gray-700">Applicable TTRPGs</label>
            <select
              multiple
              value={selectedFieldTtrpgIds.map(String)}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map((option) => Number(option.value));
                setSelectedFieldTtrpgIds(selected.filter((value) => !Number.isNaN(value)));
              }}
              className="mb-3 w-full rounded border border-gray-300 px-3 py-2"
              size={Math.min(Math.max(availableCustomTtrpgs.length, 3), 6)}
            >
              {availableCustomTtrpgs.map((row) => (
                <option key={row.id} value={String(row.id)}>{row.TTRPG_name}</option>
              ))}
            </select>

            <label className="mb-2 block text-sm font-medium text-gray-700">Field Name</label>
            <input
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              className="mb-3 w-full rounded border border-gray-300 px-3 py-2"
              placeholder="e.g. Signature Move"
            />

            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Field Type</label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2"
                >
                  <option value="text">Text</option>
                  <option value="textarea">Long Text</option>
                  <option value="number">Number</option>
                  <option value="select">Dropdown</option>
                  <option value="checkbox">Checkbox</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Display Order</label>
                <input
                  value={fieldOrder}
                  onChange={(e) => setFieldOrder(e.target.value)}
                  type="number"
                  className="w-full rounded border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            <label className="mb-2 block text-sm font-medium text-gray-700">Dropdown Options (comma-separated)</label>
            <input
              value={fieldOptions}
              onChange={(e) => setFieldOptions(e.target.value)}
              className="mb-3 w-full rounded border border-gray-300 px-3 py-2"
              placeholder="Only used for Dropdown"
            />

            <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={fieldDescription}
              onChange={(e) => setFieldDescription(e.target.value)}
              className="mb-3 w-full rounded border border-gray-300 px-3 py-2"
              rows={3}
            />

            <label className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={fieldRequired}
                onChange={(e) => setFieldRequired(e.target.checked)}
              />
              Required field
            </label>

            <div className="flex gap-2">
              <button
                onClick={handleSaveField}
                disabled={savingField}
                className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-60"
              >
                {savingField ? 'Saving...' : 'Save Field'}
              </button>
              {selectedFieldId !== '__new__' && (
                <button
                  onClick={handleDeleteField}
                  className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                  Delete
                </button>
              )}
              <button
                onClick={resetFieldForm}
                className="rounded bg-gray-400 px-4 py-2 text-white hover:bg-gray-500"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
