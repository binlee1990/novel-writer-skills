import fs from 'fs';
import path from 'path';
import os from 'os';
import { DatabaseManager } from '../../src/db/connection';

describe('DatabaseManager', () => {
  let tempDir: string;
  let dbPath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nws-db-'));
    dbPath = path.join(tempDir, 'novel-tracking.db');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should create database file on open', () => {
    const manager = new DatabaseManager(dbPath);
    manager.open();
    expect(fs.existsSync(dbPath)).toBe(true);
    manager.close();
  });

  it('should initialize schema on open', () => {
    const manager = new DatabaseManager(dbPath);
    manager.open();

    const db = manager.getDb();
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table'"
    ).all() as { name: string }[];

    expect(tables.length).toBeGreaterThan(5);
    manager.close();
  });

  it('should return same db instance on repeated getDb calls', () => {
    const manager = new DatabaseManager(dbPath);
    manager.open();

    const db1 = manager.getDb();
    const db2 = manager.getDb();
    expect(db1).toBe(db2);

    manager.close();
  });

  it('should throw if getDb called before open', () => {
    const manager = new DatabaseManager(dbPath);
    expect(() => manager.getDb()).toThrow();
  });

  it('should rebuild database from scratch', () => {
    const manager = new DatabaseManager(dbPath);
    manager.open();

    manager.getDb().prepare(
      "INSERT INTO characters (id, name, volume, status) VALUES (?, ?, ?, ?)"
    ).run('c1', 'Test', 1, 'active');

    manager.rebuild();

    const row = manager.getDb().prepare('SELECT * FROM characters WHERE id = ?').get('c1');
    expect(row).toBeUndefined();

    manager.close();
  });

  it('should be safe to call close multiple times', () => {
    const manager = new DatabaseManager(dbPath);
    manager.open();
    manager.close();
    expect(() => manager.close()).not.toThrow();
  });

  it('should be safe to call open when already open', () => {
    const manager = new DatabaseManager(dbPath);
    manager.open();
    expect(() => manager.open()).not.toThrow();
    manager.close();
  });
});
