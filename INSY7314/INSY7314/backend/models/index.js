// backend/models/index.js
const db = require('./database');

// Initialize Payments model (class-based)
db.models.Payments.initialize(db.sequelize);
db.models.Payments.associate(db.models);

// Export models and utilities
module.exports = {
  // Models
  User: db.models.User,
  Payment: db.models.Payment,
  
  // Database connection
  sequelize: db.sequelize,
  
  // Utility functions
  testConnection: db.testConnection,
  incrementLoginAttempts: db.incrementLoginAttempts,
  resetLoginAttempts: db.resetLoginAttempts,
  encrypt: db.encrypt,
  decrypt: db.decrypt,
  
  // Constants
  ROLES: {
    ADMIN: 'admin',
    STAFF: 'staff',
    USER: 'user'
  }
};