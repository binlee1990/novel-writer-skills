#!/usr/bin/env python3
"""db_volume_switch.py — 从 DB 生成 volume-summary.md

用法:
    python scripts/db_volume_switch.py --vol 2          # 为 vol-002 生成 volume-summary
    python scripts/db_volume_switch.py --vol 2 --dry     # 预览输出，不写入文件

从 DB 查询上一卷的角色状态、伏笔、关系、时间线，生成新卷的 volume-summary.md。
替代原有的"读取4个 tracking JSON"卷切换流程。
"""

import argparse
import json
import os
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


def generate_volume_summary(cur, target_vol):
    """从 DB 生成 volume-summary.md 内容"""
    prev_vol = target_vol - 1
    lines = []

    # 获取目标卷信息
    cur.execute(f"""
        SELECT v.title, p.phase_number, p.title as phase_title
        FROM {SCHEMA}.volumes v JOIN {SCHEMA}.phases p ON v.phase_id = p.id
        WHERE v.vol_number = %s
    """, (target_vol,))
    target_info = cur.fetchone()
    target_title = target_info[0] if target_info else f"vol-{target_vol:03d}"
    phase_num = target_info[1] if target_info else "?"
    phase_title = target_info[2] if target_info else "?"

    lines.append(f"# Volume Summary — vol-{target_vol:03d} {target_title}")
    lines.append(f"纪元{phase_num} [{phase_title}]")
    lines.append("")

    # 1. 故事进度
    lines.append("## 故事进度")
    cur.execute(f"""
        SELECT v.vol_number, v.title,
               COUNT(ch.id) as total_ch,
               COUNT(CASE WHEN ch.status IN ('drafted','final') THEN 1 END) as written_ch,
               COALESCE(SUM(ch.word_count), 0) as words
        FROM {SCHEMA}.volumes v
        LEFT JOIN {SCHEMA}.chapters ch ON ch.volume_id = v.id
        WHERE v.vol_number <= %s
        GROUP BY v.vol_number, v.title
        ORDER BY v.vol_number
    """, (prev_vol,))
    rows = cur.fetchall()
    for r in rows:
        status = "已完成" if r[3] == r[2] and r[2] > 0 else f"进行中({r[3]}/{r[2]}章)"
        lines.append(f"- vol-{r[0]:03d} {r[1]}: {status}, {r[4]:,}字")
    lines.append("")

    # 2. 活跃角色状态（从最近2卷提取）
    lines.append("## 活跃角色状态")
    cur.execute(f"""
        SELECT DISTINCT ON (c.name)
            c.name, c.role_type, c.status, cs.location, cs.state_summary, cs.last_appearance,
            v.vol_number
        FROM {SCHEMA}.characters c
        JOIN {SCHEMA}.character_states cs ON c.id = cs.character_id
        JOIN {SCHEMA}.volumes v ON cs.volume_id = v.id
        WHERE v.vol_number BETWEEN %s AND %s AND c.status != 'dead'
        ORDER BY c.name, v.vol_number DESC, cs.last_appearance DESC
    """, (max(1, prev_vol - 1), prev_vol))
    rows = cur.fetchall()
    if rows:
        for r in rows:
            summary = r[4] or "-"
            if len(summary) > 100:
                summary = summary[:100] + "…"
            lines.append(f"- **{r[0]}** ({r[1]}, {r[2]}): {r[3] or '?'} — {summary} [vol-{r[6]:03d} ch-{r[5]}]")
    else:
        lines.append("(无角色数据)")
    lines.append("")

    # 已故角色（单独列出）
    cur.execute(f"""
        SELECT c.name, cs.state_summary, cs.last_appearance, v.vol_number
        FROM {SCHEMA}.characters c
        JOIN {SCHEMA}.character_states cs ON c.id = cs.character_id
        JOIN {SCHEMA}.volumes v ON cs.volume_id = v.id
        WHERE c.status = 'dead' AND v.vol_number <= %s
        ORDER BY cs.last_appearance DESC
    """, (prev_vol,))
    dead_rows = cur.fetchall()
    if dead_rows:
        lines.append("### 已故/退场角色")
        for r in dead_rows:
            summary = r[1] or "-"
            if len(summary) > 80:
                summary = summary[:80] + "…"
            lines.append(f"- {r[0]}: {summary} [vol-{r[3]:03d} ch-{r[2]}]")
        lines.append("")

    # 3. 活跃伏笔
    lines.append("## 活跃伏笔")
    cur.execute(f"""
        SELECT f.code, f.description, f.status, ch.chapter_number, v.vol_number, f.note
        FROM {SCHEMA}.foreshadowing f
        JOIN {SCHEMA}.chapters ch ON f.planted_chapter_id = ch.id
        JOIN {SCHEMA}.volumes v ON ch.volume_id = v.id
        WHERE f.status IN ('planted', 'hinted', 'partially_resolved')
        ORDER BY v.vol_number, ch.chapter_number
    """)
    rows = cur.fetchall()
    if rows:
        lines.append(f"共 {len(rows)} 条未解决:")
        for r in rows:
            note = f" ({r[5]})" if r[5] else ""
            lines.append(f"- [{r[0]}] vol-{r[4]:03d} ch-{r[3]:03d} [{r[2]}]: {r[1]}{note}")
    else:
        lines.append("无活跃伏笔")
    lines.append("")

    # 4. 关键关系
    lines.append("## 关键关系")
    cur.execute(f"""
        SELECT ca.name, cb.name, r.relationship_type, r.current_status
        FROM {SCHEMA}.relationships r
        JOIN {SCHEMA}.characters ca ON r.character_a_id = ca.id
        JOIN {SCHEMA}.characters cb ON r.character_b_id = cb.id
        JOIN {SCHEMA}.volumes v ON r.volume_id = v.id
        WHERE v.vol_number = %s
        ORDER BY r.last_update_chapter DESC
    """, (prev_vol,))
    rows = cur.fetchall()
    if rows:
        for r in rows:
            status = r[3] or "-"
            if len(status) > 80:
                status = status[:80] + "…"
            lines.append(f"- {r[0]} → {r[1]} [{r[2]}]: {status}")
    else:
        lines.append("(无关系数据)")
    lines.append("")

    # 5. 待续悬念（上一卷末章钩子）
    lines.append("## 待续悬念")
    cur.execute(f"""
        SELECT ch.chapter_number, te.event_description
        FROM {SCHEMA}.timeline_events te
        JOIN {SCHEMA}.chapters ch ON te.chapter_id = ch.id
        JOIN {SCHEMA}.volumes v ON te.volume_id = v.id
        WHERE v.vol_number = %s
        ORDER BY ch.chapter_number DESC
        LIMIT 3
    """, (prev_vol,))
    rows = cur.fetchall()
    if rows:
        lines.append("上一卷末尾事件:")
        for r in reversed(rows):
            lines.append(f"- ch-{r[0]:03d}: {r[1]}")
    else:
        lines.append("(无上一卷数据)")
    lines.append("")

    # 6. 活跃情节线
    lines.append("## 活跃情节线")
    cur.execute(f"""
        SELECT name, status, description
        FROM {SCHEMA}.plot_threads
        WHERE status NOT IN ('已完成')
        ORDER BY id
    """)
    rows = cur.fetchall()
    if rows:
        for r in rows:
            desc = r[2] or "-"
            if len(desc) > 100:
                desc = desc[:100] + "…"
            lines.append(f"- **{r[0]}** [{r[1]}]: {desc}")
    else:
        lines.append("无活跃情节线")
    lines.append("")

    # 7. 主角状态
    lines.append("## 主角状态")
    cur.execute(f"""
        SELECT level, progress_pct FROM {SCHEMA}.cultivation_curve
        ORDER BY chapter_number DESC LIMIT 1
    """)
    cult = cur.fetchone()
    if cult:
        lines.append(f"- 修炼: {cult[0]} ({cult[1]}%)")

    cur.execute(f"""
        SELECT skill_name, skill_category FROM {SCHEMA}.skill_overview
        WHERE status = 'active' ORDER BY acquired_chapter
    """)
    skills = cur.fetchall()
    if skills:
        skill_strs = [f"{s[0]}[{s[1]}]" for s in skills]
        lines.append(f"- 技能清单: {', '.join(skill_strs)}")

    cur.execute(f"""
        SELECT item_name, quantity FROM {SCHEMA}.current_inventory
        ORDER BY item_type
    """)
    items = cur.fetchall()
    if items:
        item_strs = [f"{r[0]}×{r[1]}" if r[1] > 1 else r[0] for r in items]
        lines.append(f"- 关键道具: {'、'.join(item_strs)}")
    lines.append("")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="从 DB 生成 volume-summary.md")
    parser.add_argument("--vol", type=int, required=True, help="目标卷号")
    parser.add_argument("--dry", action="store_true", help="预览输出，不写入文件")
    args = parser.parse_args()

    config = load_config()
    db_config = get_db_config(config)
    story_path = get_story_path(config)
    volumes_dir = os.path.join(story_path, "volumes")

    conn = psycopg2.connect(**db_config)
    cur = conn.cursor()

    try:
        content = generate_volume_summary(cur, args.vol)

        if args.dry:
            print(content)
        else:
            vol_dir = os.path.join(volumes_dir, f"vol-{args.vol:03d}")
            os.makedirs(vol_dir, exist_ok=True)
            out_path = os.path.join(vol_dir, "volume-summary.md")
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"已生成: {out_path}")
            print(f"字数: {len(content)} 字符")
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
