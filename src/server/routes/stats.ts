import { Router } from 'express';
import type { DataSource } from '../types.js';

export function createStatsRouter(ds: DataSource): Router {
  const router = Router();

  // GET /api/stats/dashboard?story=X
  router.get('/dashboard', async (req, res) => {
    try {
      const story = req.query.story as string;
      if (!story) {
        res.status(400).json({ error: '缺少 story 参数' });
        return;
      }
      const stats = await ds.getDashboardStats(story);
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
