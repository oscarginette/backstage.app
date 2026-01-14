/**
 * Test API endpoint directly
 */

const http = require('http');

async function testAPI() {
  const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/campaigns?status=draft',
    method: 'GET',
    headers: {
      'Cookie': 'authjs.session-token=YOUR_SESSION_TOKEN_HERE' // You'll need to get this from browser
    }
  };

  console.log('Testing GET /api/campaigns?status=draft\n');
  console.log('Note: You need to be logged in and replace YOUR_SESSION_TOKEN_HERE with actual session token');
  console.log('Get it from browser DevTools > Application > Cookies > authjs.session-token\n');
}

testAPI();
