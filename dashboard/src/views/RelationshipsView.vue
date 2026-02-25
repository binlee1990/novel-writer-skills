<template>
  <div class="view-container" v-loading="loading">
    <div class="view-header">
      <h2>关系网络</h2>
      <div class="filters">
        <el-select v-model="filterVol" placeholder="按卷筛选" clearable @change="loadData">
          <el-option v-for="v in volumes" :key="v.number" :label="v.title" :value="v.number" />
        </el-select>
        <el-select v-model="filterRelType" placeholder="按关系类型" clearable @change="applyFilter">
          <el-option v-for="t in relTypes" :key="t" :label="t" :value="t" />
        </el-select>
      </div>
    </div>

    <!-- 力导向图 -->
    <el-card class="graph-card">
      <div ref="networkContainer" class="network-container"></div>
    </el-card>

    <!-- 关系详情面板 -->
    <el-card v-if="selectedEdge" style="margin-top: 16px;">
      <template #header>关系详情</template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="角色A">{{ selectedEdge.source }}</el-descriptions-item>
        <el-descriptions-item label="角色B">{{ selectedEdge.target }}</el-descriptions-item>
        <el-descriptions-item label="关系类型">{{ selectedEdge.type }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">{{ selectedEdge.status }}</el-descriptions-item>
        <el-descriptions-item label="最后更新">第 {{ selectedEdge.lastChapter }} 章</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 关系变迁（仅 DB 模式） -->
    <el-card v-if="history.length > 0" style="margin-top: 16px;">
      <template #header>关系变迁历史</template>
      <el-table :data="history" stripe max-height="300">
        <el-table-column prop="chapter" label="章节" width="80" />
        <el-table-column prop="source" label="角色A" width="100" />
        <el-table-column prop="target" label="角色B" width="100" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="oldStatus" label="旧状态" width="100" />
        <el-table-column prop="newStatus" label="新状态" width="100" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import {
  initStory, getStoryName,
  fetchRelationships, fetchRelationshipHistory, fetchVolumes,
} from '../api';

interface RelNode {
  id: string;
  name: string;
  faction: string;
  role: string;
  appearances: number;
}
interface RelEdge {
  source: string;
  target: string;
  type: string;
  status: string;
  lastChapter: number;
}
interface RelEvent {
  chapter: number;
  source: string;
  target: string;
  type: string;
  oldStatus: string;
  newStatus: string;
}
interface Volume { number: number; title: string; }

const loading = ref(true);
const volumes = ref<Volume[]>([]);
const filterVol = ref<number | undefined>();
const filterRelType = ref('');
const networkContainer = ref<HTMLElement | null>(null);
const selectedEdge = ref<RelEdge | null>(null);
const history = ref<RelEvent[]>([]);

let graphNodes: RelNode[] = [];
let graphEdges: RelEdge[] = [];
let network: Network | null = null;

const relTypes = computed(() => {
  const set = new Set(graphEdges.map(e => e.type).filter(Boolean));
  return [...set];
});

const factionColors: Record<string, string> = {
  '正道': '#409eff',
  '魔道': '#f56c6c',
  '散修': '#e6a23c',
  '妖族': '#67c23a',
};
function getFactionColor(faction: string): string {
  return factionColors[faction] || '#909399';
}

const relTypeColors: Record<string, string> = {
  '盟友': '#67c23a',
  '敌对': '#f56c6c',
  '师徒': '#409eff',
  '恋人': '#e6a23c',
  '亲属': '#b37feb',
};
function getRelColor(type: string): string {
  return relTypeColors[type] || '#c0c4cc';
}

function renderNetwork() {
  if (!networkContainer.value) return;

  const filteredEdges = filterRelType.value
    ? graphEdges.filter(e => e.type === filterRelType.value)
    : graphEdges;

  const connectedIds = new Set<string>();
  filteredEdges.forEach(e => { connectedIds.add(e.source); connectedIds.add(e.target); });
  const filteredNodes = filterRelType.value
    ? graphNodes.filter(n => connectedIds.has(n.id))
    : graphNodes;

  const nodes = new DataSet(filteredNodes.map(n => ({
    id: n.id,
    label: n.name,
    color: getFactionColor(n.faction),
    size: 15 + Math.min(n.appearances, 30),
    font: { color: '#303133', size: 14 },
    title: `${n.name}\n阵营: ${n.faction || '无'}\n身份: ${n.role}\n出场: ${n.appearances}次`,
  })));

  const edges = new DataSet(filteredEdges.map((e, i) => ({
    id: i,
    from: e.source,
    to: e.target,
    label: e.type,
    color: { color: getRelColor(e.type) },
    font: { size: 11, color: '#606266' },
    width: 2,
    title: `${e.source} ↔ ${e.target}\n${e.type}: ${e.status}`,
  })));

  if (network) network.destroy();

  network = new Network(networkContainer.value, { nodes, edges }, {
    physics: {
      solver: 'forceAtlas2Based',
      forceAtlas2Based: { gravitationalConstant: -80, springLength: 150 },
      stabilization: { iterations: 100 },
    },
    interaction: { hover: true, tooltipDelay: 200 },
    edges: { smooth: { type: 'continuous' } },
  });

  network.on('selectEdge', (params) => {
    if (params.edges.length > 0) {
      const idx = params.edges[0];
      selectedEdge.value = filteredEdges[idx] || null;
    }
  });

  network.on('deselectEdge', () => {
    selectedEdge.value = null;
  });
}

function applyFilter() {
  renderNetwork();
}

async function loadData() {
  loading.value = true;
  try {
    const story = getStoryName();
    const graph = await fetchRelationships(story, filterVol.value);
    graphNodes = graph.nodes;
    graphEdges = graph.edges;
    history.value = await fetchRelationshipHistory(story);
    await nextTick();
    renderNetwork();
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  try {
    await initStory();
    const story = getStoryName();
    volumes.value = await fetchVolumes(story);
    await loadData();
  } finally {
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  if (network) network.destroy();
});
</script>

<style scoped>
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filters {
  display: flex;
  gap: 10px;
}
.graph-card {
  margin-top: 16px;
}
.network-container {
  height: 500px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}
</style>
