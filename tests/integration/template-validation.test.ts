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

    it('should reference narrative-threads.json in track command', () => {
      const trackFile = path.join(commandsDir, 'track.md');
      const content = fs.readFileSync(trackFile, 'utf-8');
      expect(content).toContain('narrative-threads.json');
      expect(content).toContain('叙事线同步');
    });
    it('should have foreshadowing health detection in track command', () => {
      const trackFile = path.join(commandsDir, 'track.md');
      const content = fs.readFileSync(trackFile, 'utf-8');
      expect(content).toContain('伏笔健康度检测');
      expect(content).toContain('伏笔热度');
      expect(content).toContain('伏笔回收');
      expect(content).toContain('伏笔链');
    });
    it('should have enhanced timeline command with visualization and conflict detection', () => {
      const timelineFile = path.join(commandsDir, 'timeline.md');
      const content = fs.readFileSync(timelineFile, 'utf-8');
      expect(content).toContain('时间线可视化');
      expect(content).toContain('多线程时间对齐');
      expect(content).toContain('时间冲突检测');
    });
    it('should have enhanced relations command with visualization and conflict detection', () => {
      const relationsFile = path.join(commandsDir, 'relations.md');
      const content = fs.readFileSync(relationsFile, 'utf-8');
      expect(content).toContain('关系图谱可视化');
      expect(content).toContain('关系变化追踪');
      expect(content).toContain('关系冲突检测');
    });
    it('should have enhanced expert command with domain definitions and consultation flow', () => {
      const expertFile = path.join(commandsDir, 'expert.md');
      const content = fs.readFileSync(expertFile, 'utf-8');
      expect(content).toContain('角色塑造专家');
      expect(content).toContain('情节设计专家');
      expect(content).toContain('世界观构建专家');
      expect(content).toContain('文笔提升专家');
      expect(content).toContain('类型写作专家');
      expect(content).toContain('咨询流程');
    });
    it('should have enhanced tasks command with priority, dependencies, and statistics', () => {
      const tasksFile = path.join(commandsDir, 'tasks.md');
      const content = fs.readFileSync(tasksFile, 'utf-8');
      expect(content).toContain('任务优先级');
      expect(content).toContain('任务依赖关系');
      expect(content).toContain('从计划自动生成任务');
      expect(content).toContain('任务完成度统计');
    });
    it('should have enhanced checklist command with stage templates and auto-fix', () => {
      const checklistFile = path.join(commandsDir, 'checklist.md');
      const content = fs.readFileSync(checklistFile, 'utf-8');
      expect(content).toContain('阶段性检查模板');
      expect(content).toContain('写前检查');
      expect(content).toContain('写后检查');
      expect(content).toContain('卷末检查');
      expect(content).toContain('自定义检查项');
      expect(content).toContain('自动修复建议');
    });
    it('should have creation stats mode in track command', () => {
      const trackFile = path.join(commandsDir, 'track.md');
      const content = fs.readFileSync(trackFile, 'utf-8');
      expect(content).toContain('创作数据统计');
      expect(content).toContain('字数详情');
      expect(content).toContain('角色出场频率');
      expect(content).toContain('内容构成');
      expect(content).toContain('伏笔状态');
      expect(content).toContain('情节线进度');
    });
    it('should have --focus=voice in analyze command', () => {
      const analyzeFile = path.join(commandsDir, 'analyze.md');
      const content = fs.readFileSync(analyzeFile, 'utf-8');
      expect(content).toContain('--focus=voice');
      expect(content).toContain('对话一致性分析');
      expect(content).toContain('voice-consistency-checker');
    });
    it('should have inspiration scanning in write command', () => {
      const writeFile = path.join(commandsDir, 'write.md');
      const content = fs.readFileSync(writeFile, 'utf-8');
      expect(content).toContain('灵感扫描');
      expect(content).toContain('ideas.json');
      expect(content).toContain('灵感状态更新');
      expect(content).toContain('灵感快速捕捉');
    });
    it('should have inspiration allocation in plan command', () => {
      const planFile = path.join(commandsDir, 'plan.md');
      const content = fs.readFileSync(planFile, 'utf-8');
      expect(content).toContain('灵感分配');
      expect(content).toContain('ideas.json');
      expect(content).toContain('灵感分配建议');
    });
    it('should have smart recommendation engine in guide command', () => {
      const guideFile = path.join(commandsDir, 'guide.md');
      const content = fs.readFileSync(guideFile, 'utf-8');
      expect(content).toContain('三层优先级');
      expect(content).toContain('P0/P1/P2');
      expect(content).toContain('智能推荐');
      expect(content).toContain('唯一最佳下一步');
    });
    it('should have smart recommendations in write post-processing', () => {
      const writeFile = path.join(commandsDir, 'write.md');
      const content = fs.readFileSync(writeFile, 'utf-8');
      expect(content).toContain('智能推荐（后置）');
      expect(content).toContain('P0/P1');
    });
    it('should have feedback suggestion module in analyze command', () => {
      const analyzeFile = path.join(commandsDir, 'analyze.md');
      const content = fs.readFileSync(analyzeFile, 'utf-8');
      expect(content).toContain('反馈建议');
      expect(content).toContain('反馈分类');
      expect(content).toContain('规格书反馈');
      expect(content).toContain('计划反馈');
    });
    it('should have --feedback mode in specify command', () => {
      const specifyFile = path.join(commandsDir, 'specify.md');
      const content = fs.readFileSync(specifyFile, 'utf-8');
      expect(content).toContain('--feedback');
      expect(content).toContain('反馈接收模式');
      expect(content).toContain('规格书反馈处理');
    });
    it('should have --feedback mode in plan command', () => {
      const planFile = path.join(commandsDir, 'plan.md');
      const content = fs.readFileSync(planFile, 'utf-8');
      expect(content).toContain('--feedback');
      expect(content).toContain('反馈接收模式');
      expect(content).toContain('计划反馈处理');
    });
    it('should have priority-based recommendation system in guide command', () => {
      const guideFile = path.join(commandsDir, 'guide.md');
      const content = fs.readFileSync(guideFile, 'utf-8');
      expect(content).toContain('P0 优先级');
      expect(content).toContain('P1 优先级');
      expect(content).toContain('P2 优先级');
      expect(content).toContain('长篇');
      expect(content).toContain('超长篇');
      expect(content).toContain('备选操作');
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

    it('should have enhanced multi-thread-narrative skill with extended capabilities', () => {
      const skillFile = path.join(skillsDir, 'writing-techniques', 'multi-thread-narrative', 'SKILL.md');
      const content = fs.readFileSync(skillFile, 'utf-8');
      expect(content).toContain('## 扩展能力');
      expect(content).toContain('视角切换规划');
      expect(content).toContain('信息差追踪');
      expect(content).toContain('叙事线交汇设计');
      expect(content).toContain('narrative-threads.json');
    });

    it('should have enhanced style-detector skill with baseline and drift detection', () => {
      const skillFile = path.join(skillsDir, 'quality-assurance', 'style-detector', 'SKILL.md');
      const content = fs.readFileSync(skillFile, 'utf-8');
      expect(content).toContain('## 扩展能力');
      expect(content).toContain('风格基线建立');
      expect(content).toContain('风格偏移检测');
      expect(content).toContain('跨章节风格一致性评分');
    });

    it('should have voice-consistency-checker skill with dialogue analysis', () => {
      const skillFile = path.join(skillsDir, 'quality-assurance', 'voice-consistency-checker', 'SKILL.md');
      const content = fs.readFileSync(skillFile, 'utf-8');
      expect(content).toContain('对话一致性');
      expect(content).toContain('语言指纹');
      expect(content).toContain('词汇匹配');
      expect(content).toContain('voice-analyst');
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
