import { Router, Request, Response } from 'express';
import type { DataSource } from '../types.js';

export function createPlotsRouter(ds: DataSource): Router {
  const router = Router({ mergeParams: true });

  // GET /api/stories/:story/plots
  router.get('/plots', async (req: Request<{ story: string }>, res: Response) => {
    try {
      const plots = await ds.getPlotThreads(req.params.story);
      res.json(plots);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stories/:story/foreshadowing
  router.get('/foreshadowing', async (req: Request<{ story: string }>, res: Response) => {
    try {
      const items = await ds.getForeshadowing(req.params.story);
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stories/:story/foreshadowing/matrix
  router.get('/foreshadowing/matrix', async (req: Request<{ story: string }>, res: Response) => {
    try {
      const matrix = await ds.getForeshadowingMatrix(req.params.story);
      res.json(matrix);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
