// Load environment variables first
require('dotenv').config();  // ← MUST BE FIRST!

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const cron = require('node-cron');

// Import models
const User = require('./models/User');
const Appointment = require('./models/Appointment');

// Import routes
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const adminRoutes = require('./routes/admin');
const { sendAppointmentReminder } = require('./utils/emailService');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Only initialize passport if Google OAuth is configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const passport = require('./config/passport');
  app.use(passport.initialize());
  app.use(passport.session());

  // ========================================
  // GOOGLE OAUTH ROUTES
  // ========================================

  // Initiate Google OAuth - Force account selection
  app.get('/api/auth/google',
    (req, res, next) => {
      console.log('🔵 Google OAuth initiated - redirecting to Google');
      next();
    },
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      prompt: 'select_account',  // Forces Google account picker EVERY time
      accessType: 'offline'       // Allows refresh tokens
    })
  );

  // Google OAuth callback - Handle success/failure
  app.get('/api/auth/google/callback',
    (req, res, next) => {
      console.log('🔵 Google OAuth callback received from Google');
      next();
    },
    passport.authenticate('google', { 
      failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed`,
      session: true
    }),
    (req, res) => {
      try {
        console.log('✅ Google OAuth successful for user:', req.user.email);
        
        // Generate JWT token
        const token = jwt.sign(
          { userId: req.user._id }, 
          process.env.JWT_SECRET, 
          { expiresIn: '7d' }
        );
        
        console.log('🔑 JWT token generated, redirecting to frontend callback');
        
        // Redirect to frontend with token
        res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
      } catch (error) {
        console.error('❌ Error in Google OAuth callback:', error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=token_generation_failed`);
      }
    }
  );
  
  console.log('✅ Google OAuth is enabled');
} else {
  console.log('⚠️ Google OAuth is disabled (credentials not found)');
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);

// Email reminder cron job (runs every day at 9 AM)
cron.schedule('0 9 * * *', async () => {
  console.log('📧 Running daily appointment reminders...');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  try {
    const appointments = await Appointment.find({
      date: { $gte: tomorrow, $lt: dayAfterTomorrow },
      status: { $in: ['pending', 'confirmed'] },
      reminderSent: false
    }).populate('customer', 'name email');

    for (const appointment of appointments) {
      await sendAppointmentReminder(
        appointment.customer.email,
        appointment.customer.name,
        appointment
      );
      
      appointment.reminderSent = true;
      await appointment.save();
    }

    console.log(`✅ Sent ${appointments.length} appointment reminders`);
  } catch (error) {
    console.error('❌ Error sending reminders:', error);
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Backend URL: http://localhost:${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  console.log(`✨ Backend server is running smoothly!`);
});