const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { corsOptions } = require('../config/cors');

let io;

// Initialize Socket.IO
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      ...corsOptions,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      // Allow anonymous connections for public events (customers)
      console.log(`⚠️ Socket connection without token: ${socket.id} (GUEST)`);
      socket.data.user = { role: 'GUEST', userId: null };
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      console.log(`✅ Socket authenticated: ${socket.id} - User: ${decoded.userId} (${decoded.role})`);
      socket.data.user = decoded;
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      console.error(`❌ Socket token verification failed: ${error.message}`);
      // Don't reject - allow connection but mark as guest
      socket.data.user = { role: 'GUEST', userId: null };
      next();
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    console.log(`🔌 Client connected: ${socket.id} (${user.role || 'GUEST'})`);

    // Join event room
    socket.on('join-event', (eventId) => {
      socket.join(`event:${eventId}`);
      console.log(`📍 ${socket.id} joined event:${eventId}`);
      socket.emit('joined-event', { eventId });
    });

    // Leave event room
    socket.on('leave-event', (eventId) => {
      socket.leave(`event:${eventId}`);
      console.log(`👋 ${socket.id} left event:${eventId}`);
    });

    // Join bartender dashboard (bartenders/admins only)
    socket.on('join-dashboard', () => {
      if (user.role === 'BARTENDER' || user.role === 'ADMIN') {
        socket.join('bartender-dashboard');
        console.log(`👨‍🍳 ${socket.id} (${user.userId}) joined bartender dashboard`);
        socket.emit('joined-dashboard');
      } else {
        console.warn(`⚠️ Unauthorized dashboard access attempt: ${socket.id} (${user.role})`);
        socket.emit('error', { message: 'Unauthorized' });
      }
    });

    // Leave bartender dashboard
    socket.on('leave-dashboard', () => {
      socket.leave('bartender-dashboard');
      console.log(`👋 ${socket.id} left bartender dashboard`);
    });

    // Typing indicator for orders
    socket.on('typing', ({ eventId, customerName }) => {
      socket.to(`event:${eventId}`).emit('customer-typing', { customerName });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`🔴 Client disconnected: ${socket.id}`);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`Socket error (${socket.id}):`, error);
    });
  });

  console.log('✅ Socket.IO initialized successfully');
  return io;
};

// Get Socket.IO instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Emit new order to event room and bartender dashboard
const emitNewOrder = (order) => {
  if (!io) return;
  
  const eventRoom = `event:${order.eventId}`;
  
  // Notify everyone in the event
  io.to(eventRoom).emit('order-created', order);
  
  // Notify bartender dashboard
  io.to('bartender-dashboard').emit('new-order', order);
  
  console.log(`📢 New order emitted to ${eventRoom} and bartender-dashboard`);
};

// Emit order status update
const emitOrderStatusUpdate = (order) => {
  if (!io) return;
  
  const eventRoom = `event:${order.eventId}`;
  
  // Notify everyone in the event
  io.to(eventRoom).emit('order-status-updated', order);
  
  // Notify bartender dashboard
  io.to('bartender-dashboard').emit('order-updated', order);
  
  console.log(`📢 Order status updated: ${order.id} -> ${order.status}`);
};

// Emit order cancelled
const emitOrderCancelled = (order) => {
  if (!io) return;
  
  const eventRoom = `event:${order.eventId}`;
  
  io.to(eventRoom).emit('order-cancelled', order);
  io.to('bartender-dashboard').emit('order-cancelled', order);
  
  console.log(`📢 Order cancelled: ${order.id}`);
};

// Emit event status update
const emitEventStatusUpdate = (event) => {
  if (!io) return;
  
  const eventRoom = `event:${event.id}`;
  
  io.to(eventRoom).emit('event-status-updated', event);
  io.to('bartender-dashboard').emit('event-updated', event);
  
  console.log(`📢 Event status updated: ${event.id} -> ${event.status}`);
};

// Emit drink availability update
const emitDrinkAvailabilityUpdate = (eventId, drinkId, available) => {
  if (!io) return;
  
  const eventRoom = `event:${eventId}`;
  
  io.to(eventRoom).emit('drink-availability-updated', {
    eventId,
    drinkId,
    available,
  });
  
  console.log(`📢 Drink availability updated: ${drinkId} -> ${available}`);
};

// Broadcast to all connected clients
const broadcast = (event, data) => {
  if (!io) return;
  io.emit(event, data);
  console.log(`📢 Broadcast: ${event}`);
};

// Send to specific room
const emitToRoom = (room, event, data) => {
  if (!io) return;
  io.to(room).emit(event, data);
  console.log(`📢 Emit to room ${room}: ${event}`);
};

module.exports = {
  initializeSocket,
  getIO,
  emitNewOrder,
  emitOrderStatusUpdate,
  emitOrderCancelled,
  emitEventStatusUpdate,
  emitDrinkAvailabilityUpdate,
  broadcast,
  emitToRoom,
};