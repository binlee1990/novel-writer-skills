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
    it('should score 100 for perfect distribution', () => {
      const sentences = [
        // 35% short (<12 chars)
        "他走了。",
        "门开了。",
        "很冷。",
        "糟了。",

        // 50% medium (12-25 chars)
        "她站在窗前，看着外面的雨。",
        "咖啡还冒着热气。",
        "他想了想，没说话。",
        "月光打在她脸上。",
        "房间很安静。",

        // 15% long (>25 chars)
        "窗外的雨越下越大，雨点打在玻璃上发出噼啪声。",
        "她坐在椅子上，手指在桌面上轻轻敲着，咖啡还冒着热气。"
      ];

      const score = scoreSentenceLength(sentences);
      expect(score).toBeGreaterThan(85);
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
    it('should allow colloquial idioms within limit', () => {
      const text = `
        一言难尽。这事说来话长。
        他莫名其妙地生气了。她若无其事地走过。
      `;  // 4个成语，约50字 → 80个/1000字，超限

      const score = scoreIdiomUsage(text);
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
  const words = text.replace(/[。，、！？]/g, ' ').split(/\s+/).filter(w => w);
  const uniqueWords = new Set(words);
  const ttr = uniqueWords.size / words.length;

  const freq = new Map<string, number>();
  words.forEach(w => freq.set(w, (freq.get(w) || 0) + 1));

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
