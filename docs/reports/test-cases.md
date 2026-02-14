# 风格学习 Skill 测试用例

本文档定义风格学习 Skill 的测试用例，确保功能正确性和鲁棒性。

---

## 测试策略

### 测试层次
1. **单元测试**：测试单个分析函数
2. **集成测试**：测试完整的风格学习流程
3. **端到端测试**：测试与其他命令的集成

### 测试数据
- **真实章节样本**：从实际小说中提取
- **合成样本**：针对特定风格特征构造
- **边界情况样本**：极端情况测试

---

## 1. 单元测试用例

### 1.1 句子分割测试

**测试目标**：验证句子分割的准确性

#### Test Case 1.1.1: 基本句子分割
```yaml
name: test_split_sentences_basic
input: |
  他转身离开。她没有追。外面下起了雨。
expected:
  - "他转身离开。"
  - "她没有追。"
  - "外面下起了雨。"
```

#### Test Case 1.1.2: 引号内的句子
```yaml
name: test_split_sentences_with_quotes
input: |
  "你要走吗？"她问。"嗯。"他点头。
expected:
  - '"你要走吗？"她问。'
  - '"嗯。"他点点头。'
```

#### Test Case 1.1.3: 省略号和破折号
```yaml
name: test_split_sentences_with_ellipsis
input: |
  她想说什么……但最终没说。他——他不知道该怎么办。
expected:
  - "她想说什么……但最终没说。"
  - "他——他不知道该怎么办。"
```

### 1.2 句长计算测试

**测试目标**：验证句长统计的准确性

#### Test Case 1.2.1: 短句为主
```yaml
name: test_sentence_length_short
input:
  - "他走了。"
  - "她没追。"
  - "雨下了。"
expected:
  avg_length: 3.0
  short_ratio: 100.0
  medium_ratio: 0.0
  long_ratio: 0.0
```

#### Test Case 1.2.2: 混合句长
```yaml
name: test_sentence_length_mixed
input:
  - "他走了。"  # 3字
  - "她站在原地，看着他的背影消失在雨中。"  # 17字
  - "外面的雨越下越大，雷声轰隆隆的，像是要把天空撕裂一样。"  # 27字
expected:
  avg_length: 15.7  # (3+17+27)/3
  short_ratio: 33.3  # 1/3
  medium_ratio: 33.3  # 1/3
  long_ratio: 33.3   # 1/3
```

### 1.3 词汇分析测试

**测试目标**：验证形容词和副词密度计算

#### Test Case 1.3.1: 低形容词密度
```yaml
name: test_word_density_low_adj
input: "他走了。她没追。雨下了。"
expected:
  adj_density: 0.0
  adv_density: 0.0
```

#### Test Case 1.3.2: 高形容词密度
```yaml
name: test_word_density_high_adj
input: "美丽的她站在宽阔的街道上，看着灰暗的天空。"
expected:
  adj_density: > 15.0  # 美丽、宽阔、灰暗
```

### 1.4 对话检测测试

**测试目标**：验证对话占比计算

#### Test Case 1.4.1: 纯对话
```yaml
name: test_dialogue_pure
input: |
  "你要走吗？"
  "嗯。"
  "真的？"
  "真的。"
expected:
  dialogue_ratio: > 90.0
  dialogue_count: 4
```

#### Test Case 1.4.2: 对话与叙述混合
```yaml
name: test_dialogue_mixed
input: |
  "你要走吗？"她问。
  他没说话，只是点了点头。
  "那好吧。"她转身离开。
expected:
  dialogue_ratio: 40.0 - 60.0  # 大约一半
  dialogue_count: 2
```

### 1.5 段落分析测试

**测试目标**：验证段落长度和单句段比例

#### Test Case 1.5.1: 单句段为主
```yaml
name: test_paragraph_single_sentence
input: |
  他走了。

  她没追。

  雨下了。
expected:
  single_para_ratio: 100.0
  total_paragraphs: 3
```

#### Test Case 1.5.2: 混合段落
```yaml
name: test_paragraph_mixed
input: |
  他走了。

  她站在原地，看着他的背影。雨越下越大。

  外面很冷。
expected:
  single_para_ratio: 66.7  # 2/3
  total_paragraphs: 3
```

---

## 2. 集成测试用例

### 2.1 完整风格分析测试

**测试目标**：验证完整的风格分析流程

#### Test Case 2.1.1: 短句风格样本
```yaml
name: test_style_analysis_short_sentences
input_file: test/fixtures/short-sentence-style.md
expected:
  sentence:
    avg_length: 12.0 - 18.0
    short_ratio: > 60.0
  word:
    adj_density: < 5.0
  dialogue:
    dialogue_ratio: > 50.0
  style_description: "短句为主、对话驱动、简洁克制"
```

**测试数据** (`test/fixtures/short-sentence-style.md`):
```markdown
他推门进来。

"吃了吗？"她问。

"嗯。"

"吃的什么？"

"随便吃的。"

她没再问。他坐下，打开电视。

外面下雨了。
```

