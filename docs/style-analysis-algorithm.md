# 文本分析算法实现指南

本文档详细说明如何实现自适应风格学习的文本分析算法。

---

## 概述

风格分析算法的目标是从用户已写的章节中提取可量化的风格特征，并生成个性化的风格指南。

**核心思路**：
1. 读取用户已写章节（3+ 章）
2. 对文本进行多层次分析（句子、词汇、段落、对话、节奏）
3. 提取量化指标
4. 生成定性描述
5. 输出具体的续写指导

---

## 算法架构

```
输入：用户已写章节（Markdown 文件）
  ↓
预处理：清理格式、分割文本
  ↓
多层次分析：
  ├─ 句子分析
  ├─ 词汇分析
  ├─ 段落分析
  ├─ 对话分析
  └─ 节奏分析
  ↓
特征提取：量化指标
  ↓
风格归纳：定性描述
  ↓
输出：personal-voice.md
```

---

## 1. 预处理阶段

### 1.1 读取章节文件

**目标**：读取用户已写的章节内容

**实现步骤**：
1. 扫描 `stories/[current]/content/` 目录
2. 识别章节文件（通常是 `chapter-*.md` 或 `第*章.md`）
3. 排除大纲文件、草稿文件
4. 读取最近 10 章（或全部，如果 < 10 章）

**伪代码**：
```python
def read_chapters(story_path: str, max_chapters: int = 10) -> List[str]:
    """读取章节内容"""
    content_dir = os.path.join(story_path, "content")

    # 查找章节文件
    chapter_files = []
    for file in os.listdir(content_dir):
        if file.startswith("chapter-") or file.startswith("第"):
            if file.endswith(".md"):
                chapter_files.append(file)

    # 按章节号排序
    chapter_files.sort()

    # 读取最近的章节
    recent_chapters = chapter_files[-max_chapters:]

    chapters = []
    for file in recent_chapters:
        with open(os.path.join(content_dir, file), 'r', encoding='utf-8') as f:
            content = f.read()
            chapters.append(content)

    return chapters
```

### 1.2 清理文本

**目标**：移除 Markdown 格式标记，保留纯文本

**需要清理的内容**：
- 标题标记（`#`）
- 粗体/斜体标记（`**`、`*`）
- 链接标记（`[]()`）
- 代码块标记（` ``` `）
- 注释（`<!-- -->`）

**保留的内容**：
- 段落分隔（空行）
- 对话引号（`""`、`「」`、`『』`）
- 标点符号

**伪代码**：
```python
import re

def clean_markdown(text: str) -> str:
    """清理 Markdown 格式"""
    # 移除标题标记
    text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)

    # 移除粗体/斜体
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'\*(.+?)\*', r'\1', text)

    # 移除链接
    text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text)

    # 移除代码块
    text = re.sub(r'```[\s\S]*?```', '', text)

    # 移除注释
    text = re.sub(r'<!--[\s\S]*?-->', '', text)

    return text.strip()
```

---

## 2. 句子层面分析

### 2.1 句子分割

**目标**：将文本分割成独立的句子

**中文句子分割规则**：
- 句末标点：`。`、`！`、`？`、`；`
- 特殊处理：引号内的标点、省略号、破折号

**实现步骤**：
1. 按句末标点分割
2. 处理引号内的句子
3. 处理省略号（`……`）和破折号（`——`）

**伪代码**：
```python
def split_sentences(text: str) -> List[str]:
    """分割句子"""
    # 句末标点
    sentence_endings = ['。', '！', '？', '；']

    sentences = []
    current_sentence = ""
    in_quote = False

    for i, char in enumerate(text):
        current_sentence += char

        # 检测引号状态
        if char in ['"', '「', '『']:
            in_quote = True
        elif char in ['"', '」', '』']:
            in_quote = False

        # 句末标点且不在引号内
        if char in sentence_endings and not in_quote:
            sentences.append(current_sentence.strip())
            current_sentence = ""

    # 添加最后一句
    if current_sentence.strip():
        sentences.append(current_sentence.strip())

    return sentences
```

### 2.2 计算句子长度

**目标**：统计每个句子的字数

**实现步骤**：
1. 对每个句子计算字符数（不含标点）
2. 计算平均句长
3. 计算句长标准差
4. 统计短句、中句、长句比例

**伪代码**：
```python
import re
from typing import Dict

