const { prisma } = require('../services/database');
const { eventMenuInclude, emitPublicEventMenuUpdate } = require('../services/eventMenu');
const { emitEventStatusUpdate, emitDrinkAvailabilityUpdate } = require('../services/socket');

// Normalize manually-entered event codes to URL-safe uppercase values
const EVENT_CODE_MAX_LENGTH = 20;

const normalizeEventCode = (code) => (code || '')
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, EVENT_CODE_MAX_LENGTH);

// Get all events (with filters)
const getAllEvents = async (req, res, next) => {
  try {
    const { status, hostId } = req.query;

    const events = await prisma.event.findMany({
      where: {
        ...(status && { status }),
        ...(hostId && { hostId }),
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            drinks: true,
            orders: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    res.json({ events });
  } catch (error) {
    next(error);
  }
};

// Get single event by ID
const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        drinks: {
          orderBy: [
            { displayOrder: 'asc' },
            { createdAt: 'asc' },
          ],
          include: {
            drink: {
              include: {
                categories: {
                  include: { category: true },
                  orderBy: { isPrimary: 'desc' },
                },
              },
            },
          },
        },
        orders: {
          include: {
            drink: true,
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ event });
  } catch (error) {
    next(error);
  }
};

// Get event by code (for customers)
const getEventByCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    const event = await prisma.event.findUnique({
      where: { code: code.toUpperCase() },
      include: eventMenuInclude,
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ event });
  } catch (error) {
    next(error);
  }
};

// Get public event menu by ID (for guest menu refreshes/deep links)
const getEventMenu = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: eventMenuInclude,
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ event, menu: event.drinks });
  } catch (error) {
    next(error);
  }
};

// Check if an event code is available
const checkEventCodeAvailability = async (req, res, next) => {
  try {
    const code = normalizeEventCode(req.query.code);

    if (!code) {
      return res.status(400).json({
        error: 'Event code is required',
        available: false,
        code,
      });
    }

    const existingEvent = await prisma.event.findUnique({ where: { code } });

    res.json({
      available: !existingEvent,
      code,
    });
  } catch (error) {
    next(error);
  }
};

// Create new event
const createEvent = async (req, res, next) => {
  try {
    const {
      name, description, date, location, status, hidePrices, menuOnly, code: requestedCode,
    } = req.body;
    const hostId = req.user.userId;

    // Validate required fields
    if (!name || !date || !location || !requestedCode) {
      return res.status(400).json({
        error: 'Name, date, location, and event code are required',
      });
    }

    const code = normalizeEventCode(requestedCode);

    if (!code) {
      return res.status(400).json({
        error: 'Event code must contain at least one letter or number',
      });
    }

    const codeExists = await prisma.event.findUnique({ where: { code } });

    if (codeExists) {
      return res.status(409).json({
        error: 'Event code is already in use',
      });
    }

    const event = await prisma.event.create({
      data: {
        name,
        description,
        date: new Date(date),
        location,
        code,
        status: status || 'UPCOMING',
        hidePrices: hidePrices || false,
        menuOnly: menuOnly || false,
        hostId,
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Event created successfully',
      event,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Event code is already in use',
      });
    }
    next(error);
  }
};

// Update event
const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, description, date, location, status, hidePrices, menuOnly,
    } = req.body;
    const { userId } = req.user;
    const userRole = req.user.role;

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check authorization (only host or admin can update)
    if (existingEvent.hostId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({
        error: 'You do not have permission to update this event',
      });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(date && { date: new Date(date) }),
        ...(location && { location }),
        ...(status && { status }),
        ...(hidePrices !== undefined && { hidePrices }),
        ...(menuOnly !== undefined && { menuOnly }),
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Keep legacy status listeners updated and refresh the full customer menu payload.
    if (
      (status && status !== existingEvent.status)
      || (hidePrices !== undefined && hidePrices !== existingEvent.hidePrices)
      || (menuOnly !== undefined && menuOnly !== existingEvent.menuOnly)
    ) {
      emitEventStatusUpdate(updatedEvent);
    }

    await emitPublicEventMenuUpdate(id);

    res.json({
      message: 'Event updated successfully',
      event: updatedEvent,
    });
  } catch (error) {
    next(error);
  }
};