#### Test Case 2.1.2: 描写细腻风格样本
```yaml
name: test_style_analysis_descriptive
input_file: test/fixtures/descriptive-style.md
expected:
  sentence:
    avg_length: 20.0 - 30.0
  word:
    adj_density: > 10.0
  dialogue:
    dialogue_ratio: < 30.0
  style_description: "中长句混合、描写细腻"
```

**测试数据** (`test/fixtures/descriptive-style.md`):
```markdown
林晚晴站在咖啡馆的落地窗前，修长的手指轻轻摩挲着温热的瓷杯杯壁。
窗外的阳光透过玻璃洒在她白皙的脸庞上，在她的皮肤上镀上一层柔和的光晕。

她的目光若有所思地望向远方，似乎在等待着什么，又似乎在回忆着什么。
咖啡的香气在空气中弥漫，她轻抿了一口，苦涩中带着一丝甘甜。
```

#### Test Case 2.1.3: 对话驱动风格样本
```yaml
name: test_style_analysis_dialogue_driven
input_file: test/fixtures/dialogue-driven-style.md
expected:
  dialogue:
    dialogue_ratio: > 70.0
  dialogue_tags:
    tag_frequency: < 40.0  # 少用对话标签
  style_description: "对话驱动"
```

**测试数据** (`test/fixtures/dialogue-driven-style.md`):
```markdown
"你什么意思？"

"字面意思。"

"你——"

"别装了。"他打断她，"我都知道。"

她脸色变了。

"知道什么？"

"你说呢？"

"我不知道你在说什么。"

"是吗？"他冷笑。
```

### 2.2 personal-voice.md 生成测试

**测试目标**：验证风格指南文件的生成

#### Test Case 2.2.1: 生成完整的 personal-voice.md
```yaml
name: test_generate_personal_voice_md
input_chapters:
  - test/fixtures/chapter-01.md
  - test/fixtures/chapter-02.md
  - test/fixtures/chapter-03.md
expected:
  file_exists: .specify/memory/personal-voice.md
  file_contains:
    - "# 个人写作风格指南"
    - "## 📊 量化风格特征"
    - "## 🎨 定性风格印象"
    - "## ✍️ 续写指导"
    - "平均句长"
    - "形容词密度"
    - "对话占比"
```

---

## 3. 端到端测试用例

### 3.1 与 /write 命令集成测试

**测试目标**：验证风格学习与写作命令的集成

#### Test Case 3.1.1: 首次写作时提示风格学习
```yaml
name: test_write_prompts_style_learning
preconditions:
  - personal-voice.md 不存在
  - 已写章节 ≥ 3 章
steps:
  1. 执行 /write
  2. 检查是否显示风格学习提示
expected:
  prompt_shown: true
  prompt_contains: "建议执行风格学习"
```

#### Test Case 3.1.2: 已有风格指南时不提示
```yaml
name: test_write_no_prompt_with_existing_guide
preconditions:
  - personal-voice.md 存在
steps:
  1. 执行 /write
  2. 检查是否显示风格学习提示
expected:
  prompt_shown: false
```

#### Test Case 3.1.3: 章节不足时不提示
```yaml
name: test_write_no_prompt_insufficient_chapters
preconditions:
  - personal-voice.md 不存在
  - 已写章节 < 3 章
steps:
  1. 执行 /write
  2. 检查是否显示风格学习提示
expected:
  prompt_shown: false
```

### 3.2 与 /checklist 命令集成测试

**测试目标**：验证风格学习与检查清单的集成

#### Test Case 3.2.1: 写作状态检查包含风格指南状态
```yaml
name: test_checklist_includes_style_guide_status
steps:
  1. 执行 /checklist 写作状态
  2. 检查生成的 checklist
expected:
  checklist_contains:
    - "personal-voice.md 是否存在？"
    - "风格指南是否过时？"
```

---

## 4. 边界情况测试

### 4.1 样本不足测试

#### Test Case 4.1.1: 只有 1 章
```yaml
name: test_insufficient_chapters_1
input_chapters:
  - test/fixtures/chapter-01.md
expected:
  error: true
  error_message: "样本不足，建议至少 3 章"
```

#### Test Case 4.1.2: 只有 2 章
```yaml
name: test_insufficient_chapters_2
input_chapters:
  - test/fixtures/chapter-01.md
  - test/fixtures/chapter-02.md
expected:
  warning: true
  warning_message: "样本较少，分析结果可能不稳定"
```

### 4.2 空章节测试

#### Test Case 4.2.1: 空章节文件
```yaml
name: test_empty_chapter
input_chapters:
  - test/fixtures/empty-chapter.md  # 空文件
  - test/fixtures/chapter-01.md
  - test/fixtures/chapter-02.md
expected:
  chapters_analyzed: 2  # 跳过空章节
  warning: "跳过空章节：empty-chapter.md"
```

### 4.3 特殊格式测试

