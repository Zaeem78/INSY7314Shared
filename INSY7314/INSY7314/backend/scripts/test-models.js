const { sequelize, testConnection } = require('../config/database');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { v4: uuidv4 } = require('uuid');

async function testModels() {
  try {
    // Test database connection and sync models
    await testConnection();
    
    console.log('\n=== Testing User Model ===');
    
    // Create a test user
    const testUser = await User.create({
      email: `testuser-${Date.now()}@example.com`,
      password: 'Test@Password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'customer'
    });
    
    console.log('✅ Created test user:', testUser.toJSON());
    
    // Test password hashing
    const isPasswordValid = await testUser.isPasswordValid('Test@Password123');
    console.log('✅ Password validation:', isPasswordValid ? 'PASSED' : 'FAILED');
    
    // Test login attempts
    console.log('\n=== Testing Login Attempts ===');
    for (let i = 0; i < 3; i++) {
      try {
        await User.findByCredentials(testUser.email, 'wrongpassword');
      } catch (error) {
        console.log(`Login attempt ${i + 1}: ${error.message}`);
      }
    }
    
    // Check lock status
    const updatedUser = await User.scope('withSensitiveData').findByPk(testUser.id);
    console.log('Failed login attempts:', updatedUser.failedLoginAttempts);
    console.log('Account locked:', updatedUser.isLocked() ? 'YES' : 'NO');
    
    // Reset login attempts
    await updatedUser.resetLoginAttempts();
    console.log('✅ Reset login attempts');
    
    console.log('\n=== Testing Payment Model ===');
    
    // Create a test payment
    const testPayment = await Payment.create({
      userId: testUser.id,
      amount: 100.50,
      currency: 'USD',
      fee: 5.00,
      beneficiaryName: 'John Doe',
      beneficiaryAccount: '1234567890',
      beneficiaryBank: 'Test Bank',
      beneficiaryBankCountry: 'US',
      swiftCode: 'TESTUS33',
      status: 'pending'
    });
    
    console.log('✅ Created test payment:', testPayment.toJSON());
    console.log('Formatted amount:', testPayment.getFormattedAmount());
    console.log('Formatted total:', testPayment.getFormattedTotal());
    
    // Test model associations
    console.log('\n=== Testing Associations ===');
    const userWithPayments = await User.scope('withSensitiveData').findByPk(testUser.id, {
      include: [{
        model: Payment,
        as: 'payments'
      }]
    });
    
    console.log('User with payments:', {
      id: userWithPayments.id,
      email: userWithPayments.email,
      paymentCount: userWithPayments.payments ? userWithPayments.payments.length : 0
    });
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await sequelize.close();
    process.exit(0);
  }
}

// Run the tests
testModels();
