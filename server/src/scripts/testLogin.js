const axios = require('axios');
const { logger } = require('../utils/logger');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:3000/api/v1/users/login', {
      username: 'admin',
      password: 'admin123' // Default password from seed
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Login successful!');
    console.log('Response:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });

    // Try to get current user
    const cookies = response.headers['set-cookie'];
    console.log('Cookies received:', cookies);

    if (cookies && cookies.length > 0) {
      const meResponse = await axios.get('http://localhost:3000/api/v1/users/me', {
        withCredentials: true,
        headers: {
          'Cookie': cookies.join('; ')
        }
      });
      
      console.log('\nCurrent user:');
      console.log(meResponse.data);
    }
  } catch (error) {
    if (error.response) {
      console.error('Error response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    process.exit(0);
  }
}

testLogin();
