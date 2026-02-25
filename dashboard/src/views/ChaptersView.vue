<template>
  <div class="view-container" v-loading="loading">
    <div class="view-header">
      <h2>章节浏览</h2>
      <div class="filters">
        <el-select v-model="filterVol" placeholder="按卷筛选" clearable @change="loadData">
          <el-option v-for="v in volumes" :key="v.number" :label="v.title" :value="v.number" />
        </el-select>
      </div>
    </div>

    <el-row :gutter="16" style="margin-top: 16px;">
      <!-- 左侧：卷→章节树 -->
      <el-col :span="6">
        <el-card>
          <template #header>目录</template>
          <el-tree
            :data="treeData"
            :props="{ label: 'label', children: 'children' }"
            highlight-current
            @node-click="onNodeClick"
            default-expand-all
          />
        </el-card>
      </el-col>

      <!-- 右侧：章节卡片 + 热力图 -->
      <el-col :span="18">
        <!-- 字数分布热力图 -->
        <el-card>
          <template #header>字数分布</template>
          <v-chart :option="heatmapOption" style="height: 200px;" autoresize />
        </el-card>

        <!-- 章节卡片列表 -->
        <el-card style="margin-top: 16px;">
          <template #header>
            {{ filterVol ? `第 ${filterVol} 卷` : '全部' }} · {{ displayChapters.length }} 章
          </template>
          <el-row :gutter="12">
            <el-col :span="8" v-for="ch in displayChapters" :key="ch.globalNumber">
              <el-card shadow="hover" class="chapter-card">
                <div class="ch-header">
                  <span class="ch-number">第 {{ ch.globalNumber }} 章</span>
                  <el-tag size="small" :type="ch.hasContent ? 'success' : 'info'">
                    {{ ch.hasContent ? '已完成' : '未写' }}
                  </el-tag>
                </div>
                <div class="ch-meta">
                  <span v-if="ch.words > 0">{{ (ch.words / 1000).toFixed(1) }}k 字</span>
                  <span v-if="ch.pov">POV: {{ ch.pov }}</span>
                </div>
                <div class="ch-participants" v-if="ch.participants.length > 0">
                  <el-tag
                    v-for="p in ch.participants.slice(0, 5)"
                    :key="p"
                    size="small"
                    type="info"
                    style="margin: 2px;"
                  >{{ p }}</el-tag>
                  <span v-if="ch.participants.length > 5" class="more">
                    +{{ ch.participants.length - 5 }}
                  </span>
                </div>
                <div class="ch-badges">
                  <el-tag v-if="ch.hasSynopsis" size="small" type="warning">有概要</el-tag>
                </div>
              </el-card>
            </el-col>
          </el-row>
          <el-empty v-if="displayChapters.length === 0" description="暂无章节" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { HeatmapChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, VisualMapComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { initStory, getStoryName, fetchVolumes, fetchChapters } from '../api';

use([HeatmapChart, GridComponent, TooltipComponent, VisualMapComponent, CanvasRenderer]);

interface Chapter {
  globalNumber: number;
  volumeNumber: number;
  chapterInVolume: number;
  title: string;
  words: number;
  pov: string;
  participants: string[];
  hasSynopsis: boolean;
  hasContent: boolean;
}
interface Volume { number: number; title: string; chapters: number; words: number; }

const loading = ref(true);
const volumes = ref<Volume[]>([]);
const chapters = ref<Chapter[]>([]);
const filterVol = ref<number | undefined>();

const displayChapters = computed(() => {
  if (!filterVol.value) return chapters.value;
  return chapters.value.filter(c => c.volumeNumber === filterVol.value);
});

const treeData = computed(() => {
  const volMap = new Map<number, Chapter[]>();
  chapters.value.forEach(c => {
    if (!volMap.has(c.volumeNumber)) volMap.set(c.volumeNumber, []);
    volMap.get(c.volumeNumber)!.push(c);
  });
  return volumes.value.map(v => ({
    label: v.title,
    vol: v.number,
    children: (volMap.get(v.number) || []).map(c => ({
      label: `第 ${c.globalNumber} 章 (${(c.words / 1000).toFixed(1)}k)`,
      ch: c.globalNumber,
    })),
  }));
});

const heatmapOption = computed(() => {
  const data = displayChapters.value.map((c, i) => [i, 0, c.words]);
  const maxWords = Math.max(...displayChapters.value.map(c => c.words), 1);
  return {
    tooltip: {
      formatter: (params: any) => {
        const ch = displayChapters.value[params.data[0]];
        return ch ? `第 ${ch.globalNumber} 章: ${ch.words} 字` : '';
      },
    },
    xAxis: {
      type: 'category',
      data: displayChapters.value.map(c => `${c.globalNumber}`),
      name: '章节',
      splitArea: { show: true },
    },
    yAxis: { type: 'category', data: ['字数'], show: false },
    visualMap: {
      min: 0,
      max: maxWords,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: { color: ['#ebeef5', '#409eff', '#f56c6c'] },
    },
    series: [{
      type: 'heatmap',
      data,
      label: { show: false },
    }],
  };
});

function onNodeClick(data: any) {
  if (data.vol !== undefined && !data.ch) {
    filterVol.value = data.vol;
  }
}

async function loadData() {
  loading.value = true;
  try {
    const story = getStoryName();
    chapters.value = await fetchChapters(story, filterVol.value);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  try {
    await initStory();
    const story = getStoryName();
    volumes.value = await fetchVolumes(story);
    chapters.value = await fetchChapters(story);
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
.chapter-card {
  margin-bottom: 12px;
}
.ch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ch-number {
  font-weight: bold;
  font-size: 14px;
}
.ch-meta {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
  display: flex;
  gap: 12px;
}
.ch-participants {
  margin-top: 6px;
}
.ch-badges {
  margin-top: 6px;
}
.more {
  font-size: 12px;
  color: #909399;
}
</style>
