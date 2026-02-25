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
# DDL: 建 schema + 20 张核心表
# ─────────────────────────────────────────────
DDL = f"""
DROP SCHEMA IF EXISTS {SCHEMA} CASCADE;
CREATE SCHEMA {SCHEMA};

-- 1) phases: 纪元
CREATE TABLE {SCHEMA}.phases (
    id              SERIAL PRIMARY KEY,
    phase_number    INT NOT NULL UNIQUE,
    title           VARCHAR(100) NOT NULL,
    theme           VARCHAR(200),
    vol_start       INT NOT NULL,
    vol_end         INT NOT NULL,
    protagonist_level_start VARCHAR(50),
    protagonist_level_end   VARCHAR(50),
    stage_level     VARCHAR(50),
    growth_keyword  VARCHAR(200),
    core_conflict   TEXT,
    status          VARCHAR(20) DEFAULT 'planned'
);

-- 2) volumes: 卷
CREATE TABLE {SCHEMA}.volumes (
    id              SERIAL PRIMARY KEY,
    phase_id        INT NOT NULL REFERENCES {SCHEMA}.phases(id),
    vol_number      INT NOT NULL UNIQUE,
    title           VARCHAR(200) NOT NULL,
    arc_type        VARCHAR(50),
    instance_name   VARCHAR(100),
    instance_type   VARCHAR(100),
    instance_level  VARCHAR(50),
    protagonist_level_range VARCHAR(100),
    chapter_count   INT DEFAULT 100,
    outline_path    TEXT,
    summary_path    TEXT,
    status          VARCHAR(20) DEFAULT 'planned'
);

-- 3) chapters: 章节
CREATE TABLE {SCHEMA}.chapters (
    id                      SERIAL PRIMARY KEY,
    volume_id               INT NOT NULL REFERENCES {SCHEMA}.volumes(id),
    chapter_number          INT NOT NULL,
    global_chapter_number   INT NOT NULL UNIQUE,
    title                   VARCHAR(300),
    synopsis_path           TEXT,
    content_path            TEXT,
    synopsis_summary        TEXT,
    synopsis_keywords       TEXT[],
    status                  VARCHAR(20) DEFAULT 'planned',
    word_count              INT DEFAULT 0,
    scene_location          VARCHAR(200),
    time_in_story           VARCHAR(200),
    pov_character           VARCHAR(100) DEFAULT '主角'
);

-- 4) characters: 角色主表
CREATE TABLE {SCHEMA}.characters (
    id                      SERIAL PRIMARY KEY,
    name                    VARCHAR(100) NOT NULL UNIQUE,
    aliases                 TEXT[],
    role_type               VARCHAR(50),
    first_appearance_vol    INT,
    first_appearance_ch     INT,
    cultivation_level       VARCHAR(100),
    faction                 VARCHAR(200),
    status                  VARCHAR(20) DEFAULT 'active'
);

-- 5) character_states: 角色状态快照（按卷）
CREATE TABLE {SCHEMA}.character_states (
    id              SERIAL PRIMARY KEY,
    character_id    INT NOT NULL REFERENCES {SCHEMA}.characters(id),
    volume_id       INT NOT NULL REFERENCES {SCHEMA}.volumes(id),
    cultivation_level VARCHAR(100),
    location        VARCHAR(200),
    state_summary   TEXT,
    last_appearance INT,
    UNIQUE(character_id, volume_id)
);

-- 6) plot_threads: 情节线
CREATE TABLE {SCHEMA}.plot_threads (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    thread_type     VARCHAR(50),
    status          VARCHAR(30) DEFAULT 'active',
    description     TEXT,
    start_volume_id INT REFERENCES {SCHEMA}.volumes(id),
    volume_id       INT REFERENCES {SCHEMA}.volumes(id),
    key_events      JSONB DEFAULT '[]'::jsonb
);

-- 7) foreshadowing: 伏笔
CREATE TABLE {SCHEMA}.foreshadowing (
    id                  SERIAL PRIMARY KEY,
    code                VARCHAR(20) UNIQUE,
    plot_thread_id      INT REFERENCES {SCHEMA}.plot_threads(id),
    description         TEXT NOT NULL,
    planted_chapter_id  INT REFERENCES {SCHEMA}.chapters(id),
    hinted_chapter_id   INT REFERENCES {SCHEMA}.chapters(id),
    resolved_chapter_id INT REFERENCES {SCHEMA}.chapters(id),
    status              VARCHAR(30) DEFAULT 'planted',
    importance          VARCHAR(20) DEFAULT 'major',
    note                TEXT
);

-- 8) chapter_foreshadowing: 伏笔×章节关联
CREATE TABLE {SCHEMA}.chapter_foreshadowing (
    id                  SERIAL PRIMARY KEY,
    foreshadowing_id    INT NOT NULL REFERENCES {SCHEMA}.foreshadowing(id),
    chapter_id          INT NOT NULL REFERENCES {SCHEMA}.chapters(id),
    action_type         VARCHAR(20) NOT NULL,
    UNIQUE(foreshadowing_id, chapter_id, action_type)
);

-- 9) chapter_participants: 章节×角色关联
CREATE TABLE {SCHEMA}.chapter_participants (
    id              SERIAL PRIMARY KEY,
    chapter_id      INT NOT NULL REFERENCES {SCHEMA}.chapters(id),
    character_id    INT NOT NULL REFERENCES {SCHEMA}.characters(id),
    role_in_chapter VARCHAR(50),
    UNIQUE(chapter_id, character_id)
);

-- 10) relationships: 角色关系
CREATE TABLE {SCHEMA}.relationships (
    id                  SERIAL PRIMARY KEY,
    character_a_id      INT NOT NULL REFERENCES {SCHEMA}.characters(id),
    character_b_id      INT NOT NULL REFERENCES {SCHEMA}.characters(id),
    relationship_type   VARCHAR(100),
    current_status      TEXT,
    note                TEXT,
    last_update_chapter INT,
    volume_id           INT REFERENCES {SCHEMA}.volumes(id),
    UNIQUE(character_a_id, character_b_id, volume_id)
);

-- 11) timeline_events: 时间线
CREATE TABLE {SCHEMA}.timeline_events (
    id              SERIAL PRIMARY KEY,
    chapter_id      INT NOT NULL REFERENCES {SCHEMA}.chapters(id),
    event_description TEXT NOT NULL,
    story_time      VARCHAR(200),
    location        VARCHAR(200),
    tags            TEXT[] DEFAULT '{{}}',
    volume_id       INT NOT NULL REFERENCES {SCHEMA}.volumes(id)
);

-- 12) cross_volume_refs: 跨卷引用
CREATE TABLE {SCHEMA}.cross_volume_refs (
    id                  SERIAL PRIMARY KEY,
    source_chapter_id   INT NOT NULL REFERENCES {SCHEMA}.chapters(id),
    target_chapter_id   INT NOT NULL REFERENCES {SCHEMA}.chapters(id),
    ref_type            VARCHAR(50),
    description         TEXT
);

-- 13) character_key_changes: 角色章级变更历史
CREATE TABLE {SCHEMA}.character_key_changes (
    id              SERIAL PRIMARY KEY,
    character_id    INT NOT NULL REFERENCES {SCHEMA}.characters(id),
    chapter_number  INT NOT NULL,
    change_desc     TEXT NOT NULL,
    volume_id       INT NOT NULL REFERENCES {SCHEMA}.volumes(id)
);

-- 14) relationship_history: 关系变迁历史
CREATE TABLE {SCHEMA}.relationship_history (
    id              SERIAL PRIMARY KEY,
    relationship_id INT NOT NULL REFERENCES {SCHEMA}.relationships(id),
    chapter_number  INT NOT NULL,
    status_desc     TEXT NOT NULL,
    volume_id       INT NOT NULL REFERENCES {SCHEMA}.volumes(id)
);

-- 15) plot_thread_events: 情节线关键事件（展开表）
CREATE TABLE {SCHEMA}.plot_thread_events (
    id              SERIAL PRIMARY KEY,
    plot_thread_id  INT NOT NULL REFERENCES {SCHEMA}.plot_threads(id),
    chapter_number  INT NOT NULL,
    event_desc      TEXT NOT NULL,
    volume_id       INT NOT NULL REFERENCES {SCHEMA}.volumes(id)
);

-- 索引
CREATE INDEX idx_chapters_volume ON {SCHEMA}.chapters(volume_id);
CREATE INDEX idx_chapters_global ON {SCHEMA}.chapters(global_chapter_number);
CREATE INDEX idx_char_states_vol ON {SCHEMA}.character_states(volume_id);
CREATE INDEX idx_foreshadowing_status ON {SCHEMA}.foreshadowing(status);
CREATE INDEX idx_timeline_chapter ON {SCHEMA}.timeline_events(chapter_id);
CREATE INDEX idx_timeline_tags ON {SCHEMA}.timeline_events USING GIN(tags);
CREATE INDEX idx_plot_threads_status ON {SCHEMA}.plot_threads(status);
CREATE INDEX idx_plot_threads_vol ON {SCHEMA}.plot_threads(volume_id);
CREATE INDEX idx_char_key_changes_char ON {SCHEMA}.character_key_changes(character_id);
CREATE INDEX idx_char_key_changes_vol ON {SCHEMA}.character_key_changes(volume_id);
CREATE INDEX idx_rel_history_rel ON {SCHEMA}.relationship_history(relationship_id);
CREATE INDEX idx_rel_history_vol ON {SCHEMA}.relationship_history(volume_id);
CREATE INDEX idx_plot_events_thread ON {SCHEMA}.plot_thread_events(plot_thread_id);
CREATE INDEX idx_plot_events_vol ON {SCHEMA}.plot_thread_events(volume_id);

-- 16) protagonist_skills: 主角技能主表
CREATE TABLE {SCHEMA}.protagonist_skills (
    id              SERIAL PRIMARY KEY,
    skill_name      VARCHAR(100) NOT NULL UNIQUE,
    skill_category  VARCHAR(20) NOT NULL,
    skill_level     VARCHAR(50),
    parent_skill_id INT REFERENCES {SCHEMA}.protagonist_skills(id),
    description     TEXT,
    acquired_chapter INT NOT NULL,
    acquired_method  VARCHAR(200),
    last_used_chapter INT,
    use_count        INT DEFAULT 0,
    status           VARCHAR(20) DEFAULT 'active'
);

-- 17) protagonist_skill_events: 技能时序表
CREATE TABLE {SCHEMA}.protagonist_skill_events (
    id              SERIAL PRIMARY KEY,
    skill_id        INT NOT NULL REFERENCES {SCHEMA}.protagonist_skills(id),
    chapter_number  INT NOT NULL,
    event_type      VARCHAR(30) NOT NULL,
    detail          TEXT,
    volume_id       INT NOT NULL REFERENCES {SCHEMA}.volumes(id)
);

-- 18) protagonist_inventory: 装备/道具主表
CREATE TABLE {SCHEMA}.protagonist_inventory (
    id              SERIAL PRIMARY KEY,
    item_name       VARCHAR(100) NOT NULL,
    item_type       VARCHAR(30) NOT NULL,
    quantity        INT DEFAULT 1,
    quality         VARCHAR(30),
    description     TEXT,
    acquired_chapter INT NOT NULL,
    acquired_method  VARCHAR(200),
    status           VARCHAR(20) DEFAULT 'held',
    UNIQUE(item_name, acquired_chapter)
);

-- 19) protagonist_inventory_events: 道具时序表
CREATE TABLE {SCHEMA}.protagonist_inventory_events (
    id              SERIAL PRIMARY KEY,
    item_id         INT NOT NULL REFERENCES {SCHEMA}.protagonist_inventory(id),
    chapter_number  INT NOT NULL,
    event_type      VARCHAR(30) NOT NULL,
    quantity_change  INT DEFAULT 0,
    detail          TEXT,
    volume_id       INT NOT NULL REFERENCES {SCHEMA}.volumes(id)
);

-- 20) protagonist_cultivation: 修炼进度表
CREATE TABLE {SCHEMA}.protagonist_cultivation (
    id              SERIAL PRIMARY KEY,
    chapter_number  INT NOT NULL,
    level           VARCHAR(50) NOT NULL,
    progress_pct    DECIMAL(5,1),
    breakthrough_type VARCHAR(20),
    trigger         VARCHAR(200),
    detail          TEXT,
    volume_id       INT NOT NULL REFERENCES {SCHEMA}.volumes(id)
);

-- protagonist 索引
CREATE INDEX idx_skills_category ON {SCHEMA}.protagonist_skills(skill_category);
CREATE INDEX idx_skills_status ON {SCHEMA}.protagonist_skills(status);
CREATE INDEX idx_skill_events_skill ON {SCHEMA}.protagonist_skill_events(skill_id);
CREATE INDEX idx_skill_events_vol ON {SCHEMA}.protagonist_skill_events(volume_id);
CREATE INDEX idx_skill_events_type ON {SCHEMA}.protagonist_skill_events(event_type);
CREATE INDEX idx_inventory_type ON {SCHEMA}.protagonist_inventory(item_type);
CREATE INDEX idx_inventory_status ON {SCHEMA}.protagonist_inventory(status);
CREATE INDEX idx_inv_events_item ON {SCHEMA}.protagonist_inventory_events(item_id);
CREATE INDEX idx_inv_events_vol ON {SCHEMA}.protagonist_inventory_events(volume_id);
CREATE INDEX idx_cultivation_vol ON {SCHEMA}.protagonist_cultivation(volume_id);
CREATE INDEX idx_cultivation_ch ON {SCHEMA}.protagonist_cultivation(chapter_number);
"""

