import React, { useState, useEffect } from 'react';
import { getEventByCode } from '../../services/api';
import './EventCodeEntry.css';

const EVENT_CODE_MAX_LENGTH = 20;

const EventCodeEntry = ({ onEventFound }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const appName = process.env.REACT_APP_BARTENDING_COMPANY || 'The Bartending App';
  const EVENT_EXPIRY_HOURS = 12;

  // Check for event code in URL parameters (from QR code scan) or localStorage
  useEffect(() => {
    const checkUrlParams = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const eventCode = urlParams.get('code');
      
      // Check localStorage for existing event with expiry
      const storedEventData = localStorage.getItem('currentEvent');
      const storedEventExpiry = localStorage.getItem('currentEventExpiry');
      
      if (eventCode) {
        // QR code scan - load event from URL
        setCode(eventCode.toUpperCase());
        setLoading(true);
        
        try {
          const response = await getEventByCode(eventCode.toUpperCase());
          saveEventToStorage(response.event);
          onEventFound(response.event);
          
          // Clean up URL (optional - removes ?code=XXX from address bar)
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          setError(err.message || 'Event not found. Please check the code and try again.');
          setLoading(false);
        }
      } else if (storedEventData && storedEventExpiry) {
        // Check if stored event has expired
        const expiryTime = parseInt(storedEventExpiry, 10);
        const currentTime = new Date().getTime();
        
        if (currentTime < expiryTime) {
          // Event is still valid - restore it
          try {
            const event = JSON.parse(storedEventData);
            onEventFound(event);
          } catch (err) {
            console.error('Failed to restore event:', err);
            clearEventFromStorage();
          }
        } else {
          // Event has expired - clear it
          clearEventFromStorage();
        }
      }
    };
    
    checkUrlParams();
  }, [onEventFound]);

  const saveEventToStorage = (event) => {
    const expiryTime = new Date().getTime() + (EVENT_EXPIRY_HOURS * 60 * 60 * 1000);
    localStorage.setItem('currentEvent', JSON.stringify(event));
    localStorage.setItem('currentEventExpiry', expiryTime.toString());
  };

  const clearEventFromStorage = () => {
    localStorage.removeItem('currentEvent');
    localStorage.removeItem('currentEventExpiry');
  };

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
      saveEventToStorage(response.event);
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
              placeholder="Enter event code (e.g., SUMMER2026)"
              maxLength={EVENT_CODE_MAX_LENGTH}
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
          <div className="qr-info">
            <div className="qr-icon">📱</div>
            <h3>Have a QR code?</h3>
            <p>Simply scan it with your camera and you'll be directed here automatically!</p>
          </div>
          
          <div className="divider">
            <span>OR</span>
          </div>
          
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
