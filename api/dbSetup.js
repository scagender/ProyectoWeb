const pool = require('./db')

async function ensureTablesExist () {
  await ensureUsersTable()
  await ensureCoursesTable()
  await ensurePlansTable()
  await ensurePlanCoursesTable()
}

async function ensureUsersTable () {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL 
        -- no es lo mas seguro pero la alternativa es hacer un setup de auth0
      )
    `)
  } finally {
    client.release()
  }
}

async function ensureCoursesTable () {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        code VARCHAR(255) NOT NULL,
        credits INTEGER,
        owner INTEGER,
        CONSTRAINT fk_owner FOREIGN KEY (owner) REFERENCES users(id)
      )
    `)
  } finally {
    client.release()
  }
}

async function ensurePlansTable () {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id SERIAL PRIMARY KEY,
        semester VARCHAR(100),
        user_id INTEGER REFERENCES users(id)
      )
    `)
  } finally {
    client.release()
  }
}

async function ensurePlanCoursesTable () {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS plan_courses (
        plan_id INTEGER REFERENCES plans(id),
        course_id INTEGER REFERENCES courses(id),
        PRIMARY KEY (plan_id, course_id)
      )
    `)
  } finally {
    client.release()
  }
}

module.exports = ensureTablesExist
