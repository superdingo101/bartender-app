import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Navigation from './Navigation';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

import API_URL from '../../config/api';

const IngredientsPage = () => {
  const { token } = useAuth();
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadIngredients();
  }, [token]);

  const loadIngredients = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/ingredients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIngredients(res.data.ingredients);
    } catch (error) {
      console.error('Failed to load ingredients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ingredient "${name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/ingredients/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadIngredients();
      alert('✅ Ingredient deleted');
    } catch (error) {
      alert('Failed to delete: ' + (error.response?.data?.error || error.message));
    }
  };

  const filteredIngredients = ingredients.filter(ing =>
    ing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ing.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ing.brand && ing.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Ingredients Management</h2>
          <button
            onClick={() => {
              setEditingItem(null);
              setShowModal(true);
            }}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
          >
            ➕ Add Ingredient
          </button>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : filteredIngredients.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🧪</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No ingredients found</h3>
            <p className="text-gray-500">Add ingredients to build your inventory</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bottle Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Used In</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredIngredients.map((ing) => (
                  <tr key={ing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{ing.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{ing.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{ing.brand || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{ing.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {ing.bottlePrice ? `$${ing.bottlePrice.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {ing._count?.drinks || 0} drink(s)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setEditingItem(ing);
                          setShowModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(ing.id, ing.name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <IngredientModal
          ingredient={editingItem}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingItem(null);
            loadIngredients();
          }}
          token={token}
        />
      )}
    </div>
  );
};

const IngredientModal = ({ ingredient, onClose, onSave, token }) => {
  useBodyScrollLock();
  const [formData, setFormData] = useState({
    name: ingredient?.name || '',
    type: ingredient?.type || '',
    brand: ingredient?.brand || '',
    unit: ingredient?.unit || 'oz',
    quantity: ingredient?.quantity || 0,
    minQuantity: ingredient?.minQuantity || 0,
    bottlePrice: ingredient?.bottlePrice || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity) || 0,
        minQuantity: parseFloat(formData.minQuantity) || 0,
        bottlePrice: formData.bottlePrice ? parseFloat(formData.bottlePrice) : null,
      };

      if (ingredient) {
        await axios.put(
          `${API_URL}/api/ingredients/${ingredient.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${API_URL}/api/ingredients`,
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {ingredient ? 'Edit Ingredient' : 'Add Ingredient'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="e.g., Spirit, Juice, Garnish"
                className="w-full px-3 py-2 border border-gray-300 rounded"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                required
              >
                <option value="oz">oz</option>
                <option value="ml">ml</option>
                <option value="bottle">bottle</option>
                <option value="dash">dash</option>
                <option value="piece">piece</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Quantity</label>
              <input
                type="number"
                step="0.01"
                value={formData.minQuantity}
                onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bottle Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.bottlePrice}
                onChange={(e) => setFormData({ ...formData, bottlePrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
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
              {loading ? 'Saving...' : (ingredient ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IngredientsPage;