import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

import API_URL from '../../config/api';

const EnhancedDrinkModal = ({ drink, onClose, onSave }) => {
  useBodyScrollLock();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('basic');
  
  const [formData, setFormData] = useState({
    name: drink?.name || '',
    description: drink?.description || '',
    imageUrl: drink?.imageUrl || '',
    selectedCategories: drink?.categories?.map(dc => dc.category.name) || ['COCKTAIL'],
    glassTypeId: drink?.glassTypeId || '',
    ingredients: drink?.ingredients?.map(di => ({
      ingredientId: di.ingredient.id,
      quantity: di.quantity,
      unit: di.unit,
    })) || [],
    equipment: drink?.equipment?.map(de => de.equipment.id) || [],
    instructions: drink?.instructions?.map(inst => ({
      stepNumber: inst.stepNumber,
      instruction: inst.instruction,
    })) || [],
  });

  const [categories, setCategories] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [allGlassTypes, setAllGlassTypes] = useState([]);
  const [allEquipment, setAllEquipment] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [showNewIngredient, setShowNewIngredient] = useState(false);
  const [showNewGlassType, setShowNewGlassType] = useState(false);
  const [showNewEquipment, setShowNewEquipment] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [token]);

  const loadAllData = async () => {
    try {
      setDataLoading(true);
      const [categoriesRes, ingredientsRes, glassTypesRes, equipmentRes] = await Promise.all([
        axios.get(`${API_URL}/api/drinks/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/ingredients`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/glass-types`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/equipment`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);

      setCategories(categoriesRes.data.categories || []);
      setAllIngredients(ingredientsRes.data.ingredients || []);
      setAllGlassTypes(glassTypesRes.data.glassTypes || []);
      setAllEquipment(equipmentRes.data.equipment || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load form data');
    } finally {
      setDataLoading(false);
    }
  };

  const toggleCategory = (categoryName) => {
    setFormData(prev => {
      const selected = prev.selectedCategories;
      if (selected.includes(categoryName)) {
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

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { ingredientId: '', quantity: 1, unit: 'oz' }]
    }));
  };

  const updateIngredient = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => 
        i === index ? { ...ing, [field]: value } : ing
      )
    }));
  };

  const removeIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const toggleEquipment = (equipmentId) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(equipmentId)
        ? prev.equipment.filter(id => id !== equipmentId)
        : [...prev.equipment, equipmentId]
    }));
  };

  const addInstruction = () => {
    const nextStep = formData.instructions.length + 1;
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, { stepNumber: nextStep, instruction: '' }]
    }));
  };

  const updateInstruction = (index, value) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => 
        i === index ? { ...inst, instruction: value } : inst
      )
    }));
  };

  const removeInstruction = (index) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index).map((inst, i) => ({
        ...inst,
        stepNumber: i + 1
      }))
    }));
  };

  const moveInstruction = (index, direction) => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === formData.instructions.length - 1)) {
      return;
    }

    setFormData(prev => {
      const instructions = [...prev.instructions];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      [instructions[index], instructions[swapIndex]] = [instructions[swapIndex], instructions[index]];
      
      return {
        ...prev,
        instructions: instructions.map((inst, i) => ({
          ...inst,
          stepNumber: i + 1
        }))
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

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
        })),
        glassTypeId: formData.glassTypeId || null,
        ingredients: formData.ingredients.filter(ing => ing.ingredientId),
        equipment: formData.equipment.map(eqId => ({ equipmentId: eqId })),
        instructions: formData.instructions.filter(inst => inst.instruction.trim()),
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

  if (dataLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-hidden">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
        <div className="p-6 border-b flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {drink ? 'Edit Drink' : 'Add New Drink'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>

          <div className="flex space-x-2 border-b overflow-x-auto overflow-y-hidden -mx-6 px-6 scrollbar-thin">
            {['basic', 'ingredients', 'equipment', 'instructions'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium transition whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'ingredients' && formData.ingredients.length > 0 && ` (${formData.ingredients.length})`}
                {tab === 'equipment' && formData.equipment.length > 0 && ` (${formData.equipment.length})`}
                {tab === 'instructions' && formData.instructions.length > 0 && ` (${formData.instructions.length})`}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Drink Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Margarita, Mojito"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Glass Type (Optional)
                </label>
                <div className="flex space-x-2">
                  <select
                    value={formData.glassTypeId}
                    onChange={(e) => setFormData({ ...formData, glassTypeId: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">No glass type</option>
                    {allGlassTypes.map(glass => (
                      <option key={glass.id} value={glass.id}>
                        {glass.name} {glass.capacity && `(${glass.capacity} oz)`}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewGlassType(true)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    + New
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'ingredients' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  Ingredients (Optional)
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowNewIngredient(true)}
                    className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    + New Ingredient
                  </button>
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    + Add Ingredient
                  </button>
                </div>
              </div>

              {formData.ingredients.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  No ingredients added yet. Click "Add Ingredient" to start.
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.ingredients.map((ing, index) => (
                    <div key={index} className="flex space-x-2 items-start p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <select
                          value={ing.ingredientId}
                          onChange={(e) => updateIngredient(index, 'ingredientId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          required
                        >
                          <option value="">Select ingredient...</option>
                          {allIngredients.map(ingredient => (
                            <option key={ingredient.id} value={ingredient.id}>
                              {ingredient.name} {ingredient.brand && `(${ingredient.brand})`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          step="0.25"
                          value={ing.quantity}
                          onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value))}
                          placeholder="Qty"
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          required
                        />
                      </div>
                      <div className="w-24">
                        <select
                          value={ing.unit}
                          onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          required
                        >
                          <option value="oz">oz</option>
                          <option value="ml">ml</option>
                          <option value="dash">dash</option>
                          <option value="tsp">tsp</option>
                          <option value="tbsp">tbsp</option>
                          <option value="splash">splash</option>
                          <option value="piece">piece</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'equipment' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  Equipment Needed (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewEquipment(true)}
                  className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                >
                  + New Equipment
                </button>
              </div>

              {allEquipment.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  No equipment available. Create equipment first.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {allEquipment.map(eq => (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => toggleEquipment(eq.id)}
                      className={`px-4 py-3 rounded-lg font-medium transition text-left ${
                        formData.equipment.includes(eq.id)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {eq.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  Step-by-Step Instructions (Optional)
                </label>
                <button
                  type="button"
                  onClick={addInstruction}
                  className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  + Add Step
                </button>
              </div>

              {formData.instructions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  No instructions added yet. Click "Add Step" to start.
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.instructions.map((inst, index) => (
                    <div key={index} className="flex space-x-2 items-start p-3 bg-gray-50 rounded-lg">
                      <div className="flex flex-col space-y-1">
                        <button
                          type="button"
                          onClick={() => moveInstruction(index, 'up')}
                          disabled={index === 0}
                          className="px-2 py-1 text-xs bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => moveInstruction(index, 'down')}
                          disabled={index === formData.instructions.length - 1}
                          className="px-2 py-1 text-xs bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <textarea
                        value={inst.instruction}
                        onChange={(e) => updateInstruction(index, e.target.value)}
                        placeholder="Enter instruction..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded resize-none"
                        rows="2"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeInstruction(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mt-4">
              ❌ {error}
            </div>
          )}
        </form>

        <div className="p-6 border-t flex space-x-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim()}
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
              🗑️
            </button>
          )}
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Delete Drink?</h3>
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                ⚠️ This deletes the drink from the database permanently.
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showNewIngredient && (
          <QuickCreateModal
            title="New Ingredient"
            onClose={() => setShowNewIngredient(false)}
            onSave={async (data) => {
              try {
                const res = await axios.post(
                  `${API_URL}/api/ingredients`,
                  data,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                setAllIngredients([...allIngredients, res.data.ingredient]);
                setShowNewIngredient(false);
              } catch (err) {
                alert('Failed to create ingredient: ' + (err.response?.data?.error || err.message));
              }
            }}
            fields={[
              { name: 'name', label: 'Name', type: 'text', required: true },
              { name: 'type', label: 'Type', type: 'text', required: true, placeholder: 'e.g., Spirit, Liqueur, Juice' },
              { name: 'brand', label: 'Brand', type: 'text' },
              { name: 'unit', label: 'Unit', type: 'select', required: true, options: ['oz', 'ml', 'bottle', 'dash', 'piece'] },
              { name: 'bottlePrice', label: 'Bottle Price', type: 'number', step: '0.01' },
            ]}
          />
        )}

        {showNewGlassType && (
          <QuickCreateModal
            title="New Glass Type"
            onClose={() => setShowNewGlassType(false)}
            onSave={async (data) => {
              try {
                const res = await axios.post(
                  `${API_URL}/api/glass-types`,
                  data,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                setAllGlassTypes([...allGlassTypes, res.data.glassType]);
                setFormData({ ...formData, glassTypeId: res.data.glassType.id });
                setShowNewGlassType(false);
              } catch (err) {
                alert('Failed to create glass type: ' + (err.response?.data?.error || err.message));
              }
            }}
            fields={[
              { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g., Martini Glass' },
              { name: 'description', label: 'Description', type: 'text' },
              { name: 'capacity', label: 'Capacity (oz)', type: 'number', step: '0.1' },
            ]}
          />
        )}

        {showNewEquipment && (
          <QuickCreateModal
            title="New Equipment"
            onClose={() => setShowNewEquipment(false)}
            onSave={async (data) => {
              try {
                const res = await axios.post(
                  `${API_URL}/api/equipment`,
                  data,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                setAllEquipment([...allEquipment, res.data.equipment]);
                setShowNewEquipment(false);
              } catch (err) {
                alert('Failed to create equipment: ' + (err.response?.data?.error || err.message));
              }
            }}
            fields={[
              { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g., Shaker, Muddler' },
              { name: 'description', label: 'Description', type: 'text' },
            ]}
          />
        )}
      </div>
    </div>
  );
};

const QuickCreateModal = ({ title, onClose, onSave, fields }) => {
  useBodyScrollLock();
  const [formData, setFormData] = useState(
    fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {})
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          {fields.map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label} {field.required && '*'}
              </label>
              {field.type === 'select' ? (
                <select
                  value={formData[field.name]}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required={field.required}
                >
                  <option value="">Select...</option>
                  {field.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type || 'text'}
                  step={field.step}
                  value={formData[field.name]}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required={field.required}
                />
              )}
            </div>
          ))}
          <div className="flex space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedDrinkModal;