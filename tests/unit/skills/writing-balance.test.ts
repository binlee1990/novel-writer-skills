/**
 * writing-balance Skill 测试
 *
 * 注意: 本测试验证评分算法的逻辑正确性
 * Skill本身是Markdown文件，由AI在运行时应用
 * 这里的辅助函数是算法的TypeScript实现，用于验证
 */

import { describe, it, expect } from '@jest/globals';

describe('writing-balance skill', () => {
  describe('sentence length distribution', () => {
    it('should score high for balanced distribution', () => {
      const sentences = [
        // ~35% short (<12 chars) - 7 sentences
        "他走了。",
        "门开了。",
        "很冷。",
        "糟了。",
        "她愣住了。",
        "没回头。",
        "天黑了。",

        // ~50% medium (12-25 chars) - 10 sentences
        "她站在窗前，看着外面的雨。",
        "窗外的雨越下越大，雨点敲打着玻璃。",
        "他想了想，最终还是没有说话。",
        "月光冷冷地打在她的脸上。",
        "房间里安静得有些不对劲。",
        "她坐在椅子上，手指轻轻敲着桌面。",
        "他猛地转身，朝门口走去。",
        "街上的行人匆匆走过，没人注意到她。",
        "咖啡的香气弥漫在整个房间里。",
        "他深吸一口气，推开了那扇门。",

        // ~15% long (>25 chars) - 3 sentences
        "窗外的雨越下越大，雨点打在玻璃上发出噼啪声，整条街笼罩在灰蒙蒙的雨雾中。",
        "她坐在椅子上，手指在桌面上轻轻敲着，咖啡还冒着热气，空气中弥漫着一股苦涩的香味。",
        "他站在门口，手里拿着一把伞，身上的衣服湿了大半，头发上还滴着水，整个人看起来狼狈极了。"
      ];

      const score = scoreSentenceLength(sentences);
      expect(score).toBeGreaterThan(80);
    });

    it('should score low for all short sentences', () => {
      const sentences = [
        "他走了。",
        "门开了。",
        "很冷。",
        "糟了。",
        "她愣住了。"
      ];

      const score = scoreSentenceLength(sentences);
      expect(score).toBeLessThan(60);
    });
  });

  describe('lexical diversity', () => {
    it('should detect word repetition', () => {
      const text = "他说了。她说了。我也说了。他又说了。大家都在说。";

      const { ttr, highFreqWords } = analyzeLexicalDiversity(text);
      expect(ttr).toBeLessThan(0.65);
      expect(highFreqWords).toContain('说');
    });

    it('should score high for diverse vocabulary', () => {
      const text = "他讲了几句。她开口回应。我插了一句话。他又说了什么。大家都在交流。";

      const { ttr } = analyzeLexicalDiversity(text);
      expect(ttr).toBeGreaterThan(0.65);
    });
  });

  describe('idiom usage', () => {
    it('should penalize too many idioms for short text', () => {
      const idioms = ['一言难尽', '莫名其妙', '若无其事', '说来话长'];
      // 短文本中4个成语，超出限制
      const score = scoreIdiomUsage('短文本测试', idioms);
      expect(score).toBeLessThan(70);
    });

    it('should penalize literary idioms', () => {
      const idioms = ['肝肠寸断', '五味杂陈'];
      const score = scoreIdiomUsage('', idioms);
      expect(score).toBeLessThan(70);  // -15 * 2 = -30
    });
  });
});

// 辅助函数（模拟评分算法）
function scoreSentenceLength(sentences: string[]): number {
  const short = sentences.filter(s => s.length < 12).length;
  const medium = sentences.filter(s => s.length >= 12 && s.length <= 25).length;
  const long = sentences.filter(s => s.length > 25).length;

  const total = sentences.length;
  const shortPct = short / total;
  const mediumPct = medium / total;
  const longPct = long / total;

  const ideal = [0.35, 0.50, 0.15];
  const actual = [shortPct, mediumPct, longPct];

  const deviation = Math.sqrt(
    actual.reduce((sum, val, i) => sum + Math.pow(val - ideal[i], 2), 0)
  );

  return Math.max(0, 100 - deviation * 200);
}

function analyzeLexicalDiversity(text: string): { ttr: number; highFreqWords: string[] } {
  // 移除标点，按单字符分析（中文每个字近似一个词）
  const chars = text.replace(/[。，、！？""''\s]/g, '').split('').filter(c => c);
  const uniqueChars = new Set(chars);
  const ttr = uniqueChars.size / chars.length;

  const freq = new Map<string, number>();
  chars.forEach(c => freq.set(c, (freq.get(c) || 0) + 1));

  const highFreqWords = Array.from(freq.entries())
    .filter(([_, count]) => count >= 3)
    .map(([word, _]) => word);

  return { ttr, highFreqWords };
}

function scoreIdiomUsage(text: string, idioms: string[] = []): number {
  const blacklist = ['肝肠寸断', '踌躇满志', '从容不迫', '五味杂陈', '百感交集'];

  const textLength = text.replace(/[。，、！？\s]/g, '').length;
  const limit = (textLength / 1000) * 5;

  let score = 100;

  if (idioms.length > limit) {
    score -= (idioms.length - limit) * 10;
  }

  const blacklistCount = idioms.filter(i => blacklist.includes(i)).length;
  score -= blacklistCount * 15;

  return Math.max(0, score);
}
