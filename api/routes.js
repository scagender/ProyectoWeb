const Router = require('koa-router');
const { User, Course, Plan } = require('./models'); 

const router = new Router();

router.get('/users', async (ctx) => {
  console.log("GET /users")
  const users = await User.findAll();
  ctx.body = users;
});

router.get('/courses', async (ctx) => {
  console.log("GET /courses")
  const courses = await Course.findAll();
  ctx.body = courses;
});

router.get('/plans', async (ctx) => {
  console.log("GET /courses")
  const plans = await Plan.findAll();
  ctx.body = plans;
});

router.get('/plans/:userId', async (ctx) => {
  console.log("GET /courses")
  const { userId } = ctx.params;
  const userPlans = await Plan.findAll({ where: { user_id: userId } });
  ctx.body = userPlans;
});

router.get('/plans/:planId/courses', async (ctx) => {
  console.log("GET /courses")
  const { planId } = ctx.params;
  const plan = await Plan.findByPk(planId, {
    include: Course 
  });
  ctx.body = plan.Courses; 
});

module.exports = router;
