<template>
  <div class="view-container" v-loading="loading">
    <div class="view-header">
      <h2>角色管理</h2>
      <div class="filters">
        <el-select v-model="filterVol" placeholder="按卷筛选" clearable @change="loadData">
          <el-option v-for="v in volumes" :key="v.number" :label="v.title" :value="v.number" />
        </el-select>
        <el-select v-model="filterFaction" placeholder="按阵营筛选" clearable>
          <el-option v-for="f in factions" :key="f" :label="f" :value="f" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="按状态筛选" clearable>
          <el-option label="活跃" value="活跃" />
          <el-option label="已故" value="已故" />
          <el-option label="退场" value="退场" />
        </el-select>
      </div>
    </div>

    <!-- 角色卡片网格 -->
    <el-row :gutter="16" class="char-grid">
      <el-col :span="6" v-for="char in filteredCharacters" :key="char.name">
        <el-card shadow="hover" class="char-card" @click="selectCharacter(char)">
          <div class="char-avatar">{{ char.name[0] }}</div>
          <div class="char-info">
            <div class="char-name">{{ char.name }}</div>
            <el-tag size="small" :type="roleTagType(char.role)">{{ char.role }}</el-tag>
            <el-tag size="small" v-if="char.faction" class="faction-tag">{{ char.faction }}</el-tag>
          </div>
          <div class="char-meta">
            <span v-if="char.cultivation">修为: {{ char.cultivation }}</span>
            <el-tag size="small" :type="statusTagType(char.status)">{{ char.status }}</el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 角色详情抽屉 -->
    <el-drawer v-model="drawerVisible" :title="selectedChar?.name" size="40%">
      <template v-if="selectedChar">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="别名">{{ selectedChar.aliases.join('、') || '无' }}</el-descriptions-item>
          <el-descriptions-item label="身份">{{ selectedChar.role }}</el-descriptions-item>
          <el-descriptions-item label="阵营">{{ selectedChar.faction || '无' }}</el-descriptions-item>
          <el-descriptions-item label="修为">{{ selectedChar.cultivation || '无' }}</el-descriptions-item>
          <el-descriptions-item label="首次出场">第{{ selectedChar.firstVolume }}卷 第{{ selectedChar.firstChapter }}章</el-descriptions-item>
          <el-descriptions-item label="状态">{{ selectedChar.status }}</el-descriptions-item>
        </el-descriptions>

        <!-- 角色弧线 -->
        <h3 style="margin-top: 20px;">角色弧线</h3>
        <el-timeline v-if="charArc.length > 0">
          <el-timeline-item
            v-for="state in charArc"
            :key="state.volume"
            :timestamp="`第 ${state.volume} 卷`"
            placement="top"
          >
            <el-card>
              <p><strong>修为:</strong> {{ state.cultivation || '未知' }}</p>
              <p><strong>位置:</strong> {{ state.location || '未知' }}</p>
              <p>{{ state.summary }}</p>
              <p class="meta">最后出场: 第 {{ state.lastChapter }} 章</p>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无弧线数据" />
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { initStory, getStoryName, fetchCharacters, fetchCharacterArc, fetchVolumes } from '../api';

interface Character {
  name: string;
  aliases: string[];
  role: string;
  firstVolume: number;
  firstChapter: number;
  cultivation: string;
  faction: string;
  status: string;
}

interface CharacterState {
  volume: number;
  cultivation: string;
  location: string;
  summary: string;
  lastChapter: number;
}

interface Volume {
  number: number;
  title: string;
}

const loading = ref(true);
const characters = ref<Character[]>([]);
const volumes = ref<Volume[]>([]);
const filterVol = ref<number | undefined>();
const filterFaction = ref('');
const filterStatus = ref('');
const drawerVisible = ref(false);
const selectedChar = ref<Character | null>(null);
const charArc = ref<CharacterState[]>([]);

const factions = computed(() => {
  const set = new Set(characters.value.map(c => c.faction).filter(Boolean));
  return [...set];
});

const filteredCharacters = computed(() => {
  return characters.value.filter(c => {
    if (filterFaction.value && c.faction !== filterFaction.value) return false;
    if (filterStatus.value && c.status !== filterStatus.value) return false;
    return true;
  });
});

function roleTagType(role: string) {
  if (role === '主角') return 'danger';
  if (role === '配角') return 'warning';
  return 'info';
}

function statusTagType(status: string) {
  if (status === '活跃') return 'success';
  if (status === '已故') return 'danger';
  return 'info';
}

async function selectCharacter(char: Character) {
  selectedChar.value = char;
  drawerVisible.value = true;
  const story = getStoryName();
  charArc.value = await fetchCharacterArc(story, char.name);
}

async function loadData() {
  loading.value = true;
  try {
    const story = getStoryName();
    characters.value = await fetchCharacters(story, filterVol.value);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  try {
    await initStory();
    const story = getStoryName();
    volumes.value = await fetchVolumes(story);
    characters.value = await fetchCharacters(story);
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
.filters {
  display: flex;
  gap: 10px;
}
.char-grid {
  margin-top: 16px;
}
.char-card {
  cursor: pointer;
  margin-bottom: 16px;
  text-align: center;
}
.char-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  font-size: 24px;
  line-height: 60px;
  margin: 0 auto 10px;
}
.char-name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 6px;
}
.faction-tag {
  margin-left: 4px;
}
.char-meta {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}
.meta {
  font-size: 12px;
  color: #909399;
}
</style>
