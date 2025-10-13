import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DrinkModal = ({ drink, categories, onClose, onSave }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: drink?.name || '',
    description: drink?.description || '',
    imageUrl: drink?.imageUrl || '',
    selectedCategories: drink?.categories?.map(dc => dc.category.name) || ['COCKTAIL']
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        imageUrl: formData.imageUrl,
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
      setError(err.response?.data?.error || err.message);
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories * (select at least one)
              </label>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 transition"
              >
                {loading ? 'Saving...' : (drink ? 'Update Drink' : 'Add Drink')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DrinkModal;