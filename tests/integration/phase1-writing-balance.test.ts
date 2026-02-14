import { describe, it, expect } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';

describe('Phase 1: Writing Balance Integration', () => {
  it('should have writing-balance skill file', () => {
    const skillPath = path.resolve(
      __dirname,
      '../../templates/skills/writing-techniques/writing-balance/SKILL.md'
    );
    expect(fs.existsSync(skillPath)).toBe(true);

    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('句长分布平衡度');
    expect(content).toContain('词汇丰富度');
    expect(content).toContain('描写层次感');
    expect(content).toContain('成语/四字词使用度');
    expect(content).toContain('句式变化度');
    expect(content).toContain('自然度评分');
  });

  it('should have writing-techniques skill file', () => {
    const skillPath = path.resolve(
      __dirname,
      '../../templates/skills/writing-techniques/writing-techniques/SKILL.md'
    );
    expect(fs.existsSync(skillPath)).toBe(true);

    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('标点符号艺术');
    expect(content).toContain('句式变化技巧');
    expect(content).toContain('描写手法');
    expect(content).toContain('对话真实化');
  });

  it('should have deprecated anti-ai-v4', () => {
    const oldPath = path.resolve(
      __dirname,
      '../../templates/knowledge-base/requirements/anti-ai-v4-deprecated.md'
    );
    expect(fs.existsSync(oldPath)).toBe(true);

    const content = fs.readFileSync(oldPath, 'utf-8');
    expect(content).toContain('此版本已废弃');
  });

  it('should have new anti-ai-v5-balanced', () => {
    const newPath = path.resolve(
      __dirname,
      '../../templates/knowledge-base/requirements/anti-ai-v5-balanced.md'
    );
    expect(fs.existsSync(newPath)).toBe(true);

    const content = fs.readFileSync(newPath, 'utf-8');
    expect(content).toContain('v5.0（平衡版）');
    expect(content).toContain('平衡AI识别度与自然表达');
  });

  it('should integrate skills in write command', () => {
    const writePath = path.resolve(
      __dirname,
      '../../templates/commands/write.md'
    );
    const content = fs.readFileSync(writePath, 'utf-8');

    expect(content).toContain('writing-balance');
    expect(content).toContain('writing-techniques');
  });
});
