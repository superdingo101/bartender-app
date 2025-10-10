import React from 'react';
import './StatusCard.css';

const StatusCard = ({ apiStatus, error }) => {
  if (error) {
    return (
      <div className="status-card error">
        <h3>❌ Backend Connection Failed</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (apiStatus) {
    return (
      <div className="status-card success">
        <h3>✅ Backend Connected</h3>
        <div className="status-details">
          <p><strong>Status:</strong> {apiStatus.status}</p>
          <p><strong>Message:</strong> {apiStatus.message}</p>
          <p><strong>Database:</strong> {apiStatus.database}</p>
          <p><strong>Environment:</strong> {apiStatus.environment}</p>
          <p><strong>Timestamp:</strong> {new Date(apiStatus.timestamp).toLocaleString()}</p>
        </div>
      </div>
    );
  }

  return null;
};

export default StatusCard;
