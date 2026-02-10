# References 参考资料库扩展实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 扩展 References 参考资料库，新增唐朝、现代职场、修仙世界三个资料库，覆盖更多热门题材。

**Architecture:** 沿用 china-1920s 的目录结构和文件格式（overview + 分主题文件），每个资料库包含 5-6 个主题文件，遵循"概览 → 核心信息速查 → 详细说明 → 常见误区 → 写作应用"的统一格式。

**Tech Stack:** Markdown 文档，无代码依赖

---

## 现有结构参考

```
templates/knowledge-base/references/
├── README.md                    # 参考资料库总索引
└── china-1920s/                 # 已完成的示例
    ├── overview.md              # 概览
    ├── society.md               # 社会结构
    ├── culture.md               # 文化娱乐
    ├── daily-life.md            # 日常生活
    └── warlords.md              # 军阀体系
```

## 每个文件的标准格式

```markdown
# [主题名称]

## 概览（Overview）
[2-3 段总体介绍]

## 核心信息速查（Quick Facts）
[表格形式的关键数据]

## 详细说明（Detailed Information）
[按子主题组织的详细内容，使用 ### 子标题]

## 常见误区（Common Misconceptions）
[历史/题材小说中容易犯的错误，使用 ❌ 和 ✅ 对比]

## 写作应用（Writing Applications）
[如何在小说中使用这些信息，提供具体场景示例]

## 参考来源（Sources）
[资料来源，确保可靠性]
```

---

## Task 1: 唐朝参考资料库（tang-dynasty）

**Files:**
- Create: `templates/knowledge-base/references/tang-dynasty/overview.md`
- Create: `templates/knowledge-base/references/tang-dynasty/politics.md`
- Create: `templates/knowledge-base/references/tang-dynasty/society.md`
- Create: `templates/knowledge-base/references/tang-dynasty/culture.md`
- Create: `templates/knowledge-base/references/tang-dynasty/daily-life.md`
- Modify: `templates/knowledge-base/references/README.md`

### Step 1: 创建 tang-dynasty 目录

```bash
mkdir -p templates/knowledge-base/references/tang-dynasty
```

### Step 2: 编写 overview.md

创建 `templates/knowledge-base/references/tang-dynasty/overview.md`

**内容要求：**
- 唐朝（618-907）总体介绍，分初唐/盛唐/中唐/晚唐四个阶段
- 核心信息速查表：国号、都城、人口、疆域、主要帝王、重大事件
- 时间线概览：关键年份和事件
- 唐朝在中国历史中的地位和影响
- 常见误区：不是所有唐朝都是盛世（安史之乱后的衰落）
- 写作应用：不同时期适合不同类型的故事

**字数要求：** 800-1200 字

### Step 3: 编写 politics.md

创建 `templates/knowledge-base/references/tang-dynasty/politics.md`

**内容要求：**
- 三省六部制详解（中书省、门下省、尚书省）
- 科举制度（进士科、明经科、考试流程）
- 官职体系（九品三十阶、散官与职事官）
- 藩镇制度（节度使、军镇、安史之乱的根源）
- 宫廷政治（后宫、宦官、朋党之争）
- 常见误区：科举不等于现代高考、宰相不止一人
- 写作应用：权谋小说的政治背景设定

**字数要求：** 1000-1500 字

### Step 4: 编写 society.md

创建 `templates/knowledge-base/references/tang-dynasty/society.md`

**内容要求：**
- 社会阶层（士族门阀、庶族地主、商人、农民、奴婢）
- 女性地位（相对开放、武则天现象、女性参与社会活动）
- 胡汉融合（胡人在长安、胡风流行、民族政策）
- 宗教信仰（佛教、道教、景教、祆教、伊斯兰教）
- 法律制度（唐律疏议、刑罚体系）
- 常见误区：唐朝女性并非完全自由、胡汉融合有限度
- 写作应用：社会阶层冲突、跨文化交流场景

**字数要求：** 1000-1500 字

### Step 5: 编写 culture.md

创建 `templates/knowledge-base/references/tang-dynasty/culture.md`

**内容要求：**
- 诗歌文学（诗仙李白、诗圣杜甫、诗佛王维、晚唐李商隐）
- 音乐舞蹈（霓裳羽衣曲、胡旋舞、教坊）
- 绘画书法（吴道子、阎立本、颜真卿、张旭）
- 节日庆典（上元节、寒食节、重阳节）
- 饮食文化（胡饼、茶文化、宴饮礼仪）
- 常见误区：唐诗不只有五言七言、不是所有人都能写诗
- 写作应用：文化场景描写、诗酒风流的氛围营造

