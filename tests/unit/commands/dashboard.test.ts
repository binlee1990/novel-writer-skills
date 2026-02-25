import { Command } from '@commander-js/extra-typings';
import { registerDashboardCommand } from '../../../src/commands/dashboard.js';

describe('registerDashboardCommand', () => {
  it('registers dashboard command on program', () => {
    const program = new Command();
    registerDashboardCommand(program);
    const cmd = program.commands.find(c => c.name() === 'dashboard');
    expect(cmd).toBeDefined();
    expect(cmd!.description()).toContain('仪表盘');
  });

  it('has --port option with default 3210', () => {
    const program = new Command();
    registerDashboardCommand(program);
    const cmd = program.commands.find(c => c.name() === 'dashboard');
    const portOpt = cmd!.options.find(o => o.long === '--port');
    expect(portOpt).toBeDefined();
    expect(portOpt!.defaultValue).toBe('3210');
  });

  it('has --dev flag', () => {
    const program = new Command();
    registerDashboardCommand(program);
    const cmd = program.commands.find(c => c.name() === 'dashboard');
    const devOpt = cmd!.options.find(o => o.long === '--dev');
    expect(devOpt).toBeDefined();
  });

  it('has --no-open flag', () => {
    const program = new Command();
    registerDashboardCommand(program);
    const cmd = program.commands.find(c => c.name() === 'dashboard');
    const noOpenOpt = cmd!.options.find(o => o.long === '--no-open');
    expect(noOpenOpt).toBeDefined();
  });
});
