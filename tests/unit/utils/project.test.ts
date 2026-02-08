import path from 'path';
import { isProjectRoot, findProjectRoot, getProjectInfo } from '../../../src/utils/project.js';
import { createTempDir, createMockProject, cleanup } from '../../helpers/test-utils.js';
import fs from 'fs-extra';

describe('utils/project.ts', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(async () => {
    await cleanup(tempDir);
  });

  describe('isProjectRoot()', () => {
    it('should return true when .specify/config.json exists', async () => {
      const projectPath = await createMockProject(tempDir);
      const result = await isProjectRoot(projectPath);
      expect(result).toBe(true);
    });

    it('should return false when .specify/config.json does not exist', async () => {
      const emptyDir = path.join(tempDir, 'empty');
      await fs.ensureDir(emptyDir);
      const result = await isProjectRoot(emptyDir);
      expect(result).toBe(false);
    });

    it('should return false for directory with only .specify but no config.json', async () => {
      const dir = path.join(tempDir, 'partial');
      await fs.ensureDir(path.join(dir, '.specify'));
      const result = await isProjectRoot(dir);
      expect(result).toBe(false);
    });
  });

  describe('findProjectRoot()', () => {
    it('should find project root from nested directory', async () => {
      const projectPath = await createMockProject(tempDir);
      const nestedDir = path.join(projectPath, 'stories', 'chapter-01');
      await fs.ensureDir(nestedDir);

      const result = await findProjectRoot(nestedDir);
      expect(result).toBe(projectPath);
    });

    it('should return null if no project root found', async () => {
      const randomDir = path.join(tempDir, 'no-project');
      await fs.ensureDir(randomDir);

      const result = await findProjectRoot(randomDir);
      expect(result).toBeNull();
    });

    it('should find root when starting from root itself', async () => {
      const projectPath = await createMockProject(tempDir);
      const result = await findProjectRoot(projectPath);
      expect(result).toBe(projectPath);
    });
  });

  describe('getProjectInfo()', () => {
    it('should read project config correctly', async () => {
      const projectPath = await createMockProject(tempDir, 'my-novel');
      const info = await getProjectInfo(projectPath);

      expect(info).not.toBeNull();
      expect(info!.name).toBe('my-novel');
      expect(info!.version).toBe('1.0.0');
      expect(info!.hasSpecifyDir).toBe(true);
    });

    it('should return null if config not found', async () => {
      const emptyDir = path.join(tempDir, 'no-config');
      await fs.ensureDir(emptyDir);

      const info = await getProjectInfo(emptyDir);
      expect(info).toBeNull();
    });

    it('should detect directories correctly', async () => {
      const projectPath = await createMockProject(tempDir);
      const info = await getProjectInfo(projectPath);

      expect(info).not.toBeNull();
      expect(info!.hasClaudeDir).toBe(true);
      expect(info!.hasSpecifyDir).toBe(true);
      expect(info!.hasStoriesDir).toBe(true);
    });

    it('should handle missing optional directories', async () => {
      const projectPath = path.join(tempDir, 'minimal');
      await fs.ensureDir(path.join(projectPath, '.specify'));
      await fs.writeJson(path.join(projectPath, '.specify', 'config.json'), {
        name: 'minimal',
        version: '0.1.0',
      });

      const info = await getProjectInfo(projectPath);
      expect(info).not.toBeNull();
      expect(info!.hasClaudeDir).toBe(false);
      expect(info!.hasStoriesDir).toBe(false);
    });
  });
});
