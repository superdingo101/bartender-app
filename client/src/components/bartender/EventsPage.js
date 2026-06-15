import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Navigation from './Navigation';
import EventCard from './EventCard';
import EventModal from './EventModal';
import EventQRCode from './EventQRCode';

import API_URL from '../../config/api';

const EventsPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    loadEvents();
  }, [token]);

  const loadEvents = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data.events);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setShowModal(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  const handleShowQR = (event) => {
    setSelectedEvent(event);
    setShowQRModal(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      await axios.delete(`${API_URL}/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadEvents();
    } catch (error) {
      alert('Failed to delete event: ' + (error.response?.data?.error || error.message));
    }
  };

  const filteredEvents = filter === 'ALL' 
    ? events 
    : events.filter(e => e.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Events Management</h2>
          <button
            onClick={handleCreateEvent}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
          >
            ➕ Create Event
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {['ALL', 'UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-2 text-sm rounded-lg font-medium transition ${
                filter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No events found</h3>
            <p className="text-gray-500">Create your first event to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={() => handleEditEvent(event)}
                onDelete={() => handleDeleteEvent(event.id)}
                onShowQR={() => handleShowQR(event)}
                onManageMenu={() => navigate(`/bartender/events/${event.id}/menu`)}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <EventModal
          event={editingEvent}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            loadEvents();
          }}
        />
      )}

      {showQRModal && selectedEvent && (
        <EventQRCode
          event={selectedEvent}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </div>
  );
};

export default EventsPage;