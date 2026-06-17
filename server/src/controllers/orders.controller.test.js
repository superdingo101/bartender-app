jest.mock('../services/database', () => ({
  prisma: {
    event: {
      findUnique: jest.fn(),
    },
    eventDrink: {
      findUnique: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../services/socket', () => ({
  emitNewOrder: jest.fn(),
  emitOrderStatusUpdate: jest.fn(),
  emitOrderCancelled: jest.fn(),
}));

const { prisma } = require('../services/database');
const { emitNewOrder } = require('../services/socket');
const { createOrder, getAllOrders } = require('./orders.controller');

const buildResponse = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
};

describe('Orders Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {
        eventId: 'event-1',
        drinkId: 'drink-1',
        quantity: 1,
        customerName: 'Test Guest',
      },
    };
    res = buildResponse();
    next = jest.fn();

    prisma.eventDrink.findUnique.mockResolvedValue({
      eventId: 'event-1',
      drinkId: 'drink-1',
      available: true,
      price: 9,
    });
    prisma.order.create.mockResolvedValue({
      id: 'order-1',
      eventId: 'event-1',
      drinkId: 'drink-1',
    });
  });


  it('filters bartender order lists by event id', async () => {
    req = {
      query: { eventId: 'event-1' },
      user: { userId: 'bartender-1', role: 'BARTENDER' },
    };
    prisma.order.findMany.mockResolvedValue([{ id: 'order-1', eventId: 'event-1' }]);

    await getAllOrders(req, res, next);

    expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { eventId: 'event-1' },
    }));
    expect(res.json).toHaveBeenCalledWith({ orders: [{ id: 'order-1', eventId: 'event-1' }] });
  });

  it('combines event and pending bartender visibility filters', async () => {
    req = {
      query: { eventId: 'event-1', status: 'PENDING' },
      user: { userId: 'bartender-1', role: 'BARTENDER' },
    };
    prisma.order.findMany.mockResolvedValue([]);

    await getAllOrders(req, res, next);

    expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        eventId: 'event-1',
        status: 'PENDING',
        claimedById: null,
      },
    }));
  });

  it('rejects customer-facing orders for upcoming events', async () => {
    prisma.event.findUnique.mockResolvedValue({
      id: 'event-1',
      status: 'UPCOMING',
      menuOnly: false,
    });

    await createOrder(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'This event has not started yet' });
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('allows bartender quick-add orders for upcoming events', async () => {
    req.user = {
      userId: 'bartender-1',
      role: 'BARTENDER',
      name: 'Test Bartender',
    };
    prisma.event.findUnique.mockResolvedValue({
      id: 'event-1',
      status: 'UPCOMING',
      menuOnly: false,
    });

    await createOrder(req, res, next);

    expect(prisma.order.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        eventId: 'event-1',
        drinkId: 'drink-1',
        customerId: 'bartender-1',
      }),
    }));
    expect(emitNewOrder).toHaveBeenCalledWith(expect.objectContaining({ id: 'order-1' }));
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
