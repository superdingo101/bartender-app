import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Navigation from './Navigation';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ResourcesPage = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('glass');
  const [glassTypes, setGlassTypes] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalType, setModalType] = useState('glass'); // 'glass' or 'equipment'

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [glassRes, equipmentRes] = await Promise.all([
        axios.get(`${API_URL}/api/glass-types`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/equipment`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setGlassTypes(glassRes.data.glassTypes);
      setEquipment(equipmentRes.data.equipment);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type, id, name) => {
    if (!window.confirm(`Delete ${type} "${name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const endpoint = type === 'glass' ? 'glass-types' : 'equipment';
      await axios.delete(`${API_URL}/api/${endpoint}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
      alert(`✅ ${type === 'glass' ? 'Glass type' : 'Equipment'} deleted`);
    } catch (error) {
      alert('Failed to delete: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleAdd = (type) => {
    setModalType(type);
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEdit = (type, item) => {
    setModalType(type);
    setEditingItem(item);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Bar Resources Management</h2>

        {/* Tabs */}
        <div className="flex space-x-2 border-b mb-6">
          <button
            onClick={() => setActiveTab('glass')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'glass'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🥃 Glass Types ({glassTypes.length})
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'equipment'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🔧 Equipment ({equipment.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <>
            {/* Glass Types Tab */}
            {activeTab === 'glass' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">Glass Types</h3>
                  <button
                    onClick={() => handleAdd('glass')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
                  >
                    ➕ Add Glass Type
                  </button>
                </div>

                {glassTypes.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <div className="text-6xl mb-4">🥃</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No glass types found</h3>
                    <p className="text-gray-500">Add glass types to specify serving containers</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {glassTypes.map((glass) => (
                      <div key={glass.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg text-gray-800">{glass.name}</h4>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit('glass', glass)}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete('glass', glass.id, glass.name)}
                              className="text-red-600 hover:text-red-900"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        {glass.capacity && (
                          <p className="text-sm text-gray-600 mb-2">Capacity: {glass.capacity} oz</p>
                        )}
                        {glass.description && (
                          <p className="text-sm text-gray-600 mb-2">{glass.description}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Used in {glass._count?.drinks || 0} drink(s)
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Equipment Tab */}
            {activeTab === 'equipment' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">Equipment</h3>
                  <button
                    onClick={() => handleAdd('equipment')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
                  >
                    ➕ Add Equipment
                  </button>
                </div>

                {equipment.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <div className="text-6xl mb-4">🔧</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No equipment found</h3>
                    <p className="text-gray-500">Add equipment to track required tools</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {equipment.map((eq) => (
                      <div key={eq.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg text-gray-800">{eq.name}</h4>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit('equipment', eq)}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete('equipment', eq.id, eq.name)}
                              className="text-red-600 hover:text-red-900"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        {eq.description && (
                          <p className="text-sm text-gray-600 mb-2">{eq.description}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Used in {eq._count?.drinks || 0} drink(s)
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <ResourceModal
          type={modalType}
          item={editingItem}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingItem(null);
            loadData();
          }}
          token={token}
        />
      )}
    </div>
  );
};

const ResourceModal = ({ type, item, onClose, onSave, token }) => {
  const isGlass = type === 'glass';
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    capacity: item?.capacity || '',
    imageUrl: item?.imageUrl || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isGlass ? 'glass-types' : 'equipment';
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        imageUrl: formData.imageUrl.trim() || null,
        ...(isGlass && formData.capacity && { capacity: parseFloat(formData.capacity) }),
      };

      if (item) {
        await axios.put(
          `${API_URL}/api/${endpoint}/${item.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${API_URL}/api/${endpoint}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {item ? 'Edit' : 'Add'} {isGlass ? 'Glass Type' : 'Equipment'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={isGlass ? 'e.g., Martini Glass' : 'e.g., Cocktail Shaker'}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              className="w-full px-3 py-2 border border-gray-300 rounded"
              rows="2"
            />
          </div>

          {isGlass && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (oz)</label>
              <input
                type="number"
                step="0.1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="e.g., 10"
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              ❌ {error}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (item ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourcesPage;