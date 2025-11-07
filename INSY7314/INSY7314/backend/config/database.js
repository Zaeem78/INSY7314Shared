// backend/config/database.js
const { Sequelize } = require('sequelize');
const path = require('path');
const { logger } = require('../utils/logger');
const crypto = require('crypto');

// ENCRYPTION
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'MySuperSecret32ByteKey1234567890';
const getKey = () => crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  cipher.setAAD(Buffer.from('pay'));
  let e = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
  return iv.toString('hex') + ':' + cipher.getAuthTag().toString('hex') + ':' + e;
};

const decrypt = (text) => {
  if (!text) return null;
  try {
    const [iv, tag, data] = text.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    decipher.setAAD(Buffer.from('pay'));
    return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
  } catch { return null; }
};

// SEQUELIZE
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: false
});

// LOAD MODELS
const User = require('../models/User')(sequelize);
const Payments = require('../models/Payments');

// INITIALIZE
Payments.initialize(sequelize);
Payments.associate({ User });

// LOGIN LOCK
async function incrementLoginAttempts(userId) {
  const user = await User.findByPk(userId);
  if (!user) return null;
  user.loginAttempts = (user.loginAttempts || 0) + 1;
  if (user.loginAttempts >= 5) user.lockUntil = Date.now() + 15 * 60 * 1000;
  await user.save();
  return user;
}

async function resetLoginAttempts(userId) {
  await User.update({ loginAttempts: 0, lockUntil: null }, { where: { id: userId } });
}

// TEST
async function testConnection(options = {}) {
  const { force = false, alter = false } = options;
  
  try {
    // Test the connection
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    
    // Sync all models
    await sequelize.sync({ force, alter });
    logger.info(`Database synchronized (force: ${force}, alter: ${alter})`);
    
    return true;
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  testConnection,
  incrementLoginAttempts,
  resetLoginAttempts,
  encrypt,
  decrypt,
  models: { User, Payment: Payments }
};