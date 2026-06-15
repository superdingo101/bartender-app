const LOCAL_DEVELOPMENT_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const parseOrigins = (value) => (value || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const configuredOrigins = parseOrigins(process.env.CORS_ORIGIN || process.env.CLIENT_URL);
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = configuredOrigins.length || isProduction
  ? configuredOrigins
  : LOCAL_DEVELOPMENT_ORIGINS;
const allowSameOriginProxyWithoutCors = isProduction && allowedOrigins.length === 0;

const corsOrigin = (origin, callback) => {
  if (!origin) {
    return callback(null, true);
  }

  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  if (allowSameOriginProxyWithoutCors) {
    return callback(null, false);
  }

  return callback(new Error(`Origin ${origin} is not allowed by CORS`));
};

const corsOptions = {
  origin: corsOrigin,
  credentials: true,
};

module.exports = {
  allowSameOriginProxyWithoutCors,
  allowedOrigins,
  corsOptions,
  parseOrigins,
};