def analyze_sentence_length(sentences: List[str]) -> Dict:
    """分析句子长度"""
    # 移除标点，计算字数
    lengths = []
    for sentence in sentences:
        # 移除所有标点
        clean_sentence = re.sub(r'[，。！？；：""''「」『』、]', '', sentence)
        length = len(clean_sentence)
        if length > 0:
            lengths.append(length)

    if not lengths:
        return {}

    # 计算统计指标
    avg_length = sum(lengths) / len(lengths)
    std_dev = (sum((x - avg_length) ** 2 for x in lengths) / len(lengths)) ** 0.5

    # 分类统计
    short_sentences = sum(1 for l in lengths if l < 15)
    medium_sentences = sum(1 for l in lengths if 15 <= l <= 30)
    long_sentences = sum(1 for l in lengths if l > 30)

    total = len(lengths)

    return {
        'avg_length': round(avg_length, 1),
        'std_dev': round(std_dev, 1),
        'short_ratio': round(short_sentences / total * 100, 1),
        'medium_ratio': round(medium_sentences / total * 100, 1),
        'long_ratio': round(long_sentences / total * 100, 1),
        'total_sentences': total
    }
```

---

## 3. 词汇层面分析

### 3.1 分词和词性标注

**目标**：识别词汇并标注词性

**推荐工具**：jieba 分词库

**实现步骤**：
1. 使用 jieba 进行分词
2. 使用 jieba.posseg 进行词性标注
3. 识别形容词、副词、动词等

**伪代码**：
```python
import jieba.posseg as pseg

def tokenize_and_tag(text: str) -> List[Tuple[str, str]]:
    """分词和词性标注"""
    words = pseg.cut(text)
    return [(word, flag) for word, flag in words]
```

### 3.2 形容词和副词密度

**目标**：计算形容词和副词占总词数的比例

**词性标记**：
- 形容词：`a`, `ad`, `an`, `ag`
- 副词：`d`, `df`, `dg`

**伪代码**：
```python
def analyze_word_density(text: str) -> Dict:
    """分析词汇密度"""
    words = tokenize_and_tag(text)

    total_words = len(words)
    adjectives = sum(1 for _, flag in words if flag.startswith('a'))
    adverbs = sum(1 for _, flag in words if flag.startswith('d'))

    return {
        'adj_density': round(adjectives / total_words * 100, 1),
        'adv_density': round(adverbs / total_words * 100, 1),
        'total_words': total_words
    }
```

### 3.3 高频词统计

**目标**：找出最常用的词汇

**实现步骤**：
1. 统计每个词的出现次数
2. 排除停用词（的、了、是、在等）
3. 返回 Top 10 高频词

**伪代码**：
```python
from collections import Counter

def get_frequent_words(text: str, top_n: int = 10) -> List[Tuple[str, int]]:
    """获取高频词"""
    words = tokenize_and_tag(text)

    # 停用词列表
    stopwords = {'的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'}

    # 过滤停用词和标点
    filtered_words = [word for word, flag in words
                     if word not in stopwords and flag != 'x']

    # 统计频率
    word_counts = Counter(filtered_words)

    return word_counts.most_common(top_n)
```

---

## 4. 段落层面分析

### 4.1 段落分割

**目标**：将文本分割成段落

**分割规则**：
- 以空行（`\n\n`）为段落分隔符
- 单行也算一个段落

**伪代码**：
```python
def split_paragraphs(text: str) -> List[str]:
    """分割段落"""
    # 按空行分割
    paragraphs = text.split('\n\n')

    # 清理空段落
    paragraphs = [p.strip() for p in paragraphs if p.strip()]

    return paragraphs
```

### 4.2 段落长度分析

**目标**：统计段落长度和单句段比例

**实现步骤**：
1. 计算每个段落的字数
2. 计算平均段长
3. 统计单句段（只有一个句子的段落）比例

**伪代码**：
```python
def analyze_paragraph_length(paragraphs: List[str]) -> Dict:
    """分析段落长度"""
    lengths = []
    single_sentence_paras = 0

    for para in paragraphs:
        # 计算字数
        clean_para = re.sub(r'[，。！？；：""''「」『』、]', '', para)
        length = len(clean_para)
        lengths.append(length)

        # 检测是否为单句段
        sentences = split_sentences(para)
        if len(sentences) == 1:
            single_sentence_paras += 1

    avg_length = sum(lengths) / len(lengths) if lengths else 0
    single_para_ratio = single_sentence_paras / len(paragraphs) * 100 if paragraphs else 0

    return {
        'avg_length': round(avg_length, 1),
        'single_para_ratio': round(single_para_ratio, 1),
        'total_paragraphs': len(paragraphs)
    }
