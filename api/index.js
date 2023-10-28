const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const apiRouter = require('./routes');
const sequelize = require('./db'); // Assuming db.js is now setting up Sequelize

const app = new Koa();
const router = new Router();
const PORT = 3000;

router.use('/', apiRouter.routes());

app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

// Ensure Sequelize connection before starting the server
sequelize.authenticate()
  .then(() => {
    console.log('Connected to the database successfully.');
    app.listen(PORT, () => {
      console.log(`Server started on http://0.0.0.0:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
