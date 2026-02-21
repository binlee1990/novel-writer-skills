import path from 'path';
import {
  DIRS,
  FILES,
  DEFAULT_GITIGNORE,
  getPackageRoot,
  getTemplatesDir,
  getProjectPaths,
  getTemplateSourcePaths,
} from '../../../src/core/config.js';

describe('core/config.ts', () => {
  describe('DIRS', () => {
    it('should define all directory constants', () => {
      expect(DIRS.CLAUDE).toBe('.claude');
      expect(DIRS.STORIES).toBe('stories');
      expect(DIRS.COMMANDS).toBe('commands');
      expect(DIRS.TEMPLATES).toBe('templates');
      expect(DIRS.TRACKING).toBe('tracking');
      expect(DIRS.RESOURCES).toBe('resources');
      expect(DIRS.VOLUMES).toBe('volumes');
    });
  });

  describe('FILES', () => {
    it('should define all file constants', () => {
      expect(FILES.CONFIG).toBe('config.json');
      expect(FILES.GITIGNORE).toBe('.gitignore');
    });
  });

  describe('DEFAULT_GITIGNORE', () => {
    it('should contain common ignore patterns', () => {
      expect(DEFAULT_GITIGNORE).toContain('node_modules/');
      expect(DEFAULT_GITIGNORE).toContain('.DS_Store');
      expect(DEFAULT_GITIGNORE).toContain('.vscode/');
    });
  });

  describe('getPackageRoot()', () => {
    it('should return a valid directory path', () => {
      const root = getPackageRoot();
      expect(typeof root).toBe('string');
      expect(root.length).toBeGreaterThan(0);
    });

    it('should return the same value on repeated calls (cached)', () => {
      const root1 = getPackageRoot();
      const root2 = getPackageRoot();
      expect(root1).toBe(root2);
    });
  });

  describe('getTemplatesDir()', () => {
    it('should return path under package root', () => {
      const templatesDir = getTemplatesDir();
      expect(templatesDir).toBe(path.join(getPackageRoot(), 'templates'));
    });
  });

  describe('getProjectPaths()', () => {
    const projectRoot = '/fake/project';

    it('should return all expected path keys', () => {
      const paths = getProjectPaths(projectRoot);
      expect(paths.root).toBe(projectRoot);
      expect(paths.resources).toBe(path.join(projectRoot, 'resources'));
      expect(paths.resourcesConfig).toBe(path.join(projectRoot, 'resources', 'config.json'));
      expect(paths.claude).toBe(path.join(projectRoot, '.claude'));
      expect(paths.commands).toBe(path.join(projectRoot, '.claude', 'commands'));
      expect(paths.stories).toBe(path.join(projectRoot, 'stories'));
    });
  });

  describe('getTemplateSourcePaths()', () => {
    it('should return all template source paths', () => {
      const templates = getTemplateSourcePaths();
      const templatesDir = getTemplatesDir();

      expect(templates.commands).toBe(path.join(templatesDir, 'commands'));
      expect(templates.dotClaude).toBe(path.join(templatesDir, 'dot-claude'));
      expect(templates.resources).toBe(path.join(templatesDir, 'resources'));
      expect(templates.tracking).toBe(path.join(templatesDir, 'tracking'));
      expect(templates.all).toBe(templatesDir);
    });
  });
});
