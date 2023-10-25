const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const stocksRouter = require('./routes');

const app = new Koa();
const router = new Router();
const ensureTablesExist = require('./dbSetup');
const PORT = 3000;

router.use('/api', stocksRouter.routes());

app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

(async () => {
    await ensureTablesExist();
    app.listen(PORT, () => {
      console.log(`Server started on http://localhost:${PORT}`);
    });
  })();
