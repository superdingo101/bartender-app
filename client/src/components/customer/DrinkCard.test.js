import { fireEvent, render, screen } from '@testing-library/react';
import DrinkCard from './DrinkCard';

const makeEventDrink = (overrides = {}) => ({
  price: 14,
  available: true,
  drink: {
    id: 'drink-1',
    name: 'Old Fashioned',
    description: 'Whiskey cocktail with bitters, sugar, and orange peel',
    imageUrl: 'https://example.com/old-fashioned.jpg',
    categories: [
      {
        isPrimary: true,
        category: {
          name: 'cocktails',
          displayName: 'Cocktails',
          icon: '🍸',
        },
      },
      {
        isPrimary: false,
        category: {
          name: 'spirits',
          displayName: 'Spirits',
          icon: '🥃',
        },
      },
    ],
    ...overrides.drink,
  },
  ...overrides,
});

describe('DrinkCard expanded customer menu card', () => {
  it('renders full drink details, price, and add button in ordering mode', () => {
    const onAddToCart = jest.fn();
    render(
      <DrinkCard
        eventDrink={makeEventDrink()}
        onAddToCart={onAddToCart}
        hidePrices={false}
        menuOnly={false}
      />
    );

    expect(screen.getByRole('img', { name: /old fashioned/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /old fashioned/i })).toBeInTheDocument();
    expect(screen.getByText(/whiskey cocktail with bitters/i)).toBeInTheDocument();
    expect(screen.getByText(/cocktails/i)).toBeInTheDocument();
    expect(screen.getByText(/spirits/i)).toBeInTheDocument();
    expect(screen.getByText('$14.00')).toBeInTheDocument();

    const addButton = screen.getByRole('button', { name: /\+ add/i });
    expect(addButton).toBeInTheDocument();

    fireEvent.click(addButton);
    expect(onAddToCart).toHaveBeenCalledWith(expect.objectContaining({ name: 'Old Fashioned' }), 14);
  });

  it('shows the menu-only label and hides ordering controls in menu-only mode', () => {
    render(
      <DrinkCard
        eventDrink={makeEventDrink()}
        onAddToCart={jest.fn()}
        hidePrices={false}
        menuOnly={true}
      />
    );

    expect(screen.getByRole('heading', { name: /old fashioned/i })).toBeInTheDocument();
    expect(screen.getByText(/whiskey cocktail with bitters/i)).toBeInTheDocument();
    expect(screen.getByText(/cocktails/i)).toBeInTheDocument();
    expect(screen.getByText('$14.00')).toBeInTheDocument();
    expect(screen.getByText(/menu item/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /\+ add/i })).not.toBeInTheDocument();
  });

  it('hides the price when prices are hidden', () => {
    render(
      <DrinkCard
        eventDrink={makeEventDrink()}
        onAddToCart={jest.fn()}
        hidePrices={true}
        menuOnly={false}
      />
    );

    expect(screen.queryByText('$14.00')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ add/i })).toBeInTheDocument();
  });
});
