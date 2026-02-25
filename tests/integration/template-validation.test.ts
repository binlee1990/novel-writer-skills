import fs from 'fs-extra';
import path from 'path';

const TEMPLATES_DIR = path.resolve(__dirname, '../../templates');

describe('Template Files Validation', () => {
  describe('Command Templates', () => {
    const commandsDir = path.join(TEMPLATES_DIR, 'commands');

    it('should have all required v5 commands', () => {
      const commands = fs.readdirSync(commandsDir);

      const required = [
        'specify.md',
        'plan.md',
        'write.md',
        'expand.md',
        'analyze.md',
      ];

      for (const cmd of required) {
        expect(commands).toContain(cmd);
      }
    });

    it('should have exactly 5 command files', () => {
      const commands = fs.readdirSync(commandsDir)
        .filter(f => f.endsWith('.md'));
      expect(commands).toHaveLength(5);
    });

    it('should have non-empty command files', () => {
      const commands = fs.readdirSync(commandsDir)
        .filter(f => f.endsWith('.md'));

      for (const cmd of commands) {
        const content = fs.readFileSync(path.join(commandsDir, cmd), 'utf-8');
        expect(content.trim().length).toBeGreaterThan(0);
      }
    });
  });

  describe('Resource Templates', () => {
    const resourcesDir = path.join(TEMPLATES_DIR, 'resources');

    it('should have resources directory', () => {
      expect(fs.existsSync(resourcesDir)).toBe(true);
    });

    it('should have core resource files', () => {
      const required = ['constitution.md', 'style-reference.md', 'anti-ai.md'];
      for (const file of required) {
        expect(fs.existsSync(path.join(resourcesDir, file))).toBe(true);
      }
    });

    it('should have non-empty resource files', () => {
      const files = fs.readdirSync(resourcesDir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(resourcesDir, file), 'utf-8');
        expect(content.trim().length).toBeGreaterThan(0);
      }
    });
  });

  describe('Tracking Templates', () => {
    const trackingDir = path.join(TEMPLATES_DIR, 'tracking');

    it('should have all 4 tracking JSON files', () => {
      const required = [
        'character-state.json',
        'relationships.json',
        'plot-tracker.json',
        'timeline.json',
      ];

      for (const file of required) {
        expect(fs.existsSync(path.join(trackingDir, file))).toBe(true);
      }
    });

    it('should have valid JSON in tracking files', () => {
      const files = fs.readdirSync(trackingDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(trackingDir, file), 'utf-8');
        expect(() => JSON.parse(content)).not.toThrow();
      }
    });
  });

  describe('Volume Summary Template', () => {
    it('should have volume-summary.md template', () => {
      expect(fs.existsSync(path.join(TEMPLATES_DIR, 'volume-summary.md'))).toBe(true);
    });

    it('should have non-empty volume-summary template', () => {
      const content = fs.readFileSync(
        path.join(TEMPLATES_DIR, 'volume-summary.md'),
        'utf-8'
      );
      expect(content.trim().length).toBeGreaterThan(0);
    });
  });

  describe('Volume Outline Template', () => {
    it('should have volume-outline.md template', () => {
      expect(fs.existsSync(path.join(TEMPLATES_DIR, 'volume-outline.md'))).toBe(true);
    });

    it('should not contain actual story data', () => {
      const content = fs.readFileSync(
        path.join(TEMPLATES_DIR, 'volume-outline.md'),
        'utf-8'
      );
      // 不应包含具体故事内容
      expect(content).not.toContain('沈账');
      expect(content).not.toContain('蜂巢');
      expect(content).not.toContain('禁忌乡');
    });

    it('should contain placeholder markers', () => {
      const content = fs.readFileSync(
        path.join(TEMPLATES_DIR, 'volume-outline.md'),
        'utf-8'
      );
      expect(content).toContain('[卷名]');
      expect(content).toContain('vol-XXX');
      expect(content).toContain('[副本名]');
    });
  });

  describe('Tracking Templates are empty templates', () => {
    const trackingDir = path.join(TEMPLATES_DIR, 'tracking');

    it('should have empty characters array', () => {
      const data = fs.readJsonSync(path.join(trackingDir, 'character-state.json'));
      expect(data.characters).toEqual([]);
    });

    it('should have empty plotlines and foreshadowing arrays', () => {
      const data = fs.readJsonSync(path.join(trackingDir, 'plot-tracker.json'));
      expect(data.currentChapter).toBe(0);
      expect(data.plotlines).toEqual([]);
      expect(data.foreshadowing).toEqual([]);
    });

    it('should have empty relationships array', () => {
      const data = fs.readJsonSync(path.join(trackingDir, 'relationships.json'));
      expect(data.relationships).toEqual([]);
    });

    it('should have empty events array', () => {
      const data = fs.readJsonSync(path.join(trackingDir, 'timeline.json'));
      expect(data.events).toEqual([]);
    });
  });

  describe('Script Templates', () => {
    const scriptsDir = path.join(TEMPLATES_DIR, 'scripts');

    it('should have scripts directory', () => {
      expect(fs.existsSync(scriptsDir)).toBe(true);
    });

    it('should have all 5 Python script files', () => {
      const required = [
        'phase_a_init_db.py',
        'db_sync.py',
        'db_context.py',
        'db_volume_switch.py',
        'db_init_protagonist.py',
      ];
      for (const file of required) {
        expect(fs.existsSync(path.join(scriptsDir, file))).toBe(true);
      }
    });

    it('should have non-empty Python scripts', () => {
      const pyFiles = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.py'));
      expect(pyFiles.length).toBe(5);
      for (const file of pyFiles) {
        const content = fs.readFileSync(path.join(scriptsDir, file), 'utf-8');
        expect(content.trim().length).toBeGreaterThan(0);
      }
    });

    it('should have requirements.txt', () => {
      expect(fs.existsSync(path.join(scriptsDir, 'requirements.txt'))).toBe(true);
      const content = fs.readFileSync(path.join(scriptsDir, 'requirements.txt'), 'utf-8');
      expect(content).toContain('psycopg2-binary');
    });

    it('should not contain hardcoded passwords or story paths', () => {
      const pyFiles = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.py'));
      for (const file of pyFiles) {
        const content = fs.readFileSync(path.join(scriptsDir, file), 'utf-8');
        expect(content).not.toContain('"password": "admin"');
        expect(content).not.toContain('dushilunhui');
      }
    });

    it('should use novelws schema instead of novel schema', () => {
      const pyFiles = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.py'));
      for (const file of pyFiles) {
        const content = fs.readFileSync(path.join(scriptsDir, file), 'utf-8');
        // 应使用 novelws schema
        expect(content).toContain('novelws');
        // 不应有独立的 novel. 引用（排除 novelws.）
        const novelRefs = content.match(/[^w]novel\./g);
        expect(novelRefs).toBeNull();
      }
    });
  });
});
