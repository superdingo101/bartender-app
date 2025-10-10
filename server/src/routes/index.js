const healthRoutes = require('./health.routes');
const apiRoutes = require('./api.routes');
const authRoutes = require('./auth.routes');
const eventsRoutes = require('./events.routes');
const drinksRoutes = require('./drinks.routes');
const ordersRoutes = require('./orders.routes');

module.exports = (app) => {
  // Health check routes
  app.use('/health', healthRoutes);
  
  // API info routes
  app.use('/api', apiRoutes);
  
  // Authentication routes
  app.use('/api/auth', authRoutes);
  
  // Events routes
  app.use('/api/events', eventsRoutes);
  
  // Drinks routes
  app.use('/api/drinks', drinksRoutes);
  
  // Orders routes
  app.use('/api/orders', ordersRoutes);
};