const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
});

async function checkConnection() {
  try {
    const client = await pool.connect();
    client.release();
    return true;
  } catch (err) {
    return false;
  }
}

async function waitForConnection() {
  let isConnected = false;
  while (!isConnected) {
    isConnected = await checkConnection();
    if (!isConnected) {
      console.log("Failed to connect to DB. Retrying in 3 seconds...");
      await new Promise(res => setTimeout(res, 3000));
    }
  }
  console.log("Connected to DB!");
}

module.exports = pool;
