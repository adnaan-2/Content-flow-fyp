const axios = require('axios');

const testPasswordReset = async () => {
  try {
    console.log('Testing password reset flow...\n');
    
    // Test 1: Forgot Password
    console.log('1. Testing forgot password endpoint...');
    const forgotResponse = await axios.post('http://localhost:5000/api/auth/forgot-password', {
      email: 'asifmehsood2233@gmail.com'
    });
    
    console.log('✅ Forgot password response:', forgotResponse.data);
    console.log('Status:', forgotResponse.status);
    
    // Note: In a real test, you would need to extract the reset token from the email
    // For testing purposes, we can't easily test the reset password endpoint
    // without the actual token from the email
    
  } catch (error) {
    console.error('❌ Error occurred:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data);
    console.error('Full error:', error.message);
  }
};

// Test the auth test endpoint first
const testAuthEndpoint = async () => {
  try {
    console.log('Testing auth test endpoint...');
    const response = await axios.get('http://localhost:5000/api/auth/test');
    console.log('✅ Auth test response:', response.data);
  } catch (error) {
    console.error('❌ Auth test failed:', error.message);
  }
};

// Run tests
const runTests = async () => {
  await testAuthEndpoint();
  console.log('\n' + '='.repeat(50) + '\n');
  await testPasswordReset();
};

runTests();