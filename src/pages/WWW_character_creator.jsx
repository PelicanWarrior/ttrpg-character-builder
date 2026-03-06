import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const parseCsv = (value) => String(value || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const matchesMod = (rowValue, modName) => {
  const mod = String(modName || '').trim().toLowerCase();
  if (!mod) return true;

  const entries = parseCsv(rowValue).map((entry) => entry.toLowerCase());
  if (entries.length === 0) {
    const raw = String(rowValue || '').trim().toLowerCase();
    return raw ? raw.includes(mod) : true;
  }
  return entries.includes(mod);
};

export default function WWWCharacterCreator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modName = searchParams.get('mod') || 'World Wide Wrestling';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [ttrpgId, setTtrpgId] = useState(null);
  const [characterName, setCharacterName] = useState('');
  const [classRows, setClassRows] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [customFields, setCustomFields] = useState([]);
  const [customValues, setCustomValues] = useState({});
  const [notes, setNotes] = useState('');

  const selectedClass = useMemo(
    () => classRows.find((row) => String(row.id) === String(selectedClassId)),
    [classRows, selectedClassId]
  );

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError('');
      setSuccess('');

      try {
        const { data: ttrpgData, error: ttrpgError } = await supabase
          .from('TTRPGs')
          .select('id')
          .eq('TTRPG_name', modName)
          .maybeSingle();

        if (ttrpgError) throw ttrpgError;
        setTtrpgId(ttrpgData?.id ?? null);

        const [classResult, fieldResult] = await Promise.all([
          supabase
            .from('WWW_Classes')
            .select('id, ClassName, Description, TTRPGs')
            .order('ClassName'),
          supabase
            .from('WWW_CustomFields')
            .select('id, FieldName, FieldType, FieldOptions, Required, DisplayOrder, Description, TTRPGs')
            .order('DisplayOrder', { ascending: true })
            .order('FieldName', { ascending: true }),
        ]);

        if (classResult.error) throw classResult.error;
        if (fieldResult.error) throw fieldResult.error;

        const filteredClasses = (classResult.data || []).filter((row) => matchesMod(row.TTRPGs, modName));
        const filteredFields = (fieldResult.data || []).filter((row) => matchesMod(row.TTRPGs, modName));

        setClassRows(filteredClasses);
        setCustomFields(filteredFields);

        const loadedCharacterId = localStorage.getItem('loadedCharacterId');
        if (loadedCharacterId) {
          const { data: characterData, error: characterError } = await supabase
            .from('WWW_player_characters')
            .select('id, name, class_id, custom_values, notes')
            .eq('id', Number(loadedCharacterId))
            .maybeSingle();

          if (!characterError && characterData) {
            setCharacterName(characterData.name || '');
            setSelectedClassId(characterData.class_id ? String(characterData.class_id) : '');
            setNotes(characterData.notes || '');
            setCustomValues(characterData.custom_values && typeof characterData.custom_values === 'object'
              ? characterData.custom_values
              : {});
          }
        }
      } catch (err) {
        console.error('Failed to initialize WWW character creator:', err);
        setError('Failed to load World Wide Wrestling creator data. Run the WWW migration in SQL if needed.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [modName]);

  const setFieldValue = (fieldId, value) => {
    setCustomValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const saveCharacter = async () => {
    setError('');
    setSuccess('');

    if (!characterName.trim()) {
      setError('Character name is required.');
      return;
    }

    for (const field of customFields) {
      if (!field.Required) continue;
      const value = customValues[field.id];
      const isEmpty = value == null || value === '' || value === false;
      if (isEmpty) {
        setError(`Required field missing: ${field.FieldName}`);
        return;
      }
    }

    const payload = {
      name: characterName.trim(),
      class_id: selectedClass ? selectedClass.id : null,
      class_name: selectedClass ? selectedClass.ClassName : null,
      custom_values: customValues,
      notes,
      TTRPG: ttrpgId,
      User_ID: localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null,
    };

    try {
      const loadedCharacterId = localStorage.getItem('loadedCharacterId');

      if (loadedCharacterId) {
        const { error: updateError } = await supabase
          .from('WWW_player_characters')
          .update(payload)
          .eq('id', Number(loadedCharacterId));
        if (updateError) throw updateError;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('WWW_player_characters')
          .insert([payload])
          .select('id')
          .single();
        if (insertError) throw insertError;

        if (inserted?.id != null) {
          localStorage.setItem('loadedCharacterId', String(inserted.id));
        }
      }

      setSuccess('Character saved successfully.');
    } catch (err) {
      console.error('Failed to save WWW character:', err);
      setError('Failed to save character. Ensure WWW_player_characters exists in Supabase.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto w-full max-w-4xl rounded-xl border border-gray-300 bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{modName} Character Creator</h1>
          <button
            onClick={() => navigate('/select-ttrpg')}
            className="rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-800"
          >
            Back
          </button>
        </div>

        {loading && <p className="text-sm text-gray-700">Loading creator data...</p>}
        {error && <p className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {success && <p className="mb-3 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>}

        {!loading && (
          <div className="space-y-4">
            <div className="rounded border border-gray-300 bg-gray-50 p-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Character Name</label>
              <input
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2"
                placeholder="Enter character name"
              />
            </div>

            <div className="rounded border border-gray-300 bg-gray-50 p-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2"
              >
                <option value="">-- Select Class --</option>
                {classRows.map((row) => (
                  <option key={row.id} value={String(row.id)}>{row.ClassName}</option>
                ))}
              </select>
              {selectedClass?.Description && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{selectedClass.Description}</p>
              )}
            </div>

            {customFields.length > 0 && (
              <div className="rounded border border-gray-300 bg-gray-50 p-4">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">Custom Fields</h2>
                <div className="space-y-3">
                  {customFields.map((field) => {
                    const value = customValues[field.id];
                    const options = parseCsv(field.FieldOptions);

                    return (
                      <div key={field.id}>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          {field.FieldName}
                          {field.Required ? ' *' : ''}
                        </label>

                        {field.FieldType === 'textarea' && (
                          <textarea
                            value={value || ''}
                            onChange={(e) => setFieldValue(field.id, e.target.value)}
                            rows={3}
                            className="w-full rounded border border-gray-300 px-3 py-2"
                          />
                        )}

                        {field.FieldType === 'number' && (
                          <input
                            type="number"
                            value={value ?? ''}
                            onChange={(e) => setFieldValue(field.id, e.target.value)}
                            className="w-full rounded border border-gray-300 px-3 py-2"
                          />
                        )}

                        {field.FieldType === 'select' && (
                          <select
                            value={value || ''}
                            onChange={(e) => setFieldValue(field.id, e.target.value)}
                            className="w-full rounded border border-gray-300 px-3 py-2"
                          >
                            <option value="">-- Select --</option>
                            {options.map((option) => (
                              <option key={`${field.id}-${option}`} value={option}>{option}</option>
                            ))}
                          </select>
                        )}

                        {field.FieldType === 'checkbox' && (
                          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={Boolean(value)}
                              onChange={(e) => setFieldValue(field.id, e.target.checked)}
                            />
                            Checked
                          </label>
                        )}

                        {(field.FieldType === 'text' || !['textarea', 'number', 'select', 'checkbox'].includes(field.FieldType)) && (
                          <input
                            value={value || ''}
                            onChange={(e) => setFieldValue(field.id, e.target.value)}
                            className="w-full rounded border border-gray-300 px-3 py-2"
                          />
                        )}

                        {field.Description && (
                          <p className="mt-1 text-xs text-gray-600">{field.Description}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="rounded border border-gray-300 bg-gray-50 p-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>

            <button
              onClick={saveCharacter}
              className="rounded bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700"
            >
              Save Character
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
