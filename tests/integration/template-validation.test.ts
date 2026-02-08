import fs from 'fs-extra';
import path from 'path';

const TEMPLATES_DIR = path.resolve(__dirname, '../../templates');

describe('Template Files Validation', () => {
  describe('Command Templates', () => {
    const commandsDir = path.join(TEMPLATES_DIR, 'commands');

    it('should have all required core commands', () => {
      const commands = fs.readdirSync(commandsDir);

      const required = [
        'constitution.md',
        'specify.md',
        'clarify.md',
        'plan.md',
        'tasks.md',
        'write.md',
        'analyze.md',
        'track.md',
        'recap.md',
      ];

      for (const cmd of required) {
        expect(commands).toContain(cmd);
      }
    });

    it('should have non-empty command files', () => {
      const commands = fs.readdirSync(commandsDir)
        .filter(f => f.endsWith('.md') && !f.endsWith('.backup'));

      for (const cmd of commands) {
        const content = fs.readFileSync(path.join(commandsDir, cmd), 'utf-8');
        expect(content.trim().length).toBeGreaterThan(0);
      }
    });

    it('should have more than 10 unique commands', () => {
      const commands = fs.readdirSync(commandsDir)
        .filter(f => f.endsWith('.md') && !f.endsWith('.backup'));
      expect(commands.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Skill Templates', () => {
    const skillsDir = path.join(TEMPLATES_DIR, 'skills');

    it('should have genre-knowledge skills', () => {
      const genreDir = path.join(skillsDir, 'genre-knowledge');
      expect(fs.existsSync(genreDir)).toBe(true);

      const genres = fs.readdirSync(genreDir);
      expect(genres.length).toBeGreaterThanOrEqual(3);
    });

    it('should have quality-assurance skills', () => {
      const qaDir = path.join(skillsDir, 'quality-assurance');
      expect(fs.existsSync(qaDir)).toBe(true);

      const skills = fs.readdirSync(qaDir);
      expect(skills.length).toBeGreaterThanOrEqual(5);
    });

    it('should have writing-techniques skills', () => {
      const wtDir = path.join(skillsDir, 'writing-techniques');
      expect(fs.existsSync(wtDir)).toBe(true);

      const skills = fs.readdirSync(wtDir);
      expect(skills.length).toBeGreaterThanOrEqual(3);
    });

    it('should have SKILL.md in each skill directory', () => {
      const categories = fs.readdirSync(skillsDir);

      for (const category of categories) {
        const categoryPath = path.join(skillsDir, category);
        if (!fs.statSync(categoryPath).isDirectory()) continue;

        const skills = fs.readdirSync(categoryPath);
        for (const skill of skills) {
          const skillPath = path.join(categoryPath, skill);
          if (!fs.statSync(skillPath).isDirectory()) continue;

          const skillFile = path.join(skillPath, 'SKILL.md');
          expect(fs.existsSync(skillFile)).toBe(true);
        }
      }
    });

    it('should have non-empty SKILL.md files', () => {
      const categories = fs.readdirSync(skillsDir);

      for (const category of categories) {
        const categoryPath = path.join(skillsDir, category);
        if (!fs.statSync(categoryPath).isDirectory()) continue;

        const skills = fs.readdirSync(categoryPath);
        for (const skill of skills) {
          const skillFile = path.join(categoryPath, skill, 'SKILL.md');
          if (!fs.existsSync(skillFile)) continue;

          const content = fs.readFileSync(skillFile, 'utf-8');
          expect(content.trim().length).toBeGreaterThan(50);
        }
      }
    });
  });

  describe('Knowledge Base', () => {
    const kbDir = path.join(TEMPLATES_DIR, 'knowledge-base');

    it('should have knowledge-base directory', () => {
      expect(fs.existsSync(kbDir)).toBe(true);
    });

    it('should have core categories', () => {
      const categories = ['craft', 'genres', 'requirements', 'styles'];
      for (const cat of categories) {
        expect(fs.existsSync(path.join(kbDir, cat))).toBe(true);
      }
    });

    it('should have README.md', () => {
      expect(fs.existsSync(path.join(kbDir, 'README.md'))).toBe(true);
    });

    it('should have non-empty knowledge files', () => {
      const categories = ['craft', 'genres', 'requirements', 'styles'];
      for (const cat of categories) {
        const catDir = path.join(kbDir, cat);
        const files = fs.readdirSync(catDir).filter(f => f.endsWith('.md'));
        expect(files.length).toBeGreaterThanOrEqual(1);

        for (const file of files) {
          const content = fs.readFileSync(path.join(catDir, file), 'utf-8');
          expect(content.trim().length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Script Templates', () => {
    const scriptsDir = path.join(TEMPLATES_DIR, 'scripts');

    it('should have scripts directory', () => {
      expect(fs.existsSync(scriptsDir)).toBe(true);
    });

    it('should have bash scripts', () => {
      const bashDir = path.join(scriptsDir, 'bash');
      expect(fs.existsSync(bashDir)).toBe(true);

      const scripts = fs.readdirSync(bashDir).filter(f => f.endsWith('.sh'));
      expect(scripts.length).toBeGreaterThanOrEqual(10);
    });

    it('should have powershell scripts', () => {
      const psDir = path.join(scriptsDir, 'powershell');
      expect(fs.existsSync(psDir)).toBe(true);

      const scripts = fs.readdirSync(psDir).filter(f => f.endsWith('.ps1'));
      expect(scripts.length).toBeGreaterThanOrEqual(10);
    });

    it('should have common.sh and common.ps1', () => {
      expect(fs.existsSync(path.join(scriptsDir, 'bash', 'common.sh'))).toBe(true);
      expect(fs.existsSync(path.join(scriptsDir, 'powershell', 'common.ps1'))).toBe(true);
    });
  });
});
