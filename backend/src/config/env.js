require('dotenv').config();

const parseCorsOrigins = (value) => {
  if (!value) return ['http://localhost:4200'];
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

module.exports = {
  PORT: Number(process.env.PORT || 3002),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017',
  DB_NAME: process.env.DB_NAME || 'dacsan3mien',
  SESSION_SECRET: process.env.SESSION_SECRET || 'secret',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGINS: parseCorsOrigins(process.env.CORS_ORIGIN),
  FILESTACK_API_KEY: process.env.FILESTACK_API_KEY || '',
  FILESTACK_STORE_LOCATION: process.env.FILESTACK_STORE_LOCATION || 'S3',
  FILESTACK_STORE_PATH: process.env.FILESTACK_STORE_PATH || ''
};