**字数要求：** 1000-1500 字

### Step 6: 编写 daily-life.md

创建 `templates/knowledge-base/references/tang-dynasty/daily-life.md`

**内容要求：**
- 城市生活（长安城布局、坊市制度、宵禁）
- 衣着服饰（男装、女装、胡服、官服品级）
- 交通出行（马车、骑马、驿站系统、运河）
- 货币经济（开元通宝、绢帛交易、飞钱）
- 住宅建筑（贵族宅邸、平民住房、园林）
- 常见误区：坊市制度限制很严格、夜市是晚唐才普及
- 写作应用：日常场景的细节描写、生活气息营造

**字数要求：** 1000-1500 字

### Step 7: 更新 README.md 索引

修改 `templates/knowledge-base/references/README.md`，在资料库列表中添加 tang-dynasty 条目：

```markdown
### 唐朝（tang-dynasty）

**时代范围：** 618-907 年
**适用题材：** 历史小说、宫廷权谋、武侠、仙侠、言情
**包含文件：**
- `overview.md` - 唐朝概览（四个阶段、关键事件）
- `politics.md` - 政治制度（三省六部、科举、藩镇）
- `society.md` - 社会结构（阶层、女性、胡汉融合）
- `culture.md` - 文化艺术（诗歌、音乐、绘画、节日）
- `daily-life.md` - 日常生活（城市、服饰、交通、货币）
```

### Step 8: 提交

```bash
git add templates/knowledge-base/references/tang-dynasty/
git add templates/knowledge-base/references/README.md
git commit -m "feat(references): 添加唐朝参考资料库 (tang-dynasty)"
```

---

## Task 2: 现代职场参考资料库（modern-workplace）

**Files:**
- Create: `templates/knowledge-base/references/modern-workplace/overview.md`
- Create: `templates/knowledge-base/references/modern-workplace/corporate.md`
- Create: `templates/knowledge-base/references/modern-workplace/tech-industry.md`
- Create: `templates/knowledge-base/references/modern-workplace/relationships.md`
- Create: `templates/knowledge-base/references/modern-workplace/daily-life.md`
- Modify: `templates/knowledge-base/references/README.md`

### Step 1: 创建 modern-workplace 目录

```bash
mkdir -p templates/knowledge-base/references/modern-workplace
```

### Step 2: 编写 overview.md

创建 `templates/knowledge-base/references/modern-workplace/overview.md`

**内容要求：**
- 现代中国职场概览（2010s-2020s）
- 核心信息速查表：主要行业、平均薪资、工作时长、职场文化关键词
- 职场类型分类：互联网大厂、外企、国企、创业公司、传统行业
- 代际差异：70后/80后/90后/00后的职场观念
- 常见误区：不是所有公司都996、职场剧常见的不真实设定
- 写作应用：不同行业背景适合不同类型的职场故事

**字数要求：** 800-1200 字

### Step 3: 编写 corporate.md

创建 `templates/knowledge-base/references/modern-workplace/corporate.md`

**内容要求：**
- 企业组织架构（扁平化 vs 层级制、矩阵式管理）
- 职级体系（互联网大厂 P 序列/T 序列、传统企业职级）
- 会议文化（周会、月度复盘、OKR/KPI 考核）
- 办公环境（开放式办公、远程办公、共享工位）
- 企业文化（狼性文化、扁平文化、外企文化差异）
- 常见误区：总裁不会亲自面试实习生、升职不是一步到位
- 写作应用：权力结构、办公室政治的真实描写

**字数要求：** 1000-1500 字

### Step 4: 编写 tech-industry.md

创建 `templates/knowledge-base/references/modern-workplace/tech-industry.md`

**内容要求：**
- 互联网行业生态（BAT/TMD、独角兽、创业公司）
- 技术岗位（前端/后端/算法/产品/运营/测试）
- 工作流程（敏捷开发、Scrum、代码评审、上线流程）
- 行业术语（赛道、闭环、赋能、抓手、颗粒度、对齐）
- 加班文化（996/007、大小周、弹性工作制）
- 常见误区：程序员不只是写代码、产品经理不是什么都管
- 写作应用：科技公司背景的职场小说细节

**字数要求：** 1000-1500 字

### Step 5: 编写 relationships.md

创建 `templates/knowledge-base/references/modern-workplace/relationships.md`

**内容要求：**
- 上下级关系（领导风格、向上管理、mentor 制度）
- 同事关系（竞争与合作、小团体、跨部门协作）
- 职场社交（团建、下午茶、微信群文化）
- 职场禁忌（办公室恋情政策、站队、越级汇报）
- 职场冲突（资源争夺、功劳归属、裁员与跳槽）
- 常见误区：霸道总裁式管理不存在、职场友谊有边界
- 写作应用：人际关系冲突的真实描写

