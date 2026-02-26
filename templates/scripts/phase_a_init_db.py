#!/usr/bin/env python3
"""Phase A: 小说数据库初始化 — 建表 + 视图

用法:
    python scripts/phase_a_init_db.py          # 创建 schema + 表 + 视图
    python scripts/phase_a_init_db.py --seed    # 建表后运行 db_sync.py --all 导入数据

依赖: pip install -r scripts/requirements.txt
"""

import json
import os
import subprocess
import sys
import psycopg2

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCHEMA = "novelws"


def load_config():
    config_path = os.path.join(BASE, "resources", "config.json")
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_db_config(config):
    db = config.get("database", {})
    return {
        "host": db.get("host", "127.0.0.1"),
        "port": db.get("port", 5432),
        "dbname": db.get("dbname", "postgres"),
        "user": db.get("user", "postgres"),
        "password": db.get("password", ""),
    }


# ─────────────────────────────────────────────
# DDL: 建 schema + 20 张核心表（带中文注释）
# ─────────────────────────────────────────────
DDL = f"""
-- ============================================================
-- 小说数据库核心表结构
-- Schema: {SCHEMA}
-- ============================================================

DROP SCHEMA IF EXISTS {SCHEMA} CASCADE;
CREATE SCHEMA {SCHEMA};

-- 1) phases: 纪元表（记录小说的时代/纪元划分）
-- 说明：每个纪元代表小说中的一个完整时代，包含多卷内容
CREATE TABLE {SCHEMA}.phases (
    id                          SERIAL PRIMARY KEY,
    phase_number                INT NOT NULL UNIQUE,           -- 纪元编号（如：第1纪元、第2纪元）
    title                       VARCHAR(100) NOT NULL,         -- 纪元标题/名称
    theme                       VARCHAR(200),                  -- 纪元主题（如：觉醒、成长、决战等）
    vol_start                   INT NOT NULL,                  -- 起始卷号（本纪元从哪一卷开始）
    vol_end                     INT NOT NULL,                  -- 结束卷号（本纪元到哪一卷结束）
    protagonist_level_start     VARCHAR(50),                   -- 主角初始等级/境界
    protagonist_level_end       VARCHAR(50),                   -- 主角结束等级/境界
    stage_level                 VARCHAR(50),                   -- 当前境界等级（如：炼气期、筑基期）
    growth_keyword              VARCHAR(200),                  -- 成长关键词（如：觉醒、突破、蜕变）
    core_conflict               TEXT,                          -- 核心冲突/矛盾
    status                      VARCHAR(20) DEFAULT 'planned'  -- 状态：planned(计划中)/active(进行中)/completed(已完成)
);

-- 2) volumes: 卷表（记录每卷的基本信息）
-- 说明：卷是介于纪元和章节之间的单位，一个纪元包含多卷
CREATE TABLE {SCHEMA}.volumes (
    id                          SERIAL PRIMARY KEY,
    phase_id                    INT NOT NULL REFERENCES {SCHEMA}.phases(id),           -- 所属纪元ID
    vol_number                  INT NOT NULL UNIQUE,           -- 卷号（如：第1卷、第2卷）
    title                       VARCHAR(200) NOT NULL,         -- 卷标题
    arc_type                    VARCHAR(50),                  -- 剧情弧类型（如：日常、副本、高潮）
    instance_name               VARCHAR(100),                  -- 副本名称（如果有）
    instance_type               VARCHAR(100),                  -- 副本类型（如：秘境、禁地、遗迹）
    instance_level              VARCHAR(50),                   -- 副本等级/难度
    protagonist_level_range     VARCHAR(100),                  -- 主角等级范围
    chapter_count               INT DEFAULT 100,               -- 章节数量（预估或实际）
    outline_path                TEXT,                          -- 大纲文件路径
    summary_path                TEXT,                          -- 卷概要文件路径
    status                      VARCHAR(20) DEFAULT 'planned'  -- 状态：planned(计划中)/writing(写作中)/completed(已完成)
);

-- 3) chapters: 章节表（记录每个章节的详细信息）
-- 说明：章节是小说最基本的叙事单元
CREATE TABLE {SCHEMA}.chapters (
    id                          SERIAL PRIMARY KEY,
    volume_id                   INT NOT NULL REFERENCES {SCHEMA}.volumes(id),          -- 所属卷ID
    chapter_number              INT NOT NULL,                  -- 卷内章节序号（第1章、第2章...）
    global_chapter_number       INT NOT NULL UNIQUE,           -- 全局章节序号（全书第X章）
    title                       VARCHAR(300),                  -- 章节标题
    synopsis_path               TEXT,                          -- 章节梗概文件路径
    content_path                TEXT,                          -- 章节正文文件路径
    synopsis_summary            TEXT,                          -- 梗概摘要（简短描述）
    synopsis_keywords           TEXT[],                        -- 关键词数组（用于检索和分类）
    status                      VARCHAR(20) DEFAULT 'planned',  -- 状态：planned/synopsis/draft/final
    word_count                  INT DEFAULT 0,                -- 字数
    scene_location              VARCHAR(200),                  -- 场景地点
    time_in_story               VARCHAR(200),                  -- 故事内时间（如：第XX天、辰时）
    pov_character               VARCHAR(100) DEFAULT '主角'    -- 视角角色（POV）
);

-- 4) characters: 角色主表（记录所有角色的基本信息）
-- 说明：包括主角、配角、反派等所有重要角色
CREATE TABLE {SCHEMA}.characters (
    id                          SERIAL PRIMARY KEY,
    name                        VARCHAR(100) NOT NULL UNIQUE,  -- 角色名称（唯一）
    aliases                     TEXT[],                        -- 别名/称呼数组
    role_type                   VARCHAR(50),                  -- 角色类型：protagonist(主角)/supporting(配角)/antagonist(反派)/npc
    first_appearance_vol        INT,                           -- 首次登场卷号
    first_appearance_ch        INT,                           -- 首次登场章节号
    cultivation_level          VARCHAR(100),                  -- 修为等级/境界
    faction                     VARCHAR(200),                  -- 所属阵营/势力
    status                      VARCHAR(20) DEFAULT 'active'   -- 状态：active(活跃)/deceased(死亡)/disappeared(消失)
);

-- 5) character_states: 角色状态快照表（按卷记录角色状态）
-- 说明：每个角色在每卷结束时的状态快照，用于追踪角色成长轨迹
CREATE TABLE {SCHEMA}.character_states (
    id                          SERIAL PRIMARY KEY,
    character_id                INT NOT NULL REFERENCES {SCHEMA}.characters(id),      -- 角色ID
    volume_id                   INT NOT NULL REFERENCES {SCHEMA}.volumes(id),         -- 卷ID
    cultivation_level           VARCHAR(100),                  -- 当前修为等级
    location                    VARCHAR(200),                  -- 当前所在位置
    state_summary               TEXT,                          -- 状态摘要
    last_appearance             INT,                           -- 最后登场章节号
    UNIQUE(character_id, volume_id)                             -- 每个角色每卷只有一条记录
);

-- 6) plot_threads: 情节线表（记录小说的主要情节线）
-- 说明：一条情节线可能跨越多卷，包含多个关键事件
CREATE TABLE {SCHEMA}.plot_threads (
    id                          SERIAL PRIMARY KEY,
    name                        VARCHAR(200) NOT NULL,         -- 情节线名称
    thread_type                 VARCHAR(50),                  -- 情节类型：main(主线)/sub(支线)/background(暗线)
    status                      VARCHAR(30) DEFAULT 'active',  -- 状态：active(进行中)/resolved(已解决)/dormant(潜伏)
    description                 TEXT,                          -- 情节线描述
    start_volume_id             INT REFERENCES {SCHEMA}.volumes(id),                -- 起始卷ID
    volume_id                   INT REFERENCES {SCHEMA}.volumes(id),                -- 当前所属卷ID
    key_events                  JSONB DEFAULT '[]'::jsonb       -- 关键事件数组（JSON格式）
);

-- 7) foreshadowing: 伏笔表（记录埋设的伏笔）
-- 说明：记录伏笔的埋设、暗示和回收情况
CREATE TABLE {SCHEMA}.foreshadowing (
    id                          SERIAL PRIMARY KEY,
    code                        VARCHAR(20) UNIQUE,            -- 伏笔编码（如：FP001、FATE-001）
    plot_thread_id              INT REFERENCES {SCHEMA}.plot_threads(id),            -- 关联的情节线ID
    description                 TEXT NOT NULL,                 -- 伏笔描述
    planted_chapter_id          INT REFERENCES {SCHEMA}.chapters(id),                -- 埋设章节ID
    hinted_chapter_id           INT REFERENCES {SCHEMA}.chapters(id),                -- 暗示章节ID（可选）
    resolved_chapter_id         INT REFERENCES {SCHEMA}.chapters(id),               -- 解决章节ID（伏笔回收）
    status                      VARCHAR(30) DEFAULT 'planted',  -- 状态：planted(已埋设)/hinted(已暗示)/partially_resolved(部分解决)/resolved(已解决)
    importance                  VARCHAR(20) DEFAULT 'major',    -- 重要程度：major(重要)/minor(次要)/key(关键)
    note                        TEXT                           -- 备注
);

-- 8) chapter_foreshadowing: 伏笔×章节关联表
-- 说明：记录每个章节涉及哪些伏笔（埋设、暗示、解决）
CREATE TABLE {SCHEMA}.chapter_foreshadowing (
    id                          SERIAL PRIMARY KEY,
    foreshadowing_id            INT NOT NULL REFERENCES {SCHEMA}.foreshadowing(id),   -- 伏笔ID
    chapter_id                  INT NOT NULL REFERENCES {SCHEMA}.chapters(id),        -- 章节ID
    action_type                 VARCHAR(20) NOT NULL,         -- 动作类型：plant(埋设)/hint(暗示)/resolve(解决)
    UNIQUE(foreshadowing_id, chapter_id, action_type)          -- 同一伏笔在同一章节只有一种动作
);

-- 9) chapter_participants: 章节角色参与表
-- 说明：记录每个章节有哪些角色出场，以及角色在章节中的定位
CREATE TABLE {SCHEMA}.chapter_participants (
    id                          SERIAL PRIMARY KEY,
    chapter_id                  INT NOT NULL REFERENCES {SCHEMA}.chapters(id),        -- 章节ID
    character_id                INT NOT NULL REFERENCES {SCHEMA}.characters(id),      -- 角色ID
    role_in_chapter             VARCHAR(50),                  -- 章节中的角色作用：protagonist(主角)/supporting(配角)/antagonist(反派)/mentioned(提及)
    UNIQUE(chapter_id, character_id)                          -- 同一角色在同一章节只出现一次
);

-- 10) relationships: 角色关系表（记录角色之间的关系）
-- 说明：记录任意两个角色之间的关系，可按卷追踪关系变化
CREATE TABLE {SCHEMA}.relationships (
    id                          SERIAL PRIMARY KEY,
    character_a_id              INT NOT NULL REFERENCES {SCHEMA}.characters(id),      -- 角色A ID
    character_b_id              INT NOT NULL REFERENCES {SCHEMA}.characters(id),      -- 角色B ID
    relationship_type           VARCHAR(100),                  -- 关系类型：friend(朋友)/enemy(敌人)/family(家人)/rival(对手)/mentor(师徒)等
    current_status              TEXT,                          -- 当前关系状态描述
    note                        TEXT,                          -- 备注
    last_update_chapter         INT,                           -- 最后更新时的章节号
    volume_id                   INT REFERENCES {SCHEMA}.volumes(id),                 -- 所属卷ID
    UNIQUE(character_a_id, character_b_id, volume_id)        -- 同一对角色在同一卷只有一条关系记录
);

-- 11) timeline_events: 时间线事件表
-- 说明：记录小说中的重要事件，按时间线排列
CREATE TABLE {SCHEMA}.timeline_events (
    id                          SERIAL PRIMARY KEY,
    chapter_id                  INT NOT NULL REFERENCES {SCHEMA}.chapters(id),        -- 关联章节ID
    event_description           TEXT NOT NULL,                 -- 事件描述
    story_time                  VARCHAR(200),                  -- 故事内时间（如：黎明时分、三年后）
    location                    VARCHAR(200),                  -- 事件发生地点
    tags                        TEXT[] DEFAULT '{{}}',         -- 标签数组（如：战斗、突破、死亡）
    volume_id                   INT NOT NULL REFERENCES {SCHEMA}.volumes(id)         -- 所属卷ID
);

-- 12) cross_volume_refs: 跨卷引用表
-- 说明：记录章节之间的跨卷引用/呼应关系
CREATE TABLE {SCHEMA}.cross_volume_refs (
    id                          SERIAL PRIMARY KEY,
    source_chapter_id           INT NOT NULL REFERENCES {SCHEMA}.chapters(id),        -- 源章节（引用方）
    target_chapter_id           INT NOT NULL REFERENCES {SCHEMA}.chapters(id),        -- 目标章节（被引用方）
    ref_type                    VARCHAR(50),                  -- 引用类型：callback(呼应)/foreshadow(前情提要)/parallel(平行)
    description                 TEXT                          -- 描述
);

-- 13) character_key_changes: 角色关键变化表
-- 说明：记录角色在特定章节发生的重要变化/转折
CREATE TABLE {SCHEMA}.character_key_changes (
    id                          SERIAL PRIMARY KEY,
    character_id                INT NOT NULL REFERENCES {SCHEMA}.characters(id),      -- 角色ID
    chapter_number              INT NOT NULL,                  -- 变化发生的章节号
    change_desc                 TEXT NOT NULL,                 -- 变化描述
    volume_id                   INT NOT NULL REFERENCES {SCHEMA}.volumes(id)         -- 所属卷ID
);

-- 14) relationship_history: 关系变迁历史表
-- 说明：记录角色关系的演变历史
CREATE TABLE {SCHEMA}.relationship_history (
    id                          SERIAL PRIMARY KEY,
    relationship_id             INT NOT NULL REFERENCES {SCHEMA}.relationships(id),  -- 关系ID
    chapter_number              INT NOT NULL,                  -- 变化发生的章节号
    status_desc                 TEXT NOT NULL,                 -- 状态描述
    volume_id                   INT NOT NULL REFERENCES {SCHEMA}.volumes(id)         -- 所属卷ID
);

-- 15) plot_thread_events: 情节线关键事件展开表
-- 说明：展开记录情节线中的每个关键事件
CREATE TABLE {SCHEMA}.plot_thread_events (
    id                          SERIAL PRIMARY KEY,
    plot_thread_id              INT NOT NULL REFERENCES {SCHEMA}.plot_threads(id),    -- 所属情节线ID
    chapter_number              INT NOT NULL,                  -- 事件发生的章节号
    event_desc                  TEXT NOT NULL,                 -- 事件描述
    volume_id                   INT NOT NULL REFERENCES {SCHEMA}.volumes(id)         -- 所属卷ID
);

-- ============================================================
-- 索引（提升查询性能）
-- ============================================================

-- 章节相关索引
CREATE INDEX idx_chapters_volume ON {SCHEMA}.chapters(volume_id);                      -- 按卷查询章节
CREATE INDEX idx_chapters_global ON {SCHEMA}.chapters(global_chapter_number);         -- 按全局章号查询

-- 角色状态索引
CREATE INDEX idx_char_states_vol ON {SCHEMA}.character_states(volume_id);             -- 按卷查询角色状态

-- 伏笔相关索引
CREATE INDEX idx_foreshadowing_status ON {SCHEMA}.foreshadowing(status);             -- 按状态查询伏笔

-- 时间线索引
CREATE INDEX idx_timeline_chapter ON {SCHEMA}.timeline_events(chapter_id);            -- 按章节查询时间线
CREATE INDEX idx_timeline_tags ON {SCHEMA}.timeline_events USING GIN(tags);          -- 按标签查询时间线

-- 情节线索引
CREATE INDEX idx_plot_threads_status ON {SCHEMA}.plot_threads(status);                -- 按状态查询情节线
CREATE INDEX idx_plot_threads_vol ON {SCHEMA}.plot_threads(volume_id);              -- 按卷查询情节线

-- 角色变化索引
CREATE INDEX idx_char_key_changes_char ON {SCHEMA}.character_key_changes(character_id); -- 按角色查询变化
CREATE INDEX idx_char_key_changes_vol ON {SCHEMA}.character_key_changes(volume_id);  -- 按卷查询变化

-- 关系历史索引
CREATE INDEX idx_rel_history_rel ON {SCHEMA}.relationship_history(relationship_id); -- 按关系查询历史
CREATE INDEX idx_rel_history_vol ON {SCHEMA}.relationship_history(volume_id);        -- 按卷查询关系历史

-- 情节线事件索引
CREATE INDEX idx_plot_events_thread ON {SCHEMA}.plot_thread_events(plot_thread_id);  -- 按情节线查询事件
CREATE INDEX idx_plot_events_vol ON {SCHEMA}.plot_thread_events(volume_id);          -- 按卷查询事件

-- ============================================================
-- 主角相关表（16-20）：记录主角的技能、背包、修炼进度等
-- ============================================================

-- 16) protagonist_skills: 主角技能主表
-- 说明：记录主角学会的所有技能
CREATE TABLE {SCHEMA}.protagonist_skills (
    id                          SERIAL PRIMARY KEY,
    skill_name                  VARCHAR(100) NOT NULL UNIQUE,  -- 技能名称
    skill_category              VARCHAR(20) NOT NULL,           -- 技能分类：账本脑/符/阵/被动/功法等
    skill_level                 VARCHAR(50),                   -- 技能等级：入门/固化/小成/大成
    parent_skill_id             INT REFERENCES {SCHEMA}.protagonist_skills(id),      -- 父技能ID（技能树）
    description                 TEXT,                          -- 技能描述/效果说明
    acquired_chapter            INT NOT NULL,                  -- 获得章节号
    acquired_method             VARCHAR(200),                  -- 获得方式：自悟/修炼突破/副本掉落/交易等
    last_used_chapter           INT,                           -- 最后使用章节号
    use_count                   INT DEFAULT 0,                -- 使用次数
    status                      VARCHAR(20) DEFAULT 'active'   -- 状态：active(可用)/locked(锁定)/forgotten(遗忘)
);

-- 17) protagonist_skill_events: 技能时序表
-- 说明：记录技能的每次使用/变化事件
CREATE TABLE {SCHEMA}.protagonist_skill_events (
    id                          SERIAL PRIMARY KEY,
    skill_id                    INT NOT NULL REFERENCES {SCHEMA}.protagonist_skills(id),        -- 技能ID
    chapter_number              INT NOT NULL,                  -- 事件发生章节号
    event_type                  VARCHAR(30) NOT NULL,           -- 事件类型：acquired(获得)/upgraded(升级)/used(使用)/forgotten(遗忘)
    detail                      TEXT,                          -- 事件详情
    volume_id                   INT NOT NULL REFERENCES {SCHEMA}.volumes(id)                 -- 所属卷ID
);

-- 18) protagonist_inventory: 主角装备/道具主表
-- 说明：记录主角当前拥有的所有物品
CREATE TABLE {SCHEMA}.protagonist_inventory (
    id                          SERIAL PRIMARY KEY,
    item_name                   VARCHAR(100) NOT NULL,          -- 物品名称
    item_type                   VARCHAR(30) NOT NULL,           -- 物品类型：装备/材料/消耗品/工具
    quantity                    INT DEFAULT 1,                 -- 数量
    quality                     VARCHAR(30),                   -- 品质：普通/稀有/精良/史诗/传说
    description                 TEXT,                          -- 物品描述
    acquired_chapter            INT NOT NULL,                  -- 获得章节号
    acquired_method             VARCHAR(200),                  -- 获得方式：拾取/交易/制作/副本掉落
    status                      VARCHAR(20) DEFAULT 'held',     -- 状态：held(持有)/consumed(已消耗)/equipped(装备中)
    UNIQUE(item_name, acquired_chapter)                         -- 同一物品同名只能有一条记录
);

-- 19) protagonist_inventory_events: 道具时序表
-- 说明：记录物品的获取、使用、消耗等事件
CREATE TABLE {SCHEMA}.protagonist_inventory_events (
    id                          SERIAL PRIMARY KEY,
    item_id                     INT NOT NULL REFERENCES {SCHEMA}.protagonist_inventory(id),      -- 物品ID
    chapter_number              INT NOT NULL,                  -- 事件发生章节号
    event_type                  VARCHAR(30) NOT NULL,           -- 事件类型：acquired(获得)/used(使用)/lost(丢失)/given(赠予)
    quantity_change             INT DEFAULT 0,                 -- 数量变化（正数增加，负数减少）
    detail                      TEXT,                          -- 事件详情
    volume_id                   INT NOT NULL REFERENCES {SCHEMA}.volumes(id)                 -- 所属卷ID
);

-- 20) protagonist_cultivation: 修炼进度表
-- 说明：记录主角的修炼突破历程
CREATE TABLE {SCHEMA}.protagonist_cultivation (
    id                          SERIAL PRIMARY KEY,
    chapter_number              INT NOT NULL,                  -- 记录发生的章节号
    level                       VARCHAR(50) NOT NULL,          -- 修炼等级/境界（如：段1·炼气前期）
    progress_pct                DECIMAL(5,1),                  -- 进度百分比（0-100）
    breakthrough_type           VARCHAR(20),                   -- 突破类型：major(大境界突破)/minor(小境界提升)
    trigger                     VARCHAR(200),                  -- 触发原因：修炼突破/副本战斗/特殊事件
    detail                      TEXT,                          -- 详情描述
    volume_id                   INT NOT NULL REFERENCES {SCHEMA}.volumes(id)                 -- 所属卷ID
);

-- 主角相关索引
CREATE INDEX idx_skills_category ON {SCHEMA}.protagonist_skills(skill_category);           -- 按技能分类查询
CREATE INDEX idx_skills_status ON {SCHEMA}.protagonist_skills(status);                     -- 按状态查询技能
CREATE INDEX idx_skill_events_skill ON {SCHEMA}.protagonist_skill_events(skill_id);       -- 按技能查询事件
CREATE INDEX idx_skill_events_vol ON {SCHEMA}.protagonist_skill_events(volume_id);         -- 按卷查询技能事件
CREATE INDEX idx_skill_events_type ON {SCHEMA}.protagonist_skill_events(event_type);      -- 按事件类型查询

CREATE INDEX idx_inventory_type ON {SCHEMA}.protagonist_inventory(item_type);               -- 按物品类型查询
CREATE INDEX idx_inventory_status ON {SCHEMA}.protagonist_inventory(status);                 -- 按状态查询背包
CREATE INDEX idx_inv_events_item ON {SCHEMA}.protagonist_inventory_events(item_id);        -- 按物品查询事件
CREATE INDEX idx_inv_events_vol ON {SCHEMA}.protagonist_inventory_events(volume_id);        -- 按卷查询背包事件

CREATE INDEX idx_cultivation_vol ON {SCHEMA}.protagonist_cultivation(volume_id);            -- 按卷查询修炼进度
CREATE INDEX idx_cultivation_ch ON {SCHEMA}.protagonist_cultivation(chapter_number);         -- 按章节查询修炼进度

-- ============================================================
-- 表和字段的中文注释（COMMENT ON）
-- ============================================================

-- phases 表注释
COMMENT ON TABLE {SCHEMA}.phases IS '纪元表：记录小说的时代/纪元划分，每个纪元代表小说中的一个完整时代';
COMMENT ON COLUMN {SCHEMA}.phases.id IS '主键ID';
COMMENT ON COLUMN {SCHEMA}.phases.phase_number IS '纪元编号（如：第1纪元、第2纪元）';
COMMENT ON COLUMN {SCHEMA}.phases.title IS '纪元标题/名称';
COMMENT ON COLUMN {SCHEMA}.phases.theme IS '纪元主题（如：觉醒、成长、决战等）';
COMMENT ON COLUMN {SCHEMA}.phases.vol_start IS '起始卷号（本纪元从哪一卷开始）';
COMMENT ON COLUMN {SCHEMA}.phases.vol_end IS '结束卷号（本纪元到哪一卷结束）';
COMMENT ON COLUMN {SCHEMA}.phases.protagonist_level_start IS '主角初始等级/境界';
COMMENT ON COLUMN {SCHEMA}.phases.protagonist_level_end IS '主角结束等级/境界';
COMMENT ON COLUMN {SCHEMA}.phases.stage_level IS '当前境界等级（如：炼气期、筑基期）';
COMMENT ON COLUMN {SCHEMA}.phases.growth_keyword IS '成长关键词（如：觉醒、突破、蜕变）';
COMMENT ON COLUMN {SCHEMA}.phases.core_conflict IS '核心冲突/矛盾';
COMMENT ON COLUMN {SCHEMA}.phases.status IS '状态：planned(计划中)/active(进行中)/completed(已完成)';

-- volumes 表注释
COMMENT ON TABLE {SCHEMA}.volumes IS '卷表：记录每卷的基本信息，卷是介于纪元和章节之间的单位';
COMMENT ON COLUMN {SCHEMA}.volumes.id IS '主键ID';
COMMENT ON COLUMN {SCHEMA}.volumes.phase_id IS '所属纪元ID';
COMMENT ON COLUMN {SCHEMA}.volumes.vol_number IS '卷号（如：第1卷、第2卷）';
COMMENT ON COLUMN {SCHEMA}.volumes.title IS '卷标题';
COMMENT ON COLUMN {SCHEMA}.volumes.arc_type IS '剧情弧类型（如：日常、副本、高潮）';
COMMENT ON COLUMN {SCHEMA}.volumes.instance_name IS '副本名称（如果有）';
COMMENT ON COLUMN {SCHEMA}.volumes.instance_type IS '副本类型（如：秘境、禁地、遗迹）';
COMMENT ON COLUMN {SCHEMA}.volumes.instance_level IS '副本等级/难度';
COMMENT ON COLUMN {SCHEMA}.volumes.protagonist_level_range IS '主角等级范围';
COMMENT ON COLUMN {SCHEMA}.volumes.chapter_count IS '章节数量（预估或实际）';
COMMENT ON COLUMN {SCHEMA}.volumes.outline_path IS '大纲文件路径';
COMMENT ON COLUMN {SCHEMA}.volumes.summary_path IS '卷概要文件路径';
COMMENT ON COLUMN {SCHEMA}.volumes.status IS '状态：planned(计划中)/writing(写作中)/completed(已完成)';

-- chapters 表注释
COMMENT ON TABLE {SCHEMA}.chapters IS '章节表：记录每个章节的详细信息，章节是小说最基本的叙事单元';
COMMENT ON COLUMN {SCHEMA}.chapters.id IS '主键ID';
COMMENT ON COLUMN {SCHEMA}.chapters.volume_id IS '所属卷ID';
COMMENT ON COLUMN {SCHEMA}.chapters.chapter_number IS '卷内章节序号（第1章、第2章...）';
COMMENT ON COLUMN {SCHEMA}.chapters.global_chapter_number IS '全局章节序号（全书第X章）';
COMMENT ON COLUMN {SCHEMA}.chapters.title IS '章节标题';
COMMENT ON COLUMN {SCHEMA}.chapters.synopsis_path IS '章节梗概文件路径';
COMMENT ON COLUMN {SCHEMA}.chapters.content_path IS '章节正文文件路径';
COMMENT ON COLUMN {SCHEMA}.chapters.synopsis_summary IS '梗概摘要（简短描述）';
COMMENT ON COLUMN {SCHEMA}.chapters.synopsis_keywords IS '关键词数组（用于检索和分类）';
COMMENT ON COLUMN {SCHEMA}.chapters.status IS '状态：planned(计划中)/synopsis(梗概)/draft(草稿)/final(定稿)';
COMMENT ON COLUMN {SCHEMA}.chapters.word_count IS '字数';
COMMENT ON COLUMN {SCHEMA}.chapters.scene_location IS '场景地点';
COMMENT ON COLUMN {SCHEMA}.chapters.time_in_story IS '故事内时间（如：第XX天、辰时）';
COMMENT ON COLUMN {SCHEMA}.chapters.pov_character IS '视角角色（POV）';

-- characters 表注释
COMMENT ON TABLE {SCHEMA}.characters IS '角色主表：记录所有角色的基本信息，包括主角、配角、反派等';
COMMENT ON COLUMN {SCHEMA}.characters.id IS '主键ID';
COMMENT ON COLUMN {SCHEMA}.characters.name IS '角色名称（唯一）';
COMMENT ON COLUMN {SCHEMA}.characters.aliases IS '别名/称呼数组';
COMMENT ON COLUMN {SCHEMA}.characters.role_type IS '角色类型：protagonist(主角)/supporting(配角)/antagonist(反派)/npc';
COMMENT ON COLUMN {SCHEMA}.characters.first_appearance_vol IS '首次登场卷号';
COMMENT ON COLUMN {SCHEMA}.characters.first_appearance_ch IS '首次登场章节号';
COMMENT ON COLUMN {SCHEMA}.characters.cultivation_level IS '修为等级/境界';
COMMENT ON COLUMN {SCHEMA}.characters.faction IS '所属阵营/势力';
COMMENT ON COLUMN {SCHEMA}.characters.status IS '状态：active(活跃)/deceased(死亡)/disappeared(消失)';

-- character_states 表注释
COMMENT ON TABLE {SCHEMA}.character_states IS '角色状态快照表：按卷记录角色状态，用于追踪角色成长轨迹';
COMMENT ON COLUMN {SCHEMA}.character_states.id IS '主键ID';
COMMENT ON COLUMN {SCHEMA}.character_states.character_id IS '角色ID';
COMMENT ON COLUMN {SCHEMA}.character_states.volume_id IS '卷ID';
COMMENT ON COLUMN {SCHEMA}.character_states.cultivation_level IS '当前修为等级';
COMMENT ON COLUMN {SCHEMA}.character_states.location IS '当前所在位置';
COMMENT ON COLUMN {SCHEMA}.character_states.state_summary IS '状态摘要';
COMMENT ON COLUMN {SCHEMA}.character_states.last_appearance IS '最后登场章节号';

-- plot_threads 表注释
COMMENT ON TABLE {SCHEMA}.plot_threads IS '情节线表：记录小说的主要情节线，可能跨越多卷';
COMMENT ON COLUMN {SCHEMA}.plot_threads.id IS '主键ID';
COMMENT ON COLUMN {SCHEMA}.plot_threads.name IS '情节线名称';
COMMENT ON COLUMN {SCHEMA}.plot_threads.thread_type IS '情节类型：main(主线)/sub(支线)/background(暗线)';
COMMENT ON COLUMN {SCHEMA}.plot_threads.status IS '状态：active(进行中)/resolved(已解决)/dormant(潜伏)';
COMMENT ON COLUMN {SCHEMA}.plot_threads.description IS '情节线描述';
COMMENT ON COLUMN {SCHEMA}.plot_threads.start_volume_id IS '起始卷ID';
COMMENT ON COLUMN {SCHEMA}.plot_threads.volume_id IS '当前所属卷ID';
COMMENT ON COLUMN {SCHEMA}.plot_threads.key_events IS '关键事件数组（JSON格式）';

-- foreshadowing 表注释
COMMENT ON TABLE {SCHEMA}.foreshadowing IS '伏笔表：记录埋设的伏笔，包括埋设、暗示和回收情况';
COMMENT ON COLUMN {SCHEMA}.foreshadowing.id IS '主键ID';
COMMENT ON COLUMN {SCHEMA}.foreshadowing.code IS '伏笔编码（如：FP001、FATE-001）';
COMMENT ON COLUMN {SCHEMA}.foreshadowing.plot_thread_id IS '关联的情节线ID';
COMMENT ON COLUMN {SCHEMA}.foreshadowing.description IS '伏笔描述';
COMMENT ON COLUMN {SCHEMA}.foreshadowing.planted_chapter_id IS '埋设章节ID';
COMMENT ON COLUMN {SCHEMA}.foreshadowing.hinted_chapter_id IS '暗示章节ID（可选）';
COMMENT ON COLUMN {SCHEMA}.foreshadowing.resolved_chapter_id IS '解决章节ID（伏笔回收）';
COMMENT ON COLUMN {SCHEMA}.foreshadowing.status IS '状态：planted(已埋设)/hinted(已暗示)/partially_resolved(部分解决)/resolved(已解决)';
COMMENT ON COLUMN {SCHEMA}.foreshadowing.importance IS '重要程度：major(重要)/minor(次要)/key(关键)';
COMMENT ON COLUMN {SCHEMA}.foreshadowing.note IS '备注';

-- chapter_foreshadowing 表注释
COMMENT ON TABLE {SCHEMA}.chapter_foreshadowing IS '伏笔×章节关联表：记录每个章节涉及哪些伏笔';
COMMENT ON COLUMN {SCHEMA}.chapter_foreshadowing.id IS '主键ID';
COMMENT ON COLUMN {SCHEMA}.chapter_foreshadowing.foreshadowing_id IS '伏笔ID';
COMMENT ON COLUMN {SCHEMA}.chapter_foreshadowing.chapter_id IS '章节ID';
COMMENT ON COLUMN {SCHEMA}.chapter_foreshadowing.action_type IS '动作类型：plant(埋设)/hint(暗示)/resolve(解决)';

-- chapter_participants 表注释
COMMENT ON TABLE {SCHEMA}.chapter_participants IS '章节角色参与表：记录每个章节有哪些角色出场';
COMMENT ON COLUMN {SCHEMA}.chapter_participants.id IS '主键ID';
COMMENT ON COLUMN {SCHEMA}.chapter_participants.chapter_id IS '章节ID';
COMMENT ON COLUMN {SCHEMA}.chapter_participants.character_id IS '角色ID';
COMMENT ON COLUMN {SCHEMA}.chapter_participants.role_in_chapter IS '章节中的角色作用：protagonist(主角)/supporting(配角)/antagonist(反派)/mentioned(提及)';

-- relationships 表注释
COMMENT ON TABLE {SCHEMA}.relationships IS '角色关系表：记录角色之间的关系，可按卷追踪变化';
COMMENT ON COLUMN {SCHEMA}.relationships.id IS '主键ID';
COMMENT ON COLUMN {SCHEMA}.relationships.character_a_id IS '角色A ID';
COMMENT ON COLUMN {SCHEMA}.relationships.character_b_id IS '角色B ID';
COMMENT ON COLUMN {SCHEMA}.relationships.relationship_type IS '关系类型：friend(朋友)/enemy(敌人)/family(家人)/rival(对手)/mentor(师徒)等';
COMMENT ON COLUMN {SCHEMA}.relationships.current_status IS '当前关系状态描述';
COMMENT ON COLUMN {SCHEMA}.relationships.note IS '备注';
COMMENT ON COLUMN {SCHEMA}.relationships.last_update_chapter IS '最后更新时的章节号';
COMMENT ON COLUMN {SCHEMA}.relationships.volume_id IS '所属卷ID';

-- timeline_events 表注释
COMMENT ON TABLE {SCHEMA}.timeline_events IS '时间线事件表：记录小说中的重要事件，按时间线排列';
COMMENT ON COLUMN {SCHEMA}.timeline_events.id IS '主键ID';
COMMENT ON COLUMN {SCHEMA}.timeline_events.chapter_id IS '关联章节ID';
COMMENT ON COLUMN {SCHEMA}.timeline_events.event_description IS '事件描述';
COMMENT ON COLUMN {SCHEMA}.timeline_events.story_time IS '故事内时间（如：黎明时分、三年后）';
COMMENT ON COLUMN {SCHEMA}.timeline_events.location IS '事件发生地点';
COMMENT ON COLUMN {SCHEMA}.timeline_events.tags IS '标签数组（如：战斗、突破、死亡）';
COMMENT ON COLUMN {SCHEMA}.timeline_events.volume_id IS '所属卷ID';

-- cross_volume_refs 表注释
COMMENT ON TABLE {SCHEMA}.cross_volume_refs IS '跨卷引用表：记录章节之间的跨卷引用/呼应关系';
COMMENT ON COLUMN {SCHEMA}.cross_volume_refs.id IS '主键ID';
COMMENT ON COLUMN {SCHEMA}.cross_volume_refs.source_chapter_id IS '源章节（引用方）';
COMMENT ON COLUMN {SCHEMA}.cross_volume_refs.target_chapter_id IS '目标章节（被引用方）';
COMMENT ON COLUMN {SCHEMA}.cross_volume_refs.ref_type IS '引用类型：callback(呼应)/foreshadow(前情提要)/parallel(平行)';
COMMENT ON COLUMN {SCHEMA}.cross_volume_refs.description IS '描述';

-- character_key_changes 表注释
COMMENT ON TABLE {SCHEMA}.character_key_changes IS '角色关键变化表：记录角色在特定章节发生的重要变化/转折';
COMMENT ON COLUMN {SCHEMA}.character_key_changes.id IS '主键ID';
COMMENT ON COLUMN {SCHEMA}.character_key_changes.character_id IS '角色ID';
COMMENT ON COLUMN {SCHEMA}.character_key_changes.chapter_number IS '变化发生的章节号';
COMMENT ON COLUMN {SCHEMA}.character_key_changes.change_desc IS '变化描述';
COMMENT ON COLUMN {SCHEMA}.character_key_changes.volume_id IS '所属卷ID';

-- relationship_history 表注释
COMMENT ON TABLE {SCHEMA}.relationship_history IS '关系变迁历史表：记录角色关系的演变历史';
COMMENT ON COLUMN {SCHEMA}.relationship_history.id IS '主键ID';
COMMENT ON COLUMN {SCHEMA}.relationship_history.relationship_id IS '关系ID';
COMMENT ON COLUMN {SCHEMA}.relationship_history.chapter_number IS '变化发生的章节号';
COMMENT ON COLUMN {SCHEMA}.relationship_history.status_desc IS '状态描述';
COMMENT ON COLUMN {SCHEMA}.relationship_history.volume_id IS '所属卷ID';

-- plot_thread_events 表注释
COMMENT ON TABLE {SCHEMA}.plot_thread_events IS '情节线关键事件展开表：展开记录情节线中的每个关键事件';
COMMENT ON COLUMN {SCHEMA}.plot_thread_events.id IS '主键ID';
COMMENT ON COLUMN {SCHEMA}.plot_thread_events.plot_thread_id IS '所属情节线ID';
COMMENT ON COLUMN {SCHEMA}.plot_thread_events.chapter_number IS '事件发生的章节号';
COMMENT ON COLUMN {SCHEMA}.plot_thread_events.event_desc IS '事件描述';
COMMENT ON COLUMN {SCHEMA}.plot_thread_events.volume_id IS '所属卷ID';

-- protagonist_skills 表注释
COMMENT ON TABLE {SCHEMA}.protagonist_skills IS '主角技能主表：记录主角学会的所有技能';
COMMENT ON COLUMN {SCHEMA}.protagonist_skills.id IS '主键ID';
COMMENT ON COLUMN {SCHEMA}.protagonist_skills.skill_name IS '技能名称';
COMMENT ON COLUMN {SCHEMA}.protagonist_skills.skill_category IS '技能分类：账本脑/符/阵/被动/功法等';
COMMENT ON COLUMN {SCHEMA}.protagonist_skills.skill_level IS '技能等级：入门/固化/小成/大成';
COMMENT ON COLUMN {SCHEMA}.protagonist_skills.parent_skill_id IS '父技能ID（技能树）';
COMMENT ON COLUMN {SCHEMA}.protagonist_skills.description IS '技能描述/效果说明';
COMMENT ON COLUMN {SCHEMA}.protagonist_skills.acquired_chapter IS '获得章节号';
COMMENT ON COLUMN {SCHEMA}.protagonist_skills.acquired_method IS '获得方式：自悟/修炼突破/副本掉落/交易等';
COMMENT ON COLUMN {SCHEMA}.protagonist_skills.last_used_chapter IS '最后使用章节号';
COMMENT ON COLUMN {SCHEMA}.protagonist_skills.use_count IS '使用次数';
COMMENT ON COLUMN {SCHEMA}.protagonist_skills.status IS '状态：active(可用)/locked(锁定)/forgotten(遗忘)';

-- protagonist_skill_events 表注释
COMMENT ON TABLE {SCHEMA}.protagonist_skill_events IS '技能时序表：记录技能的每次使用/变化事件';
COMMENT ON COLUMN {SCHEMA}.protagonist_skill_events.id IS '主键ID';
COMMENT ON COLUMN {SCHEMA}.protagonist_skill_events.skill_id IS '技能ID';
COMMENT ON COLUMN {SCHEMA}.protagonist_skill_events.chapter_number IS '事件发生章节号';
COMMENT ON COLUMN {SCHEMA}.protagonist_skill_events.event_type IS '事件类型：acquired(获得)/upgraded(升级)/used(使用)/forgotten(遗忘)';
COMMENT ON COLUMN {SCHEMA}.protagonist_skill_events.detail IS '事件详情';
COMMENT ON COLUMN {SCHEMA}.protagonist_skill_events.volume_id IS '所属卷ID';

-- protagonist_inventory 表注释
COMMENT ON TABLE {SCHEMA}.protagonist_inventory IS '主角装备/道具主表：记录主角当前拥有的所有物品';
COMMENT ON COLUMN {SCHEMA}.protagonist_inventory.id IS '主键ID';
COMMENT ON COLUMN {SCHEMA}.protagonist_inventory.item_name IS '物品名称';
COMMENT ON COLUMN {SCHEMA}.protagonist_inventory.item_type IS '物品类型：装备/材料/消耗品/工具';
COMMENT ON COLUMN {SCHEMA}.protagonist_inventory.quantity IS '数量';
COMMENT ON COLUMN {SCHEMA}.protagonist_inventory.quality IS '品质：普通/稀有/精良/史诗/传说';
COMMENT ON COLUMN {SCHEMA}.protagonist_inventory.description IS '物品描述';
COMMENT ON COLUMN {SCHEMA}.protagonist_inventory.acquired_chapter IS '获得章节号';
COMMENT ON COLUMN {SCHEMA}.protagonist_inventory.acquired_method IS '获得方式：拾取/交易/制作/副本掉落';
COMMENT ON COLUMN {SCHEMA}.protagonist_inventory.status IS '状态：held(持有)/consumed(已消耗)/equipped(装备中)';

-- protagonist_inventory_events 表注释
COMMENT ON TABLE {SCHEMA}.protagonist_inventory_events IS '道具时序表：记录物品的获取、使用、消耗等事件';
COMMENT ON COLUMN {SCHEMA}.protagonist_inventory_events.id IS '主键ID';
COMMENT ON COLUMN {SCHEMA}.protagonist_inventory_events.item_id IS '物品ID';
COMMENT ON COLUMN {SCHEMA}.protagonist_inventory_events.chapter_number IS '事件发生章节号';
COMMENT ON COLUMN {SCHEMA}.protagonist_inventory_events.event_type IS '事件类型：acquired(获得)/used(使用)/lost(丢失)/given(赠予)';
COMMENT ON COLUMN {SCHEMA}.protagonist_inventory_events.quantity_change IS '数量变化（正数增加，负数减少）';
COMMENT ON COLUMN {SCHEMA}.protagonist_inventory_events.detail IS '事件详情';
COMMENT ON COLUMN {SCHEMA}.protagonist_inventory_events.volume_id IS '所属卷ID';

-- protagonist_cultivation 表注释
COMMENT ON TABLE {SCHEMA}.protagonist_cultivation IS '修炼进度表：记录主角的修炼突破历程';
COMMENT ON COLUMN {SCHEMA}.protagonist_cultivation.id IS '主键ID';
COMMENT ON COLUMN {SCHEMA}.protagonist_cultivation.chapter_number IS '记录发生的章节号';
COMMENT ON COLUMN {SCHEMA}.protagonist_cultivation.level IS '修炼等级/境界（如：段1·炼气前期）';
COMMENT ON COLUMN {SCHEMA}.protagonist_cultivation.progress_pct IS '进度百分比（0-100）';
COMMENT ON COLUMN {SCHEMA}.protagonist_cultivation.breakthrough_type IS '突破类型：major(大境界突破)/minor(小境界提升)';
COMMENT ON COLUMN {SCHEMA}.protagonist_cultivation.trigger IS '触发原因：修炼突破/副本战斗/特殊事件';
COMMENT ON COLUMN {SCHEMA}.protagonist_cultivation.detail IS '详情描述';
COMMENT ON COLUMN {SCHEMA}.protagonist_cultivation.volume_id IS '所属卷ID';
"""

