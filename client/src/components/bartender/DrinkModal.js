import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

import API_URL from '../../config/api';

const DrinkModal = ({ drink, onClose, onSave }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: drink?.name || '',
    description: drink?.description || '',
    imageUrl: drink?.imageUrl || '',
    selectedCategories: drink?.categories?.map(dc => dc.category.name) || ['COCKTAIL']
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, [token]);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await axios.get(
        `${API_URL}/api/drinks/categories`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError('Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const toggleCategory = (categoryName) => {
    setFormData(prev => {
      const selected = prev.selectedCategories;
      if (selected.includes(categoryName)) {
        // Keep at least one category
        if (selected.length === 1) return prev;
        return {
          ...prev,
          selectedCategories: selected.filter(c => c !== categoryName)
        };
      } else {
        return {
          ...prev,
          selectedCategories: [...selected, categoryName]
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!formData.name || formData.name.trim().length === 0) {
      setError('Drink name is required');
      return;
    }

    if (!formData.selectedCategories || formData.selectedCategories.length === 0) {
      setError('Please select at least one category');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        imageUrl: formData.imageUrl.trim() || null,
        categories: formData.selectedCategories.map((cat, idx) => ({
          name: cat,
          isPrimary: idx === 0
        }))
      };

      if (drink) {
        await axios.put(
          `${API_URL}/api/drinks/${drink.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${API_URL}/api/drinks`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save drink');
      console.error('Error saving drink:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      await axios.delete(
        `${API_URL}/api/drinks/${drink.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowDeleteConfirm(false);
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to delete drink');
      console.error('Error deleting drink:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {drink ? 'Edit Drink' : 'Add New Drink'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Drink Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Margarita, Mojito"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories * (select at least one)
              </label>
              
              {categoriesLoading ? (
                <div className="text-center py-4 text-gray-500">
                  Loading categories...
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  ⚠️ No categories available. Please contact your administrator.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => toggleCategory(cat.name)}
                      className={`px-4 py-3 rounded-lg font-medium transition text-left ${
                        formData.selectedCategories.includes(cat.name)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="text-xl mr-2">{cat.icon}</span>
                      {cat.displayName}
                      {formData.selectedCategories[0] === cat.name && (
                        <span className="ml-2 text-xs">⭐ Primary</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                First selected category will be the primary category
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                ❌ {error}
              </div>
            )}

            <div className="flex space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name.trim() || categoriesLoading}
                className="flex-1 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 transition"
              >
                {loading ? 'Saving...' : (drink ? 'Update Drink' : 'Add Drink')}
              </button>
              {drink && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50 transition"
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          </form>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Delete Drink?</h3>
                  
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                    ⚠️ <strong>Are you sure?</strong> This deletes the drink from the database. To delete a drink from an event's menu, select "Manage Menu" from the Events Management tab.
                  </div>

                  <div className="mb-4 text-sm text-gray-600">
                    <p><strong>Drink:</strong> {drink?.name}</p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={loading}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50 transition"
                    >
                      {loading ? 'Deleting...' : 'Delete Drink'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrinkModal;