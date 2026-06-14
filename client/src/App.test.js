import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('renders the guest event-code entry experience', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: /welcome to the bartending app/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter event code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enter event/i })).toBeDisabled();
  });

  it('renders the bartender login page route', async () => {
    window.history.pushState({}, '', '/bartender/login');

    render(<App />);

    expect(await screen.findByRole('heading', { name: /bartender portal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});
