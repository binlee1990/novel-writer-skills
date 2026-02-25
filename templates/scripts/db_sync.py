#!/usr/bin/env python3
"""db_sync.py — 文件系统 tracking → PostgreSQL 同步器

用法:
    python scripts/db_sync.py --vol 1          # 同步单卷
    python scripts/db_sync.py --vol 1 --vol 2  # 同步多卷
    python scripts/db_sync.py --all             # 全量同步所有已有卷

幂等操作：可重复运行，基于 UPSERT 逻辑。
"""

import argparse
import json
import os
import re
import sys
import psycopg2
from psycopg2.extras import execute_values

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


def get_story_path(config):
    story_name = config.get("story", "")
    if not story_name:
        stories_dir = os.path.join(BASE, "stories")
        if os.path.isdir(stories_dir):
            dirs = [d for d in os.listdir(stories_dir)
                    if os.path.isdir(os.path.join(stories_dir, d))]
            if dirs:
                story_name = dirs[0]
    return os.path.join(BASE, "stories", story_name)


def load_json(path):
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_available_volumes(volumes_dir):
    """扫描 volumes 目录，返回有 tracking 数据的卷号列表"""
    vols = []
    if not os.path.isdir(volumes_dir):
        return vols
    for d in sorted(os.listdir(volumes_dir)):
        if d.startswith("vol-"):
            tracking_dir = os.path.join(volumes_dir, d, "tracking")
            if os.path.isdir(tracking_dir):
                vol_num = int(d.split("-")[1])
                vols.append(vol_num)
    return vols


def ensure_volume_exists(cur, vol_number):
    """确保卷在DB中存在，返回 volume_id"""
    cur.execute(f"SELECT id FROM {SCHEMA}.volumes WHERE vol_number = %s", (vol_number,))
    row = cur.fetchone()
    if row:
        return row[0]
    # 卷不存在，创建占位记录
    cur.execute(f"SELECT id FROM {SCHEMA}.phases WHERE vol_start <= %s AND vol_end >= %s", (vol_number, vol_number))
    phase_row = cur.fetchone()
    phase_id = phase_row[0] if phase_row else 1
    cur.execute(f"""
        INSERT INTO {SCHEMA}.volumes (phase_id, vol_number, title, status)
        VALUES (%s, %s, %s, 'planned')
        RETURNING id
    """, (phase_id, vol_number, f"vol-{vol_number:03d}"))
    return cur.fetchone()[0]


def ensure_chapter_exists(cur, vol_id, vol_number, ch_num):
    """确保章节在DB中存在，返回 chapter_id"""
    global_ch = (vol_number - 1) * 100 + ch_num
    cur.execute(f"SELECT id FROM {SCHEMA}.chapters WHERE global_chapter_number = %s", (global_ch,))
    row = cur.fetchone()
    if row:
        return row[0]
    cur.execute(f"""
        INSERT INTO {SCHEMA}.chapters (volume_id, chapter_number, global_chapter_number, status)
        VALUES (%s, %s, %s, 'planned')
        ON CONFLICT (global_chapter_number) DO UPDATE SET volume_id = EXCLUDED.volume_id
        RETURNING id
    """, (vol_id, ch_num, global_ch))
    return cur.fetchone()[0]


def ensure_character_exists(cur, name):
    """确保角色在DB中存在，返回 character_id"""
    cur.execute(f"SELECT id FROM {SCHEMA}.characters WHERE name = %s", (name,))
    row = cur.fetchone()
    if row:
        return row[0]
    cur.execute(f"""
        INSERT INTO {SCHEMA}.characters (name, role_type, status)
        VALUES (%s, 'unknown', 'active')
        RETURNING id
    """, (name,))
    return cur.fetchone()[0]


