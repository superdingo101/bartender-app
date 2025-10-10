const getApiInfo = (req, res) => {
  res.json({ 
    message: 'Welcome to Bartending App API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api'
    },
    documentation: 'https://github.com/yourusername/bartending-app'
  });
};

module.exports = {
  getApiInfo
};
