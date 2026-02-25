import type { DataSource } from '../types.js';

export class FsDataSource implements DataSource {
  constructor(public projectRoot: string) {}
  async getStories() { return []; }
  async getOverview() { return { name: '', totalVolumes: 0, totalChapters: 0, totalWords: 0, currentVolume: 0 }; }
  async getVolumes() { return []; }
  async getChapters() { return []; }
  async getCharacters() { return []; }
  async getCharacterArc() { return []; }
  async getRelationships() { return { nodes: [], edges: [] }; }
  async getRelationshipHistory() { return []; }
  async getTimeline() { return []; }
  async getPlotThreads() { return []; }
  async getForeshadowing() { return []; }
  async getForeshadowingMatrix() { return { chapters: [], rows: [] }; }
  async getDashboardStats() { return { totalWords: 0, totalChapters: 0, totalVolumes: 0, totalCharacters: 0, activePlotThreads: 0, unresolvedForeshadowing: 0, volumeStats: [] }; }
}