def sync_characters(cur, vol_id, vol_number, data):
    """同步 character-state.json"""
    if not data or "characters" not in data:
        return 0
    count = 0
    for c in data["characters"]:
        status_map = {"活跃": "active", "已死亡": "dead", "受伤退走": "active", "休眠": "dormant"}
        db_status = status_map.get(c.get("status", ""), c.get("status", "active"))

        # UPSERT 角色主表
        cur.execute(f"""
            INSERT INTO {SCHEMA}.characters (name, role_type, status, first_appearance_vol)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (name) DO UPDATE SET
                role_type = COALESCE(NULLIF(EXCLUDED.role_type, 'unknown'), {SCHEMA}.characters.role_type),
                status = EXCLUDED.status
            RETURNING id
        """, (c["name"], c.get("role", "unknown"), db_status, vol_number))
        char_id = cur.fetchone()[0]

        # UPSERT 角色状态快照
        cur.execute(f"""
            INSERT INTO {SCHEMA}.character_states (character_id, volume_id, location, state_summary, last_appearance)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (character_id, volume_id) DO UPDATE SET
                location = EXCLUDED.location,
                state_summary = EXCLUDED.state_summary,
                last_appearance = EXCLUDED.last_appearance
        """, (char_id, vol_id, c.get("location"), c.get("state"), c.get("lastAppearance")))

        # 同步角色章级变更历史（先删后插，幂等）
        cur.execute(f"""
            DELETE FROM {SCHEMA}.character_key_changes WHERE character_id = %s AND volume_id = %s
        """, (char_id, vol_id))
        for kc in c.get("keyChanges", []):
            cur.execute(f"""
                INSERT INTO {SCHEMA}.character_key_changes (character_id, chapter_number, change_desc, volume_id)
                VALUES (%s, %s, %s, %s)
            """, (char_id, kc["chapter"], kc["change"], vol_id))

        count += 1
    return count


def sync_plotlines(cur, vol_id, vol_number, data):
    """同步 plot-tracker.json 的情节线"""
    if not data or "plotlines" not in data:
        return 0
    count = 0
    for p in data["plotlines"]:
        key_events_json = json.dumps(p.get("keyEvents", []), ensure_ascii=False)
        cur.execute(f"SELECT id FROM {SCHEMA}.plot_threads WHERE name = %s AND volume_id = %s", (p["name"], vol_id))
        row = cur.fetchone()
        if row:
            tid = row[0]
            cur.execute(f"""
                UPDATE {SCHEMA}.plot_threads SET status = %s, description = %s, key_events = %s::jsonb
                WHERE id = %s
            """, (p["status"], p.get("description"), key_events_json, tid))
        else:
            cur.execute(f"""
                INSERT INTO {SCHEMA}.plot_threads (name, status, description, start_volume_id, volume_id, key_events)
                VALUES (%s, %s, %s, %s, %s, %s::jsonb)
                RETURNING id
            """, (p["name"], p["status"], p.get("description"), vol_id, vol_id, key_events_json))
            tid = cur.fetchone()[0]

        # 同步 plot_thread_events 展开表（先删后插，幂等）
        cur.execute(f"DELETE FROM {SCHEMA}.plot_thread_events WHERE plot_thread_id = %s AND volume_id = %s", (tid, vol_id))
        for ke in p.get("keyEvents", []):
            cur.execute(f"""
                INSERT INTO {SCHEMA}.plot_thread_events (plot_thread_id, chapter_number, event_desc, volume_id)
                VALUES (%s, %s, %s, %s)
            """, (tid, ke["chapter"], ke["event"], vol_id))

        count += 1
    return count


