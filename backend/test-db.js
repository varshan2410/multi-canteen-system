require('dotenv').config();

const { Pool } = require('pg');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'multi_canteen_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

console.log('Testing database connection with config:', {
  host: DB_CONFIG.host,
  port: DB_CONFIG.port,
  database: DB_CONFIG.database,
  user: DB_CONFIG.user,
  password: '***'
});

const db = new Pool(DB_CONFIG);

const testConnection = async () => {
  try {
    console.log('Attempting to connect to database...');
    const client = await db.connect();
    console.log('✅ Database connected successfully!');
    
    // Test query
    const result = await client.query('SELECT COUNT(*) FROM canteens');
    console.log('✅ Canteens table exists, count:', result.rows[0].count);
    
    // Get canteens data
    const canteensResult = await client.query('SELECT * FROM canteens');
    console.log('✅ Canteens data:', canteensResult.rows);
    
    client.release();
    await db.end();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  }
};

testConnection();
