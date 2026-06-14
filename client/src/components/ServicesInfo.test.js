// client/src/components/ServicesInfo.test.js

import { render, screen } from '@testing-library/react';
import ServicesInfo from './ServicesInfo';

describe('ServicesInfo Component', () => {
  it('renders all three services', () => {
    render(<ServicesInfo />);

    expect(screen.getByText(/Docker Services Running:/i)).toBeInTheDocument();
    expect(screen.getByText(/Frontend \(React\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Backend \(Express\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Database \(PostgreSQL\)/i)).toBeInTheDocument();
  });
});
