require('dotenv').config();

module.exports = {
  PORT: Number(process.env.PORT || 3002),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017',
  DB_NAME: process.env.DB_NAME || 'dacsan3mien',
  SESSION_SECRET: process.env.SESSION_SECRET || 'secret',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:4200'
};
