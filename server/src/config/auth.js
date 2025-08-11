require('dotenv').config();

const authConfig = {
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key', // Change this to a strong secret in production
    expiresIn: '8h', // Token expiration time
    issuer: 'smart-presence-api',
    audience: 'smart-presence-client',
  },
  
  // Password hashing
  password: {
    saltRounds: 10, // Number of salt rounds for bcrypt
    minLength: 8, // Minimum password length
    requireSpecialChar: true, // Require special characters
    requireNumber: true, // Require numbers
    requireUppercase: true, // Require uppercase letters
  },
  
  // Rate limiting for authentication endpoints
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many login attempts, please try again later.',
  },
  
  // Session management
  session: {
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Enable in production with HTTPS
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
  },
  
  // CORS configuration
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
};

module.exports = authConfig;
