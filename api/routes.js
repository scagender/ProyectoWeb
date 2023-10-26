const Router = require('koa-router');
const pool = require('./db');

const router = new Router();

router.get('/users', async (ctx) => {
  const data = await getUsersData();
  ctx.body = data;
});

router.get('/courses', async (ctx) => {
  const data = await getCoursesData();
  ctx.body = data;
});

router.get('/plans', async (ctx) => {
  const data = await getPlansData();
  ctx.body = data;
});

router.get('/plans/:userId', async (ctx) => {
  const { userId } = ctx.params;
  const data = await getUserPlansData(userId);
  ctx.body = data;
});

router.get('/plans/:planId/courses', async (ctx) => {
  const { planId } = ctx.params;
  const data = await getPlanCoursesData(planId);
  ctx.body = data;
});

async function getUsersData() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM users');
    return res.rows;
  } finally {
    client.release();
  }
}

async function getCoursesData() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM courses');
    return res.rows;
  } finally {
    client.release();
  }
}

async function getPlansData() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM plans');
    return res.rows;
  } finally {
    client.release();
  }
}

async function getUserPlansData(userId) {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM plans WHERE user_id = $1', [userId]);
    return res.rows;
  } finally {
    client.release();
  }
}

async function getPlanCoursesData(planId) {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT c.* FROM courses c
      JOIN plan_courses pc ON c.id = pc.course_id
      WHERE pc.plan_id = $1
    `, [planId]);
    return res.rows;
  } finally {
    client.release();
  }
}

module.exports = router;
