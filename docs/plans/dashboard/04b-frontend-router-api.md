# P4b: 前端路由与 API 层

## Task 16: Vue Router 配置

**Files:**
- Create: `dashboard/src/router/index.ts`

```typescript
// dashboard/src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
    },
    {
      path: '/characters',
      name: 'characters',
      component: () => import('../views/CharactersView.vue'),
    },
    {
      path: '/relationships',
      name: 'relationships',
      component: () => import('../views/RelationshipsView.vue'),
    },
    {
      path: '/timeline',
      name: 'timeline',
      component: () => import('../views/TimelineView.vue'),
    },
    {
      path: '/plots',
      name: 'plots',
      component: () => import('../views/PlotsView.vue'),
    },
    {
      path: '/chapters',
      name: 'chapters',
      component: () => import('../views/ChaptersView.vue'),
    },
  ],
});

export default router;
```

---

## Task 17: API 请求层

**Files:**
- Create: `dashboard/src/api/index.ts`

```typescript
// dashboard/src/api/index.ts
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 当前故事名（从 getStories 第一个结果获取）
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
```

---

## Task 18: 创建页面占位组件

为每个视图创建最小占位组件，确保路由可以正常工作。

**Files:**
- Create: `dashboard/src/views/DashboardView.vue`
- Create: `dashboard/src/views/CharactersView.vue`
- Create: `dashboard/src/views/RelationshipsView.vue`
- Create: `dashboard/src/views/TimelineView.vue`
- Create: `dashboard/src/views/PlotsView.vue`
- Create: `dashboard/src/views/ChaptersView.vue`

每个文件使用相同模板（以 DashboardView 为例）：

```vue
<!-- dashboard/src/views/DashboardView.vue -->
<template>
  <div class="view-container">
    <h1>仪表盘</h1>
    <p>加载中...</p>
  </div>
</template>

<script setup lang="ts">
// 将在后续 Task 中实现
</script>

<style scoped>
.view-container {
  padding: 20px;
}
</style>
```

其他视图同理，标题分别为：
- CharactersView: `角色管理`
- RelationshipsView: `关系网络`
- TimelineView: `时间线`
- PlotsView: `情节追踪`
- ChaptersView: `章节浏览`

**验证：**

```bash
cd D:/repository/novel-writer-skills/dashboard
node node_modules/vite/bin/vite.js build --mode development 2>&1 | tail -5
```

Expected: 构建成功，输出到 `../dist/dashboard/`

**提交：**

```bash
cd D:/repository/novel-writer-skills
git add dashboard/src/router/ dashboard/src/api/ dashboard/src/views/
git commit -m "feat(dashboard): add Vue router, API layer, and placeholder views"
```
