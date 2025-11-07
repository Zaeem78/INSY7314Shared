// backend/models/Payments.js
const { DataTypes, Model } = require('sequelize');
const { validateSwiftCode } = require('../utils/validators');

class Payment extends Model {
  // FORMAT MONEY
  getFormattedAmount() {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency || 'USD'
    }).format(this.amount);
  }

  static initialize(sequelize) {
    this.init({
      referenceNumber: { type: DataTypes.STRING, unique: true, allowNull: false },
      amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      currency: { type: DataTypes.STRING(3), allowNull: false },
      fee: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0.00 },
      totalAmount: {
        type: DataTypes.VIRTUAL,
        get() { return (parseFloat(this.amount) + parseFloat(this.fee || 0)).toFixed(2); }
      },
      beneficiaryName: { type: DataTypes.TEXT, allowNull: false },
      beneficiaryAccount: { type: DataTypes.STRING, allowNull: false },
      beneficiaryBank: { type: DataTypes.STRING, allowNull: false },
      beneficiaryBankCountry: { type: DataTypes.STRING(2), allowNull: false },
      swiftCode: {
        type: DataTypes.STRING(11),
        allowNull: false,
        validate: {
          isValidSwiftCode(value) {
            if (!validateSwiftCode(value)) {
              throw new Error('Invalid SWIFT/BIC code');
            }
          }
        }
      },
      status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'on_hold'),
        defaultValue: 'pending'
      },
      userId: { type: DataTypes.STRING, allowNull: false },
      processedById: { type: DataTypes.STRING }
    }, {
      sequelize,
      modelName: 'Payment',
      tableName: 'payments',
      timestamps: true,
      paranoid: true,
      hooks: {
        beforeCreate: (p) => {
          if (!p.referenceNumber) p.referenceNumber = `PAY-${Date.now()}`;
          const { encrypt } = require('../config/database');
          p.beneficiaryName = encrypt(p.beneficiaryName);
          p.beneficiaryAccount = encrypt(p.beneficiaryAccount);
        },
        beforeUpdate: (p) => {
          const { encrypt } = require('../config/database');
          if (p.changed('beneficiaryName')) p.beneficiaryName = encrypt(p.beneficiaryName);
          if (p.changed('beneficiaryAccount')) p.beneficiaryAccount = encrypt(p.beneficiaryAccount);
        }
      }
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    this.belongsTo(models.User, { foreignKey: 'processedById', as: 'processedBy' });
  }
}

module.exports = Payment;