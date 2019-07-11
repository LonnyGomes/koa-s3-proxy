import Koa from 'koa';
import { S3 } from 'aws-sdk';

const app = new Koa();
const s3 = new S3();

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
            message: err.message || 'Something Failed!'
        };

        // since we handled this manually we'll
        // want to delegate to the regular app
        // level error handling as well so that
        // centralized still functions correctly.
        ctx.app.emit('error', err, ctx);
    }
});

app.use(async (ctx: any, next: any) => {
    const { url, method, header } = ctx.request;
    try {
        const basePath = 'site';
        const Bucket = 'lonnygomes';
        const Key = url.match(/\/$/)
            ? `${basePath}${url}index.html`
            : `${basePath}${url}`;

        const params = { Bucket, Key };
        const s3result = await s3.getObject(params).promise();
        const s3Stream = s3.getObject(params).createReadStream();
        ctx.response.set('Content-Type', s3result.ContentType);
        ctx.response.set('Content-Length', s3result.ContentLength);
        ctx.response.set('ETag', s3result.ETag);
        ctx.status = 200;
        ctx.body = s3Stream;
    } catch (err) {
        if (err.code === 'NoSuchKey') {
            ctx.status = 404;
            ctx.body = `${url} not found`;
        } else {
            ctx.status = 500;
            throw err;
        }
    }
    await next();
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
