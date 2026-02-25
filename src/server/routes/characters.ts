import { Router } from 'express';
import type { DataSource } from '../types.js';

export function createCharactersRouter(ds: DataSource): Router {
  const router = Router({ mergeParams: true });

  // GET /api/stories/:story/characters?vol=X
  router.get('/', async (req, res) => {
    try {
      const vol = req.query.vol ? parseInt(req.query.vol as string, 10) : undefined;
      const characters = await ds.getCharacters(req.params.story, vol);
      res.json(characters);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stories/:story/characters/:name/arc
  router.get('/:name/arc', async (req, res) => {
    try {
      const arc = await ds.getCharacterArc(req.params.story, decodeURIComponent(req.params.name));
      res.json(arc);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
