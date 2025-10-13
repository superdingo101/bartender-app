import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AddDrinksModal = ({ eventId, availableDrinks, onClose, onSave }) => {
  const { token } = useAuth();
  const [selectedDrinks, setSelectedDrinks] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleToggleDrink = (drinkId) => {
    setSelectedDrinks(prev => {
      if (prev.includes(drinkId)) {
        return prev.filter(id => id !== drinkId);
      } else {
        setPrices(p => ({ ...p, [drinkId]: '5.00' }));
        return [...prev, drinkId];
      }
    });
  };

  const handleAddDrinks = async () => {
    if (selectedDrinks.length === 0) {
      alert('Please select at least one drink');
      return;
    }

    setLoading(true);
    try {
      await Promise.all(
        selectedDrinks.map(drinkId =>
          axios.post(
            `${API_URL}/api/events/${eventId}/drinks`,
            {
              drinkId,
              price: parseFloat(prices[drinkId] || 5.00),
              available: true
            },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );
      onSave();
    } catch (error) {
      alert('Failed to add drinks: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const filteredDrinks = availableDrinks.filter(drink =>
    drink.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Add Drinks to Event</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>
          
          <input
            type="text"
            placeholder="Search drinks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
          
          <p className="text-sm text-gray-600 mt-2">
            Selected: {selectedDrinks.length} drink(s)
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filteredDrinks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {availableDrinks.length === 0 
                ? 'All drinks have been added to this event'
                : 'No drinks found matching your search'
              }
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDrinks.map(drink => {
                const primaryCategory = drink.categories?.find(dc => dc.isPrimary)?.category || drink.categories?.[0]?.category;
                const allCategories = drink.categories?.map(dc => dc.category) || [];
                
                return (
                  <div
                    key={drink.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                      selectedDrinks.includes(drink.id)
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                    onClick={() => handleToggleDrink(drink.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <input
                          type="checkbox"
                          checked={selectedDrinks.includes(drink.id)}
                          onChange={() => {}}
                          className="w-5 h-5 text-purple-600 rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-2xl">{primaryCategory?.icon || '🍹'}</span>
                          <h3 className="font-bold text-gray-800">{drink.name}</h3>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {allCategories.slice(0, 3).map((cat, idx) => (
                            <span 
                              key={cat.id}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                            >
                              {cat.displayName}
                            </span>
                          ))}
                          {allCategories.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                              +{allCategories.length - 3}
                            </span>
                          )}
                        </div>
                        {selectedDrinks.includes(drink.id) && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price:</label>
                            <input
                              type="number"
                              step="0.01"
                              value={prices[drink.id] || '5.00'}
                              onChange={(e) => setPrices(p => ({ ...p, [drink.id]: e.target.value }))}
                              className="w-full px-3 py-1 border border-gray-300 rounded"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleAddDrinks}
            disabled={loading || selectedDrinks.length === 0}
            className="flex-1 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 transition"
          >
            {loading ? 'Adding...' : `Add ${selectedDrinks.length} Drink(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddDrinksModal;