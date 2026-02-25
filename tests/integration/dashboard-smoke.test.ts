import { createApp } from '../../src/server/index.js';
import http from 'http';

describe('Dashboard smoke test', () => {
  let server: http.Server;

  afterEach((done) => {
    if (server) server.close(done);
    else done();
  });

  it('GET /api/health returns ok', (done) => {
    const app = createApp(process.cwd());
    server = app.listen(0, () => {
      const addr = server.address() as any;
      http.get(`http://localhost:${addr.port}/api/health`, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          const json = JSON.parse(body);
          expect(json.status).toBe('ok');
          done();
        });
      });
    });
  });

  it('GET / returns HTML or 404 (SPA fallback)', (done) => {
    const app = createApp(process.cwd());
    server = app.listen(0, () => {
      const addr = server.address() as any;
      http.get(`http://localhost:${addr.port}/`, (res) => {
        expect([200, 404]).toContain(res.statusCode);
        res.resume();
        res.on('end', done);
      });
    });
  });
});