**字数要求：** 1000-1500 字

### Step 6: 编写 daily-life.md

创建 `templates/knowledge-base/references/modern-workplace/daily-life.md`

**内容要求：**
- 通勤生活（地铁、打车、租房与买房）
- 工作日常（早会、午餐、下午茶、加班）
- 薪资福利（五险一金、股票期权、年终奖）
- 职业发展（跳槽、转行、考公、读研）
- 生活压力（房贷、内卷、35岁危机）
- 常见误区：不是所有白领都光鲜、薪资差距巨大
- 写作应用：职场人物的日常生活细节

**字数要求：** 1000-1500 字

### Step 7: 更新 README.md 索引

修改 `templates/knowledge-base/references/README.md`，添加 modern-workplace 条目：

```markdown
### 现代职场（modern-workplace）

**时代范围：** 2010s-2020s 中国
**适用题材：** 都市言情、职场小说、商战、轻喜剧
**包含文件：**
- `overview.md` - 职场概览（行业分类、代际差异）
- `corporate.md` - 企业制度（组织架构、职级、考核）
- `tech-industry.md` - 互联网行业（岗位、流程、术语）
- `relationships.md` - 职场关系（上下级、同事、社交）
- `daily-life.md` - 日常生活（通勤、薪资、压力）
```

### Step 8: 提交

```bash
git add templates/knowledge-base/references/modern-workplace/
git add templates/knowledge-base/references/README.md
git commit -m "feat(references): 添加现代职场参考资料库 (modern-workplace)"
```

---

## Task 3: 修仙世界参考资料库（cultivation-world）

**Files:**
- Create: `templates/knowledge-base/references/cultivation-world/overview.md`
- Create: `templates/knowledge-base/references/cultivation-world/power-system.md`
- Create: `templates/knowledge-base/references/cultivation-world/sects.md`
- Create: `templates/knowledge-base/references/cultivation-world/world-setting.md`
- Create: `templates/knowledge-base/references/cultivation-world/daily-life.md`
- Modify: `templates/knowledge-base/references/README.md`

### Step 1: 创建 cultivation-world 目录

```bash
mkdir -p templates/knowledge-base/references/cultivation-world
```

### Step 2: 编写 overview.md

创建 `templates/knowledge-base/references/cultivation-world/overview.md`

**内容要求：**
- 修仙小说世界观概览
- 核心信息速查表：修仙体系分类、常见设定、核心概念
- 修仙小说的流派分类（凡人流、宗门流、洪荒流、都市修仙、系统流）
- 修仙与仙侠的区别
- 常见误区：修仙不等于打怪升级、境界不是唯一卖点
- 写作应用：如何选择适合自己故事的修仙体系

**字数要求：** 800-1200 字

### Step 3: 编写 power-system.md

创建 `templates/knowledge-base/references/cultivation-world/power-system.md`

**内容要求：**
- 经典境界体系（炼气 → 筑基 → 金丹 → 元婴 → 化神 → 渡劫 → 大乘 → 飞升）
- 每个境界的特征（寿命、能力、战力表现）
- 功法体系（修炼功法、战斗法术、炼丹炼器、阵法符箓）
- 灵根与资质（五行灵根、变异灵根、天灵根）
- 天材地宝（灵石、灵药、法宝品级）
- 常见误区：境界碾压不是绝对的、越级战斗需要合理解释
- 写作应用：如何设计有层次感的力量体系

**字数要求：** 1200-1800 字

### Step 4: 编写 sects.md

创建 `templates/knowledge-base/references/cultivation-world/sects.md`

**内容要求：**
- 宗门体系（大宗门、中小门派、散修、魔道）
- 宗门组织架构（掌门、长老、内门弟子、外门弟子、杂役弟子）
- 宗门资源分配（灵石月例、功法阁、丹药堂、任务殿）
- 宗门关系（同盟、世仇、宗门大比、修仙界格局）
- 散修生存（坊市交易、冒险探宝、依附势力）
- 常见误区：宗门不是学校、长老不是老师
- 写作应用：宗门政治和权力斗争的设计

**字数要求：** 1000-1500 字

### Step 5: 编写 world-setting.md

创建 `templates/knowledge-base/references/cultivation-world/world-setting.md`

