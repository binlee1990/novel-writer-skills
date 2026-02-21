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
});
