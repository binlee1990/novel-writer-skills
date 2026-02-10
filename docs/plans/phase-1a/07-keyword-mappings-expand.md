# Task 7: Keyword Mappings 补全

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 `keyword-mappings.json` 从当前 8 条映射扩展到约 20 条，覆盖所有现有 genres 知识库和新增的 craft 知识库

**Architecture:** 在现有 JSON 结构中的 `genre-knowledge` 和 `craft-knowledge` 分类下新增映射条目。保持现有条目不变，仅新增。同时更新 `regex-patterns` 部分保持同步。

**Tech Stack:** JSON 配置

---

### Task 7.1: 在 genre-knowledge 中补全现有 genres

**Files:**
- Modify: `templates/config/keyword-mappings.json:56-77`（genre-knowledge 部分）

**Step 1: 在 `genre-knowledge` 对象中（第 77 行 `}` 之前）添加缺失的 genre 映射**

当前已有：`romance`、`mystery`（2 条）
需要新增：`wuxia`、`historical`、`sci-fi`、`thriller`、`revenge`、`xuanhuan`（6 条）

在 `mystery` 条目（第 76 行 `}` ）之后、`genre-knowledge` 的闭合 `}` 之前，添加：

```json
,
      "wuxia": {
        "keywords": ["武侠", "江湖", "侠客", "武功", "wuxia", "martial arts"],
        "regex": "武侠|江湖|侠客|武功|wuxia|martial\\s*arts",
        "regex_flags": "i",
        "resources": [
          "templates/knowledge-base/genres/wuxia.md"
        ],
        "priority": 2
      },
      "historical": {
        "keywords": ["历史", "古代", "朝代", "宫廷", "historical", "dynasty"],
        "regex": "历史|古代|朝代|宫廷|historical|dynasty",
        "regex_flags": "i",
        "resources": [
          "templates/knowledge-base/genres/historical.md"
        ],
        "priority": 2
      },
      "sci-fi": {
        "keywords": ["科幻", "未来", "太空", "星际", "sci-fi", "science fiction"],
        "regex": "科幻|未来|太空|星际|sci-fi|science\\s*fiction",
        "regex_flags": "i",
        "resources": [
          "templates/knowledge-base/genres/sci-fi.md"
        ],
        "priority": 2
      },
      "thriller": {
        "keywords": ["惊悚", "恐怖", "紧张", "thriller", "horror", "suspense"],
        "regex": "惊悚|恐怖|紧张|thriller|horror|suspense",
        "regex_flags": "i",
        "resources": [
          "templates/knowledge-base/genres/thriller.md"
        ],
        "priority": 2
      },
      "revenge": {
        "keywords": ["复仇", "报仇", "仇恨", "revenge", "vengeance"],
        "regex": "复仇|报仇|仇恨|revenge|vengeance",
        "regex_flags": "i",
        "resources": [
          "templates/knowledge-base/genres/revenge.md"
        ],
        "priority": 2
      },
      "xuanhuan": {
        "keywords": ["玄幻", "修仙", "修炼", "境界", "灵气", "宗门", "xuanhuan", "cultivation"],
        "regex": "玄幻|修仙|修炼|境界|灵气|宗门|xuanhuan|cultivation",
        "regex_flags": "i",
        "resources": [
          "templates/knowledge-base/genres/xuanhuan.md"
        ],
        "priority": 2
      }
```

**Step 2: 验证 JSON 格式**

Run: `node -e "JSON.parse(require('fs').readFileSync('templates/config/keyword-mappings.json','utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

**Step 3: Commit**

```bash
git add templates/config/keyword-mappings.json
git commit -m "feat(config): add genre keyword mappings for wuxia, historical, sci-fi, thriller, revenge, xuanhuan"
```

---

### Task 7.2: 在 craft-knowledge 中添加 hook-design 映射

**Files:**
- Modify: `templates/config/keyword-mappings.json:5-55`（craft-knowledge 部分）

**Step 1: 在 `craft-knowledge` 对象中（`show-not-tell` 条目之后）添加 hook-design 映射**

在 `show-not-tell` 条目（第 54 行 `}` ）之后、`craft-knowledge` 的闭合 `}` 之前，添加：

```json
,
      "hook-design": {
        "keywords": ["钩子", "悬念", "章末", "hook", "cliffhanger", "结尾"],
        "regex": "钩子|悬念|章末|hook|cliffhanger|结尾",
        "regex_flags": "i",
        "resources": [
          "templates/knowledge-base/craft/hook-design.md"
        ],
        "priority": 1
      }
