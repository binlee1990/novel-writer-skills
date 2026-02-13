import path from 'path';
import {
  DIRS,
  FILES,
  DEFAULT_GITIGNORE,
  getPackageRoot,
  getTemplatesDir,
  getBuiltinPluginsDir,
  getProjectPaths,
  getTemplateSourcePaths,
} from '../../../src/core/config.js';

describe('core/config.ts', () => {
  describe('DIRS', () => {
    it('should define all directory constants', () => {
      expect(DIRS.CLAUDE).toBe('.claude');
      expect(DIRS.SPECIFY).toBe('.specify');
      expect(DIRS.STORIES).toBe('stories');
      expect(DIRS.SPEC).toBe('spec');
      expect(DIRS.COMMANDS).toBe('commands');
      expect(DIRS.SKILLS).toBe('skills');
      expect(DIRS.KNOWLEDGE_BASE).toBe('knowledge-base');
      expect(DIRS.PLUGINS).toBe('plugins');
      expect(DIRS.MEMORY).toBe('memory');
      expect(DIRS.TEMPLATES).toBe('templates');
      expect(DIRS.TRACKING).toBe('tracking');
      expect(DIRS.KNOWLEDGE).toBe('knowledge');
    });
  });

  describe('FILES', () => {
    it('should define all file constants', () => {
      expect(FILES.CONFIG).toBe('config.json');
      expect(FILES.PLUGIN_REGISTRY).toBe('plugins.json');
      expect(FILES.PLUGIN_CONFIG).toBe('config.yaml');
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

  describe('getBuiltinPluginsDir()', () => {
    it('should return path under package root', () => {
      const pluginsDir = getBuiltinPluginsDir();
      expect(pluginsDir).toBe(path.join(getPackageRoot(), 'plugins'));
    });
  });

  describe('getProjectPaths()', () => {
    const projectRoot = '/fake/project';

    it('should return all expected path keys', () => {
      const paths = getProjectPaths(projectRoot);
      expect(paths.root).toBe(projectRoot);
      expect(paths.specify).toBe(path.join(projectRoot, '.specify'));
      expect(paths.specifyConfig).toBe(path.join(projectRoot, '.specify', 'config.json'));
      expect(paths.claude).toBe(path.join(projectRoot, '.claude'));
      expect(paths.commands).toBe(path.join(projectRoot, '.claude', 'commands'));
      expect(paths.skills).toBe(path.join(projectRoot, '.claude', 'skills'));
      expect(paths.stories).toBe(path.join(projectRoot, 'stories'));
      expect(paths.spec).toBe(path.join(projectRoot, 'spec'));
      expect(paths.tracking).toBe(path.join(projectRoot, 'spec', 'tracking'));
      expect(paths.knowledge).toBe(path.join(projectRoot, 'spec', 'knowledge'));
      expect(paths.plugins).toBe(path.join(projectRoot, 'plugins'));
    });

    it('should include knowledgeBase path', () => {
      const paths = getProjectPaths(projectRoot);
      expect(paths.knowledgeBase).toBe(path.join(projectRoot, '.specify', 'templates', 'knowledge-base'));
    });

    it('should include pluginRegistry path', () => {
      const paths = getProjectPaths(projectRoot);
      expect(paths.pluginRegistry).toBe(path.join(projectRoot, '.specify', 'plugins.json'));
    });

    it('should include trackingSummary path', () => {
      const paths = getProjectPaths(projectRoot);
      expect(paths.trackingSummary).toBe(path.join(projectRoot, 'spec', 'tracking', 'summary'));
    });

    it('should include trackingVolumes path', () => {
      const paths = getProjectPaths(projectRoot);
      expect(paths.trackingVolumes).toBe(path.join(projectRoot, 'spec', 'tracking', 'volumes'));
    });
  });

  describe('getTemplateSourcePaths()', () => {
    it('should return all template source paths', () => {
      const templates = getTemplateSourcePaths();
      const templatesDir = getTemplatesDir();

      expect(templates.commands).toBe(path.join(templatesDir, 'commands'));
      expect(templates.skills).toBe(path.join(templatesDir, 'skills'));
      expect(templates.knowledgeBase).toBe(path.join(templatesDir, 'knowledge-base'));
      expect(templates.memory).toBe(path.join(templatesDir, 'memory'));
      expect(templates.tracking).toBe(path.join(templatesDir, 'tracking'));
      expect(templates.knowledge).toBe(path.join(templatesDir, 'knowledge'));
      expect(templates.all).toBe(templatesDir);
    });

    it('should include trackingSummary template path', () => {
      const templates = getTemplateSourcePaths();
      const templatesDir = getTemplatesDir();
      expect(templates.trackingSummary).toBe(path.join(templatesDir, 'tracking', 'summary'));
    });
  });
});
