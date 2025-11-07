const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: () => require('crypto').randomUUID()
    },
    fullName: { type: DataTypes.TEXT },
    idNumber: { type: DataTypes.TEXT },
    accountNumber: { type: DataTypes.TEXT },
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    salt: { type: DataTypes.STRING, allowNull: false },
    loginAttempts: { type: DataTypes.INTEGER, defaultValue: 0 },
    lockUntil: { type: DataTypes.DATE }
  }, { 
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    defaultScope: {
      attributes: { exclude: ['passwordHash', 'salt'] }
    },
    scopes: {
      withSensitive: {
        attributes: { include: ['id', 'email'] }
      }
    },
    hooks: {
      beforeCreate: async (user) => {
        const bcrypt = await import('bcrypt');
        const SALT_ROUNDS = 10;
        if (user.changed('passwordHash')) {
          user.salt = await bcrypt.genSalt(SALT_ROUNDS);
          user.passwordHash = await bcrypt.hash(user.passwordHash, user.salt);
        }
      }
    }
  });

  // Instance methods
  User.prototype.verifyPassword = async function(password) {
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash(password, this.salt);
    return hash === this.passwordHash;
  };

  User.prototype.isLocked = function() {
    return this.lockUntil && this.lockUntil > new Date();
  };

  // Class methods
  User.beforeCreate(async (user) => {
    const bcrypt = await import('bcrypt');
    const SALT_ROUNDS = 10;
    if (user.changed('passwordHash')) {
      user.salt = await bcrypt.genSalt(SALT_ROUNDS);
      user.passwordHash = await bcrypt.hash(user.passwordHash, user.salt);
    }
  });

  return User;
};