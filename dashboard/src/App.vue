<template>
  <el-container class="app-container">
    <el-aside width="220px" class="app-aside">
      <div class="logo">
        <h2>NovelWS</h2>
        <span class="subtitle">创作仪表盘</span>
      </div>
      <el-menu
        :default-active="route.path"
        router
        class="app-menu"
      >
        <el-menu-item index="/">
          <el-icon><DataBoard /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/characters">
          <el-icon><User /></el-icon>
          <span>角色管理</span>
        </el-menu-item>
        <el-menu-item index="/protagonist">
          <el-icon><TrophyBase /></el-icon>
          <span>主角成长</span>
        </el-menu-item>
        <el-menu-item index="/relationships">
          <el-icon><Connection /></el-icon>
          <span>关系网络</span>
        </el-menu-item>
        <el-menu-item index="/timeline">
          <el-icon><Timer /></el-icon>
          <span>时间线</span>
        </el-menu-item>
        <el-menu-item index="/plots">
          <el-icon><List /></el-icon>
          <span>情节追踪</span>
        </el-menu-item>
        <el-menu-item index="/chapters">
          <el-icon><Document /></el-icon>
          <span>章节浏览</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main class="app-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import {
  DataBoard, User, Connection, Timer, List, Document, TrophyBase,
} from '@element-plus/icons-vue';

const route = useRoute();
</script>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.app-container {
  height: 100vh;
}
.app-aside {
  background: #1d1e2c;
  color: #fff;
  overflow-y: auto;
}
.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #2d2e3e;
}
.logo h2 {
  margin: 0;
  font-size: 20px;
  color: #409eff;
}
.logo .subtitle {
  font-size: 12px;
  color: #909399;
}
.app-menu {
  border-right: none;
  background: transparent;
}
.app-menu .el-menu-item {
  color: #c0c4cc;
}
.app-menu .el-menu-item.is-active {
  color: #409eff;
  background: #262738;
}
.app-main {
  background: #f5f7fa;
  overflow-y: auto;
}
</style>