def sync_foreshadowing(cur, vol_id, vol_number, data):
    """同步 plot-tracker.json 的伏笔"""
    if not data or "foreshadowing" not in data:
        return 0
    count = 0
    for f in data["foreshadowing"]:
        planted_ch_id = None
        hinted_ch_id = None
        resolved_ch_id = None

        if f.get("plantedAt"):
            planted_ch_id = ensure_chapter_exists(cur, vol_id, vol_number, f["plantedAt"])
        if f.get("hintedAt"):
            hinted_ch_id = ensure_chapter_exists(cur, vol_id, vol_number, f["hintedAt"])
        if f.get("resolvedAt"):
            resolved_ch_id = ensure_chapter_exists(cur, vol_id, vol_number, f["resolvedAt"])

        cur.execute(f"SELECT id FROM {SCHEMA}.foreshadowing WHERE code = %s", (f["id"],))
        row = cur.fetchone()
        if row:
            cur.execute(f"""
                UPDATE {SCHEMA}.foreshadowing SET
                    description = %s, planted_chapter_id = %s, hinted_chapter_id = %s,
                    resolved_chapter_id = %s, status = %s, note = %s
                WHERE id = %s
            """, (f["content"], planted_ch_id, hinted_ch_id, resolved_ch_id,
                  f["status"], f.get("note"), row[0]))
            fs_id = row[0]
        else:
            cur.execute(f"""
                INSERT INTO {SCHEMA}.foreshadowing (code, description, planted_chapter_id,
                    hinted_chapter_id, resolved_chapter_id, status, note)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (f["id"], f["content"], planted_ch_id, hinted_ch_id, resolved_ch_id,
                  f["status"], f.get("note")))
            fs_id = cur.fetchone()[0]

        # 同步 chapter_foreshadowing 关联
        for ch_id, action in [(planted_ch_id, "plant"), (hinted_ch_id, "hint"), (resolved_ch_id, "resolve")]:
            if ch_id:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.chapter_foreshadowing (foreshadowing_id, chapter_id, action_type)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (foreshadowing_id, chapter_id, action_type) DO NOTHING
                """, (fs_id, ch_id, action))
        count += 1
    return count


