const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');

const DB_PATH = path.join(__dirname, 'payments.db');

// Encryption utilities
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
const ALGORITHM = 'aes-256-gcm';

// Create a 32-byte key for AES-256 from the provided key
const getEncryptionKey = () => {
  const hash = crypto.createHash('sha256');
  hash.update(ENCRYPTION_KEY);
  return hash.digest();
};

function encrypt(text) {
  if (!text) return null;

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  cipher.setAAD(Buffer.from('payment-system'));

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText) {
  if (!encryptedText) return null;

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return null;

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);
    decipher.setAAD(Buffer.from('payment-system'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    return null;
  }
}

// Initialize database
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        reject(err);
        return;
      }
      console.log('✅ Connected to SQLite database');
    });

    // Create Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        fullName TEXT NOT NULL,
        idNumber TEXT NOT NULL,
        accountNumber TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        salt TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err.message);
        reject(err);
        return;
      }
    });

    // Create Payments table
    db.run(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        currency TEXT NOT NULL,
        paymentProvider TEXT NOT NULL,
        beneficiaryAccountNumber TEXT NOT NULL,
        beneficiarySwiftCode TEXT NOT NULL,
        beneficiaryName TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) {
        console.error('Error creating payments table:', err.message);
        reject(err);
        return;
      }
      console.log('✅ Database tables created successfully');
      resolve(db);
    });
  });
}

// Database query functions
async function createUser(userData) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    const { id, fullName, idNumber, accountNumber, username, passwordHash, salt } = userData;

    const query = `
      INSERT INTO users (id, fullName, idNumber, accountNumber, username, passwordHash, salt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [id, fullName, idNumber, accountNumber, username, passwordHash, salt], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: id, ...userData });
      }
      db.close();
    });
  });
}

async function findUserByUsername(username) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);

    const query = 'SELECT * FROM users WHERE username = ?';
    db.get(query, [username], (err, row) => {
      if (err) {
        reject(err);
      } else {
        if (row) {
          // Decrypt sensitive fields before returning
          resolve({
            ...row,
            fullName: decrypt(row.fullName),
            idNumber: decrypt(row.idNumber),
            accountNumber: decrypt(row.accountNumber)
          });
        } else {
          resolve(null);
        }
      }
      db.close();
    });
  });
}

async function findUserById(id) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);

    const query = 'SELECT * FROM users WHERE id = ?';
    db.get(query, [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        if (row) {
          // Decrypt sensitive fields before returning
          resolve({
            ...row,
            fullName: decrypt(row.fullName),
            idNumber: decrypt(row.idNumber),
            accountNumber: decrypt(row.accountNumber)
          });
        } else {
          resolve(null);
        }
      }
      db.close();
    });
  });
}

async function createPayment(paymentData) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    const { id, userId, amount, currency, paymentProvider, beneficiaryAccountNumber, beneficiarySwiftCode, beneficiaryName } = paymentData;

    const query = `
      INSERT INTO payments (id, userId, amount, currency, paymentProvider, beneficiaryAccountNumber, beneficiarySwiftCode, beneficiaryName)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [id, userId, amount, currency, paymentProvider, beneficiaryAccountNumber, beneficiarySwiftCode, beneficiaryName], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: id, ...paymentData });
      }
      db.close();
    });
  });
}

async function getUserPayments(userId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);

    const query = `
      SELECT p.*, u.fullName as userName
      FROM payments p
      JOIN users u ON p.userId = u.id
      WHERE p.userId = ?
      ORDER BY p.createdAt DESC
    `;

    db.all(query, [userId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const decryptedRows = rows.map(row => ({
          ...row,
          beneficiaryAccountNumber: decrypt(row.beneficiaryAccountNumber),
          beneficiarySwiftCode: decrypt(row.beneficiarySwiftCode),
          beneficiaryName: decrypt(row.beneficiaryName)
        }));
        resolve(decryptedRows);
      }
      db.close();
    });
  });
}

module.exports = {
  initializeDatabase,
  encrypt,
  decrypt,
  createUser,
  findUserByUsername,
  findUserById,
  createPayment,
  getUserPayments
};