```

### 4.3 段落类型分类

**目标**：识别对话段、描写段、叙述段

**分类规则**：
- **对话段**：包含引号 `""`、`「」`、`『』`，且引号内容占比 > 50%
- **描写段**：形容词密度 > 10%
- **叙述段**：其他

**伪代码**：
```python
def classify_paragraph_type(para: str) -> str:
    """分类段落类型"""
    # 检测对话
    dialogue_chars = sum(1 for char in para if char in '"「『')
    if dialogue_chars > 0:
        # 计算引号内容占比
        dialogue_content = re.findall(r'[""「『](.+?)[""」』]', para)
        dialogue_length = sum(len(content) for content in dialogue_content)
        if dialogue_length / len(para) > 0.5:
            return 'dialogue'

    # 检测描写（形容词密度）
    words = tokenize_and_tag(para)
    adjectives = sum(1 for _, flag in words if flag.startswith('a'))
    if adjectives / len(words) > 0.1:
        return 'description'

    # 默认为叙述
    return 'narration'

def analyze_paragraph_types(paragraphs: List[str]) -> Dict:
    """分析段落类型分布"""
    types = [classify_paragraph_type(para) for para in paragraphs]

    dialogue_count = types.count('dialogue')
    description_count = types.count('description')
    narration_count = types.count('narration')

    total = len(types)

    return {
        'dialogue_ratio': round(dialogue_count / total * 100, 1),
        'description_ratio': round(description_count / total * 100, 1),
        'narration_ratio': round(narration_count / total * 100, 1)
    }
```

---

## 5. 对话层面分析

### 5.1 对话检测

**目标**：识别对话内容并计算对话占比

**检测规则**：
- 识别引号：`""`、`「」`、`『』`
- 提取引号内的内容
- 计算对话字数占总字数的比例

**伪代码**：
```python
def analyze_dialogue(text: str) -> Dict:
    """分析对话占比"""
    # 提取对话内容
    dialogue_pattern = r'[""「『](.+?)[""」』]'
    dialogues = re.findall(dialogue_pattern, text)

    # 计算对话字数
    dialogue_chars = sum(len(d) for d in dialogues)

    # 计算总字数（不含标点）
    clean_text = re.sub(r'[，。！？；：""''「」『』、\s]', '', text)
    total_chars = len(clean_text)

    dialogue_ratio = dialogue_chars / total_chars * 100 if total_chars > 0 else 0

    return {
        'dialogue_ratio': round(dialogue_ratio, 1),
        'dialogue_count': len(dialogues)
    }
```

### 5.2 对话标签频率

**目标**：统计对话标签（"他说"、"她说"）的使用频率

**检测规则**：
- 识别常见对话标签：说、问、答、道、喊、叫等
- 计算对话标签占对话总数的比例

**伪代码**：
```python
def analyze_dialogue_tags(text: str) -> Dict:
    """分析对话标签频率"""
    # 提取对话
    dialogues = re.findall(r'[""「『](.+?)[""」』]', text)

    # 检测对话标签
    tag_pattern = r'[""」』](他|她|我|你|[^，。！？；：]{1,3})(说|问|答|道|喊|叫|笑|哭)'
    tags = re.findall(tag_pattern, text)

    tag_ratio = len(tags) / len(dialogues) * 100 if dialogues else 0

    return {
        'tag_frequency': round(tag_ratio, 1),
        'tag_count': len(tags)
    }
```

---

## 6. 节奏层面分析

### 6.1 场景切换检测

**目标**：识别场景切换并计算场景频率

**检测规则**：
- 空行（段落分隔）
- 时间标记（"第二天"、"三天后"）
- 地点标记（"在咖啡馆"、"回到家"）

**伪代码**：
```python
def detect_scene_changes(text: str) -> int:
    """检测场景切换次数"""
    scene_changes = 0

    # 检测空行（段落分隔）
    paragraphs = split_paragraphs(text)
    scene_changes += len(paragraphs) - 1

    # 检测时间标记
    time_markers = ['第二天', '三天后', '一周后', '次日', '翌日', '过了', '后来']
    for marker in time_markers:
        scene_changes += text.count(marker)

    # 检测地点标记
    location_markers = ['在', '到了', '来到', '回到', '走进']
    for marker in location_markers:
        scene_changes += text.count(marker)

    return scene_changes

