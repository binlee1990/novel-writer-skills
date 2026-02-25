<template>
  <div class="view-container" v-loading="loading">
    <h2>主角成长</h2>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-cards">
      <el-col :span="6" v-for="card in statCards" :key="card.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ card.value }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 20px;">
      <!-- 技能列表 -->
      <el-col :span="12">
        <el-card>
          <template #header>技能列表</template>
          <el-collapse v-if="skillGroups.length">
            <el-collapse-item
              v-for="group in skillGroups"
              :key="group.category"
              :title="`${group.category} (${group.skills.length})`"
            >
              <el-table :data="group.skills" size="small" stripe>
                <el-table-column prop="name" label="技能" width="120" />
                <el-table-column prop="level" label="等级" width="80" />
                <el-table-column label="习得" width="80">
                  <template #default="{ row }">ch-{{ row.acquiredChapter }}</template>
                </el-table-column>
                <el-table-column prop="useCount" label="使用" width="60" />
                <el-table-column label="状态" width="70">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
                      {{ row.status === 'active' ? '活跃' : '封印' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </el-collapse-item>
          </el-collapse>
          <el-empty v-else description="暂无技能数据" />
        </el-card>
      </el-col>

      <!-- 道具背包 -->
      <el-col :span="12">
        <el-card>
          <template #header>道具背包</template>
          <el-table v-if="inventory.length" :data="inventory" size="small" stripe>
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="type" label="类型" width="80" />
            <el-table-column prop="quantity" label="数量" width="60" />
            <el-table-column label="品质" width="70">
              <template #default="{ row }">
                <el-tag :type="qualityType(row.quality)" size="small">{{ row.quality }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="70">
              <template #default="{ row }">
                <el-tag :type="row.status === 'held' ? 'success' : 'info'" size="small">
                  {{ row.status === 'held' ? '持有' : row.status === 'consumed' ? '已消耗' : row.status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无道具数据" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 修炼曲线 -->
    <el-card style="margin-top: 20px;">
      <template #header>修炼曲线</template>
      <v-chart v-if="cultivationData.length" :option="cultivationChartOption" style="height: 350px;" autoresize />
      <el-empty v-else description="暂无修炼数据" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, MarkPointComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import {
  initStory, getStoryName,
  fetchProtagonistOverview, fetchProtagonistSkills,
  fetchProtagonistInventory, fetchCultivationCurve,
} from '../api';

use([LineChart, GridComponent, TooltipComponent, MarkPointComponent, CanvasRenderer]);

interface ProtagonistOverview {
  currentLevel: string;
  currentProgress: number;
  totalSkills: number;
  activeSkills: number;
  totalItems: number;
  heldItems: number;
}

interface Skill {
  name: string;
  category: string;
  level: string;
  description: string;
  acquiredChapter: number;
  useCount: number;
  status: string;
}

interface Item {
  name: string;
  type: string;
  quantity: number;
  quality: string;
  description: string;
  acquiredChapter: number;
  status: string;
}

interface CultivationNode {
  chapter: number;
  level: string;
  progressPct: number;
  breakthroughType: string | null;
  detail: string;
}

const loading = ref(true);
const overview = ref<ProtagonistOverview | null>(null);
const skills = ref<Skill[]>([]);
const inventory = ref<Item[]>([]);
const cultivationData = ref<CultivationNode[]>([]);

const statCards = computed(() => {
  if (!overview.value) return [];
  const o = overview.value;
  return [
    { label: '当前修为', value: o.currentLevel || '-' },
    { label: '技能数', value: `${o.activeSkills} / ${o.totalSkills}` },
    { label: '持有道具', value: o.heldItems },
    { label: '修炼进度', value: `${o.currentProgress}%` },
  ];
});

const skillGroups = computed(() => {
  const map = new Map<string, Skill[]>();
  for (const s of skills.value) {
    if (!map.has(s.category)) map.set(s.category, []);
    map.get(s.category)!.push(s);
  }
  return [...map.entries()].map(([category, skills]) => ({ category, skills }));
});

function qualityType(quality: string): string {
  switch (quality) {
    case '古纪级': return 'danger';
    case '稀有': return 'warning';
    case '精良': return 'primary';
    default: return 'info';
  }
}

const cultivationChartOption = computed(() => {
  const data = cultivationData.value;
  const breakthroughs = data.filter(d => d.breakthroughType === 'major');
  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0];
        const node = data[p.dataIndex];
        return `ch-${node.chapter}<br/>${node.level} (${node.progressPct}%)<br/>${node.detail}`;
      },
    },
    xAxis: {
      type: 'category',
      name: '章节',
      data: data.map(d => `ch-${d.chapter}`),
    },
    yAxis: { type: 'value', name: '进度%', max: 100 },
    series: [{
      type: 'line',
      data: data.map(d => d.progressPct),
      smooth: true,
      itemStyle: { color: '#409eff' },
      areaStyle: { color: 'rgba(64,158,255,0.1)' },
      markPoint: {
        data: breakthroughs.map(b => ({
          coord: [`ch-${b.chapter}`, b.progressPct],
          name: b.detail,
          symbol: 'diamond',
          symbolSize: 12,
          itemStyle: { color: '#e6a23c' },
        })),
      },
    }],
  };
});

onMounted(async () => {
  try {
    await initStory();
    const story = getStoryName();
    if (story) {
      const [ov, sk, inv, cult] = await Promise.all([
        fetchProtagonistOverview(story),
        fetchProtagonistSkills(story),
        fetchProtagonistInventory(story),
        fetchCultivationCurve(story),
      ]);
      overview.value = ov;
      skills.value = sk;
      inventory.value = inv;
      cultivationData.value = cult;
    }
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.stat-cards { margin-top: 16px; }
.stat-card { text-align: center; }
.stat-value { font-size: 28px; font-weight: bold; color: #303133; }
.stat-label { font-size: 13px; color: #909399; margin-top: 4px; }
</style>
