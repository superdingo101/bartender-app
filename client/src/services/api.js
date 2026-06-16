import API_URL from '../config/api';

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
};

// Health check
export const checkHealth = () => apiCall('/health');

// Event endpoints
export const getEventByCode = (code) => apiCall(`/api/events/code/${code}`);

export const getEventMenu = (id) => apiCall(`/api/events/${id}/menu`);

export const getEventById = (id, token) =>
  apiCall(`/api/events/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Drinks endpoints
export const getAllDrinks = () => apiCall('/api/drinks');

export const getDrinksByCategory = (category) =>
  apiCall(`/api/drinks/category/${category}`);

export const searchDrinks = (query) =>
  apiCall(`/api/drinks/search?q=${encodeURIComponent(query)}`);

// Order endpoints
export const createOrder = (orderData, token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return apiCall('/api/orders', {
    method: 'POST',
    headers,
    body: JSON.stringify(orderData),
  });
};

export const getMyOrders = (token) =>
  apiCall('/api/orders', {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getOrderById = (orderId, token) =>
  apiCall(`/api/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const cancelOrder = (orderId, token) =>
  apiCall(`/api/orders/${orderId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

// Auth endpoints
export const login = (credentials) =>
  apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

export const register = (userData) =>
  apiCall('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

export default {
  checkHealth,
  getEventByCode,
  getEventMenu,
  getEventById,
  getAllDrinks,
  getDrinksByCategory,
  searchDrinks,
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  login,
  register,
};