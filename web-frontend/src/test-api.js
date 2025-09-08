// Test script to debug API calls from frontend
const axios = require('axios');

const testAPI = async () => {
  try {
    console.log('Testing API call...');
    const response = await axios.get('http://localhost:5000/api/canteens');
    console.log('SUCCESS! API Response:', response.data);
    console.log('Count:', response.data.length);
  } catch (error) {
    console.error('API Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

testAPI();