**内容要求：**
- 世界结构（凡人界、修仙界、仙界、魔界）
- 地理设定（灵脉、秘境、禁地、坊市、修仙城）
- 天道规则（天劫、因果、气运、大道）
- 种族设定（人族、妖族、魔族、鬼修）
- 历史背景（上古大战、仙魔之战、末法时代）
- 常见误区：世界不需要面面俱到、规则要自洽
- 写作应用：如何构建有深度的修仙世界观

**字数要求：** 1000-1500 字

### Step 6: 编写 daily-life.md

创建 `templates/knowledge-base/references/cultivation-world/daily-life.md`

**内容要求：**
- 修士日常（打坐修炼、炼丹炼器、外出历练）
- 交易系统（灵石货币、坊市、拍卖会、以物易物）
- 通讯传送（传音符、传送阵、飞剑传书）
- 饮食起居（辟谷、灵食、洞府布置）
- 社交礼仪（道友称呼、拜师礼、宗门规矩）
- 常见误区：修士不是不食人间烟火、低阶修士生活很苦
- 写作应用：修仙世界的生活细节描写

**字数要求：** 1000-1500 字

### Step 7: 更新 README.md 索引

修改 `templates/knowledge-base/references/README.md`，添加 cultivation-world 条目：

```markdown
### 修仙世界（cultivation-world）

**类型：** 虚构世界观设定
**适用题材：** 修仙、仙侠、玄幻、系统流
**包含文件：**
- `overview.md` - 修仙世界概览（流派分类、核心概念）
- `power-system.md` - 力量体系（境界、功法、灵根、法宝）
- `sects.md` - 宗门体系（组织架构、资源分配、散修）
- `world-setting.md` - 世界设定（地理、天道、种族、历史）
- `daily-life.md` - 日常生活（修炼、交易、通讯、社交）
```

### Step 8: 提交

```bash
git add templates/knowledge-base/references/cultivation-world/
git add templates/knowledge-base/references/README.md
git commit -m "feat(references): 添加修仙世界参考资料库 (cultivation-world)"
```

---

## Task 4: 最终验证与总提交

### Step 1: 验证目录结构

```bash
find templates/knowledge-base/references/ -type f -name "*.md" | sort
```

**期望输出：**
```
templates/knowledge-base/references/README.md
templates/knowledge-base/references/china-1920s/culture.md
templates/knowledge-base/references/china-1920s/daily-life.md
templates/knowledge-base/references/china-1920s/overview.md
templates/knowledge-base/references/china-1920s/society.md
templates/knowledge-base/references/china-1920s/warlords.md
templates/knowledge-base/references/cultivation-world/daily-life.md
templates/knowledge-base/references/cultivation-world/overview.md
templates/knowledge-base/references/cultivation-world/power-system.md
templates/knowledge-base/references/cultivation-world/sects.md
templates/knowledge-base/references/cultivation-world/world-setting.md
templates/knowledge-base/references/modern-workplace/corporate.md
templates/knowledge-base/references/modern-workplace/daily-life.md
templates/knowledge-base/references/modern-workplace/overview.md
templates/knowledge-base/references/modern-workplace/relationships.md
templates/knowledge-base/references/modern-workplace/tech-industry.md
templates/knowledge-base/references/tang-dynasty/culture.md
templates/knowledge-base/references/tang-dynasty/daily-life.md
templates/knowledge-base/references/tang-dynasty/overview.md
templates/knowledge-base/references/tang-dynasty/politics.md
templates/knowledge-base/references/tang-dynasty/society.md
```

**总计：** 21 个 Markdown 文件（原有 6 个 + 新增 15 个）

### Step 2: 验证 README.md 索引完整性

确认 README.md 包含全部 4 个资料库的索引条目：
- ✅ china-1920s
- ✅ tang-dynasty
- ✅ modern-workplace
- ✅ cultivation-world

### Step 3: 更新 setting-detector Skill

修改 `templates/skills/quality-assurance/setting-detector/SKILL.md`，在关键词映射表中添加新资料库的触发关键词：

```yaml
tang-dynasty:
  keywords: [唐朝, 唐代, 长安, 大唐, 贞观, 开元, 安史之乱, 科举]
  auto_load: references/tang-dynasty/

modern-workplace:
  keywords: [职场, 公司, 互联网, 大厂, 996, 办公室, 同事, 上班]
  auto_load: references/modern-workplace/

cultivation-world:
  keywords: [修仙, 修真, 炼气, 筑基, 金丹, 元婴, 宗门, 灵根, 渡劫]
  auto_load: references/cultivation-world/
```

### Step 4: 最终提交

```bash
git add templates/skills/quality-assurance/setting-detector/SKILL.md
git commit -m "feat(skills): 更新 setting-detector 支持新参考资料库"
```
