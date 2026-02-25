import { createApp } from '../../../src/server/index.js';
import http from 'http';

describe('createApp', () => {
  it('returns an express app with listen method', () => {
    const app = createApp('/fake/project');
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
  });

  it('GET /api/health returns ok', (done) => {
    const app = createApp('/fake/project');
    const server = app.listen(0, () => {
      const addr = server.address() as any;
      http.get(`http://localhost:${addr.port}/api/health`, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          const json = JSON.parse(body);
          expect(json.status).toBe('ok');
          expect(json.project).toBe('/fake/project');
          server.close(done);
        });
      });
    });
  });
});
