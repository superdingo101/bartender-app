import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Navigation from './Navigation';
import EventDrinkCard from './EventDrinkCard';
import AddDrinksModal from './AddDrinksModal';

import API_URL from '../../config/api';

const EventMenuPage = () => {
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [allDrinks, setAllDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [id, token]);

  const loadData = async () => {
    try {
      const [eventRes, drinksRes] = await Promise.all([
        axios.get(`${API_URL}/api/events/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/drinks`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setEvent(eventRes.data.event);
      setAllDrinks(drinksRes.data.drinks);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load event details');
      navigate('/bartender/events');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDrink = async (drinkId) => {
    if (!window.confirm('Remove this drink from the event?')) return;

    try {
      await axios.delete(`${API_URL}/api/events/${id}/drinks/${drinkId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
    } catch (error) {
      alert('Failed to remove drink: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleToggleAvailability = async (drinkId, currentAvailability) => {
    try {
      await axios.put(
        `${API_URL}/api/events/${id}/drinks/${drinkId}`,
        { available: !currentAvailability },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadData();
    } catch (error) {
      alert('Failed to update availability: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleReorderDrink = async (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= event.drinks.length) {
      return;
    }

    const reorderedDrinks = [...event.drinks];
    const [movedDrink] = reorderedDrinks.splice(fromIndex, 1);
    reorderedDrinks.splice(toIndex, 0, movedDrink);

    setEvent((prevEvent) => ({
      ...prevEvent,
      drinks: reorderedDrinks,
    }));

    try {
      await axios.put(
        `${API_URL}/api/events/${id}/drinks/reorder`,
        { drinkIds: reorderedDrinks.map((eventDrink) => eventDrink.drinkId) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadData();
    } catch (error) {
      alert('Failed to update menu order: ' + (error.response?.data?.error || error.message));
      loadData();
    }
  };

  const handleUpdatePrice = async (drinkId, newPrice) => {
    try {
      await axios.put(
        `${API_URL}/api/events/${id}/drinks/${drinkId}`,
        { price: parseFloat(newPrice) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadData();
    } catch (error) {
      alert('Failed to update price: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  const eventDrinkIds = new Set(event.drinks.map(ed => ed.drinkId));
  const availableDrinks = allDrinks.filter(d => !eventDrinkIds.has(d.id));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/bartender/events')}
          className="mb-4 text-purple-600 hover:text-purple-700 font-medium transition"
        >
          ← Back to Events
        </button>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{event.name}</h1>
              <div className="space-y-1 text-gray-600">
                <p>📅 {new Date(event.date).toLocaleDateString()}</p>
                <p>📍 {event.location}</p>
                <p>🔑 Code: <code className="bg-gray-100 px-2 py-1 rounded">{event.code}</code></p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
            >
              ➕ Add Drinks
            </button>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Event Menu ({event.drinks.length} drinks)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Use the ↑ and ↓ controls to change the order customers see.
          </p>
        </div>

        {event.drinks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🍹</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No drinks added yet</h3>
            <p className="text-gray-500 mb-4">Add drinks to create your event menu</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
            >
              Add Drinks
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {event.drinks.map((eventDrink, index) => (
              <EventDrinkCard
                key={eventDrink.id}
                eventDrink={eventDrink}
                onRemove={() => handleRemoveDrink(eventDrink.drinkId)}
                onToggleAvailability={() => handleToggleAvailability(eventDrink.drinkId, eventDrink.available)}
                onUpdatePrice={(price) => handleUpdatePrice(eventDrink.drinkId, price)}
                onMoveUp={() => handleReorderDrink(index, index - 1)}
                onMoveDown={() => handleReorderDrink(index, index + 1)}
                isFirst={index === 0}
                isLast={index === event.drinks.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddDrinksModal
          eventId={id}
          availableDrinks={availableDrinks}
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};

export default EventMenuPage;
