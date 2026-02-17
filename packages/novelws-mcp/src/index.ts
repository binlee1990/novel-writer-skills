#!/usr/bin/env node

/**
 * novelws-mcp - MCP server for novel-writer-skills tracking data
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import path from 'path';
import { DatabaseManager } from './db/connection.js';
import { queryCharacters } from './tools/query-characters.js';
import { queryTimeline } from './tools/query-timeline.js';
import { queryRelationships } from './tools/query-relationships.js';
import { queryPlot } from './tools/query-plot.js';
import { queryFacts } from './tools/query-facts.js';
import { queryChapterEntities } from './tools/query-chapter-entities.js';
import { statsVolume } from './tools/stats-volume.js';
import { statsCharacter } from './tools/stats-character.js';
import { statsConsistency } from './tools/stats-consistency.js';
import { searchContent, updateFtsIndex } from './tools/search-content.js';
import { syncFromJson } from './tools/sync-from-json.js';
import { syncStatus } from './tools/sync-status.js';
import { logWritingSession } from './tools/log-writing-session.js';
import { queryAnalysisHistory } from './tools/query-analysis-history.js';
import { queryWritingStats } from './tools/query-writing-stats.js';

const projectRoot = process.argv[2] || process.cwd();
const dbPath = path.join(projectRoot, 'tracking', 'novel-tracking.db');

const dbManager = new DatabaseManager(dbPath);
dbManager.open();

const server = new McpServer({
  name: 'novelws-mcp',
  version: '0.1.0',
});

const getDb = () => dbManager.getDb();
const jsonResult = (data: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
});

// === Data Query Tools ===

server.tool('query_characters', '按卷/状态/名字搜索角色', {
  volume: z.number().optional().describe('限定卷号'),
  status: z.enum(['active', 'archived', 'deceased']).optional().describe('角色状态'),
  name: z.string().optional().describe('名字模糊搜索'),
  limit: z.number().optional().describe('返回数量上限'),
}, async (params) => jsonResult(queryCharacters(getDb(), params)));

server.tool('query_timeline', '查询时间线事件', {
  volume: z.number().optional().describe('限定卷号'),
  chapter_from: z.number().optional().describe('起始章节'),
  chapter_to: z.number().optional().describe('结束章节'),
  type: z.string().optional().describe('事件类型'),
  limit: z.number().optional().describe('返回数量上限'),
}, async (params) => jsonResult(queryTimeline(getDb(), params)));

server.tool('query_relationships', '查询角色关系', {
  character: z.string().optional().describe('查某角色的所有关系'),
  volume: z.number().optional().describe('限定卷号'),
  type: z.string().optional().describe('关系类型'),
  limit: z.number().optional().describe('返回数量上限'),
}, async (params) => jsonResult(queryRelationships(getDb(), params)));

server.tool('query_plot', '查询剧情线和伏笔', {
  status: z.enum(['active', 'resolved']).optional().describe('状态过滤'),
  type: z.enum(['foreshadowing', 'subplot', 'main']).optional().describe('类型过滤'),
  planted_before: z.number().optional().describe('在某章之前埋下的'),
  limit: z.number().optional().describe('返回数量上限'),
}, async (params) => jsonResult(queryPlot(getDb(), params)));

server.tool('query_facts', '查询故事设定事实', {
  category: z.string().optional().describe('分类过滤'),
  keyword: z.string().optional().describe('关键词模糊搜索'),
  limit: z.number().optional().describe('返回数量上限'),
}, async (params) => jsonResult(queryFacts(getDb(), params)));

server.tool('query_chapter_entities', '查询章节实体（角色/地点/物品）', {
  chapter: z.number().describe('章节号'),
  entity_type: z.enum(['character', 'location', 'item', 'power', 'faction']).optional().describe('实体类型'),
}, async (params) => jsonResult(queryChapterEntities(getDb(), params)));

// === Statistics Tools ===

server.tool('stats_volume', '获取某卷的统计数据', {
  volume: z.number().describe('卷号'),
}, async (params) => jsonResult(statsVolume(getDb(), params)));

server.tool('stats_character', '获取角色统计数据', {
  name: z.string().describe('角色名'),
}, async (params) => jsonResult(statsCharacter(getDb(), params)));

server.tool('stats_consistency', '一致性检查', {
  volume: z.number().optional().describe('限定卷号，不传则全局检查'),
}, async (params) => jsonResult(statsConsistency(getDb(), params)));

// === Search Tool ===

server.tool('search_content', '全文搜索章节内容', {
  query: z.string().describe('搜索关键词'),
  volume: z.number().optional().describe('限定卷号'),
  limit: z.number().optional().describe('返回数量上限'),
}, async (params) => jsonResult(searchContent(getDb(), params)));

// === Sync Tools ===

server.tool('sync_from_json', '从 JSON 文件同步数据到 SQLite', {}, async () => {
  const result = syncFromJson(getDb(), projectRoot);
  return jsonResult(result);
});

server.tool('sync_status', '查看同步状态和各表行数', {}, async () => {
  return jsonResult(syncStatus(getDb()));
});

// === Creative Data Tools ===

server.tool('log_writing_session', '记录写作会话', {
  chapter: z.number().describe('章节号'),
  word_count: z.number().describe('字数'),
  commands_used: z.string().optional().describe('使用的命令'),
}, async (params) => {
  const id = logWritingSession(getDb(), params);
  return jsonResult({ id, success: true });
});

server.tool('update_fts_index', '更新章节全文索引', {
  chapter: z.number().describe('章节号'),
  volume: z.number().describe('卷号'),
  title: z.string().describe('章节标题'),
  content: z.string().describe('章节内容'),
}, async (params) => {
  updateFtsIndex(getDb(), params.chapter, params.volume, params.title, params.content);
  return jsonResult({ success: true });
});

server.tool('query_analysis_history', '查询分析历史', {
  chapter: z.number().optional().describe('章节号'),
  analysis_type: z.string().optional().describe('分析类型'),
  limit: z.number().optional().describe('返回数量上限'),
}, async (params) => jsonResult(queryAnalysisHistory(getDb(), params)));

server.tool('query_writing_stats', '查询写作统计', {
  volume: z.number().optional().describe('限定卷号'),
}, async (params) => jsonResult(queryWritingStats(getDb(), params)));

// === Server Lifecycle ===

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('Failed to start novelws-mcp:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  dbManager.close();
  process.exit(0);
});
