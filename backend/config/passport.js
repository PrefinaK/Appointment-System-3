const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Only configure if Google credentials exist
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log('Google OAuth callback triggered');
          console.log('Profile:', profile.displayName, profile.emails[0].value);
          
          // Check if user already exists by email
          let user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            console.log('Existing user found:', user.email);
            // User exists, update Google ID if not set
            if (!user.googleId) {
              user.googleId = profile.id;
              await user.save();
              console.log('Updated Google ID for existing user');
            }
            return done(null, user);
          }

          // Create new user with Google account
          console.log('Creating new user from Google account');
          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            password: 'google-oauth-' + Math.random().toString(36).substring(2, 15),
            role: 'customer', // Default to customer, user can change later
            phone: '',
            businessName: ''
          });

          await user.save();
          console.log('New user created:', user.email);
          done(null, user);
          
        } catch (error) {
          console.error('Google OAuth error:', error);
          done(error, null);
        }
      }
    )
  );
  
  console.log('✅ Google OAuth Strategy configured');
} else {
  console.log('⚠️ Google OAuth disabled - credentials not found');
}

module.exports = passport;