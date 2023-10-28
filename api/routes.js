const Router = require('koa-router');
const { User, Course, Plan } = require('./models'); 

const router = new Router();
// USERS

router.get('/users', async (ctx) => {
  console.log("GET /users")
  const users = await User.findAll();
  ctx.body = users;
});

router.post('/create-users', async (ctx) => {
  try{
      console.log(ctx.request.body)
      const user = await User.create(ctx.request.body);
      ctx.body = user;
      ctx.status = 201;
  } catch (error) {
    console.log(error)
    ctx.body = error;
    ctx.status = 400;

  }
});

// COURSES


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
