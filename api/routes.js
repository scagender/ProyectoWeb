const Router = require('koa-router');
const { User, Course, Plan } = require('./models'); 

const router = new Router();

router.get('/users', async (ctx) => {
  const users = await User.findAll();
  ctx.body = users;
});

router.get('/courses', async (ctx) => {
  const courses = await Course.findAll();
  ctx.body = courses;
});

router.get('/plans', async (ctx) => {
  const plans = await Plan.findAll();
  ctx.body = plans;
});

router.get('/plans/:userId', async (ctx) => {
  const { userId } = ctx.params;
  const userPlans = await Plan.findAll({ where: { user_id: userId } });
  ctx.body = userPlans;
});

router.get('/plans/:planId/courses', async (ctx) => {
  const { planId } = ctx.params;
  const plan = await Plan.findByPk(planId, {
    include: Course 
  });
  ctx.body = plan.Courses; 
});

module.exports = router;
