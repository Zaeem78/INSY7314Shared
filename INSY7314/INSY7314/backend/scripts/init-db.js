const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const createAdminUser = async () => {
  try {
    // Check if admin user already exists
    const adminExists = await User.findOne({ 
      where: { email: process.env.ADMIN_EMAIL } 
    });

    if (adminExists) {
      logger.info('Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    
    await User.create({
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
      lastName: process.env.ADMIN_LAST_NAME || 'User',
      role: 'admin',
      isActive: true
    });

    logger.info('Admin user created successfully');
  } catch (error) {
    logger.error('Error creating admin user:', error);
    process.exit(1);
  }
};

const initDatabase = async () => {
  try {
    // Test the database connection
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    
    // Sync all models
    await sequelize.sync({ force: false, alter: true });
    logger.info('Database synchronized');
    
    // Create admin user
    await createAdminUser();
    
    process.exit(0);
  } catch (error) {
    logger.error('Unable to initialize database:', error);
    process.exit(1);
  }
};

// Run the initialization
initDatabase();