// Reorder drinks on the customer-facing event menu
const reorderEventDrinks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { drinkIds } = req.body;
    const { userId } = req.user;
    const userRole = req.user.role;

    if (!Array.isArray(drinkIds) || drinkIds.length === 0) {
      return res.status(400).json({ error: 'An ordered drinkIds array is required' });
    }

    const event = await prisma.event.findUnique({
      where: { id },
      select: { hostId: true },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.hostId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({
        error: 'You do not have permission to update this event menu',
      });
    }

    const existingEventDrinks = await prisma.eventDrink.findMany({
      where: { eventId: id },
      select: { drinkId: true },
    });
    const existingDrinkIds = existingEventDrinks.map((eventDrink) => eventDrink.drinkId);
    const uniqueDrinkIds = [...new Set(drinkIds)];

    if (uniqueDrinkIds.length !== drinkIds.length) {
      return res.status(400).json({ error: 'Drink IDs cannot contain duplicates' });
    }

    const hasSameDrinks = uniqueDrinkIds.length === existingDrinkIds.length
      && uniqueDrinkIds.every((drinkId) => existingDrinkIds.includes(drinkId));

    if (!hasSameDrinks) {
      return res.status(400).json({
        error: 'Drink IDs must match the drinks currently assigned to this event',
      });
    }

    await prisma.$transaction(
      uniqueDrinkIds.map((drinkId, displayOrder) => prisma.eventDrink.update({
        where: {
          eventId_drinkId: {
            eventId: id,
            drinkId,
          },
        },
        data: { displayOrder },
      })),
    );

    await emitPublicEventMenuUpdate(id);

    const updatedEvent = await prisma.event.findUnique({
      where: { id },
      include: eventMenuInclude,
    });

    res.json({
      message: 'Event menu order updated successfully',
      event: updatedEvent,
    });
  } catch (error) {
    next(error);
  }
};

// Delete event
const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const userRole = req.user.role;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check authorization
    if (event.hostId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({
        error: 'You do not have permission to delete this event',
      });
    }

    await prisma.event.delete({
      where: { id },
    });

    res.json({
      message: 'Event deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Add drink to event
const addDrinkToEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { drinkId, price, available } = req.body;

    if (!drinkId || price === undefined) {
      return res.status(400).json({
        error: 'Drink ID and price are required',
      });
    }

    const lastEventDrink = await prisma.eventDrink.findFirst({
      where: { eventId: id },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });

    const eventDrink = await prisma.eventDrink.create({
      data: {
        eventId: id,
        drinkId,
        price: parseFloat(price),
        displayOrder: (lastEventDrink?.displayOrder ?? -1) + 1,
        available: available !== undefined ? available : true,
      },
      include: {
        drink: true,
      },
    });

    await emitPublicEventMenuUpdate(id);

    res.status(201).json({
      message: 'Drink added to event successfully',
      eventDrink,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'This drink is already added to the event',
      });
    }
    next(error);
  }
};

// Remove drink from event
const removeDrinkFromEvent = async (req, res, next) => {
  try {
    const { id, drinkId } = req.params;

    await prisma.eventDrink.delete({
      where: {
        eventId_drinkId: {
          eventId: id,
          drinkId,
        },
      },
    });

    await emitPublicEventMenuUpdate(id);

    res.json({
      message: 'Drink removed from event successfully',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Drink not found in this event',
      });
    }
    next(error);
  }
};

// Update drink availability in event
const updateEventDrink = async (req, res, next) => {
  try {
    const { id, drinkId } = req.params;
    const { price, available } = req.body;

    const eventDrink = await prisma.eventDrink.update({
      where: {
        eventId_drinkId: {
          eventId: id,
          drinkId,
        },
      },
      data: {
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(available !== undefined && { available }),
      },
      include: {
        drink: true,
      },
    });

    await emitPublicEventMenuUpdate(id);

    // Emit targeted real-time update if availability changed for clients that only need the toggle.
    if (available !== undefined) {
      emitDrinkAvailabilityUpdate(id, drinkId, available);
    }

    res.json({
      message: 'Event drink updated successfully',
      eventDrink,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  getEventByCode,
  getEventMenu,
  checkEventCodeAvailability,
  createEvent,
  updateEvent,
  reorderEventDrinks,
  deleteEvent,
  addDrinkToEvent,
  removeDrinkFromEvent,
  updateEventDrink,
};
