import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DrinkMenu, { drinkHasLiquorType, getAvailableLiquorFilters } from './DrinkMenu';
import { getEventMenu } from '../../services/api';

jest.mock('../../services/api', () => ({
  getEventMenu: jest.fn(),
  createOrder: jest.fn(),
}));

const category = (name, displayName, icon = '🍹') => ({
  isPrimary: true,
  category: { name, displayName, icon },
});

const ingredient = (name, type = 'Spirit', brand) => ({
  ingredient: { name, type, brand },
});

const eventDrink = ({ id, name, ingredients, categories = [category('COCKTAIL', 'Cocktail', '🍸')], available = true }) => ({
  id,
  drinkId: `${id}-drink`,
  price: 12,
  available,
  drink: {
    id: `${id}-drink`,
    name,
    description: `${name} description`,
    categories,
    ingredients,
  },
});

const menuEvent = (drinks) => ({
  id: 'event-1',
  name: 'Test Event',
  location: 'Test Bar',
  date: '2026-06-18T00:00:00.000Z',
  hidePrices: false,
  menuOnly: false,
  drinks,
});

const renderDrinkMenu = (drinks) => {
  const event = menuEvent(drinks);
  getEventMenu.mockResolvedValue({ event, menu: drinks });

  return render(
    <DrinkMenu
      event={event}
      cart={{ itemCount: 0 }}
      onAddToCart={jest.fn()}
      onOrderPlaced={jest.fn()}
    />
  );
};

describe('DrinkMenu liquor filters', () => {
  beforeEach(() => {
    getEventMenu.mockReset();
  });

  it('detects supported liquor types from drink ingredients', () => {
    expect(drinkHasLiquorType({ ingredients: [ingredient('Tito\'s Vodka')] }, 'vodka')).toBe(true);
    expect(drinkHasLiquorType({ ingredients: [ingredient('Simple Syrup')] }, 'vodka')).toBe(false);

    const filters = getAvailableLiquorFilters([
      eventDrink({ id: 'vodka', name: 'Vodka Soda', ingredients: [ingredient('Vodka')] }),
      eventDrink({ id: 'rum', name: 'Daiquiri', ingredients: [ingredient('White Rum')] }),
      eventDrink({ id: 'gin', name: 'Gin Fizz', ingredients: [ingredient('Gin')] }),
    ]);

    expect(filters.map((filter) => filter.name)).toEqual(['VODKA', 'RUM']);
  });

  it('shows only liquor filters present on the event menu and filters matching drinks', async () => {
    renderDrinkMenu([
      eventDrink({ id: 'vodka', name: 'Vodka Soda', ingredients: [ingredient('Vodka')] }),
      eventDrink({ id: 'whiskey', name: 'Old Fashioned', ingredients: [ingredient('Bourbon Whiskey')] }),
      eventDrink({ id: 'gin', name: 'Gin Fizz', ingredients: [ingredient('Gin')] }),
    ]);

    expect(await screen.findByRole('button', { name: /vodka \(1\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /whiskey \(1\)/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /rum/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /tequila/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /vodka \(1\)/i }));

    expect(screen.getByRole('heading', { name: /vodka soda/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /old fashioned/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /gin fizz/i })).not.toBeInTheDocument();

    await waitFor(() => expect(getEventMenu).toHaveBeenCalledWith('event-1'));
  });
});