def analyze_scene_frequency(chapters: List[str]) -> Dict:
    """分析场景切换频率"""
    total_scenes = sum(detect_scene_changes(chapter) for chapter in chapters)
    avg_scenes_per_chapter = total_scenes / len(chapters) if chapters else 0

    return {
        'avg_scenes_per_chapter': round(avg_scenes_per_chapter, 1),
        'total_scenes': total_scenes
    }
```

---

## 7. 综合分析和风格归纳

### 7.1 整合所有指标

**目标**：将所有分析结果整合成一个风格档案

**伪代码**：
```python
def analyze_writing_style(chapters: List[str]) -> Dict:
    """综合分析写作风格"""
    # 合并所有章节
    full_text = '\n\n'.join(chapters)

    # 清理文本
    clean_text = clean_markdown(full_text)

    # 分割文本
    sentences = split_sentences(clean_text)
    paragraphs = split_paragraphs(clean_text)

    # 执行各层次分析
    sentence_analysis = analyze_sentence_length(sentences)
    word_analysis = analyze_word_density(clean_text)
    frequent_words = get_frequent_words(clean_text)
    paragraph_analysis = analyze_paragraph_length(paragraphs)
    paragraph_types = analyze_paragraph_types(paragraphs)
    dialogue_analysis = analyze_dialogue(clean_text)
    dialogue_tags = analyze_dialogue_tags(clean_text)
    scene_analysis = analyze_scene_frequency(chapters)

    # 整合结果
    style_profile = {
        'sentence': sentence_analysis,
        'word': word_analysis,
        'frequent_words': frequent_words,
        'paragraph': paragraph_analysis,
        'paragraph_types': paragraph_types,
        'dialogue': dialogue_analysis,
        'dialogue_tags': dialogue_tags,
        'scene': scene_analysis
    }

    return style_profile
```

### 7.2 生成定性描述

**目标**：根据量化指标生成定性的风格描述

**规则**：
- 平均句长 < 18 字 → "短句为主"
- 平均句长 18-25 字 → "中短句混合"
- 平均句长 > 25 字 → "长句为主"
- 对话占比 > 60% → "对话驱动"
- 对话占比 30-60% → "对话与叙述平衡"
- 对话占比 < 30% → "叙述为主"
- 形容词密度 < 5% → "简洁克制"
- 形容词密度 5-10% → "适度修饰"
- 形容词密度 > 10% → "描写细腻"

**伪代码**：
```python
def generate_style_description(style_profile: Dict) -> str:
    """生成定性风格描述"""
    descriptions = []

    # 句式特点
    avg_length = style_profile['sentence']['avg_length']
    if avg_length < 18:
        descriptions.append("短句为主")
    elif avg_length < 25:
        descriptions.append("中短句混合")
    else:
        descriptions.append("长句为主")

    # 对话特点
    dialogue_ratio = style_profile['dialogue']['dialogue_ratio']
    if dialogue_ratio > 60:
        descriptions.append("对话驱动")
    elif dialogue_ratio > 30:
        descriptions.append("对话与叙述平衡")
    else:
        descriptions.append("叙述为主")

    # 用词特点
    adj_density = style_profile['word']['adj_density']
    if adj_density < 5:
        descriptions.append("简洁克制")
    elif adj_density < 10:
        descriptions.append("适度修饰")
    else:
        descriptions.append("描写细腻")

    # 节奏特点
    scenes = style_profile['scene']['avg_scenes_per_chapter']
    if scenes > 4:
        descriptions.append("快节奏")
    elif scenes > 2:
        descriptions.append("中等节奏")
    else:
        descriptions.append("慢节奏")

    return "、".join(descriptions)
