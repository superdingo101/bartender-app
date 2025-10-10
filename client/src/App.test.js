import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock fetch
global.fetch = jest.fn();

describe('App Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('renders the main heading', () => {
    render(<App />);
    const heading = screen.getByText(/Bartending App/i);
    expect(heading).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<App />);
    expect(screen.getByText(/Checking backend connection/i)).toBeInTheDocument();
  });

  it('displays success status when API responds', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        status: 'OK',
        message: 'API is running',
        timestamp: new Date().toISOString(),
        database: 'configured',
      }),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Backend Connected/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Status:/i)).toBeInTheDocument();
    expect(screen.getByText(/OK/i)).toBeInTheDocument();
  });

  it('displays error when API request fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Backend Connection Failed/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Failed to connect to backend API/i)).toBeInTheDocument();
  });

  it('refreshes status when button is clicked', async () => {
    const user = userEvent.setup();
    
    fetch.mockResolvedValue({
      json: async () => ({
        status: 'OK',
        message: 'API is running',
        timestamp: new Date().toISOString(),
        database: 'configured',
      }),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Backend Connected/i)).toBeInTheDocument();
    });

    const refreshButton = screen.getByText(/Refresh Status/i);
    await user.click(refreshButton);

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('displays Docker services information', () => {
    render(<App />);
    
    expect(screen.getByText(/Frontend \(React\) - Port 3000/i)).toBeInTheDocument();
    expect(screen.getByText(/Backend \(Express\) - Port 5000/i)).toBeInTheDocument();
    expect(screen.getByText(/Database \(PostgreSQL\) - Port 5432/i)).toBeInTheDocument();
  });
});