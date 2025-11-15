import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Adjust path as needed

export default function Settings() {
  const location = useLocation();
  const navigate = useNavigate();

  // -----------------------------------------------------------------
  // 1. Player ID (from navigation state) – only for console & DB
  // -----------------------------------------------------------------
  const playerId = location.state?.playerId;

  useEffect(() => {
    console.log('Player ID:', playerId ?? '—');
  }, [playerId]);

  // -----------------------------------------------------------------
  // 2. UI State
  // -----------------------------------------------------------------
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // For success message

  // -----------------------------------------------------------------
  // 3. Handlers
  // -----------------------------------------------------------------
  const handleChangePasswordClick = () => {
    setShowPasswordForm(true);
    setError('');
    setSuccess('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleApplyPassword = async () => {
    setError('');
    setSuccess('');

    // Validate match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate length
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!playerId) {
      setError('Player ID is missing. Cannot update password.');
      return;
    }

    try {
      // Update password in Supabase 'user' table
      const { data, error } = await supabase
        .from('user')
        .update({ password: newPassword }) // Warning: Store hashed passwords in production!
        .eq('id', playerId);

      if (error) throw error;

      // Success!
      setSuccess('Password changed');
      setShowPasswordForm(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password update failed:', err);
      setError('Failed to update password. Please try again.');
    }
  };

  const handleBack = () => {
    navigate('/select-ttrpg');
  };

  // -----------------------------------------------------------------
  // 4. Render
  // -----------------------------------------------------------------
  return (
    <div className="flex flex-col items-center min-h-screen bg-white py-10">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {/* Change Password Button */}
      {!showPasswordForm && (
        <button
          onClick={handleChangePasswordClick}
          className="mb-8 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Change Password
        </button>
      )}

      {/* Password Form */}
      {showPasswordForm && (
        <div className="w-3/4 max-w-md mb-8 space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter new password"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm new password"
            />
          </div>

          {/* Error Message */}
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* Success Message */}
          {success && <p className="text-green-600 text-sm font-medium">{success}</p>}

          {/* Apply Password Button */}
          <button
            onClick={handleApplyPassword}
            className="w-full px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Apply Password
          </button>
        </div>
      )}

      {/* Placeholder for future settings */}
      <div className="w-3/4 max-w-md text-center mb-8">
        <p className="text-gray-600">No other settings available yet.</p>
      </div>

      {/* Back Button */}
      <button
        onClick={handleBack}
        className="px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
      >
        Back
      </button>
    </div>
  );
}