#### Test Case 4.3.1: 纯对话章节
```yaml
name: test_pure_dialogue_chapter
input_chapters:
  - test/fixtures/pure-dialogue.md  # 100% 对话
  - test/fixtures/chapter-01.md
  - test/fixtures/chapter-02.md
expected:
  dialogue:
    dialogue_ratio: > 80.0
  warning: "检测到纯对话章节，可能影响分析结果"
```

#### Test Case 4.3.2: 诗歌格式
```yaml
name: test_poetry_format
input_chapters:
  - test/fixtures/poetry-chapter.md  # 诗歌格式
expected:
  warning: "检测到特殊格式（诗歌），建议手动调整风格指南"
```

### 4.4 异常值测试

#### Test Case 4.4.1: 极短句子
```yaml
name: test_extremely_short_sentences
input: "他。她。雨。风。"
expected:
  sentence:
    avg_length: < 2.0
  warning: "平均句长异常短（< 5 字），请检查分析结果"
```

#### Test Case 4.4.2: 极长句子
```yaml
name: test_extremely_long_sentences
input: |
  他站在那里，看着她，想着刚才发生的一切，回忆着他们相识的那一天，
  那个阳光明媚的下午，他们在咖啡馆相遇，她穿着白色的连衣裙，
  笑容灿烂，像是春天的阳光，温暖而明亮，让他一见倾心，
  从那以后，他就再也无法忘记她。
expected:
  sentence:
    avg_length: > 50.0
  warning: "平均句长异常长（> 40 字），请检查分析结果"
```

---

## 5. 性能测试

### 5.1 大文本测试

#### Test Case 5.1.1: 10 章（约 20,000 字）
```yaml
name: test_performance_10_chapters
input_chapters: 10 章，每章 2000 字
expected:
  execution_time: < 10 秒
  memory_usage: < 100 MB
```

#### Test Case 5.1.2: 50 章（约 100,000 字）
```yaml
name: test_performance_50_chapters
input_chapters: 50 章，每章 2000 字
expected:
  execution_time: < 30 秒
  memory_usage: < 500 MB
```

---

## 6. 回归测试

### 6.1 风格指南更新测试

#### Test Case 6.1.1: 更新现有风格指南
```yaml
name: test_update_existing_guide
preconditions:
  - personal-voice.md 存在（基于前 10 章）
  - 新写了 10 章（第 11-20 章）
steps:
  1. 执行风格学习
  2. 检查 personal-voice.md 是否更新
expected:
  file_updated: true
  update_record_added: true
  analysis_range: "第 1-20 章"
```

---

## 7. 测试执行计划

### 阶段 1：单元测试（优先级：P0）
- 句子分割测试
- 句长计算测试
- 词汇分析测试
- 对话检测测试
- 段落分析测试

### 阶段 2：集成测试（优先级：P0）
- 完整风格分析测试（3 种风格样本）
- personal-voice.md 生成测试

### 阶段 3：端到端测试（优先级：P1）
- 与 /write 命令集成测试
- 与 /checklist 命令集成测试

### 阶段 4：边界情况测试（优先级：P1）
- 样本不足测试
- 空章节测试
- 特殊格式测试
- 异常值测试

### 阶段 5：性能测试（优先级：P2）
- 大文本测试

### 阶段 6：回归测试（优先级：P2）
- 风格指南更新测试

---

## 8. 测试数据准备

### 需要准备的测试文件

```
test/
├── fixtures/
│   ├── short-sentence-style.md      # 短句风格样本
│   ├── descriptive-style.md         # 描写细腻风格样本
│   ├── dialogue-driven-style.md     # 对话驱动风格样本
│   ├── chapter-01.md                # 标准章节 1
│   ├── chapter-02.md                # 标准章节 2
│   ├── chapter-03.md                # 标准章节 3
│   ├── empty-chapter.md             # 空章节
│   ├── pure-dialogue.md             # 纯对话章节
│   └── poetry-chapter.md            # 诗歌格式章节
└── expected/
    └── personal-voice-sample.md     # 预期的风格指南样本
```

---

## 9. 验收标准

### 功能完整性
- [ ] 所有 P0 测试用例通过
- [ ] 至少 80% 的 P1 测试用例通过

### 准确性
- [ ] 句长计算误差 < 5%
- [ ] 对话占比计算误差 < 10%
- [ ] 形容词密度计算误差 < 5%

### 性能
- [ ] 10 章分析时间 < 10 秒
- [ ] 内存占用 < 100 MB

### 可用性
- [ ] 生成的 personal-voice.md 可读性良好
- [ ] 续写指导清晰可执行
- [ ] 错误提示友好明确

---

## 总结

本测试计划覆盖了风格学习 Skill 的所有核心功能，包括：
- 文本分析算法的准确性
- 风格指南生成的完整性
- 与其他命令的集成
- 边界情况和异常处理
- 性能和可用性

通过执行这些测试用例，可以确保风格学习 Skill 的质量和可靠性。
