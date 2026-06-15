import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navigation from '../bartender/Navigation';

import API_URL from '../../config/api';

const AdminPage = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // State for create admin
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // State for create bartender
  const [bartenderForm, setBartenderForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // State for reset password
  const [resetForm, setResetForm] = useState({
    userId: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [bartenders, setBartenders] = useState([]);
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Check if user is admin
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/bartender/login');
    }
  }, [user, navigate]);

  // Load bartenders and admins
  useEffect(() => {
    if (token) {
      loadUsers();
    }
  }, [token]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await axios.get(
        `${API_URL}/api/admin/users`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBartenders(response.data.users.filter(u => u.role === 'BARTENDER'));
      setAdminAccounts(response.data.users.filter(u => u.role === 'ADMIN'));
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

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

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!adminForm.name.trim()) {
      showMessage('Admin name is required', true);
      return;
    }

    if (!adminForm.email.trim()) {
      showMessage('Admin email is required', true);
      return;
    }

    if (adminForm.password !== adminForm.confirmPassword) {
      showMessage('Passwords do not match', true);
      return;
    }

    if (adminForm.password.length < 8) {
      showMessage('Password must be at least 8 characters', true);
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API_URL}/api/admin/create-admin`,
        {
          name: adminForm.name.trim(),
          email: adminForm.email.trim(),
          password: adminForm.password
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showMessage(`✅ Admin account created: ${adminForm.email}`);
      setAdminForm({ name: '', email: '', password: '', confirmPassword: '' });
      loadUsers();
    } catch (err) {
      showMessage(err.response?.data?.error || 'Failed to create admin account', true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBartender = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!bartenderForm.name.trim()) {
      showMessage('Bartender name is required', true);
      return;
    }

    if (!bartenderForm.email.trim()) {
      showMessage('Bartender email is required', true);
      return;
    }

    if (bartenderForm.password !== bartenderForm.confirmPassword) {
      showMessage('Passwords do not match', true);
      return;
    }

    if (bartenderForm.password.length < 8) {
      showMessage('Password must be at least 8 characters', true);
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API_URL}/api/admin/create-bartender`,
        {
          name: bartenderForm.name.trim(),
          email: bartenderForm.email.trim(),
          password: bartenderForm.password
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showMessage(`✅ Bartender account created: ${bartenderForm.email}`);
      setBartenderForm({ name: '', email: '', password: '', confirmPassword: '' });
      loadUsers();
    } catch (err) {
      showMessage(err.response?.data?.error || 'Failed to create bartender account', true);
    } finally {
      setLoading(false);
    }
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
      await axios.post(
        `${API_URL}/api/admin/reset-password`,
        {
          userId: resetForm.userId,
          newPassword: resetForm.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const selectedBartender = bartenders.find(b => b.id === resetForm.userId);
      showMessage(`✅ Password reset for ${selectedBartender?.name}`);
      setResetForm({ userId: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showMessage(err.response?.data?.error || 'Failed to reset password', true);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">👑 Admin Management</h1>
          <p className="text-gray-600 mt-2">Manage admin accounts and bartender staff</p>
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
          {/* Create Admin Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">➕ Create Admin Account</h2>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  placeholder="e.g., Jane Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  placeholder="admin@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={adminForm.confirmPassword}
                  onChange={(e) => setAdminForm({ ...adminForm, confirmPassword: e.target.value })}
                  placeholder="Confirm password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 transition"
              >
                {loading ? 'Creating...' : 'Create Admin'}
              </button>
            </form>

            {adminAccounts.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-700 mb-3">Admin Accounts ({adminAccounts.length})</h3>
                <div className="space-y-2">
                  {adminAccounts.map(admin => (
                    <div key={admin.id} className="text-sm bg-gray-50 p-2 rounded">
                      <p className="font-medium text-gray-800">{admin.name}</p>
                      <p className="text-gray-600">{admin.email}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Create Bartender Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">➕ Create Bartender</h2>

            <form onSubmit={handleCreateBartender} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={bartenderForm.name}
                  onChange={(e) => setBartenderForm({ ...bartenderForm, name: e.target.value })}
                  placeholder="e.g., John Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={bartenderForm.email}
                  onChange={(e) => setBartenderForm({ ...bartenderForm, email: e.target.value })}
                  placeholder="bartender@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={bartenderForm.password}
                  onChange={(e) => setBartenderForm({ ...bartenderForm, password: e.target.value })}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={bartenderForm.confirmPassword}
                  onChange={(e) => setBartenderForm({ ...bartenderForm, confirmPassword: e.target.value })}
                  placeholder="Confirm password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 transition"
              >
                {loading ? 'Creating...' : 'Create Bartender'}
              </button>
            </form>

            {bartenders.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-700 mb-3">Bartenders ({bartenders.length})</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {bartenders.map(bartender => (
                    <div key={bartender.id} className="text-sm bg-gray-50 p-2 rounded">
                      <p className="font-medium text-gray-800">{bartender.name}</p>
                      <p className="text-gray-600">{bartender.email}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reset Password Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🔑 Reset Bartender Password</h2>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Bartender</label>
                <select
                  value={resetForm.userId}
                  onChange={(e) => setResetForm({ ...resetForm, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading || loadingUsers || bartenders.length === 0}
                >
                  <option value="">-- Select a bartender --</option>
                  {bartenders.map(bartender => (
                    <option key={bartender.id} value={bartender.id}>
                      {bartender.name} ({bartender.email})
                    </option>
                  ))}
                </select>
                {bartenders.length === 0 && !loadingUsers && (
                  <p className="text-sm text-gray-500 mt-1">No bartenders found</p>
                )}
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
                <strong>ℹ️ Note:</strong> Resetting a password will immediately change the bartender's login credentials. They should be notified of the new password.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;