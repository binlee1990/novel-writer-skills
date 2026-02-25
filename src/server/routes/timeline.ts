import { Router } from 'express';
import type { DataSource } from '../types.js';

export function createTimelineRouter(ds: DataSource): Router {
  const router = Router({ mergeParams: true });

  // GET /api/stories/:story/timeline?vol=X
  router.get('/', async (req, res) => {
    try {
      const vol = req.query.vol ? parseInt(req.query.vol as string, 10) : undefined;
      const events = await ds.getTimeline(req.params.story, vol);
      res.json(events);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
