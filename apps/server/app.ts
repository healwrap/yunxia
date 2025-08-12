const koa = require('koa');
const app = new koa();

app.use(async (ctx: any) => {
  ctx.body = 'hello world';
});

const port = 3000;
app.listen(port, () => {
  console.log(`server is running at http://localhost:${port}`);
});
