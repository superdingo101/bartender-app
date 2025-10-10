const getHealth = (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Bartending App API is running',
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL ? 'configured' : 'not configured',
    environment: process.env.NODE_ENV || 'development'
  });
};

module.exports = {
  getHealth
};
