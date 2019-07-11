import Koa from 'koa';

const app = new Koa();

const PORT = 3000;

app.use(async function(ctx, next) {
    try {
        await next();
    } catch (err) {
        // some errors will have .status
        // however this is not a guarantee
        ctx.status = err.status || 500;
        ctx.type = 'json';
        ctx.body = {
            status: 'failed',
            message: err.message || 'Something Failed!',
        };

        // since we handled this manually we'll
        // want to delegate to the regular app
        // level error handling as well so that
        // centralized still functions correctly.
        ctx.app.emit('error', err, ctx);
    }
});

app.use(async (ctx: any, next: any) => {
    await next();
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});