VIEWS = f"""
-- 写作仪表盘视图：按纪元统计卷、章节、字数等汇总信息
CREATE OR REPLACE VIEW {SCHEMA}.writing_dashboard AS
SELECT
    p.phase_number,
    p.title AS phase_title,
    COUNT(DISTINCT v.id) AS total_volumes,
    COUNT(DISTINCT v.id) FILTER (WHERE v.status = 'completed') AS completed_volumes,
    COUNT(DISTINCT ch.id) AS total_chapters,
    COUNT(DISTINCT ch.id) FILTER (WHERE ch.status = 'final') AS final_chapters,
    COUNT(DISTINCT ch.id) FILTER (WHERE ch.status = 'synopsis') AS synopsis_chapters,
    SUM(ch.word_count) AS total_words
FROM {SCHEMA}.phases p
LEFT JOIN {SCHEMA}.volumes v ON v.phase_id = p.id
LEFT JOIN {SCHEMA}.chapters ch ON ch.volume_id = v.id
GROUP BY p.id, p.phase_number, p.title
ORDER BY p.phase_number;

-- 未解决伏笔视图：显示所有未回收的伏笔
CREATE OR REPLACE VIEW {SCHEMA}.open_foreshadowing AS
SELECT
    f.code, f.description, f.status,
    ch.chapter_number AS planted_at,
    ch.time_in_story AS planted_time,
    f.note
FROM {SCHEMA}.foreshadowing f
JOIN {SCHEMA}.chapters ch ON f.planted_chapter_id = ch.id
WHERE f.status IN ('planted', 'hinted', 'partially_resolved')
ORDER BY ch.chapter_number;

-- 角色总览视图：显示所有角色的状态和在各卷的位置
CREATE OR REPLACE VIEW {SCHEMA}.character_overview AS
SELECT
    c.name, c.role_type, c.status,
    cs.location, cs.state_summary, cs.last_appearance,
    v.vol_number, v.title AS volume_title
FROM {SCHEMA}.characters c
LEFT JOIN {SCHEMA}.character_states cs ON c.id = cs.character_id
LEFT JOIN {SCHEMA}.volumes v ON cs.volume_id = v.id
ORDER BY c.name, v.vol_number;

-- 当前背包视图：显示主角当前持有的物品
CREATE OR REPLACE VIEW {SCHEMA}.current_inventory AS
SELECT item_name, item_type, quantity, quality, description, acquired_chapter
FROM {SCHEMA}.protagonist_inventory
WHERE status = 'held'
ORDER BY item_type, item_name;

-- 技能总览视图：显示所有技能的概览信息及使用统计
CREATE OR REPLACE VIEW {SCHEMA}.skill_overview AS
SELECT s.skill_name, s.skill_category, s.skill_level, s.status,
       s.acquired_chapter, s.use_count,
       COUNT(e.id) AS total_events
FROM {SCHEMA}.protagonist_skills s
LEFT JOIN {SCHEMA}.protagonist_skill_events e ON s.id = e.skill_id
GROUP BY s.id
ORDER BY s.skill_category, s.acquired_chapter;

-- 修炼进度曲线视图：按章节展示修炼进度变化
CREATE OR REPLACE VIEW {SCHEMA}.cultivation_curve AS
SELECT chapter_number, level, progress_pct, breakthrough_type, trigger
FROM {SCHEMA}.protagonist_cultivation
ORDER BY chapter_number;

-- ============================================================
-- 视图的中文注释（COMMENT ON）
-- ============================================================

-- writing_dashboard 视图注释
COMMENT ON VIEW {SCHEMA}.writing_dashboard IS '写作仪表盘：按纪元统计卷、章节、字数等汇总信息';
COMMENT ON COLUMN {SCHEMA}.writing_dashboard.phase_number IS '纪元编号';
COMMENT ON COLUMN {SCHEMA}.writing_dashboard.phase_title IS '纪元标题';
COMMENT ON COLUMN {SCHEMA}.writing_dashboard.total_volumes IS '总卷数';
COMMENT ON COLUMN {SCHEMA}.writing_dashboard.completed_volumes IS '已完成卷数';
COMMENT ON COLUMN {SCHEMA}.writing_dashboard.total_chapters IS '总章节数';
COMMENT ON COLUMN {SCHEMA}.writing_dashboard.final_chapters IS '定稿章节数';
COMMENT ON COLUMN {SCHEMA}.writing_dashboard.synopsis_chapters IS '已写梗概章节数';
COMMENT ON COLUMN {SCHEMA}.writing_dashboard.total_words IS '总字数';

-- open_foreshadowing 视图注释
COMMENT ON VIEW {SCHEMA}.open_foreshadowing IS '未解决伏笔：显示所有未回收的伏笔';
COMMENT ON COLUMN {SCHEMA}.open_foreshadowing.code IS '伏笔编码';
COMMENT ON COLUMN {SCHEMA}.open_foreshadowing.description IS '伏笔描述';
COMMENT ON COLUMN {SCHEMA}.open_foreshadowing.status IS '伏笔状态';
COMMENT ON COLUMN {SCHEMA}.open_foreshadowing.planted_at IS '埋设章节号';
COMMENT ON COLUMN {SCHEMA}.open_foreshadowing.planted_time IS '埋设时间';
COMMENT ON COLUMN {SCHEMA}.open_foreshadowing.note IS '备注';

-- character_overview 视图注释
COMMENT ON VIEW {SCHEMA}.character_overview IS '角色总览：显示所有角色的状态和在各卷的位置';
COMMENT ON COLUMN {SCHEMA}.character_overview.name IS '角色名称';
COMMENT ON COLUMN {SCHEMA}.character_overview.role_type IS '角色类型';
COMMENT ON COLUMN {SCHEMA}.character_overview.status IS '角色状态';
COMMENT ON COLUMN {SCHEMA}.character_overview.location IS '所在位置';
COMMENT ON COLUMN {SCHEMA}.character_overview.state_summary IS '状态摘要';
COMMENT ON COLUMN {SCHEMA}.character_overview.last_appearance IS '最后登场章节';
COMMENT ON COLUMN {SCHEMA}.character_overview.vol_number IS '卷号';
COMMENT ON COLUMN {SCHEMA}.character_overview.volume_title IS '卷标题';

-- current_inventory 视图注释
COMMENT ON VIEW {SCHEMA}.current_inventory IS '当前背包：显示主角当前持有的物品';
COMMENT ON COLUMN {SCHEMA}.current_inventory.item_name IS '物品名称';
COMMENT ON COLUMN {SCHEMA}.current_inventory.item_type IS '物品类型';
COMMENT ON COLUMN {SCHEMA}.current_inventory.quantity IS '数量';
COMMENT ON COLUMN {SCHEMA}.current_inventory.quality IS '品质';
COMMENT ON COLUMN {SCHEMA}.current_inventory.description IS '物品描述';
COMMENT ON COLUMN {SCHEMA}.current_inventory.acquired_chapter IS '获得章节';

-- skill_overview 视图注释
COMMENT ON VIEW {SCHEMA}.skill_overview IS '技能总览：显示所有技能的概览信息及使用统计';
COMMENT ON COLUMN {SCHEMA}.skill_overview.skill_name IS '技能名称';
COMMENT ON COLUMN {SCHEMA}.skill_overview.skill_category IS '技能分类';
COMMENT ON COLUMN {SCHEMA}.skill_overview.skill_level IS '技能等级';
COMMENT ON COLUMN {SCHEMA}.skill_overview.status IS '技能状态';
COMMENT ON COLUMN {SCHEMA}.skill_overview.acquired_chapter IS '获得章节';
COMMENT ON COLUMN {SCHEMA}.skill_overview.use_count IS '使用次数';
COMMENT ON COLUMN {SCHEMA}.skill_overview.total_events IS '事件总数';

-- cultivation_curve 视图注释
COMMENT ON VIEW {SCHEMA}.cultivation_curve IS '修炼进度曲线：按章节展示修炼进度变化';
COMMENT ON COLUMN {SCHEMA}.cultivation_curve.chapter_number IS '章节号';
COMMENT ON COLUMN {SCHEMA}.cultivation_curve.level IS '修炼等级';
COMMENT ON COLUMN {SCHEMA}.cultivation_curve.progress_pct IS '进度百分比';
COMMENT ON COLUMN {SCHEMA}.cultivation_curve.breakthrough_type IS '突破类型';
COMMENT ON COLUMN {SCHEMA}.cultivation_curve.trigger IS '触发原因';
"""


