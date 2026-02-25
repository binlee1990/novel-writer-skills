import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

let currentStory = '';

export async function initStory(): Promise<string> {
  if (currentStory) return currentStory;
  const { data } = await api.get('/stories');
  if (data.length > 0) {
    currentStory = data[0].name;
  }
  return currentStory;
}

export function getStoryName(): string {
  return currentStory;
}

// Stories
export const fetchStories = () => api.get('/stories').then(r => r.data);
export const fetchOverview = (story: string) => api.get(`/stories/${story}/overview`).then(r => r.data);
export const fetchVolumes = (story: string) => api.get(`/stories/${story}/volumes`).then(r => r.data);

// Chapters
export const fetchChapters = (story: string, vol?: number) => {
  const params = vol ? { vol } : {};
  return api.get(`/stories/${story}/chapters`, { params }).then(r => r.data);
};

// Characters
export const fetchCharacters = (story: string, vol?: number) => {
  const params = vol ? { vol } : {};
  return api.get(`/stories/${story}/characters`, { params }).then(r => r.data);
};
export const fetchCharacterArc = (story: string, name: string) =>
  api.get(`/stories/${story}/characters/${encodeURIComponent(name)}/arc`).then(r => r.data);

// Relationships
export const fetchRelationships = (story: string, vol?: number) => {
  const params = vol ? { vol } : {};
  return api.get(`/stories/${story}/relationships`, { params }).then(r => r.data);
};
export const fetchRelationshipHistory = (story: string) =>
  api.get(`/stories/${story}/relationships/history`).then(r => r.data);

// Timeline
export const fetchTimeline = (story: string, vol?: number) => {
  const params = vol ? { vol } : {};
  return api.get(`/stories/${story}/timeline`, { params }).then(r => r.data);
};

// Plots
export const fetchPlotThreads = (story: string) =>
  api.get(`/stories/${story}/plots`).then(r => r.data);
export const fetchForeshadowing = (story: string) =>
  api.get(`/stories/${story}/foreshadowing`).then(r => r.data);
export const fetchForeshadowingMatrix = (story: string) =>
  api.get(`/stories/${story}/foreshadowing/matrix`).then(r => r.data);

// Stats
export const fetchDashboardStats = (story: string) =>
  api.get('/stats/dashboard', { params: { story } }).then(r => r.data);

export default api;