```

---

## 8. 生成 personal-voice.md

### 8.1 格式化输出

**目标**：将分析结果格式化为 Markdown 文件

**伪代码**：
```python
def generate_personal_voice_md(style_profile: Dict, chapters_analyzed: int, total_words: int) -> str:
    """生成 personal-voice.md 内容"""
    from datetime import date

    today = date.today().strftime("%Y-%m-%d")
    style_desc = generate_style_description(style_profile)

    md_content = f"""# 个人写作风格指南

> 本文件由风格学习 Skill 自动生成，基于已写章节分析
> 生成日期：{today}
> 分析章节：第 1-{chapters_analyzed} 章（共 {total_words:,} 字）

---

## 📊 量化风格特征

### 句子层面
- **平均句长**：{style_profile['sentence']['avg_length']} 字
- **句长分布**：
  - 短句（<15字）：{style_profile['sentence']['short_ratio']}%
  - 中句（15-30字）：{style_profile['sentence']['medium_ratio']}%
  - 长句（>30字）：{style_profile['sentence']['long_ratio']}%
- **句长标准差**：{style_profile['sentence']['std_dev']}（{'低' if style_profile['sentence']['std_dev'] < 5 else '中等' if style_profile['sentence']['std_dev'] < 10 else '高'}变化）

### 词汇层面
- **形容词密度**：{style_profile['word']['adj_density']}%（{'低' if style_profile['word']['adj_density'] < 5 else '中' if style_profile['word']['adj_density'] < 10 else '高'}）
- **副词密度**：{style_profile['word']['adv_density']}%（{'低' if style_profile['word']['adv_density'] < 5 else '中' if style_profile['word']['adv_density'] < 10 else '高'}）
- **对话标签频率**：{style_profile['dialogue_tags']['tag_frequency']}%（{'较少使用' if style_profile['dialogue_tags']['tag_frequency'] < 40 else '适度使用' if style_profile['dialogue_tags']['tag_frequency'] < 70 else '频繁使用'}"他说""她说"）
- **高频词 Top 10**：{', '.join(f'{word}({count}次)' for word, count in style_profile['frequent_words'][:10])}

### 段落层面
- **平均段长**：{style_profile['paragraph']['avg_length']} 字
- **单句段比例**：{style_profile['paragraph']['single_para_ratio']}%（{'低' if style_profile['paragraph']['single_para_ratio'] < 20 else '中' if style_profile['paragraph']['single_para_ratio'] < 40 else '高'}，{'制造节奏感' if style_profile['paragraph']['single_para_ratio'] > 30 else ''}）
- **段落类型分布**：
  - 对话段：{style_profile['paragraph_types']['dialogue_ratio']}%
  - 叙述段：{style_profile['paragraph_types']['narration_ratio']}%
  - 描写段：{style_profile['paragraph_types']['description_ratio']}%

### 叙述层面
- **对话占比**：{style_profile['dialogue']['dialogue_ratio']}%（{'对话驱动' if style_profile['dialogue']['dialogue_ratio'] > 60 else '平衡' if style_profile['dialogue']['dialogue_ratio'] > 30 else '叙述为主'}）

---

## 🎨 定性风格印象

### 整体风格
{style_desc}

[... 其余内容使用 SKILL.md 中的模板 ...]

---

**使用建议**：
每次执行 /write 前，先快速扫描本文件，刷新风格记忆。
"""

    return md_content
```

---

## 9. 实现注意事项

### 9.1 性能优化

- 对于长文本（> 10 万字），考虑分批处理
- 缓存分词结果，避免重复计算
- 使用多线程并行分析不同章节

### 9.2 错误处理

- 章节数不足（< 3 章）：提示用户样本不足
- 文件读取失败：提供清晰的错误信息
- 分析结果异常（如平均句长 < 5 或 > 100）：警告用户可能存在问题

### 9.3 边界情况

- 空章节：跳过
- 纯对话章节：调整分析权重
- 特殊格式（诗歌、信件）：识别并特殊处理

---

## 10. 测试验证

### 10.1 单元测试

为每个分析函数编写单元测试：
- `test_split_sentences()`: 测试句子分割
- `test_analyze_sentence_length()`: 测试句长计算
- `test_tokenize_and_tag()`: 测试分词和词性标注
- `test_analyze_dialogue()`: 测试对话检测

### 10.2 集成测试

使用真实章节进行端到端测试：
- 短句风格样本（平均句长 12-15 字）
- 对话驱动样本（对话占比 > 70%）
- 描写细腻样本（形容词密度 > 12%）

### 10.3 验证标准

- 分析结果的准确性（与人工标注对比）
- 生成的风格指南的可读性
- 续写指导的可执行性

---

## 总结

本算法通过多层次的文本分析，从用户已写章节中提取可量化的风格特征，并生成个性化的风格指南。核心思路是：

1. **量化为主**：提取客观、可测量的指标
2. **定性为辅**：生成易理解的风格描述
3. **指导为重**：提供具体的续写建议

通过这种方式，AI 可以真正理解用户的写作风格，而非依赖模糊的"学我的风格"指令。
