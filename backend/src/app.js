const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const { MONGODB_URI, DB_NAME, SESSION_SECRET, NODE_ENV, CORS_ORIGINS } = require('./config/env');

const productsRoutes = require('./routes/products.routes');
const usersRoutes = require('./routes/users.routes');
const cartRoutes = require('./routes/cart.routes');
const ordersRoutes = require('./routes/orders.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const blogsRoutes = require('./routes/blogs.routes');
const couponsRoutes = require('./routes/coupons.routes');

const app = express();
const isProduction = NODE_ENV === 'production';
const allowedOrigins = new Set(CORS_ORIGINS);
const frontendAssetsPath = path.resolve(__dirname, '../../frontend/src/assets');

app.set('trust proxy', 1);

app.use(morgan('combined'));
app.use('/assets', express.static(frontendAssetsPath, {
  maxAge: '1d'
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    dbName: DB_NAME,
    collectionName: 'sessions'
  }),
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.get('/health', (_req, res) => {
  return res.status(200).json({ status: 'ok' });
});

app.use('/products', productsRoutes);
app.use('/user', usersRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', ordersRoutes);
app.use('/feedback', feedbackRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/blogs', blogsRoutes);
app.use('/coupons', couponsRoutes);

app.use((err, _req, res, _next) => {
  if (err && err.message.startsWith('CORS blocked')) {
    return res.status(403).json({ message: err.message });
  }
  return res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = app;
