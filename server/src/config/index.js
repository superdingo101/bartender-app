module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-please-change-in-production-use-long-random-string',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  }
};