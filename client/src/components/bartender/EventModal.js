import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

import API_URL from '../../config/api';

const EVENT_CODE_MAX_LENGTH = 20;

const normalizeEventCode = (value) => (value || '')
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, EVENT_CODE_MAX_LENGTH);

const EventModal = ({ event, onClose, onSave }) => {
  useBodyScrollLock();
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: event?.name || '',
    code: event?.code || '',
    description: event?.description || '',
    date: event?.date ? new Date(event.date).toISOString().slice(0, 16) : '',
    location: event?.location || '',
    status: event?.status || 'UPCOMING',
    hidePrices: event?.hidePrices || false,
    menuOnly: event?.menuOnly || false
  });
  const [codeEdited, setCodeEdited] = useState(Boolean(event?.code));
  const [codeStatus, setCodeStatus] = useState({ state: event ? 'available' : 'idle', message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!event && !codeEdited) {
      setFormData((current) => ({
        ...current,
        code: normalizeEventCode(current.name)
      }));
    }
  }, [event, codeEdited, formData.name]);

  useEffect(() => {
    if (event) {
      return undefined;
    }

    const code = normalizeEventCode(formData.code);

    if (!code) {
      setCodeStatus({ state: 'idle', message: 'Enter an event code.' });
      return undefined;
    }

    setCodeStatus({ state: 'checking', message: 'Checking availability...' });

    const timeoutId = setTimeout(async () => {
      try {
        const response = await axios.get(`${API_URL}/api/events/availability/code`, {
          params: { code },
          headers: { Authorization: `Bearer ${token}` }
        });

        setCodeStatus({
          state: response.data.available ? 'available' : 'unavailable',
          message: response.data.available ? 'Event code is available.' : 'Event code is already in use.'
        });
      } catch (err) {
        setCodeStatus({
          state: 'unavailable',
          message: err.response?.data?.error || 'Unable to check event code availability.'
        });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [event, formData.code, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const normalizedCode = normalizeEventCode(formData.code);

    if (!formData.name || formData.name.trim().length === 0) {
      setError('Event name is required');
      return;
    }

    if (!event && !normalizedCode) {
      setError('Event code is required');
      return;
    }

    if (!event && codeStatus.state !== 'available') {
      setError('Please choose an available event code');
      return;
    }

    if (!formData.date) {
      setError('Event date is required');
      return;
    }

    if (!formData.location || formData.location.trim().length === 0) {
      setError('Event location is required');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        date: new Date(formData.date).toISOString(),
        location: formData.location.trim(),
        status: formData.status,
        hidePrices: formData.hidePrices,
        menuOnly: formData.menuOnly
      };

      if (!event) {
        payload.code = normalizedCode;
      }

      if (event) {
        await axios.put(
          `${API_URL}/api/events/${event.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${API_URL}/api/events`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save event');
      console.error('Error saving event:', err);
    } finally {
      setLoading(false);
    }
  };

  const isCodeUnavailable = !event && codeStatus.state !== 'available';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {event ? 'Edit Event' : 'Create New Event'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Summer Party, Wedding Reception"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            {!event && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Code *</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => {
                      setCodeEdited(true);
                      setFormData({ ...formData, code: normalizeEventCode(e.target.value) });
                    }}
                    placeholder="e.g., SUMMER-PARTY"
                    maxLength={EVENT_CODE_MAX_LENGTH}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <span
                    className={`text-2xl ${codeStatus.state === 'available' ? 'text-green-600' : 'text-red-600'}`}
                    aria-label={codeStatus.state === 'available' ? 'Event code available' : 'Event code unavailable'}
                    title={codeStatus.message}
                  >
                    {codeStatus.state === 'available' ? '✓' : '✕'}
                  </span>
                </div>
                <p className={`mt-1 text-sm ${codeStatus.state === 'available' ? 'text-green-700' : 'text-red-700'}`}>
                  {codeStatus.message || 'Event codes may contain letters, numbers, and hyphens.'}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional event description"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time *</label>
              <input
                type="datetime-local"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Grand Ballroom, Outdoor Pavilion"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="UPCOMING">Upcoming</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <input
                type="checkbox"
                id="hidePrices"
                checked={formData.hidePrices}
                onChange={(e) => setFormData({ ...formData, hidePrices: e.target.checked })}
                className="w-5 h-5 text-purple-600 rounded"
              />
              <label htmlFor="hidePrices" className="flex-1 cursor-pointer">
                <div className="font-medium text-gray-900">🎁 Hide All Prices</div>
                <div className="text-sm text-gray-600">
                  Enable this for events with complimentary drinks (weddings, corporate events, etc.)
                </div>
              </label>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                type="checkbox"
                id="menuOnly"
                checked={formData.menuOnly}
                onChange={(e) => setFormData({ ...formData, menuOnly: e.target.checked })}
                className="w-5 h-5 text-purple-600 rounded"
              />
              <label htmlFor="menuOnly" className="flex-1 cursor-pointer">
                <div className="font-medium text-gray-900">📋 Menu Only Mode</div>
                <div className="text-sm text-gray-600">
                  Show the customer app as a browsable menu without add-to-cart or place-order options.
                </div>
              </label>
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
                disabled={loading || !formData.name.trim() || !formData.date || !formData.location.trim() || isCodeUnavailable}
                className="flex-1 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 transition"
              >
                {loading ? 'Saving...' : (event ? 'Update Event' : 'Create Event')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventModal;