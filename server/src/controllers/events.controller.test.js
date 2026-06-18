jest.mock('../services/database', () => ({
  prisma: {
    event: {
      findUnique: jest.fn(),
    },
    eventDrink: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../services/eventMenu', () => ({
  eventMenuInclude: { drinks: true },
  emitPublicEventMenuUpdate: jest.fn(),
}));

jest.mock('../services/socket', () => ({
  emitEventStatusUpdate: jest.fn(),
  emitDrinkAvailabilityUpdate: jest.fn(),
}));

const { prisma } = require('../services/database');
const { emitPublicEventMenuUpdate } = require('../services/eventMenu');
const { reorderEventDrinks } = require('./events.controller');

const buildResponse = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
};

describe('Events Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: { id: 'event-1' },
      body: { drinkIds: ['drink-2', 'drink-1'] },
      user: { userId: 'host-1', role: 'BARTENDER' },
    };
    res = buildResponse();
    next = jest.fn();

    prisma.event.findUnique
      .mockResolvedValueOnce({ hostId: 'host-1' })
      .mockResolvedValueOnce({ id: 'event-1', drinks: [] });
    prisma.eventDrink.findMany.mockResolvedValue([
      { drinkId: 'drink-1' },
      { drinkId: 'drink-2' },
    ]);
    prisma.eventDrink.update.mockImplementation((updateArgs) => updateArgs);
    prisma.$transaction.mockImplementation(async (updates) => updates);
    emitPublicEventMenuUpdate.mockResolvedValue(undefined);
  });

  it('reorders drinks for only the requested event menu', async () => {
    await reorderEventDrinks(req, res, next);

    expect(prisma.eventDrink.update).toHaveBeenCalledWith({
      where: {
        eventId_drinkId: {
          eventId: 'event-1',
          drinkId: 'drink-2',
        },
      },
      data: { displayOrder: 0 },
    });
    expect(prisma.eventDrink.update).toHaveBeenCalledWith({
      where: {
        eventId_drinkId: {
          eventId: 'event-1',
          drinkId: 'drink-1',
        },
      },
      data: { displayOrder: 1 },
    });
    expect(prisma.eventDrink.update).toHaveBeenCalledTimes(2);
    expect(emitPublicEventMenuUpdate).toHaveBeenCalledWith('event-1');
    expect(res.json).toHaveBeenCalledWith({
      message: 'Event menu order updated successfully',
      event: { id: 'event-1', drinks: [] },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('lets another event persist a different order for the same drinks', async () => {
    req.params.id = 'event-2';
    req.body.drinkIds = ['drink-1', 'drink-2'];
    prisma.event.findUnique
      .mockReset()
      .mockResolvedValueOnce({ hostId: 'host-1' })
      .mockResolvedValueOnce({ id: 'event-2', drinks: [] });

    await reorderEventDrinks(req, res, next);

    expect(prisma.eventDrink.update).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        eventId_drinkId: {
          eventId: 'event-2',
          drinkId: 'drink-1',
        },
      },
      data: { displayOrder: 0 },
    }));
    expect(prisma.eventDrink.update).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        eventId_drinkId: {
          eventId: 'event-2',
          drinkId: 'drink-2',
        },
      },
      data: { displayOrder: 1 },
    }));
  });

  it('rejects order payloads that do not match the event drinks', async () => {
    req.body.drinkIds = ['drink-1', 'drink-3'];

    await reorderEventDrinks(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Drink IDs must match the drinks currently assigned to this event',
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
