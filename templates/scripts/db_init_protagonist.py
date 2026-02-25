#!/usr/bin/env python3
"""db_init_protagonist.py — 主角数据表初始化 + 首次导入

用法:
    python scripts/db_init_protagonist.py          # 建表 + 导入 vol-001~003
    python scripts/db_init_protagonist.py --ddl     # 仅建表
"""

import argparse
import json
import os
import sys
import psycopg2

sys.stdout.reconfigure(encoding='utf-8')

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


DDL = f"""
-- 主角技能主表
CREATE TABLE IF NOT EXISTS {SCHEMA}.protagonist_skills (
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

-- 技能时序表
CREATE TABLE IF NOT EXISTS {SCHEMA}.protagonist_skill_events (
    id              SERIAL PRIMARY KEY,
    skill_id        INT NOT NULL REFERENCES {SCHEMA}.protagonist_skills(id),
    chapter_number  INT NOT NULL,
    event_type      VARCHAR(30) NOT NULL,
    detail          TEXT,
    volume_id       INT NOT NULL REFERENCES {SCHEMA}.volumes(id)
);

-- 装备/道具主表
CREATE TABLE IF NOT EXISTS {SCHEMA}.protagonist_inventory (
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

-- 道具时序表
CREATE TABLE IF NOT EXISTS {SCHEMA}.protagonist_inventory_events (
    id              SERIAL PRIMARY KEY,
    item_id         INT NOT NULL REFERENCES {SCHEMA}.protagonist_inventory(id),
    chapter_number  INT NOT NULL,
    event_type      VARCHAR(30) NOT NULL,
    quantity_change  INT DEFAULT 0,
    detail          TEXT,
    volume_id       INT NOT NULL REFERENCES {SCHEMA}.volumes(id)
);

-- 修炼进度表
CREATE TABLE IF NOT EXISTS {SCHEMA}.protagonist_cultivation (
    id              SERIAL PRIMARY KEY,
    chapter_number  INT NOT NULL,
    level           VARCHAR(50) NOT NULL,
    progress_pct    DECIMAL(5,1),
    breakthrough_type VARCHAR(20),
    trigger         VARCHAR(200),
    detail          TEXT,
    volume_id       INT NOT NULL REFERENCES {SCHEMA}.volumes(id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_skills_category ON {SCHEMA}.protagonist_skills(skill_category);
CREATE INDEX IF NOT EXISTS idx_skills_status ON {SCHEMA}.protagonist_skills(status);
CREATE INDEX IF NOT EXISTS idx_skill_events_skill ON {SCHEMA}.protagonist_skill_events(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_events_vol ON {SCHEMA}.protagonist_skill_events(volume_id);
CREATE INDEX IF NOT EXISTS idx_skill_events_type ON {SCHEMA}.protagonist_skill_events(event_type);
CREATE INDEX IF NOT EXISTS idx_inventory_type ON {SCHEMA}.protagonist_inventory(item_type);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON {SCHEMA}.protagonist_inventory(status);
CREATE INDEX IF NOT EXISTS idx_inv_events_item ON {SCHEMA}.protagonist_inventory_events(item_id);
CREATE INDEX IF NOT EXISTS idx_inv_events_vol ON {SCHEMA}.protagonist_inventory_events(volume_id);
CREATE INDEX IF NOT EXISTS idx_cultivation_vol ON {SCHEMA}.protagonist_cultivation(volume_id);
CREATE INDEX IF NOT EXISTS idx_cultivation_ch ON {SCHEMA}.protagonist_cultivation(chapter_number);

-- 视图
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

# ── 技能数据（vol-001~003） ──
# (skill_name, skill_category, skill_level, parent_skill_id, description,
#  acquired_chapter, acquired_method, status)
SKILLS_DATA = [
    # vol-001
    ("账本脑", "账本脑", "入门", None, "数据化思维，信息分类归档", 1, "铜盘觉醒", "active"),
    ("分解功能", "账本脑", "入门", None, "铜盘分解灵材", 40, "铜盘解锁", "active"),
    ("灵气感知", "被动", "入门", None, "灵气初步感知能力", 49, "自悟", "active"),
    ("定身符", "符", "入门", None, "3秒静止效果", 68, "修炼突破", "active"),
    # vol-002
    ("P0轮回仓应急", "账本脑", "入门", None, "72小时冷却，副本内有效", 108, "铜盘解锁", "active"),
    ("灵气内敛", "被动", "入门", None, "压制灵气外泄，5分钟持续", 129, "修炼突破", "active"),
    ("伪装术", "被动", "固化", None, "禁忌乡伪装术固化为永久技能", 139, "副本掉落", "active"),
    ("假身符", "符", "入门", None, "8秒维持时间", 178, "修炼突破", "active"),
    # vol-003
    ("镜面系统", "阵", "入门", None, "镜面反射间接观察，规避视线类铁律", 215, "副本自创", "active"),
    ("Build雏形", "符", "入门", None, "陷阱链+符毒联动+镜面系统+假身符四系统联动", 240, "副本设计", "active"),
    ("镜杀阵", "阵", "入门", None, "用镜片反射诅咒实体目光回自身，以敌人规则反杀", 262, "副本实战", "active"),
]

# ── 修炼进度数据 ──
# (chapter_number, level, progress_pct, breakthrough_type, trigger, detail, vol_number)
CULTIVATION_DATA = [
    # vol-001
    (1, "段0", 0.0, "major", "铜盘觉醒", "铜盘激活，灵气初灌", 1),
    (49, "段0", 80.0, None, "修炼", "首次主动感知灵气", 1),
    (68, "段1·炼气前期", 0.0, "major", "修炼突破", "突破段1，画出第一张有共振的符纸", 1),
    # vol-002
    (154, "段1·炼气前期", 25.0, None, "修炼", "段1修炼进度达25%", 2),
    (182, "段1·炼气前期", 30.0, None, "画符修炼", "画符训练效率是纯打坐的三倍", 2),
    # vol-003
    (272, "段1·炼气前期", 35.0, None, "副本战斗", "超标副本高压环境促进修为", 3),
    (300, "段1·炼气前期", 37.8, None, "修炼", "卷3完结状态", 3),
]

# ── 道具数据 ──
# (item_name, item_type, quantity, quality, description,
#  acquired_chapter, acquired_method, status)
INVENTORY_DATA = [
    # vol-001
    ("短刃", "装备", 1, "普通", "来自前探索者补给点", 30, "拾取", "held"),
    ("铁丝绊索", "工具", 1, "普通", "陷阱材料", 30, "拾取", "held"),
    ("迷香", "消耗品", 1, "普通", "来自前探索者补给点", 30, "拾取", "consumed"),
    ("兽血", "材料", 1, "普通", "来自前探索者补给点", 30, "拾取", "consumed"),
    ("灵气结晶", "材料", 3, "普通", "蜂巢副本掉落", 40, "副本掉落", "consumed"),
    ("定身符纸成品", "消耗品", 6, "普通", "3秒静止效果", 68, "制作", "held"),
    # vol-002
    ("假身符纸成品", "消耗品", 2, "普通", "假身符成品（卷2末剩余）", 181, "制作", "held"),
    ("阴气结晶", "材料", 1, "稀有", "禁忌乡副本掉落", 139, "副本掉落", "held"),
    ("灵魂印记碎片", "材料", 1, "稀有", "用途待解锁", 139, "副本掉落", "held"),
    ("灵墨", "材料", 1, "普通", "画符用灵墨", 165, "交易", "held"),
    ("空白符纸", "材料", 10, "普通", "画符用空白符纸", 68, "交易", "held"),
    ("灵气压制符", "消耗品", 1, "精良", "压制灵气波动约六小时", 191, "交易", "consumed"),
    # vol-003
    ("镜面符材", "材料", 5, "稀有", "可制作反射观察符，规避视线类铁律", 268, "副本掉落", "held"),
    ("诅咒封存体（林安）", "材料", 1, "古纪级", "林安灵魂封存在轮回盘中，用途待解锁", 268, "副本掉落", "held"),
    ("灵魂印记碎片", "材料", 3, "稀有", "副本掉落累计（卷3新增）", 268, "副本掉落", "held"),
]


def get_vol_id(cur, vol_number):
    cur.execute(f"SELECT id FROM {SCHEMA}.volumes WHERE vol_number = %s", (vol_number,))
    row = cur.fetchone()
    if not row:
        raise ValueError(f"卷 {vol_number} 不存在于数据库中")
    return row[0]


def import_skills(cur):
    count = 0
    for s in SKILLS_DATA:
        name, cat, level, parent, desc, ch, method, status = s
        cur.execute(f"""
            INSERT INTO {SCHEMA}.protagonist_skills
                (skill_name, skill_category, skill_level, parent_skill_id,
                 description, acquired_chapter, acquired_method, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (skill_name) DO UPDATE SET
                skill_level = EXCLUDED.skill_level,
                status = EXCLUDED.status
            RETURNING id
        """, s)
        skill_id = cur.fetchone()[0]

        vol_num = 1 if ch <= 100 else (2 if ch <= 200 else 3)
        vol_id = get_vol_id(cur, vol_num)
        cur.execute(f"""
            INSERT INTO {SCHEMA}.protagonist_skill_events
                (skill_id, chapter_number, event_type, detail, volume_id)
            VALUES (%s, %s, 'acquired', %s, %s)
        """, (skill_id, ch, f"获得技能：{name}", vol_id))
        count += 1
    return count


def import_cultivation(cur):
    count = 0
    for c in CULTIVATION_DATA:
        ch, level, pct, bt, trigger, detail, vol_num = c
        vol_id = get_vol_id(cur, vol_num)
        cur.execute(f"""
            INSERT INTO {SCHEMA}.protagonist_cultivation
                (chapter_number, level, progress_pct, breakthrough_type,
                 trigger, detail, volume_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (ch, level, pct, bt, trigger, detail, vol_id))
        count += 1
    return count


def import_inventory(cur):
    count = 0
    for item in INVENTORY_DATA:
        name, itype, qty, quality, desc, ch, method, status = item
        vol_num = 1 if ch <= 100 else (2 if ch <= 200 else 3)
        vol_id = get_vol_id(cur, vol_num)
        cur.execute(f"""
            INSERT INTO {SCHEMA}.protagonist_inventory
                (item_name, item_type, quantity, quality, description,
                 acquired_chapter, acquired_method, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (item_name, acquired_chapter) DO UPDATE SET
                quantity = EXCLUDED.quantity,
                status = EXCLUDED.status
            RETURNING id
        """, item)
        item_id = cur.fetchone()[0]

        cur.execute(f"""
            INSERT INTO {SCHEMA}.protagonist_inventory_events
                (item_id, chapter_number, event_type, quantity_change, detail, volume_id)
            VALUES (%s, %s, 'acquired', %s, %s, %s)
        """, (item_id, ch, qty, f"获得：{name}", vol_id))
        count += 1
    return count


def run():
    parser = argparse.ArgumentParser(description="主角数据表初始化")
    parser.add_argument("--ddl", action="store_true", help="仅建表，不导入数据")
    args = parser.parse_args()

    config = load_config()
    db_config = get_db_config(config)
    conn = psycopg2.connect(**db_config)
    conn.autocommit = False
    cur = conn.cursor()

    try:
        print("[1/4] 创建主角数据表...")
        cur.execute(DDL)
        conn.commit()
        print("      5张表 + 索引 + 视图创建完成")

        if args.ddl:
            print("\nDDL 完成（仅建表模式）")
            return

        # 清空旧数据（幂等）
        print("[1.5] 清空旧数据（幂等重导）...")
        cur.execute(f"DELETE FROM {SCHEMA}.protagonist_skill_events")
        cur.execute(f"DELETE FROM {SCHEMA}.protagonist_inventory_events")
        cur.execute(f"DELETE FROM {SCHEMA}.protagonist_skills")
        cur.execute(f"DELETE FROM {SCHEMA}.protagonist_inventory")
        cur.execute(f"DELETE FROM {SCHEMA}.protagonist_cultivation")
        conn.commit()

        print("[2/4] 导入技能数据...")
        n = import_skills(cur)
        conn.commit()
        print(f"      {n} 条技能导入完成")

        print("[3/4] 导入修炼进度...")
        n = import_cultivation(cur)
        conn.commit()
        print(f"      {n} 条修炼记录导入完成")

        print("[4/4] 导入道具数据...")
        n = import_inventory(cur)
        conn.commit()
        print(f"      {n} 条道具导入完成")

        # 验证
        print("\n--- 数据验证 ---")
        for table, label in [
            (f"{SCHEMA}.protagonist_skills", "技能"),
            (f"{SCHEMA}.protagonist_skill_events", "技能事件"),
            (f"{SCHEMA}.protagonist_inventory", "道具"),
            (f"{SCHEMA}.protagonist_inventory_events", "道具事件"),
            (f"{SCHEMA}.protagonist_cultivation", "修炼进度"),
        ]:
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            count = cur.fetchone()[0]
            print(f"  {label:10s}: {count} 条")

        print("\n主角数据初始化完成")

    except Exception as e:
        conn.rollback()
        print(f"\n!!! 失败: {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    run()
