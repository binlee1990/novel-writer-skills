import { Router } from 'express';
import type { DataSource } from '../types.js';

export function createStoriesRouter(ds: DataSource): Router {
  const router = Router();

  // GET /api/stories
  router.get('/', async (_req, res) => {
    try {
      const stories = await ds.getStories();
      res.json(stories);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stories/:story/overview
  router.get('/:story/overview', async (req, res) => {
    try {
      const overview = await ds.getOverview(req.params.story);
      res.json(overview);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stories/:story/volumes
  router.get('/:story/volumes', async (req, res) => {
    try {
      const volumes = await ds.getVolumes(req.params.story);
      res.json(volumes);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stories/:story/volumes/:vol/stats
  router.get('/:story/volumes/:vol/stats', async (req, res) => {
    try {
      const vol = parseInt(req.params.vol, 10);
      const chapters = await ds.getChapters(req.params.story, vol);
      const characters = await ds.getCharacters(req.params.story, vol);
      res.json({
        volume: vol,
        chapters: chapters.length,
        words: chapters.reduce((sum, c) => sum + c.words, 0),
        characters: characters.length,
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stories/:story/chapters?vol=X
  router.get('/:story/chapters', async (req, res) => {
    try {
      const vol = req.query.vol ? parseInt(req.query.vol as string, 10) : undefined;
      const chapters = await ds.getChapters(req.params.story, vol);
      res.json(chapters);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stories/:story/chapters/:ch
  router.get('/:story/chapters/:ch', async (req, res) => {
    try {
      const chNum = parseInt(req.params.ch, 10);
      const chapters = await ds.getChapters(req.params.story);
      const chapter = chapters.find(c => c.globalNumber === chNum);
      if (!chapter) {
        res.status(404).json({ error: '章节不存在' });
        return;
      }
      res.json(chapter);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
