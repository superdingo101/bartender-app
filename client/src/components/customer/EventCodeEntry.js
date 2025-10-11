import React, { useState } from 'react';
import { getEventByCode } from '../../services/api';
import './EventCodeEntry.css';

const EventCodeEntry = ({ onEventFound }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const appName = process.env.REACT_APP_BARTENDING_COMPANY || 'The Bartending App';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('Please enter an event code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getEventByCode(code.toUpperCase());
      onEventFound(response.event);
    } catch (err) {
      setError(err.message || 'Event not found. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="event-code-entry">
      <div className="entry-container">
        <div className="entry-header">
          <h1>🍸 Welcome to {appName}</h1>
          <p>Enter your event code to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="entry-form">
          <div className="input-group">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter event code (e.g., SUMMER2024)"
              maxLength={20}
              disabled={loading}
              className="code-input"
              autoFocus
            />
          </div>

          {error && (
            <div className="error-message">
              <span>❌</span> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="submit-button"
          >
            {loading ? 'Finding Event...' : 'Enter Event'}
          </button>
        </form>

        <div className="info-section">
          <h3>How it works:</h3>
          <ol>
            <li>Enter the event code provided by your host</li>
            <li>Browse the drink menu</li>
            <li>Place your order</li>
            <li>Track your order in real-time</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default EventCodeEntry;