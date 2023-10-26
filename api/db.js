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

const MAX_RETRIES = 10;
let retries = 0;

async function waitForConnection() {
  let isConnected = false;
  while (!isConnected && retries < MAX_RETRIES) {
    isConnected = await checkConnection();
    if (!isConnected) {
      retries += 1;
      console.log(`Failed to connect to DB. Retrying in 3 seconds... (Attempt ${retries}/${MAX_RETRIES})`);
      await new Promise(res => setTimeout(res, 3000));
    }
  }

  if (retries === MAX_RETRIES) {
    throw new Error("Max retries reached. Could not connect to DB.");
  }

  console.log("Connected to DB!");
}


waitForConnection().catch(error => {
  console.error("Error while waiting for DB connection:", error);
  process.exit(1); // Exit the process if there's an error
});

module.exports = pool;
