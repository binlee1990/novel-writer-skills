# P4a: 前端项目初始化

## Task 15: Vue 3 项目初始化

**Files:**
- Create: `dashboard/package.json`
- Create: `dashboard/vite.config.ts`
- Create: `dashboard/tsconfig.json`
- Create: `dashboard/index.html`
- Create: `dashboard/src/main.ts`
- Create: `dashboard/src/App.vue`
- Create: `dashboard/src/env.d.ts`

**Step 1: 创建 dashboard/package.json**

```json
{
  "name": "novelws-dashboard",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.3.0",
    "element-plus": "^2.9.0",
    "echarts": "^5.5.0",
    "vue-echarts": "^7.0.0",
    "vis-network": "^9.1.0",
    "vis-data": "^7.1.0",
    "axios": "^1.7.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.4.0",
    "vue-tsc": "^2.0.0"
  }
}
```

**Step 2: 创建 dashboard/vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3210',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../dist/dashboard',
    emptyOutDir: true,
  },
});
```

**Step 3: 创建 dashboard/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.vue", "src/env.d.ts"]
}
```

**Step 4: 创建 dashboard/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NovelWS Dashboard</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

**Step 5: 创建 dashboard/src/env.d.ts**

```typescript
/// <reference types="vite/client" />
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
```

**Step 6: 创建 dashboard/src/main.ts**

```typescript
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import router from './router';

const app = createApp(App);
app.use(ElementPlus);
app.use(router);
app.mount('#app');
```

**Step 7: 创建 dashboard/src/App.vue**

```vue
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
  DataBoard, User, Connection, Timer, List, Document,
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
```

**Step 8: 安装依赖并验证**

```bash
cd D:/repository/novel-writer-skills/dashboard
npm install
```

验证 Vite 能正常构建（不启动 dev server）：
```bash
cd D:/repository/novel-writer-skills/dashboard
node node_modules/vite/bin/vite.js build --mode development 2>&1 | head -5
```

注意：构建可能因缺少 router 文件而失败，这是预期的，将在下一个 Task 中创建。

**Step 9: 提交**

```bash
cd D:/repository/novel-writer-skills
git add dashboard/package.json dashboard/package-lock.json dashboard/vite.config.ts dashboard/tsconfig.json dashboard/index.html dashboard/src/
git commit -m "feat(dashboard): initialize Vue 3 frontend project with Element Plus"
```
