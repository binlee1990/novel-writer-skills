# P5d: 情节追踪页面

## Task 23: PlotsView 完整实现

**Files:**
- Modify: `dashboard/src/views/PlotsView.vue`

```vue
<!-- dashboard/src/views/PlotsView.vue -->
<template>
  <div class="view-container" v-loading="loading">
    <h2>情节追踪</h2>

    <!-- 情节线看板 -->
    <el-card>
      <template #header>情节线</template>
      <div class="kanban">
        <div class="kanban-column" v-for="col in kanbanColumns" :key="col.status">
          <div class="kanban-title">
            <el-tag :type="col.tagType">{{ col.label }}</el-tag>
            <span class="kanban-count">{{ col.items.length }}</span>
          </div>
          <div class="kanban-items">
            <el-card
              v-for="plot in col.items"
              :key="plot.name"
              shadow="hover"
              class="kanban-item"
            >
              <div class="plot-name">{{ plot.name }}</div>
              <div class="plot-type">{{ plot.type }}</div>
              <div class="plot-desc">{{ plot.description }}</div>
            </el-card>
            <el-empty v-if="col.items.length === 0" description="无" :image-size="40" />
          </div>
        </div>
      </div>
    </el-card>

    <!-- 伏笔列表 -->
    <el-card style="margin-top: 16px;">
      <template #header>
        <div class="foreshadow-header">
          <span>伏笔管理</span>
          <div class="fs-stats">
            <el-tag type="success">已回收 {{ resolvedCount }}</el-tag>
            <el-tag type="warning">暗示中 {{ hintedCount }}</el-tag>
            <el-tag type="danger">未回收 {{ plantedCount }}</el-tag>
          </div>
        </div>
      </template>
      <el-table :data="foreshadowing" stripe>
        <el-table-column prop="code" label="代码" width="100" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="plantedChapter" label="埋设章节" width="100" />
        <el-table-column label="暗示章节" width="150">
          <template #default="{ row }">
            {{ row.hintedChapters.join(', ') || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="回收章节" width="100">
          <template #default="{ row }">
            {{ row.resolvedChapter || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="importance" label="重要度" width="80">
          <template #default="{ row }">
            <el-tag :type="importanceType(row.importance)" size="small">{{ row.importance }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="fsStatusType(row.status)" size="small">{{ fsStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 伏笔矩阵（仅 DB 模式） -->
    <el-card v-if="matrix.rows.length > 0" style="margin-top: 16px;">
      <template #header>伏笔矩阵</template>
      <div class="matrix-wrapper">
        <table class="matrix-table">
          <thead>
            <tr>
              <th class="matrix-label">伏笔</th>
              <th v-for="ch in matrix.chapters" :key="ch" class="matrix-ch">{{ ch }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in matrix.rows" :key="row.code">
              <td class="matrix-label" :title="row.description">{{ row.code }}</td>
              <td v-for="cell in row.cells" :key="cell.chapter" class="matrix-cell">
                <span v-if="cell.action === 'plant'" class="dot dot-plant" title="埋设">●</span>
                <span v-else-if="cell.action === 'hint'" class="dot dot-hint" title="暗示">●</span>
                <span v-else-if="cell.action === 'resolve'" class="dot dot-resolve" title="回收">●</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="matrix-legend">
        <span><span class="dot dot-plant">●</span> 埋设</span>
        <span><span class="dot dot-hint">●</span> 暗示</span>
        <span><span class="dot dot-resolve">●</span> 回收</span>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  initStory, getStoryName,
  fetchPlotThreads, fetchForeshadowing, fetchForeshadowingMatrix,
} from '../api';

interface PlotThread {
  name: string;
  type: string;
  status: string;
  description: string;
  keyEvents: string[];
}
interface Foreshadow {
  code: string;
  description: string;
  plantedChapter: number;
  hintedChapters: number[];
  resolvedChapter: number | null;
  status: string;
  importance: string;
}
interface ForeshadowCell { chapter: number; action: string | null; }
interface ForeshadowMatrix {
  chapters: number[];
  rows: Array<{ code: string; description: string; cells: ForeshadowCell[] }>;
}

const loading = ref(true);
const plots = ref<PlotThread[]>([]);
const foreshadowing = ref<Foreshadow[]>([]);
const matrix = ref<ForeshadowMatrix>({ chapters: [], rows: [] });

const kanbanColumns = computed(() => [
  {
    status: 'active', label: '进行中', tagType: 'success' as const,
    items: plots.value.filter(p => p.status === 'active'),
  },
  {
    status: 'paused', label: '暂停', tagType: 'warning' as const,
    items: plots.value.filter(p => p.status === 'paused'),
  },
  {
    status: 'resolved', label: '已完结', tagType: 'info' as const,
    items: plots.value.filter(p => p.status === 'resolved'),
  },
]);

const resolvedCount = computed(() => foreshadowing.value.filter(f => f.status === 'resolved').length);
const hintedCount = computed(() => foreshadowing.value.filter(f => f.status === 'hinted').length);
const plantedCount = computed(() => foreshadowing.value.filter(f => f.status === 'planted').length);

function fsStatusType(status: string) {
  if (status === 'resolved') return 'success';
  if (status === 'hinted') return 'warning';
  return 'danger';
}
function fsStatusLabel(status: string) {
  if (status === 'resolved') return '已回收';
  if (status === 'hinted') return '暗示中';
  return '已埋设';
}
function importanceType(imp: string) {
  if (imp === 'high') return 'danger';
  if (imp === 'normal') return '';
  return 'info';
}

onMounted(async () => {
  try {
    await initStory();
    const story = getStoryName();
    const [p, f, m] = await Promise.all([
      fetchPlotThreads(story),
      fetchForeshadowing(story),
      fetchForeshadowingMatrix(story),
    ]);
    plots.value = p;
    foreshadowing.value = f;
    matrix.value = m;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.kanban {
  display: flex;
  gap: 16px;
}
.kanban-column {
  flex: 1;
  min-width: 0;
}
.kanban-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.kanban-count {
  font-size: 12px;
  color: #909399;
}
.kanban-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.kanban-item {
  cursor: default;
}
.plot-name {
  font-weight: bold;
  margin-bottom: 4px;
}
.plot-type {
  font-size: 12px;
  color: #909399;
}
.plot-desc {
  font-size: 13px;
  margin-top: 4px;
  color: #606266;
}
.foreshadow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.fs-stats {
  display: flex;
  gap: 8px;
}
.matrix-wrapper {
  overflow-x: auto;
}
.matrix-table {
  border-collapse: collapse;
  font-size: 12px;
}
.matrix-table th, .matrix-table td {
  border: 1px solid #ebeef5;
  padding: 4px 6px;
  text-align: center;
}
.matrix-label {
  text-align: left;
  white-space: nowrap;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.matrix-ch {
  min-width: 28px;
  font-size: 11px;
  color: #909399;
}
.matrix-cell {
  min-width: 28px;
}
.dot { font-size: 14px; }
.dot-plant { color: #67c23a; }
.dot-hint { color: #e6a23c; }
.dot-resolve { color: #f56c6c; }
.matrix-legend {
  margin-top: 8px;
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #606266;
}
</style>
```

**提交：**

```bash
git add dashboard/src/views/PlotsView.vue
git commit -m "feat(dashboard): implement PlotsView with kanban, foreshadowing table, and matrix"
```
