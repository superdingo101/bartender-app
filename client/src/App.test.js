import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import * as api from './services/api';

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the guest event-code entry experience', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: /welcome to the bartending app/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter event code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enter event/i })).toBeDisabled();
  });

  it('clears an existing cart before switching to a different event', async () => {
    const firstEvent = {
      id: 'event-1',
      name: 'First Event',
      location: 'Main Hall',
      date: '2026-07-01T00:00:00.000Z',
      status: 'ACTIVE',
      drinks: [
        {
          id: 'event-drink-1',
          drinkId: 'drink-1',
          available: true,
          price: 8,
          drink: { id: 'drink-1', name: 'Margarita', categories: [] },
        },
      ],
    };
    const secondEvent = {
      id: 'event-2',
      name: 'Second Event',
      location: 'Patio',
      date: '2026-07-02T00:00:00.000Z',
      status: 'ACTIVE',
      drinks: [
        {
          id: 'event-drink-2',
          drinkId: 'drink-2',
          available: true,
          price: 10,
          drink: { id: 'drink-2', name: 'Old Fashioned', categories: [] },
        },
      ],
    };

    jest.spyOn(api, 'getEventMenu').mockImplementation((eventId) =>
      Promise.resolve({ event: eventId === 'event-1' ? firstEvent : secondEvent })
    );
    jest.spyOn(api, 'getEventByCode').mockResolvedValue({ event: secondEvent });

    const expiryTime = new Date().getTime() + 60 * 60 * 1000;
    localStorage.setItem('currentEvent', JSON.stringify(firstEvent));
    localStorage.setItem('currentEventExpiry', expiryTime.toString());

    render(<App />);

    expect(await screen.findByRole('heading', { name: /first event/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /\+ add/i }));
    expect(await screen.findByRole('button', { name: /cart \(1\)/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /choose a different event/i }));
    expect(await screen.findByRole('heading', { name: /welcome to the bartending app/i })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/enter event code/i), {
      target: { value: 'SECOND' },
    });
    fireEvent.click(screen.getByRole('button', { name: /enter event/i }));

    expect(await screen.findByRole('heading', { name: /second event/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cart \(0\)/i })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /cart \(1\)/i })).not.toBeInTheDocument();
  });

  it('renders the bartender login page route', async () => {
    window.history.pushState({}, '', '/bartender/login');

    render(<App />);

    expect(await screen.findByRole('heading', { name: /bartender portal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});
