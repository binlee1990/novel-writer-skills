# P5c: 时间线页面

## Task 22: TimelineView 完整实现

**Files:**
- Modify: `dashboard/src/views/TimelineView.vue`

```vue
<!-- dashboard/src/views/TimelineView.vue -->
<template>
  <div class="view-container" v-loading="loading">
    <div class="view-header">
      <h2>时间线</h2>
      <div class="filters">
        <el-select v-model="filterVol" placeholder="按卷筛选" clearable @change="loadData">
          <el-option v-for="v in volumes" :key="v.number" :label="v.title" :value="v.number" />
        </el-select>
        <el-input v-model="searchText" placeholder="搜索事件..." clearable style="width: 200px;" />
      </div>
    </div>

    <!-- 时间轴 -->
    <el-card style="margin-top: 16px;">
      <el-timeline v-if="filteredEvents.length > 0">
        <el-timeline-item
          v-for="event in filteredEvents"
          :key="event.id"
          :timestamp="`第 ${event.chapter} 章 · ${event.storyTime}`"
          placement="top"
          :color="getEventColor(event)"
        >
          <el-card shadow="hover" class="event-card" @click="toggleDetail(event.id)">
            <div class="event-header">
              <span class="event-desc">{{ event.description }}</span>
              <el-tag size="small" v-if="event.location">{{ event.location }}</el-tag>
            </div>
            <div v-if="expandedId === event.id" class="event-detail">
              <el-tag
                v-for="tag in event.tags"
                :key="tag"
                size="small"
                type="info"
                style="margin-right: 4px; margin-top: 4px;"
              >{{ tag }}</el-tag>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无时间线数据" />
    </el-card>

    <!-- 统计 -->
    <el-card v-if="events.length > 0" style="margin-top: 16px;">
      <template #header>事件分布</template>
      <v-chart :option="distributionChart" style="height: 250px;" autoresize />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { initStory, getStoryName, fetchTimeline, fetchVolumes } from '../api';

use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

interface TimelineEvent {
  id: number;
  chapter: number;
  storyTime: string;
  location: string;
  description: string;
  tags: string[];
}
interface Volume { number: number; title: string; }

const loading = ref(true);
const events = ref<TimelineEvent[]>([]);
const volumes = ref<Volume[]>([]);
const filterVol = ref<number | undefined>();
const searchText = ref('');
const expandedId = ref<number | null>(null);

const filteredEvents = computed(() => {
  if (!searchText.value) return events.value;
  const q = searchText.value.toLowerCase();
  return events.value.filter(e =>
    e.description.toLowerCase().includes(q) ||
    e.location.toLowerCase().includes(q) ||
    e.tags.some(t => t.toLowerCase().includes(q))
  );
});

function getEventColor(event: TimelineEvent): string {
  if (event.tags.includes('高潮')) return '#f56c6c';
  if (event.tags.includes('转折')) return '#e6a23c';
  if (event.tags.includes('开端')) return '#409eff';
  return '#67c23a';
}

function toggleDetail(id: number) {
  expandedId.value = expandedId.value === id ? null : id;
}

const distributionChart = computed(() => {
  const chapterMap = new Map<number, number>();
  events.value.forEach(e => {
    chapterMap.set(e.chapter, (chapterMap.get(e.chapter) || 0) + 1);
  });
  const chapters = [...chapterMap.keys()].sort((a, b) => a - b);
  return {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: chapters.map(c => `第${c}章`), name: '章节' },
    yAxis: { type: 'value', name: '事件数', minInterval: 1 },
    series: [{
      type: 'bar',
      data: chapters.map(c => chapterMap.get(c)),
      itemStyle: { color: '#409eff' },
    }],
  };
});

async function loadData() {
  loading.value = true;
  try {
    const story = getStoryName();
    events.value = await fetchTimeline(story, filterVol.value);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  try {
    await initStory();
    const story = getStoryName();
    volumes.value = await fetchVolumes(story);
    events.value = await fetchTimeline(story);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filters { display: flex; gap: 10px; }
.event-card { cursor: pointer; }
.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.event-desc { font-weight: 500; }
.event-detail { margin-top: 8px; }
</style>
```

**提交：**

```bash
git add dashboard/src/views/TimelineView.vue
git commit -m "feat(dashboard): implement TimelineView with event timeline and distribution chart"
```
