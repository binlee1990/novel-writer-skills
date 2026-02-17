import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const CLI_PATH = path.resolve(__dirname, '../../dist/cli.js');

describe('Ultra-long novel support - integration', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nws-ultra-'));
  });

  afterEach(async () => {
    try {
      await fs.remove(testDir);
    } catch {
      // ignore cleanup errors on Windows
    }
  }, 30_000);

  describe('init --scale large', () => {
    it('should create complete sharded directory structure', () => {
      execSync(`node "${CLI_PATH}" init large-novel --no-git --scale large`, {
        cwd: testDir,
        stdio: 'pipe',
      });

      const projectPath = path.join(testDir, 'large-novel');

      // Summary files
      const summaryDir = path.join(projectPath, 'tracking', 'summary');
      expect(fs.existsSync(path.join(summaryDir, 'characters-summary.json'))).toBe(true);
      expect(fs.existsSync(path.join(summaryDir, 'plot-summary.json'))).toBe(true);
      expect(fs.existsSync(path.join(summaryDir, 'timeline-summary.json'))).toBe(true);
      expect(fs.existsSync(path.join(summaryDir, 'volume-summaries.json'))).toBe(true);

      // Volume directory
      const vol01Dir = path.join(projectPath, 'tracking', 'volumes', 'vol-01');
      expect(fs.existsSync(path.join(vol01Dir, 'character-state.json'))).toBe(true);
      expect(fs.existsSync(path.join(vol01Dir, 'plot-tracker.json'))).toBe(true);
      expect(fs.existsSync(path.join(vol01Dir, 'timeline.json'))).toBe(true);
      expect(fs.existsSync(path.join(vol01Dir, 'relationships.json'))).toBe(true);

      // Config should record scale
      const config = fs.readJsonSync(path.join(projectPath, 'resources', 'config', 'config.json'));
      expect(config.scale).toBe('large');
    });

    it('should also create standard tracking files for backward compat', () => {
      execSync(`node "${CLI_PATH}" init compat-novel --no-git --scale large`, {
        cwd: testDir,
        stdio: 'pipe',
      });

      const projectPath = path.join(testDir, 'compat-novel');
      // Standard tracking files should still exist (copied by default init logic)
      expect(fs.existsSync(path.join(projectPath, 'tracking', 'character-state.json'))).toBe(true);
    });
  });

  describe('init --with-mcp', () => {
    it('should imply --scale large and set mcp flag', () => {
      execSync(`node "${CLI_PATH}" init mcp-novel --no-git --with-mcp`, {
        cwd: testDir,
        stdio: 'pipe',
      });

      const projectPath = path.join(testDir, 'mcp-novel');
      const config = fs.readJsonSync(path.join(projectPath, 'resources', 'config', 'config.json'));
      expect(config.mcp).toBe(true);

      // Should have summary dir (implied --scale large)
      expect(fs.existsSync(path.join(projectPath, 'tracking', 'summary'))).toBe(true);
    });
  });

  describe('summary template validation', () => {
    it('all summary templates should be valid JSON', () => {
      const summaryDir = path.resolve(__dirname, '../../templates/tracking/summary');
      const files = fs.readdirSync(summaryDir).filter(f => f.endsWith('.json'));

      for (const file of files) {
        const content = fs.readFileSync(path.join(summaryDir, file), 'utf-8');
        expect(() => JSON.parse(content)).not.toThrow();
      }
    });

    it('volume-summaries.json should have correct structure', () => {
      const filePath = path.resolve(__dirname, '../../templates/tracking/summary/volume-summaries.json');
      const data = fs.readJsonSync(filePath);
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('currentVolume');
      expect(data).toHaveProperty('volumes');
      expect(Array.isArray(data.volumes)).toBe(true);
    });

    it('characters-summary.json should have correct structure', () => {
      const filePath = path.resolve(__dirname, '../../templates/tracking/summary/characters-summary.json');
      const data = fs.readJsonSync(filePath);
      expect(data).toHaveProperty('active');
      expect(data).toHaveProperty('archived');
      expect(data).toHaveProperty('totalCount');
      expect(data).toHaveProperty('activeCount');
    });
  });

  describe('new commands exist', () => {
    it('volume-summary.md should exist in templates', () => {
      const filePath = path.resolve(__dirname, '../../templates/commands/volume-summary.md');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('search.md should exist in templates', () => {
      const filePath = path.resolve(__dirname, '../../templates/commands/search.md');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('new skill exists', () => {
    it('long-series-continuity SKILL.md should exist', () => {
      const filePath = path.resolve(__dirname,
        '../../templates/skills/quality-assurance/long-series-continuity/SKILL.md');
      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('long-series-continuity');
      expect(content).toContain('100');
    });
  });

  describe('migrate-tracking.ps1 exists', () => {
    it('should exist in templates/scripts/powershell/', () => {
      const filePath = path.resolve(__dirname,
        '../../templates/resources/scripts/powershell/migrate-tracking.ps1');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});
