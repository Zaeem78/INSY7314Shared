const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sanitizeInput } = require('../utils/validators');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Set JWT token as HTTP-only cookie
const setTokenCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  };

  res.cookie('token', token, cookieOptions);
};

// User registration (admin only)
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'user' } = req.sanitizedData;

    // Create new user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role,
      isActive: true
    });

    // Generate JWT token
    const token = generateToken(user.id);
    
    // Set token in HTTP-only cookie
    setTokenCookie(res, token);

    // Don't send password hash in response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Error registering user. Please try again.'
    });
  }
};

// User login
const login = async (req, res) => {
  try {
    const { email, password } = req.sanitizedData;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      return res.status(403).json({
        success: false,
        error: 'Account is temporarily locked. Please try again later.'
      });
    }

    // Check password
    const isMatch = await user.isValidPassword(password);
    if (!isMatch) {
      // Increment failed login attempts
      await user.increment('failedLoginAttempts');

      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts + 1 >= 5) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        await user.update({
          accountLockedUntil: lockUntil,
          failedLoginAttempts: 0
        });

        return res.status(403).json({
          success: false,
          error: 'Account locked. Too many failed login attempts. Please try again in 30 minutes.'
        });
      }

      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
        remainingAttempts: 5 - (user.failedLoginAttempts + 1)
      });
    }

    // Reset failed login attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await user.update({ 
        failedLoginAttempts: 0,
        accountLockedUntil: null 
      });
    }

    // Update last login time
    await user.update({ lastLogin: new Date() });

    // Generate JWT token
    const token = generateToken(user.id);
    
    // Set token in HTTP-only cookie
    setTokenCookie(res, token);

    // Don't send password hash in response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Error logging in. Please try again.'
    });
  }
};

// Get current user
const getCurrentUser = (req, res) => {
  try {
    // User is already attached to request by auth middleware
    const user = req.user.toJSON();
    delete user.password;
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching user data.'
    });
  }
};

// Logout user
const logout = (req, res) => {
  try {
    // Clear the token cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.json({
      success: true,
      message: 'Successfully logged out.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Error logging out. Please try again.'
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  logout,
  generateToken
};