```

**Step 2: 验证 JSON 格式**

Run: `node -e "JSON.parse(require('fs').readFileSync('templates/config/keyword-mappings.json','utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

**Step 3: Commit**

```bash
git add templates/config/keyword-mappings.json
git commit -m "feat(config): add hook-design craft keyword mapping"
```

---

### Task 7.3: 更新 regex-patterns 部分

**Files:**
- Modify: `templates/config/keyword-mappings.json:90-99`（regex-patterns 部分）

**Step 1: 在 `regex-patterns` 对象中添加新增映射的正则**

将原来的：
```json
"regex-patterns": {
    "dialogue": "对话|台词|说话|对白",
    "scene": "场景|镜头|画面",
    "character-arc": "角色成长|角色弧线|弧线|转变|成长",
    "pacing": "节奏|拖沓|太快|太慢|过快|过慢",
    "show-tell": "展示|描写|tell|show",
    "romance": "言情|恋爱|感情|爱情",
    "mystery": "悬疑|推理|线索",
    "consistency": "一致性|矛盾|冲突"
  }
```

改为：
```json
"regex-patterns": {
    "dialogue": "对话|台词|说话|对白",
    "scene": "场景|镜头|画面",
    "character-arc": "角色成长|角色弧线|弧线|转变|成长",
    "pacing": "节奏|拖沓|太快|太慢|过快|过慢",
    "show-tell": "展示|描写|tell|show",
    "hook-design": "钩子|悬念|章末|hook|cliffhanger|结尾",
    "romance": "言情|恋爱|感情|爱情",
    "mystery": "悬疑|推理|线索",
    "wuxia": "武侠|江湖|侠客|武功",
    "historical": "历史|古代|朝代|宫廷",
    "sci-fi": "科幻|未来|太空|星际",
    "thriller": "惊悚|恐怖|紧张",
    "revenge": "复仇|报仇|仇恨",
    "xuanhuan": "玄幻|修仙|修炼|境界|灵气|宗门",
    "consistency": "一致性|矛盾|冲突"
  }
```

**Step 2: 验证 JSON 格式**

Run: `node -e "JSON.parse(require('fs').readFileSync('templates/config/keyword-mappings.json','utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

**Step 3: 验证映射总数**

Run: `node -e "const j=JSON.parse(require('fs').readFileSync('templates/config/keyword-mappings.json','utf8')); let c=0; for(const cat of Object.values(j.mappings)) c+=Object.keys(cat).length; console.log('Total mappings:', c)"`
Expected: `Total mappings: 15`（原 8 条 + 新增 7 条）

**Step 4: 更新 notes 中的说明**

将 `notes.usage` 保持不变，无需修改。

**Step 5: Commit**

```bash
git add templates/config/keyword-mappings.json
git commit -m "feat(config): update regex-patterns to match all new keyword mappings (8 → 15 entries)"
```

---

### Task 7.4: 最终验证

**Step 1: 验证完整的 JSON 文件**

Run: `node -e "const j=JSON.parse(require('fs').readFileSync('templates/config/keyword-mappings.json','utf8')); console.log('Mappings categories:', Object.keys(j.mappings)); for(const [cat,items] of Object.entries(j.mappings)) console.log(cat+':', Object.keys(items).join(', ')); console.log('Regex patterns:', Object.keys(j['regex-patterns']).join(', '))"`

Expected:
```
Mappings categories: [ 'craft-knowledge', 'genre-knowledge', 'quality-assurance' ]
craft-knowledge: dialogue, scene-structure, character-arc, pacing, show-not-tell, hook-design
genre-knowledge: romance, mystery, wuxia, historical, sci-fi, thriller, revenge, xuanhuan
quality-assurance: consistency
Regex patterns: dialogue, scene, character-arc, pacing, show-tell, hook-design, romance, mystery, wuxia, historical, sci-fi, thriller, revenge, xuanhuan, consistency
```

**Step 2: 确认所有引用的资源文件存在**

Run: `node -e "const j=JSON.parse(require('fs').readFileSync('templates/config/keyword-mappings.json','utf8')); const fs=require('fs'); for(const cat of Object.values(j.mappings)) for(const item of Object.values(cat)) for(const r of item.resources) console.log(fs.existsSync(r)?'✅':'❌', r)"`

Expected: 所有文件显示 ✅（前提是 Task 4 和 Task 5 已完成）

**Step 3: 最终 Commit 汇总**

```bash
git log --oneline -5
```
Expected: 看到 3-4 个相关 commit
