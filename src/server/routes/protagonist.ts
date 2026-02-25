import { Router, Request, Response } from 'express';
import type { DataSource } from '../types.js';

export function createProtagonistRouter(ds: DataSource): Router {
  const router = Router({ mergeParams: true });

  // GET /api/stories/:story/protagonist/overview
  router.get('/overview', async (req: Request<{ story: string }>, res: Response) => {
    try {
      const data = await ds.getProtagonistOverview(req.params.story);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stories/:story/protagonist/skills
  router.get('/skills', async (req: Request<{ story: string }>, res: Response) => {
    try {
      const data = await ds.getProtagonistSkills(req.params.story);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stories/:story/protagonist/inventory
  router.get('/inventory', async (req: Request<{ story: string }>, res: Response) => {
    try {
      const data = await ds.getProtagonistInventory(req.params.story);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stories/:story/protagonist/cultivation
  router.get('/cultivation', async (req: Request<{ story: string }>, res: Response) => {
    try {
      const data = await ds.getCultivationCurve(req.params.story);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
