import {
  cancelOrder,
  checkHealth,
  createOrder,
  getAllDrinks,
  getDrinksByCategory,
  getEventByCode,
  getEventMenu,
  getEvents,
  getEventById,
  getMyOrders,
  getOrderById,
  login,
  register,
  searchDrinks,
} from './api';

describe('API service', () => {
  const originalFetch = global.fetch;
  const originalConsoleError = console.error;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ ok: true }),
    });
    console.error = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    console.error = originalConsoleError;
    jest.clearAllMocks();
  });

  const expectFetch = (path, options = {}) => {
    expect(global.fetch).toHaveBeenCalledWith(
      path,
      expect.objectContaining({
        ...options,
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        }),
      })
    );
  };

  it.each([
    ['checkHealth', () => checkHealth(), '/health'],
    ['getEventByCode', () => getEventByCode('SUMMER26'), '/api/events/code/SUMMER26'],
    ['getEventMenu', () => getEventMenu('event-1'), '/api/events/event-1/menu'],
    ['getAllDrinks', () => getAllDrinks(), '/api/drinks'],
    ['getDrinksByCategory', () => getDrinksByCategory('classic'), '/api/drinks/category/classic'],
    ['searchDrinks', () => searchDrinks('gin & tonic'), '/api/drinks/search?q=gin%20%26%20tonic'],
  ])('calls %s with the expected GET request', async (_name, apiFunction, path) => {
    await expect(apiFunction()).resolves.toEqual({ ok: true });

    expectFetch(path);
  });

  it.each([
    ['getEvents', () => getEvents('token-123'), '/api/events'],
    ['getEventById', () => getEventById('event-1', 'token-123'), '/api/events/event-1'],
    ['getMyOrders', () => getMyOrders('token-123'), '/api/orders'],
    ['getOrderById', () => getOrderById('order-1', 'token-123'), '/api/orders/order-1'],
  ])('calls %s with bearer authentication', async (_name, apiFunction, path) => {
    await expect(apiFunction()).resolves.toEqual({ ok: true });

    expectFetch(path, {
      headers: { Authorization: 'Bearer token-123' },
    });
  });

  it('creates a guest order without an authorization header', async () => {
    const orderData = { eventId: 'event-1', drinkId: 'drink-1', quantity: 2 };

    await createOrder(orderData);

    expectFetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    expect(global.fetch.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
  });

  it('creates an authenticated order with a bearer token', async () => {
    const orderData = { eventId: 'event-1', drinkId: 'drink-1', quantity: 2 };

    await createOrder(orderData, 'token-123');

    expectFetch('/api/orders', {
      method: 'POST',
      headers: { Authorization: 'Bearer token-123' },
      body: JSON.stringify(orderData),
    });
  });

  it('fetches orders scoped to an event when an event is selected', async () => {
    await getMyOrders('token-123', 'event 1');

    expectFetch('/api/orders?eventId=event%201', {
      headers: { Authorization: 'Bearer token-123' },
    });
  });

  it('cancels an order with the DELETE method and bearer token', async () => {
    await cancelOrder('order-1', 'token-123');

    expectFetch('/api/orders/order-1', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer token-123' },
    });
  });

  it.each([
    ['login', () => login({ email: 'user@example.com', password: 'password123' }), '/api/auth/login', { email: 'user@example.com', password: 'password123' }],
    ['register', () => register({ name: 'User', email: 'user@example.com', password: 'password123' }), '/api/auth/register', { name: 'User', email: 'user@example.com', password: 'password123' }],
  ])('calls %s with POST JSON credentials', async (_name, apiFunction, path, payload) => {
    await apiFunction();

    expectFetch(path, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  });

  it('throws the API error message for unsuccessful responses', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({ error: 'Bad request' }),
    });

    await expect(checkHealth()).rejects.toThrow('Bad request');
    expect(console.error).toHaveBeenCalledWith(
      'API call failed: /health',
      expect.any(Error)
    );
  });

  it('throws a status error when the response has no API error message', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({}),
    });

    await expect(checkHealth()).rejects.toThrow('HTTP error! status: 500');
  });
});
