const express = require('express');
const dotenv = require('dotenv');

// Load environment variables FIRST before any other imports
dotenv.config();

const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('./config/passport');
const connectDB = require('./config/db');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads/profile');

// Connect to database
connectDB();

// Initialize post scheduler
const { initializeScheduler } = require('./controllers/scheduleController');
initializeScheduler();

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Initialize express
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false,
}));

// Update your CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://yourproductiondomain.com' 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with', 'Accept', 'Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));

// Stripe webhook endpoint (MUST be before express.json() middleware)
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log('⚠️  Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      console.log('✅ Checkout session completed:', event.data.object.id);
      // Handle successful payment here
      break;
    case 'customer.subscription.created':
      console.log('✅ Subscription created:', event.data.object.id);
      // Update user subscription in database
      break;
    case 'invoice.payment_succeeded':
      console.log('✅ Payment succeeded for invoice:', event.data.object.id);
      break;
    case 'customer.subscription.deleted':
      console.log('❌ Subscription cancelled:', event.data.object.id);
      // Handle subscription cancellation
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});

// Body parser (AFTER webhook endpoint)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration for Passport
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Add near your other middleware setup

// Increase payload size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Request logger with detailed debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  
  // Log request body for POST/PUT requests
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
  }
  
  next();
});

// Make uploads directory accessible
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', require('./routes/profileRoutes'));

// Add this with your other routes
const mediaRoutes = require('./routes/mediaRoutes');
app.use('/api/media', mediaRoutes);


// Add ads routes
const adRoutes = require('./routes/adRoutes');
app.use('/api/ads', adRoutes);

// Add caption routes
const captionRoutes = require('./routes/captionRoutes');
app.use('/api/caption', captionRoutes);

// Add social media routes
const socialMediaRoutes = require('./routes/socialMedia');
app.use('/api/social-media', socialMediaRoutes);

// Add subscription routes
const subscriptionRoutes = require('./routes/subscriptionRoutes');
app.use('/api/subscription', subscriptionRoutes);

// Add post routes
const postRoutes = require('./routes/postRoutes');
app.use('/api/posts', postRoutes);

// Notification routes
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);
// Schedule routes
const scheduleRoutes = require('./routes/scheduleRoutes');
app.use('/api/schedule', scheduleRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong!',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});
