import Database from 'better-sqlite3';
import fs from 'fs';
import { initializeSchema } from './schema.js';

export class DatabaseManager {
  private dbPath: string;
  private db: Database.Database | null = null;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  open(): void {
    if (this.db) return;
    this.db = new Database(this.dbPath);
    initializeSchema(this.db);
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  getDb(): Database.Database {
    if (!this.db) {
      throw new Error('Database not opened. Call open() first.');
    }
    return this.db;
  }

  rebuild(): void {
    this.close();
    if (fs.existsSync(this.dbPath)) {
      fs.unlinkSync(this.dbPath);
    }
    this.open();
  }
}