def sync_relationships(cur, vol_id, vol_number, data):
    """同步 relationships.json"""
    if not data or "relationships" not in data:
        return 0

    # 先清除该卷的旧关系历史数据
    cur.execute(f"""
        DELETE FROM {SCHEMA}.relationship_history WHERE relationship_id IN (
            SELECT id FROM {SCHEMA}.relationships WHERE volume_id = %s
        )
    """, (vol_id,))
    # 再清除该卷的旧关系数据
    cur.execute(f"DELETE FROM {SCHEMA}.relationships WHERE volume_id = %s", (vol_id,))

    count = 0
    for r in data["relationships"]:
        a_id = ensure_character_exists(cur, r["from"])
        b_id = ensure_character_exists(cur, r["to"])

        # current_status 取 history 最后一条，note 独立存储
        last_status = r["history"][-1]["status"] if r.get("history") else r.get("note", "")
        cur.execute(f"""
            INSERT INTO {SCHEMA}.relationships (character_a_id, character_b_id, relationship_type,
                current_status, note, last_update_chapter, volume_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (a_id, b_id, r["type"], last_status, r.get("note"), r.get("lastUpdate"), vol_id))
        rel_id = cur.fetchone()[0]

        # 关系变迁历史
        for h in r.get("history", []):
            cur.execute(f"""
                INSERT INTO {SCHEMA}.relationship_history (relationship_id, chapter_number, status_desc, volume_id)
                VALUES (%s, %s, %s, %s)
            """, (rel_id, h["chapter"], h["status"], vol_id))

        count += 1
    return count


def sync_timeline(cur, vol_id, vol_number, data):
    """同步 timeline.json"""
    if not data or "events" not in data:
        return 0

    # 先清除该卷的旧时间线数据
    cur.execute(f"DELETE FROM {SCHEMA}.timeline_events WHERE volume_id = %s", (vol_id,))

    count = 0
    for ev in data["events"]:
        ch_id = ensure_chapter_exists(cur, vol_id, vol_number, ev["chapter"])

        # 同时更新章节的 time_in_story
        cur.execute(f"UPDATE {SCHEMA}.chapters SET time_in_story = %s WHERE id = %s", (ev.get("time"), ch_id))

        cur.execute(f"""
            INSERT INTO {SCHEMA}.timeline_events (chapter_id, event_description, story_time, tags, volume_id)
            VALUES (%s, %s, %s, %s, %s)
        """, (ch_id, ev["event"], ev.get("time"), ev.get("tags", []), vol_id))
        count += 1
    return count


def extract_synopsis_summary(fpath, max_len=120):
    """从概要文件提取摘要：标题 + 正文前N字"""
    with open(fpath, "r", encoding="utf-8") as fp:
        lines = fp.readlines()
    if not lines:
        return None

    # 第一行是标题 "# 第X章：标题"
    title = lines[0].strip().lstrip("# ").strip()

    # 提取正文（跳过标题和空行，排除末尾的元数据行）
    body_lines = []
    for line in lines[1:]:
        stripped = line.strip()
        if stripped.startswith("**出场角色**") or stripped.startswith("**情感走向**") or stripped.startswith("**章末钩子**"):
            break
        if stripped:
            body_lines.append(stripped)

    body = "".join(body_lines)
    # 截取前N字作为摘要
    body_preview = body[:max_len - len(title) - 3]  # 留空间给标题和分隔符
    if len(body) > len(body_preview):
        body_preview += "…"

    return f"{title}｜{body_preview}"


def sync_synopsis_files(cur, vol_id, vol_number, volumes_dir):
    """扫描概要文件，更新章节状态、路径和摘要"""
    content_dir = os.path.join(volumes_dir, f"vol-{vol_number:03d}", "content")
    if not os.path.isdir(content_dir):
        return 0
    count = 0
    for fname in os.listdir(content_dir):
        if fname.endswith("-synopsis.md"):
            ch_num = int(fname.split("-")[1])
            ch_id = ensure_chapter_exists(cur, vol_id, vol_number, ch_num)
            rel_path = f"volumes/vol-{vol_number:03d}/content/{fname}"
            fpath = os.path.join(content_dir, fname)
            summary = extract_synopsis_summary(fpath)
            cur.execute(f"""
                UPDATE {SCHEMA}.chapters SET synopsis_path = %s, synopsis_summary = %s,
                    status = CASE WHEN status = 'planned' THEN 'synopsis' ELSE status END
                WHERE id = %s
            """, (rel_path, summary, ch_id))
            count += 1
        elif fname.endswith(".md") and not fname.endswith("-synopsis.md"):
            # 正文文件
            ch_num = int(fname.split("-")[1].split(".")[0])
            ch_id = ensure_chapter_exists(cur, vol_id, vol_number, ch_num)
            rel_path = f"volumes/vol-{vol_number:03d}/content/{fname}"
            fpath = os.path.join(content_dir, fname)
            word_count = 0
            with open(fpath, "r", encoding="utf-8") as fp:
                word_count = len(fp.read())
            cur.execute(f"""
                UPDATE {SCHEMA}.chapters SET content_path = %s, word_count = %s,
                    status = CASE WHEN status IN ('planned','synopsis') THEN 'drafted' ELSE status END
                WHERE id = %s
            """, (rel_path, word_count, ch_id))
            count += 1
    return count


def verify_volume_metadata(cur, vol_number, vol_id, volumes_dir):
    """从 volume-outline.md 解析卷元数据，与 DB 比对，不一致时自动修正"""
    outline_path = os.path.join(volumes_dir, f"vol-{vol_number:03d}", "volume-outline.md")
    if not os.path.exists(outline_path):
        return

    with open(outline_path, "r", encoding="utf-8") as f:
        text = f.read(2000)  # 只需头部

    # 解析字段
    file_data = {}
    # 标题：第一行 # 卷N：XXX
    m = re.search(r"^# 卷\d+[：:]\s*(.+)$", text, re.MULTILINE)
    if m:
        file_data["title_from_file"] = m.group(1).strip()

    field_map = {
        "卷型": "arc_type",
        "副本名称": "instance_name",
        "副本类型": "instance_type",
        "副本等级": "instance_level",
    }
    for label, db_col in field_map.items():
        m = re.search(rf"- {label}[：:]\s*(.+)$", text, re.MULTILINE)
        if m:
            file_data[db_col] = m.group(1).strip()

    # 段位范围
    m = re.search(r"- 本卷段位范围[：:]\s*(.+)$", text, re.MULTILINE)
    if m:
        file_data["protagonist_level_range"] = m.group(1).strip()

    if not file_data:
        return

    # 读取 DB 当前值
    cur.execute(f"""
        SELECT title, arc_type, instance_name, instance_type, instance_level, protagonist_level_range
        FROM {SCHEMA}.volumes WHERE id = %s
    """, (vol_id,))
    row = cur.fetchone()
    if not row:
        return

    db_vals = {
        "title": row[0], "arc_type": row[1], "instance_name": row[2],
        "instance_type": row[3], "instance_level": row[4], "protagonist_level_range": row[5],
    }

    # 比对并修正
    fixes = {}
    if "title_from_file" in file_data:
        file_title = file_data["title_from_file"]
        if file_title not in (db_vals["title"] or ""):
            fixes["title"] = file_title

    for db_col in ["arc_type", "instance_name", "instance_type", "instance_level", "protagonist_level_range"]:
        if db_col in file_data and file_data[db_col] != (db_vals[db_col] or ""):
            fixes[db_col] = file_data[db_col]

    if fixes:
        set_clause = ", ".join(f"{k} = %s" for k in fixes)
        vals = list(fixes.values()) + [vol_id]
        cur.execute(f"UPDATE {SCHEMA}.volumes SET {set_clause} WHERE id = %s", vals)
        print(f"  ⚠️ 卷元数据校验：修正 {list(fixes.keys())}")
        for k, v in fixes.items():
            print(f"     {k}: {db_vals.get(k, '?')} → {v}")
    else:
        print(f"  ✅ 卷元数据校验通过")


def sync_volume(cur, vol_number, volumes_dir):
    """同步单卷的所有 tracking 数据"""
    vol_dir = os.path.join(volumes_dir, f"vol-{vol_number:03d}")
    tracking_dir = os.path.join(vol_dir, "tracking")

    print(f"\n--- vol-{vol_number:03d} ---")

    vol_id = ensure_volume_exists(cur, vol_number)

    # 校验卷元数据与 volume-outline.md 一致性
    verify_volume_metadata(cur, vol_number, vol_id, volumes_dir)

    # 同步角色
    char_data = load_json(os.path.join(tracking_dir, "character-state.json"))
    n = sync_characters(cur, vol_id, vol_number, char_data)
    # 统计 keyChanges 数量
    kc_count = 0
    if char_data and "characters" in char_data:
        for c in char_data["characters"]:
            kc_count += len(c.get("keyChanges", []))
    print(f"  角色: {n} 条, 变更历史: {kc_count} 条")

    # 同步情节线 + 伏笔
    plot_data = load_json(os.path.join(tracking_dir, "plot-tracker.json"))
    n1 = sync_plotlines(cur, vol_id, vol_number, plot_data)
    n2 = sync_foreshadowing(cur, vol_id, vol_number, plot_data)
    print(f"  情节线: {n1} 条, 伏笔: {n2} 条")

    # 同步关系
    rel_data = load_json(os.path.join(tracking_dir, "relationships.json"))
    n = sync_relationships(cur, vol_id, vol_number, rel_data)
    rh_count = 0
    if rel_data and "relationships" in rel_data:
        for r in rel_data["relationships"]:
            rh_count += len(r.get("history", []))
    print(f"  关系: {n} 条, 关系历史: {rh_count} 条")

    # 同步时间线
    tl_data = load_json(os.path.join(tracking_dir, "timeline.json"))
    n = sync_timeline(cur, vol_id, vol_number, tl_data)
    print(f"  时间线: {n} 条")

    # 同步概要/正文文件状态
    n = sync_synopsis_files(cur, vol_id, vol_number, volumes_dir)
    print(f"  文件状态: {n} 条")


def main():
    parser = argparse.ArgumentParser(description="文件系统 tracking -> DB 同步器")
    parser.add_argument("--vol", type=int, action="append", help="同步指定卷号（可多次指定）")
    parser.add_argument("--all", action="store_true", help="同步所有已有卷")
    args = parser.parse_args()

    if not args.vol and not args.all:
        print("用法: python db_sync.py --vol 1 或 --all")
        sys.exit(1)

    config = load_config()
    db_config = get_db_config(config)
    story_path = get_story_path(config)
    volumes_dir = os.path.join(story_path, "volumes")

    vols = get_available_volumes(volumes_dir) if args.all else (args.vol or [])
    if not vols:
        print("未找到可同步的卷")
        sys.exit(1)

    print(f"=== db_sync: 同步 {len(vols)} 卷 ===")

    conn = psycopg2.connect(**db_config)
    conn.autocommit = False
    cur = conn.cursor()

    try:
        for vol_number in sorted(vols):
            sync_volume(cur, vol_number, volumes_dir)
        conn.commit()
        print(f"\n=== 同步完成 ===")
    except Exception as e:
        conn.rollback()
        print(f"\n!!! 同步失败: {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
