const { Pool } = require('pg');

const testCredentials = async (user, password) => {
  const DB_CONFIG = {
    host: 'localhost',
    port: 5432,
    database: 'multi_canteen_db',
    user: user,
    password: password,
  };

  console.log(`Testing credentials: user=${user}, password=${password}`);
  
  const db = new Pool(DB_CONFIG);
  
  try {
    const client = await db.connect();
    console.log(`✅ SUCCESS with user=${user}, password=${password}`);
    const result = await client.query('SELECT COUNT(*) FROM canteens');
    console.log(`Canteens count: ${result.rows[0].count}`);
    client.release();
    await db.end();
    return true;
  } catch (error) {
    console.log(`❌ FAILED with user=${user}, password=${password}: ${error.message}`);
    await db.end();
    return false;
  }
};

const testAllCredentials = async () => {
  const credentials = [
    ['varshan24', 'password'],
    ['varshan24', ''],
    ['postgres', 'password'],
    ['postgres', ''],
    ['varshan24', 'varshan24'],
    ['postgres', 'postgres'],
  ];

  for (const [user, password] of credentials) {
    const success = await testCredentials(user, password);
    if (success) {
      console.log(`\n🎉 WORKING CREDENTIALS: user=${user}, password=${password}`);
      break;
    }
  }
};

testAllCredentials();
