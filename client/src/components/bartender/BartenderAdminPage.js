import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navigation from './Navigation';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const BartenderAdminPage = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // State for reset password
  const [resetForm, setResetForm] = useState({
    userId: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [bartenders, setBartenders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Check if user is bartender
  useEffect(() => {
    if (!user || user.role !== 'BARTENDER') {
      navigate('/bartender/login');
    }
  }, [user, navigate]);

  const showMessage = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setMessage(null);
    } else {
      setMessage(msg);
      setError(null);
    }
    setTimeout(() => {
      setMessage(null);
      setError(null);
    }, 5000);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!resetForm.userId) {
      showMessage('Please select a bartender', true);
      return;
    }

    if (resetForm.newPassword !== resetForm.confirmPassword) {
      showMessage('Passwords do not match', true);
      return;
    }

    if (resetForm.newPassword.length < 8) {
      showMessage('Password must be at least 8 characters', true);
      return;
    }

    setLoading(true);

    try {
      await axios.put(
        `${API_URL}/api/auth/password`,
        {
          userId: user.id,
		  currentPassword: resetForm.oldPassword,
          newPassword: resetForm.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showMessage(`✅ Password reset for ${user?.name}`);
      setResetForm({ userId: '', newPassword: '', confirmPassword: '' });
      logout();
      setTimeout(() => {
        navigate('/bartender/login');
      }, 1500);
    } catch (err) {
      showMessage(err.response?.data?.error || 'Failed to reset password', true);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'BARTENDER') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Management</h1>
          <p className="text-gray-600 mt-2">Manage password</p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            ❌ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Reset Password Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🔑 Reset Password</h2>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={resetForm.oldPassword}
                  onChange={(e) => setResetForm({ ...resetForm, oldPassword: e.target.value })}
                  placeholder="Current password..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
			  
			  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={resetForm.newPassword}
                  onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={resetForm.confirmPassword}
                  onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                  placeholder="Confirm password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !resetForm.userId}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 transition"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600">
                <strong>ℹ️ Note:</strong> Resetting a password will immediately change your login credentials. You will have to log back in again.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BartenderAdminPage;