VIEWS = f"""
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

CREATE OR REPLACE VIEW {SCHEMA}.character_overview AS
SELECT
    c.name, c.role_type, c.status,
    cs.location, cs.state_summary, cs.last_appearance,
    v.vol_number, v.title AS volume_title
FROM {SCHEMA}.characters c
LEFT JOIN {SCHEMA}.character_states cs ON c.id = cs.character_id
LEFT JOIN {SCHEMA}.volumes v ON cs.volume_id = v.id
ORDER BY c.name, v.vol_number;

CREATE OR REPLACE VIEW {SCHEMA}.current_inventory AS
SELECT item_name, item_type, quantity, quality, description, acquired_chapter
FROM {SCHEMA}.protagonist_inventory
WHERE status = 'held'
ORDER BY item_type, item_name;

CREATE OR REPLACE VIEW {SCHEMA}.skill_overview AS
SELECT s.skill_name, s.skill_category, s.skill_level, s.status,
       s.acquired_chapter, s.use_count,
       COUNT(e.id) AS total_events
FROM {SCHEMA}.protagonist_skills s
LEFT JOIN {SCHEMA}.protagonist_skill_events e ON s.id = e.skill_id
GROUP BY s.id
ORDER BY s.skill_category, s.acquired_chapter;

CREATE OR REPLACE VIEW {SCHEMA}.cultivation_curve AS
SELECT chapter_number, level, progress_pct, breakthrough_type, trigger
FROM {SCHEMA}.protagonist_cultivation
ORDER BY chapter_number;
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
