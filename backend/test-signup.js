const axios = require('axios');

const testSignup = async () => {
  try {
    console.log('Testing signup endpoint...');
    
    const testData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpass123'
    };
    
    console.log('Sending request with data:', testData);
    
    const response = await axios.post('http://localhost:5000/api/auth/register', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Success! Response:', response.data);
    console.log('Status:', response.status);
    
  } catch (error) {
    console.error('Error occurred:');
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
    console.log('Auth test response:', response.data);
  } catch (error) {
    console.error('Auth test failed:', error.message);
  }
};

// Run both tests
const runTests = async () => {
  await testAuthEndpoint();
  console.log('\n' + '='.repeat(50) + '\n');
  await testSignup();
};

runTests();