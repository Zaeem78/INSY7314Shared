const { Sequelize } = require('sequelize');
const path = require('path');
const { logger } = require('../utils/logger');
const crypto = require('crypto');

// ENCRYPTION
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'change-me-32-chars-1234567890abc';
const ALGORITHM = 'aes-256-gcm';
const getKey = () => crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  cipher.setAAD(Buffer.from('payment-system'));
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
};

const decrypt = (text) => {
  if (!text) return null;
  try {
    const [ivHex, authTagHex, encrypted] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    decipher.setAAD(Buffer.from('payment-system'));
    return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
  } catch (error) {
    logger.error('Decryption error:', error);
    return null;
  }
};

// SEQUELIZE
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: process.env.DB_LOGGING === 'true' ? (msg) => logger.debug(msg) : false,
  define: { 
    timestamps: true, 
    underscored: true, 
    paranoid: true 
  }
});

// Initialize models with sequelize instance and utils
const initUserModel = require('./User');
const initPaymentModel = require('./Payments');

// Create model instances with dependencies
const User = initUserModel(sequelize, { encrypt, decrypt });
const Payment = initPaymentModel(sequelize);

// Setup associations
const setupAssociations = () => {
  // User-Payment associations
  User.hasMany(Payment, { 
    foreignKey: 'userId', 
    as: 'payments' 
  });
  
  Payment.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user' 
  });

  logger.info('Database associations initialized');
};

// LOGIN ATTEMPTS
async function incrementLoginAttempts(userId) {
  const user = await User.findByPk(userId);
  if (!user) return null;
  
  user.loginAttempts = (user.loginAttempts || 0) + 1;
  if (user.loginAttempts >= 5) {
    user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  }
  
  await user.save();
  return user;
}

async function resetLoginAttempts(userId) {
  await User.update(
    { loginAttempts: 0, lockUntil: null }, 
    { where: { id: userId } }
  );
}

// TEST CONNECTION
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');
    
    // Setup associations after connection
    setupAssociations();
    
    // Sync models with database
    await sequelize.sync({ alter: true });
    logger.info('Database synchronized');
    
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  incrementLoginAttempts,
  resetLoginAttempts,
  encrypt,
  decrypt,
  models: { User, Payment }
};