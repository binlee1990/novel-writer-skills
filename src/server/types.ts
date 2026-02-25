/** 故事基础信息 */
export interface Story {
  name: string;
  path: string;
}

/** 故事总览 */
export interface StoryOverview {
  name: string;
  totalVolumes: number;
  totalChapters: number;
  totalWords: number;
  currentVolume: number;
}

/** 卷信息 */
export interface Volume {
  number: number;
  title: string;
  chapters: number;
  words: number;
  progress: number; // 0-100
}

/** 章节信息 */
export interface Chapter {
  globalNumber: number;
  volumeNumber: number;
  chapterInVolume: number;
  title: string;
  words: number;
  pov: string;
  participants: string[];
  hasSynopsis: boolean;
  hasContent: boolean;
}

/** 角色信息 */
export interface Character {
  name: string;
  aliases: string[];
  role: string; // 主角/配角/龙套
  firstVolume: number;
  firstChapter: number;
  cultivation: string;
  faction: string;
  status: string; // 活跃/已故/退场
}

/** 角色状态快照（按卷） */
export interface CharacterState {
  volume: number;
  cultivation: string;
  location: string;
  summary: string;
  lastChapter: number;
}

/** 关系图节点 */
export interface RelationshipNode {
  id: string;
  name: string;
  faction: string;
  role: string;
  appearances: number;
}

/** 关系图边 */
export interface RelationshipEdge {
  source: string;
  target: string;
  type: string; // 盟友/敌对/师徒/恋人等
  status: string;
  lastChapter: number;
}

/** 关系网络图 */
export interface RelationshipGraph {
  nodes: RelationshipNode[];
  edges: RelationshipEdge[];
}

/** 关系变迁事件 */
export interface RelationshipEvent {
  chapter: number;
  source: string;
  target: string;
  type: string;
  oldStatus: string;
  newStatus: string;
}

/** 时间线事件 */
export interface TimelineEvent {
  id: number;
  chapter: number;
  storyTime: string;
  location: string;
  description: string;
  tags: string[];
}

/** 情节线 */
export interface PlotThread {
  name: string;
  type: string;
  status: string; // active/paused/resolved
  description: string;
  keyEvents: string[];
}

/** 伏笔 */
export interface Foreshadow {
  code: string;
  description: string;
  plantedChapter: number;
  hintedChapters: number[];
  resolvedChapter: number | null;
  status: string; // planted/hinted/resolved
  importance: string;
}

/** 伏笔矩阵单元格 */
export interface ForeshadowCell {
  chapter: number;
  action: 'plant' | 'hint' | 'resolve' | null;
}

/** 伏笔矩阵 */
export interface ForeshadowMatrix {
  chapters: number[];
  rows: Array<{
    code: string;
    description: string;
    cells: ForeshadowCell[];
  }>;
}

/** 卷级统计 */
export interface VolumeStat {
  volume: number;
  title: string;
  words: number;
  chapters: number;
  progress: number;
}

/** 仪表盘聚合统计 */
export interface DashboardStats {
  totalWords: number;
  totalChapters: number;
  totalVolumes: number;
  totalCharacters: number;
  activePlotThreads: number;
  unresolvedForeshadowing: number;
  volumeStats: VolumeStat[];
}

/** 主角技能 */
export interface ProtagonistSkill {
  name: string;
  category: string;
  level: string;
  description: string;
  acquiredChapter: number;
  useCount: number;
  status: string;
}

/** 主角道具 */
export interface ProtagonistItem {
  name: string;
  type: string;
  quantity: number;
  quality: string;
  description: string;
  acquiredChapter: number;
  status: string;
}

/** 修炼进度节点 */
export interface CultivationNode {
  chapter: number;
  level: string;
  progressPct: number;
  breakthroughType: string | null;
  detail: string;
}

/** 主角总览 */
export interface ProtagonistOverview {
  currentLevel: string;
  currentProgress: number;
  totalSkills: number;
  activeSkills: number;
  totalItems: number;
  heldItems: number;
}

/** 数据源抽象接口 */
export interface DataSource {
  getStories(): Promise<Story[]>;
  getOverview(story: string): Promise<StoryOverview>;
  getVolumes(story: string): Promise<Volume[]>;
  getChapters(story: string, vol?: number): Promise<Chapter[]>;
  getCharacters(story: string, vol?: number): Promise<Character[]>;
  getCharacterArc(story: string, name: string): Promise<CharacterState[]>;
  getRelationships(story: string, vol?: number): Promise<RelationshipGraph>;
  getRelationshipHistory(story: string): Promise<RelationshipEvent[]>;
  getTimeline(story: string, vol?: number): Promise<TimelineEvent[]>;
  getPlotThreads(story: string): Promise<PlotThread[]>;
  getForeshadowing(story: string): Promise<Foreshadow[]>;
  getForeshadowingMatrix(story: string): Promise<ForeshadowMatrix>;
  getDashboardStats(story: string): Promise<DashboardStats>;
  getProtagonistOverview(story: string): Promise<ProtagonistOverview>;
  getProtagonistSkills(story: string): Promise<ProtagonistSkill[]>;
  getProtagonistInventory(story: string): Promise<ProtagonistItem[]>;
  getCultivationCurve(story: string): Promise<CultivationNode[]>;
}
