import { useState, useEffect } from 'react';
import { checkHealth } from '../services/api';

const useHealthCheck = () => {
  const [apiStatus, setApiStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const data = await checkHealth();
      setApiStatus(data);
      setError(null);
    } catch (err) {
      setError('Failed to connect to backend API');
      setApiStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return { apiStatus, loading, error, refetch: fetchHealth };
};

export default useHealthCheck;
