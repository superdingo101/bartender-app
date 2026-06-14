const { prisma } = require('../services/database');
const { emitNewOrder, emitOrderStatusUpdate, emitOrderCancelled } = require('../services/socket');

// Get all orders with filtering
const getAllOrders = async (req, res, next) => {
  try {
    const { eventId, status, customerId } = req.query;
    const userRole = req.user.role;
    const userId = req.user.userId;

    const where = {
      ...(eventId && { eventId }),
      ...(status && { status }),
      // Customers can only see their own orders
      ...(userRole === 'CUSTOMER' && { customerId: userId }),
      ...(customerId && userRole !== 'CUSTOMER' && { customerId }),
    };

    const orders = await prisma.order.findMany({
      where,
      include: {
        drink: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ orders });
  } catch (error) {
    next(error);
  }
};

// Get single order by ID
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.userId;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        drink: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            code: true,
            location: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Customers can only see their own orders
    if (userRole === 'CUSTOMER' && order.customerId !== userId) {
      return res.status(403).json({
        error: 'You do not have permission to view this order',
      });
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
};

// Describe the Socket.IO order stream endpoint for clients that discover it via REST.
const getOrderStreamInfo = (req, res) => {
  res.json({
    transport: 'socket.io',
    namespace: '/',
    joinEvent: 'join-dashboard',
    events: ['new-order', 'order-updated', 'order-cancelled'],
    message: 'Connect with Socket.IO and emit join-dashboard to receive the real-time order stream.',
  });
};

// Create new order
const createOrder = async (req, res, next) => {
  try {
    const { eventId, drinkId, quantity, customerName, notes } = req.body;
    const userId = req.user?.userId;

    // Validate required fields
    if (!eventId || !drinkId) {
      return res.status(400).json({
        error: 'Event ID and Drink ID are required',
      });
    }

    // Check if event exists and is active
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.status === 'CANCELLED') {
      return res.status(400).json({
        error: 'Cannot place orders for cancelled events',
      });
    }

    // Check if drink is available at this event
    const eventDrink = await prisma.eventDrink.findUnique({
      where: {
        eventId_drinkId: {
          eventId,
          drinkId,
        },
      },
    });

    if (!eventDrink) {
      return res.status(404).json({
        error: 'This drink is not available at this event',
      });
    }

    if (!eventDrink.available) {
      return res.status(400).json({
        error: 'This drink is currently unavailable',
      });
    }

    // Calculate total price
    const totalPrice = eventDrink.price * (quantity || 1);

    // Create order
    const order = await prisma.order.create({
      data: {
        eventId,
        drinkId,
        quantity: quantity || 1,
        customerName: customerName || req.user?.name,
        notes,
        totalPrice,
        status: 'PENDING',
        ...(userId && { customerId: userId }),
      },
      include: {
        drink: true,
        event: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Emit real-time event
    emitNewOrder(order);

    res.status(201).json({
      message: 'Order placed successfully',
      order,
    });
  } catch (error) {
    next(error);
  }
};

// Update order status (Bartender/Admin only)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        validStatuses,
      });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        drink: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Emit real-time event
    emitOrderStatusUpdate(order);

    res.json({
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' });
    }
    next(error);
  }
};

// Cancel order
const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.userId;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Customers can only cancel their own orders
    if (userRole === 'CUSTOMER' && order.customerId !== userId) {
      return res.status(403).json({
        error: 'You do not have permission to cancel this order',
      });
    }

    // Can't cancel completed orders
    if (order.status === 'COMPLETED') {
      return res.status(400).json({
        error: 'Cannot cancel completed orders',
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        drink: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Emit real-time event
    emitOrderCancelled(updatedOrder);

    res.json({
      message: 'Order cancelled successfully',
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// Get order statistics for an event
const getEventOrderStats = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const stats = await prisma.order.groupBy({
      by: ['status'],
      where: { eventId },
      _count: {
        status: true,
      },
      _sum: {
        totalPrice: true,
        quantity: true,
      },
    });

    const totalOrders = await prisma.order.count({
      where: { eventId },
    });

    const totalRevenue = await prisma.order.aggregate({
      where: { eventId, status: { not: 'CANCELLED' } },
      _sum: {
        totalPrice: true,
      },
    });

    res.json({
      eventId,
      totalOrders,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      byStatus: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  getOrderStreamInfo,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getEventOrderStats,
};
