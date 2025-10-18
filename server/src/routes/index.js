const healthRoutes = require('./health.routes');
const apiRoutes = require('./api.routes');
const authRoutes = require('./auth.routes');
const eventsRoutes = require('./events.routes');
const drinksRoutes = require('./drinks.routes');
const ordersRoutes = require('./orders.routes');
const adminRoutes = require('./admin.routes');
const ingredientsRoutes = require('./ingredients.routes');
const glassTypesRoutes = require('./glassTypes.routes');
const equipmentRoutes = require('./equipment.routes');

module.exports = (app) => {
  // Health check routes
  app.use('/health', healthRoutes);
  
  // API info routes
  app.use('/api', apiRoutes);
  
  // Authentication routes
  app.use('/api/auth', authRoutes);
  
  // Admin routes (must come before other routes)
  app.use('/api/admin', adminRoutes);
  
  // Events routes
  app.use('/api/events', eventsRoutes);
  
  // Drinks routes
  app.use('/api/drinks', drinksRoutes);
  
  // Orders routes
  app.use('/api/orders', ordersRoutes);
  
  app.use('/api/ingredients', ingredientsRoutes);
  app.use('/api/glass-types', glassTypesRoutes);
  app.use('/api/equipment', equipmentRoutes);
  
};