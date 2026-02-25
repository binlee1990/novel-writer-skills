<template>
  <div class="view-container" v-loading="loading">
    <h2>创作仪表盘</h2>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-cards">
      <el-col :span="4" v-for="card in statCards" :key="card.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ card.value }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区 -->
    <el-row :gutter="16" style="margin-top: 20px;">
      <el-col :span="14">
        <el-card>
          <template #header>各卷字数统计</template>
          <v-chart :option="volumeChartOption" style="height: 350px;" autoresize />
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header>各卷章节数</template>
          <v-chart :option="chapterChartOption" style="height: 350px;" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <!-- 卷列表 -->
    <el-card style="margin-top: 20px;">
      <template #header>卷目录</template>
      <el-table :data="stats?.volumeStats || []" stripe>
        <el-table-column prop="volume" label="卷号" width="80" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="chapters" label="章节数" width="100" />
        <el-table-column label="字数" width="120">
          <template #default="{ row }">
            {{ (row.words / 10000).toFixed(1) }}万
          </template>
        </el-table-column>
        <el-table-column label="进度" width="200">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" :stroke-width="10" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { initStory, getStoryName, fetchDashboardStats, fetchProtagonistOverview } from '../api';

use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

interface VolumeStat {
  volume: number;
  title: string;
  words: number;
  chapters: number;
  progress: number;
}

interface DashboardStats {
  totalWords: number;
  totalChapters: number;
  totalVolumes: number;
  totalCharacters: number;
  activePlotThreads: number;
  unresolvedForeshadowing: number;
  volumeStats: VolumeStat[];
}

interface ProtagonistOverview {
  currentLevel: string;
  currentProgress: number;
  totalSkills: number;
  activeSkills: number;
  totalItems: number;
  heldItems: number;
}

const loading = ref(true);
const stats = ref<DashboardStats | null>(null);
const protagonist = ref<ProtagonistOverview | null>(null);

const statCards = computed(() => {
  if (!stats.value) return [];
  const s = stats.value;
  const cards = [
    { label: '总字数', value: `${(s.totalWords / 10000).toFixed(1)}万` },
    { label: '总章节', value: s.totalChapters },
    { label: '总卷数', value: s.totalVolumes },
    { label: '角色数', value: s.totalCharacters },
    { label: '活跃情节线', value: s.activePlotThreads },
    { label: '未解伏笔', value: s.unresolvedForeshadowing },
  ];
  if (protagonist.value) {
    const p = protagonist.value;
    cards.push({ label: '主角修为', value: p.currentLevel || '-' });
    cards.push({ label: '技能/道具', value: `${p.activeSkills}技能 / ${p.heldItems}道具` });
  }
  return cards;
});

const volumeChartOption = computed(() => {
  const vs = stats.value?.volumeStats || [];
  return {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: vs.map(v => v.title) },
    yAxis: { type: 'value', name: '字数' },
    series: [{
      type: 'bar',
      data: vs.map(v => v.words),
      itemStyle: { color: '#409eff' },
    }],
  };
});

const chapterChartOption = computed(() => {
  const vs = stats.value?.volumeStats || [];
  return {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: vs.map(v => v.title) },
    yAxis: { type: 'value', name: '章节' },
    series: [{
      type: 'bar',
      data: vs.map(v => v.chapters),
      itemStyle: { color: '#67c23a' },
    }],
  };
});

onMounted(async () => {
  try {
    await initStory();
    const story = getStoryName();
    if (story) {
      const [s, p] = await Promise.all([
        fetchDashboardStats(story),
        fetchProtagonistOverview(story).catch(() => null),
      ]);
      stats.value = s;
      protagonist.value = p;
    }
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.stat-cards {
  margin-top: 16px;
}
.stat-card {
  text-align: center;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}
</style>