def run():
    config = load_config()
    db_config = get_db_config(config)
    conn = psycopg2.connect(**db_config)
    conn.autocommit = False
    cur = conn.cursor()

    # ── Step 1: 建表 ──
    print("[1/3] 创建 schema + 20 张表...")
    cur.execute(DDL)
    conn.commit()
    print("      ✓ 表结构创建完成")

    # ── Step 2: 创建视图 ──
    print("[2/3] 创建常用视图...")
    cur.execute(VIEWS)
    conn.commit()
    print("      ✓ 6 个视图创建完成")

    # ── Step 3: 验证 ──
    print("\n[3/3] 验证表结构...")
    cur.execute(f"""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = '{SCHEMA}' AND table_type = 'BASE TABLE'
        ORDER BY table_name
    """)
    tables = [row[0] for row in cur.fetchall()]
    print(f"      ✓ {len(tables)} 张表创建成功: {', '.join(tables)}")

    cur.close()
    conn.close()

    print(f"\n✅ 数据库初始化完成 (schema: {SCHEMA})")
    print("   下一步: 运行 python scripts/db_sync.py --all 导入 tracking 数据")


def main():
    import argparse
    parser = argparse.ArgumentParser(description="小说数据库初始化 — 建表 + 视图")
    parser.add_argument("--seed", action="store_true", help="建表后自动运行 db_sync.py --all")
    args = parser.parse_args()

    run()

    if args.seed:
        print("\n--- 自动导入数据 ---")
        sync_script = os.path.join(BASE, "scripts", "db_sync.py")
        subprocess.run([sys.executable, sync_script, "--all"], check=True)


if __name__ == "__main__":
    main()
