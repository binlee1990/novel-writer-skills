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
-- ============================================================
-- 主角相关表结构（5张表）
-- Schema: {SCHEMA}
-- ============================================================

-- 主角技能主表
-- 说明：记录主角学会的所有技能
CREATE TABLE IF NOT EXISTS {SCHEMA}.protagonist_skills (
    id                      SERIAL PRIMARY KEY,
    skill_name              VARCHAR(100) NOT NULL UNIQUE,  -- 技能名称（唯一）
    skill_category          VARCHAR(20) NOT NULL,           -- 技能分类：账本脑/符/阵/被动/功法等
    skill_level             VARCHAR(50),                   -- 技能等级：入门/固化/小成/大成
    parent_skill_id         INT REFERENCES {SCHEMA}.protagonist_skills(id),  -- 父技能ID（技能树）
    description             TEXT,                          -- 技能描述/效果说明
    acquired_chapter        INT NOT NULL,                  -- 获得章节号
    acquired_method         VARCHAR(200),                  -- 获得方式：自悟/修炼突破/副本掉落/交易等
    last_used_chapter      INT,                           -- 最后使用章节号
    use_count               INT DEFAULT 0,                -- 使用次数
    status                  VARCHAR(20) DEFAULT 'active'   -- 状态：active(可用)/locked(锁定)/forgotten(遗忘)
);

-- 技能时序表
-- 说明：记录技能的每次使用/变化事件
CREATE TABLE IF NOT EXISTS {SCHEMA}.protagonist_skill_events (
    id                      SERIAL PRIMARY KEY,
    skill_id                INT NOT NULL REFERENCES {SCHEMA}.protagonist_skills(id),        -- 技能ID
    chapter_number          INT NOT NULL,                  -- 事件发生章节号
    event_type              VARCHAR(30) NOT NULL,           -- 事件类型：acquired(获得)/upgraded(升级)/used(使用)/forgotten(遗忘)
    detail                  TEXT,                          -- 事件详情
    volume_id               INT NOT NULL REFERENCES {SCHEMA}.volumes(id)                 -- 所属卷ID
);

-- 主角装备/道具主表
-- 说明：记录主角当前拥有的所有物品
CREATE TABLE IF NOT EXISTS {SCHEMA}.protagonist_inventory (
    id                      SERIAL PRIMARY KEY,
    item_name               VARCHAR(100) NOT NULL,          -- 物品名称
    item_type               VARCHAR(30) NOT NULL,           -- 物品类型：装备/材料/消耗品/工具
    quantity                INT DEFAULT 1,                 -- 数量
    quality                 VARCHAR(30),                   -- 品质：普通/稀有/精良/史诗/传说
    description             TEXT,                          -- 物品描述
    acquired_chapter        INT NOT NULL,                  -- 获得章节号
    acquired_method         VARCHAR(200),                  -- 获得方式：拾取/交易/制作/副本掉落
    status                  VARCHAR(20) DEFAULT 'held',     -- 状态：held(持有)/consumed(已消耗)/equipped(装备中)
    UNIQUE(item_name, acquired_chapter)                 -- 同一物品同名只能有一条记录
);

-- 道具时序表
-- 说明：记录物品的获取、使用、消耗等事件
CREATE TABLE IF NOT EXISTS {SCHEMA}.protagonist_inventory_events (
    id                      SERIAL PRIMARY KEY,
    item_id                 INT NOT NULL REFERENCES {SCHEMA}.protagonist_inventory(id),      -- 物品ID
    chapter_number          INT NOT NULL,                  -- 事件发生章节号
    event_type              VARCHAR(30) NOT NULL,           -- 事件类型：acquired(获得)/used(使用)/lost(丢失)/given(赠予)
    quantity_change         INT DEFAULT 0,                 -- 数量变化（正数增加，负数减少）
    detail                  TEXT,                          -- 事件详情
    volume_id               INT NOT NULL REFERENCES {SCHEMA}.volumes(id)                 -- 所属卷ID
);

-- 修炼进度表
-- 说明：记录主角的修炼突破历程
CREATE TABLE IF NOT EXISTS {SCHEMA}.protagonist_cultivation (
    id                      SERIAL PRIMARY KEY,
    chapter_number          INT NOT NULL,                  -- 记录发生的章节号
    level                   VARCHAR(50) NOT NULL,          -- 修炼等级/境界（如：段1·炼气前期）
    progress_pct            DECIMAL(5,1),                  -- 进度百分比（0-100）
    breakthrough_type       VARCHAR(20),                   -- 突破类型：major(大境界突破)/minor(小境界提升)
    trigger                 VARCHAR(200),                  -- 触发原因：修炼突破/副本战斗/特殊事件
    detail                  TEXT,                          -- 详情描述
    volume_id               INT NOT NULL REFERENCES {SCHEMA}.volumes(id)                 -- 所属卷ID
);

-- ============================================================
-- 索引（提升查询性能）
-- ============================================================

-- 技能相关索引
CREATE INDEX IF NOT EXISTS idx_skills_category ON {SCHEMA}.protagonist_skills(skill_category);             -- 按技能分类查询
CREATE INDEX IF NOT EXISTS idx_skills_status ON {SCHEMA}.protagonist_skills(status);                   -- 按状态查询技能
CREATE INDEX IF NOT EXISTS idx_skill_events_skill ON {SCHEMA}.protagonist_skill_events(skill_id);       -- 按技能查询事件
CREATE INDEX IF NOT EXISTS idx_skill_events_vol ON {SCHEMA}.protagonist_skill_events(volume_id);         -- 按卷查询技能事件
CREATE INDEX IF NOT EXISTS idx_skill_events_type ON {SCHEMA}.protagonist_skill_events(event_type);      -- 按事件类型查询

-- 背包相关索引
CREATE INDEX IF NOT EXISTS idx_inventory_type ON {SCHEMA}.protagonist_inventory(item_type);               -- 按物品类型查询
CREATE INDEX IF NOT EXISTS idx_inventory_status ON {SCHEMA}.protagonist_inventory(status);                 -- 按状态查询背包
CREATE INDEX IF NOT EXISTS idx_inv_events_item ON {SCHEMA}.protagonist_inventory_events(item_id);        -- 按物品查询事件
CREATE INDEX IF NOT EXISTS idx_inv_events_vol ON {SCHEMA}.protagonist_inventory_events(volume_id);        -- 按卷查询背包事件

-- 修炼进度索引
CREATE INDEX IF NOT EXISTS idx_cultivation_vol ON {SCHEMA}.protagonist_cultivation(volume_id);            -- 按卷查询修炼进度
CREATE INDEX IF NOT EXISTS idx_cultivation_ch ON {SCHEMA}.protagonist_cultivation(chapter_number);         -- 按章节查询修炼进度

-- ============================================================
-- 视图（常用查询）
-- ============================================================

-- 当前持有物品视图：显示主角当前背包中的所有物品
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
-- 表和字段的中文注释（COMMENT ON）
-- ============================================================

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

-- ============================================================
-- 视图的中文注释（COMMENT ON）
-- ============================================================

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
