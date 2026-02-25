import { Router } from 'express';
import type { DataSource } from '../types.js';

export function createRelationshipsRouter(ds: DataSource): Router {
  const router = Router({ mergeParams: true });

  // GET /api/stories/:story/relationships?vol=X
  router.get('/', async (req, res) => {
    try {
      const vol = req.query.vol ? parseInt(req.query.vol as string, 10) : undefined;
      const graph = await ds.getRelationships(req.params.story, vol);
      res.json(graph);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stories/:story/relationships/history
  router.get('/history', async (req, res) => {
    try {
      const history = await ds.getRelationshipHistory(req.params.story);
      res.json(history);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
