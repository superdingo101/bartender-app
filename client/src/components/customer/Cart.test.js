import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Cart from './Cart';
import { createOrder, getEventMenu } from '../../services/api';

jest.mock('../../services/api', () => ({
  createOrder: jest.fn(),
  getEventMenu: jest.fn(),
}));

const drink = { id: 'drink-1', name: 'Margarita' };

const makeCart = () => ({
  items: [{ drink, quantity: 1, price: 8 }],
  total: 8,
  updateQuantity: jest.fn(),
  removeItem: jest.fn(),
  clearCart: jest.fn(),
});

const renderCart = (eventStatus) => {
  const cart = makeCart();
  const onClose = jest.fn();
  getEventMenu.mockResolvedValue({ event: { id: 'event-1', status: eventStatus } });

  render(
    <Cart
      cart={cart}
      event={{ id: 'event-1', status: eventStatus }}
      onClose={onClose}
      hidePrices={false}
    />
  );

  return { cart, onClose };
};

describe('Cart event status checkout guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    Object.defineProperty(window, 'scrollTo', { value: jest.fn(), writable: true });
  });

  it('warns for upcoming events and keeps items in the cart', async () => {
    const { cart, onClose } = renderCart('UPCOMING');

    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Sam' } });
    fireEvent.click(screen.getByRole('button', { name: /place order now/i }));

    expect(await screen.findByText(/event has not started yet/i)).toBeInTheDocument();
    expect(createOrder).not.toHaveBeenCalled();
    expect(cart.clearCart).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('alerts for completed events and clears the cart', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const { cart, onClose } = renderCart('COMPLETED');

    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Sam' } });
    fireEvent.click(screen.getByRole('button', { name: /place order now/i }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/event has ended/i));
    });
    expect(createOrder).not.toHaveBeenCalled();
    expect(cart.clearCart).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    alertSpy.mockRestore();
  });
});
