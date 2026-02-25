#!/usr/bin/env python3
"""db_context.py — 从 DB 生成精确最小上下文

用法:
    python scripts/db_context.py --chapter 42 --mode write
    python scripts/db_context.py --chapter 42 --mode expand
    python scripts/db_context.py --chapter 42 --mode analyze
    python scripts/db_context.py --dashboard

输出 markdown 格式的上下文摘要到 stdout，可重定向到文件供 AI 读取。
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


def get_conn():
    config = load_config()
    return psycopg2.connect(**get_db_config(config))


def get_chapter_info(cur, global_ch):
    """获取章节基本信息和所属卷"""
    cur.execute(f"""
        SELECT ch.id, ch.chapter_number, ch.time_in_story, ch.status,
               v.id as vol_id, v.vol_number, v.title as vol_title,
               p.phase_number, p.title as phase_title
        FROM {SCHEMA}.chapters ch
        JOIN {SCHEMA}.volumes v ON ch.volume_id = v.id
        JOIN {SCHEMA}.phases p ON v.phase_id = p.id
        WHERE ch.global_chapter_number = %s
    """, (global_ch,))
    return cur.fetchone()


def context_write(cur, global_ch):
    """生成 /write 模式的上下文"""
    info = get_chapter_info(cur, global_ch)
    if not info:
        print(f"## 错误: 章节 {global_ch} 不存在于数据库中")
        return

    ch_id, ch_num, time_in_story, ch_status, vol_id, vol_num, vol_title, phase_num, phase_title = info

    print(f"# /write 上下文 — 第{global_ch}章 (vol-{vol_num:03d} ch-{ch_num:03d})")
    print(f"纪元{phase_num} [{phase_title}] · {vol_title}")
    print()

    # 1. 当前卷活跃角色
    print("## 活跃角色")
    cur.execute(f"""
        SELECT c.name, c.role_type, cs.location, cs.state_summary, cs.last_appearance
        FROM {SCHEMA}.characters c
        JOIN {SCHEMA}.character_states cs ON c.id = cs.character_id
        WHERE cs.volume_id = %s
        ORDER BY cs.last_appearance DESC
    """, (vol_id,))
    rows = cur.fetchall()
    if rows:
        print("| 角色 | 身份 | 位置 | 状态 | 最后出场 |")
        print("|------|------|------|------|---------|")
        for r in rows:
            print(f"| {r[0]} | {r[1]} | {r[2] or '-'} | {_truncate(r[3], 60)} | ch-{r[4]} |")
    print()

    # 2. 未解决伏笔
    print("## 未解决伏笔")
    cur.execute(f"""
        SELECT f.code, f.description, f.status, ch.chapter_number as planted_at, f.note
        FROM {SCHEMA}.foreshadowing f
        JOIN {SCHEMA}.chapters ch ON f.planted_chapter_id = ch.id
        WHERE f.status IN ('planted', 'hinted', 'partially_resolved')
          AND ch.volume_id = %s
        ORDER BY ch.chapter_number
    """, (vol_id,))
    rows = cur.fetchall()
    if rows:
        print(f"共 {len(rows)} 条:")
        for r in rows:
            note = f" ({r[4]})" if r[4] else ""
            print(f"- [{r[0]}] ch-{r[3]:03d} [{r[2]}]: {r[1]}{note}")
    else:
        print("无")
    print()

    # 3. 活跃情节线
    print("## 活跃情节线")
    cur.execute(f"""
        SELECT name, status, description
        FROM {SCHEMA}.plot_threads
        WHERE status NOT IN ('已完成')
        ORDER BY id
    """)
    rows = cur.fetchall()
    if rows:
        for r in rows:
            print(f"- **{r[0]}** [{r[1]}]: {_truncate(r[2], 80)}")
    print()

    # 4. 前5章概要摘要
    print("## 前序章节")
    start_ch = max(1, ch_num - 5)
    cur.execute(f"""
        SELECT chapter_number, time_in_story, synopsis_summary
        FROM {SCHEMA}.chapters
        WHERE volume_id = %s AND chapter_number >= %s AND chapter_number < %s
        ORDER BY chapter_number
    """, (vol_id, start_ch, ch_num))
    rows = cur.fetchall()
    if rows:
        for r in rows:
            print(f"- ch-{r[0]:03d} [{r[1] or '?'}]: {r[2] or '(无摘要)'}")
    else:
        print("无前序章节")
    print()

    # 5. 角色关系
    print("## 关键关系")
    cur.execute(f"""
        SELECT ca.name, cb.name, r.relationship_type, r.current_status
        FROM {SCHEMA}.relationships r
        JOIN {SCHEMA}.characters ca ON r.character_a_id = ca.id
        JOIN {SCHEMA}.characters cb ON r.character_b_id = cb.id
        WHERE r.volume_id = %s
        ORDER BY r.last_update_chapter DESC
        LIMIT 10
    """, (vol_id,))
    rows = cur.fetchall()
    if rows:
        for r in rows:
            print(f"- {r[0]} → {r[1]} [{r[2]}]: {_truncate(r[3], 60)}")
    print()

    # 6. 时间线（最近5条）
    print("## 最近时间线")
    cur.execute(f"""
        SELECT ch.chapter_number, te.story_time, te.event_description
        FROM {SCHEMA}.timeline_events te
        JOIN {SCHEMA}.chapters ch ON te.chapter_id = ch.id
        WHERE te.volume_id = %s AND ch.chapter_number < %s
        ORDER BY ch.chapter_number DESC
        LIMIT 5
    """, (vol_id, ch_num))
    rows = cur.fetchall()
    if rows:
        for r in reversed(rows):
            print(f"- ch-{r[0]:03d} [{r[1]}]: {r[2]}")
    print()


def context_expand(cur, global_ch):
    """生成 /expand 模式的上下文 — 更精确，只加载本章相关数据"""
    info = get_chapter_info(cur, global_ch)
    if not info:
        print(f"## 错误: 章节 {global_ch} 不存在于数据库中")
        return

    ch_id, ch_num, time_in_story, ch_status, vol_id, vol_num, vol_title, phase_num, phase_title = info

    print(f"# /expand 上下文 — 第{global_ch}章 (vol-{vol_num:03d} ch-{ch_num:03d})")
    print(f"纪元{phase_num} [{phase_title}] · {vol_title}")
    print(f"故事时间: {time_in_story or '未知'}")
    print()

    # 1. 本章关联的伏笔
    print("## 本章伏笔")
    cur.execute(f"""
        SELECT f.code, f.description, f.status, cf.action_type,
               planted_ch.chapter_number as planted_at
        FROM {SCHEMA}.chapter_foreshadowing cf
        JOIN {SCHEMA}.foreshadowing f ON cf.foreshadowing_id = f.id
        LEFT JOIN {SCHEMA}.chapters planted_ch ON f.planted_chapter_id = planted_ch.id
        WHERE cf.chapter_id = %s
        ORDER BY cf.action_type
    """, (ch_id,))
    rows = cur.fetchall()
    if rows:
        for r in rows:
            print(f"- [{r[0]}] {r[3]}: {r[1]} (埋设于ch-{r[4]:03d}, 状态:{r[2]})")
    else:
        # 回退：显示当前卷所有未解决伏笔
        print("(本章无直接关联伏笔，显示当前卷未解决伏笔)")
        cur.execute(f"""
            SELECT f.code, f.description, f.status, ch.chapter_number
            FROM {SCHEMA}.foreshadowing f
            JOIN {SCHEMA}.chapters ch ON f.planted_chapter_id = ch.id
            WHERE f.status IN ('planted', 'hinted', 'partially_resolved')
              AND ch.volume_id = %s
            ORDER BY ch.chapter_number
        """, (vol_id,))
        rows = cur.fetchall()
        for r in rows:
            print(f"- [{r[0]}] ch-{r[3]:03d} [{r[2]}]: {r[1]}")
    print()

    # 2. 当前卷活跃角色（精简版）
    print("## 活跃角色状态")
    cur.execute(f"""
        SELECT c.name, c.role_type, cs.location, cs.state_summary, cs.last_appearance
        FROM {SCHEMA}.characters c
        JOIN {SCHEMA}.character_states cs ON c.id = cs.character_id
        WHERE cs.volume_id = %s
        ORDER BY cs.last_appearance DESC
    """, (vol_id,))
    rows = cur.fetchall()
    if rows:
        for r in rows:
            print(f"- **{r[0]}** ({r[1]}): {r[2] or '?'} — {_truncate(r[3], 80)} [ch-{r[4]}]")
    print()

    # 3. 相关角色关系
    print("## 角色关系")
    cur.execute(f"""
        SELECT ca.name, cb.name, r.relationship_type, r.current_status
        FROM {SCHEMA}.relationships r
        JOIN {SCHEMA}.characters ca ON r.character_a_id = ca.id
        JOIN {SCHEMA}.characters cb ON r.character_b_id = cb.id
        WHERE r.volume_id = %s
        ORDER BY r.last_update_chapter DESC
    """, (vol_id,))
    rows = cur.fetchall()
    if rows:
        for r in rows:
            print(f"- {r[0]} → {r[1]} [{r[2]}]: {_truncate(r[3], 60)}")
    print()

    # 4. 前2章时间线（衔接用）
    print("## 前序衔接")
    cur.execute(f"""
        SELECT ch.chapter_number, te.story_time, te.event_description
        FROM {SCHEMA}.timeline_events te
        JOIN {SCHEMA}.chapters ch ON te.chapter_id = ch.id
        WHERE te.volume_id = %s AND ch.chapter_number < %s
        ORDER BY ch.chapter_number DESC
        LIMIT 3
    """, (vol_id, ch_num))
    rows = cur.fetchall()
    if rows:
        for r in reversed(rows):
            print(f"- ch-{r[0]:03d} [{r[1]}]: {r[2]}")
    print()


def context_analyze(cur, global_ch):
    """生成 /analyze 模式的上下文 — 一致性校验数据"""
    info = get_chapter_info(cur, global_ch)
    if not info:
        print(f"## 错误: 章节 {global_ch} 不存在于数据库中")
        return

    ch_id, ch_num, time_in_story, ch_status, vol_id, vol_num, vol_title, phase_num, phase_title = info

    print(f"# /analyze 上下文 — 第{global_ch}章 (vol-{vol_num:03d} ch-{ch_num:03d})")
    print()

    # 1. 本章应有的伏笔
    print("## 本章伏笔检查清单")
    cur.execute(f"""
        SELECT f.code, f.description, cf.action_type
        FROM {SCHEMA}.chapter_foreshadowing cf
        JOIN {SCHEMA}.foreshadowing f ON cf.foreshadowing_id = f.id
        WHERE cf.chapter_id = %s
    """, (ch_id,))
    rows = cur.fetchall()
    if rows:
        for r in rows:
            print(f"- [{r[0]}] 应{r[2]}: {r[1]}")
    else:
        print("无直接关联伏笔")
    print()

    # 2. 角色状态（用于一致性对比）
    print("## 角色状态基准")
    cur.execute(f"""
        SELECT c.name, cs.location, cs.state_summary, cs.last_appearance
        FROM {SCHEMA}.characters c
        JOIN {SCHEMA}.character_states cs ON c.id = cs.character_id
        WHERE cs.volume_id = %s
        ORDER BY c.name
    """, (vol_id,))
    rows = cur.fetchall()
    for r in rows:
        print(f"- {r[0]}: {r[1]} — {_truncate(r[2], 60)} [最后ch-{r[3]}]")
    print()

    # 3. 时间线连续性
    print("## 时间线连续性")
    cur.execute(f"""
        SELECT ch.chapter_number, te.story_time, te.event_description
        FROM {SCHEMA}.timeline_events te
        JOIN {SCHEMA}.chapters ch ON te.chapter_id = ch.id
        WHERE te.volume_id = %s AND ch.chapter_number BETWEEN %s AND %s
        ORDER BY ch.chapter_number
    """, (vol_id, max(1, ch_num - 2), ch_num + 1))
    rows = cur.fetchall()
    for r in rows:
        marker = " <<<" if r[0] == ch_num else ""
        print(f"- ch-{r[0]:03d} [{r[1]}]: {r[2]}{marker}")
    print()

    # 4. 全局一致性警告
    print("## 一致性警告")
    # 检测遗忘伏笔（埋设超过50章未解决）
    cur.execute(f"""
        SELECT f.code, f.description, ch.chapter_number as planted_at
        FROM {SCHEMA}.foreshadowing f
        JOIN {SCHEMA}.chapters ch ON f.planted_chapter_id = ch.id
        WHERE f.status = 'planted' AND ch.chapter_number < %s - 50
        ORDER BY ch.chapter_number
    """, (ch_num,))
    rows = cur.fetchall()
    if rows:
        print("### 可能遗忘的伏笔（埋设超过50章）:")
        for r in rows:
            print(f"- [{r[0]}] 埋设于ch-{r[2]:03d}: {r[1]}")
    else:
        print("无一致性警告")
    print()


def dashboard(cur):
    """输出创作进度仪表盘"""
    print("# 创作进度仪表盘")
    print()

    cur.execute(f"SELECT * FROM {SCHEMA}.writing_dashboard")
    rows = cur.fetchall()

    print("## 纪元进度")
    print("| 纪 | 标题 | 总卷 | 完成卷 | 总章 | 终稿章 | 概要章 | 总字数 |")
    print("|----|------|------|--------|------|--------|--------|--------|")
    for r in rows:
        words = f"{r[7]:,}" if r[7] else "0"
        print(f"| {r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]} | {r[5]} | {r[6]} | {words} |")
    print()

    # 伏笔统计
    print("## 伏笔统计")
    cur.execute(f"""
        SELECT status, COUNT(*) FROM {SCHEMA}.foreshadowing GROUP BY status ORDER BY status
    """)
    rows = cur.fetchall()
    for r in rows:
        print(f"- {r[0]}: {r[1]} 条")
    print()

    # 角色统计
    print("## 角色统计")
    cur.execute(f"""
        SELECT status, COUNT(*) FROM {SCHEMA}.characters GROUP BY status ORDER BY status
    """)
    rows = cur.fetchall()
    for r in rows:
        print(f"- {r[0]}: {r[1]} 个")
    print()

    # 情节线统计
    print("## 情节线统计")
    cur.execute(f"""
        SELECT status, COUNT(*) FROM {SCHEMA}.plot_threads GROUP BY status ORDER BY status
    """)
    rows = cur.fetchall()
    for r in rows:
        print(f"- {r[0]}: {r[1]} 条")
    print()

    # 遗忘伏笔检测
    print("## 遗忘伏笔检测")
    cur.execute(f"""
        SELECT f.code, f.description, ch.chapter_number, v.vol_number
        FROM {SCHEMA}.foreshadowing f
        JOIN {SCHEMA}.chapters ch ON f.planted_chapter_id = ch.id
        JOIN {SCHEMA}.volumes v ON ch.volume_id = v.id
        WHERE f.status = 'planted'
        ORDER BY ch.chapter_number
    """)
    rows = cur.fetchall()
    # 获取最大章节号作为当前进度
    cur.execute(f"SELECT MAX(chapter_number) FROM {SCHEMA}.chapters WHERE synopsis_summary IS NOT NULL")
    max_ch = cur.fetchone()[0] or 0

    warn_count = 0
    crit_count = 0
    if rows:
        for r in rows:
            age = max_ch - r[2]
            if age > 50:
                crit_count += 1
                print(f"- ❌ [{r[0]}] vol-{r[3]:03d} ch-{r[2]:03d} (已过{age}章): {_truncate(r[1], 60)}")
            elif age > 30:
                warn_count += 1
                print(f"- ⚠️ [{r[0]}] vol-{r[3]:03d} ch-{r[2]:03d} (已过{age}章): {_truncate(r[1], 60)}")
        if warn_count == 0 and crit_count == 0:
            print("✅ 无超期伏笔")
        else:
            print(f"\n合计: ⚠️ 待推进 {warn_count} 条, ❌ 严重遗忘 {crit_count} 条")
    else:
        print("无 planted 伏笔")
    print()

    # 角色活跃度
    print("## 角色活跃度")
    cur.execute(f"""
        SELECT DISTINCT ON (c.name)
            c.name, c.role_type, cs.last_appearance, v.vol_number, c.status
        FROM {SCHEMA}.characters c
        JOIN {SCHEMA}.character_states cs ON c.id = cs.character_id
        JOIN {SCHEMA}.volumes v ON cs.volume_id = v.id
        ORDER BY c.name, v.vol_number DESC, cs.last_appearance DESC
    """)
    rows = cur.fetchall()
    if rows:
        print("| 角色 | 类型 | 最后出场 | 状态 |")
        print("|------|------|---------|------|")
        for r in sorted(rows, key=lambda x: x[2] or 0, reverse=True):
            print(f"| {r[0]} | {r[1]} | vol-{r[3]:03d} ch-{r[2] or '?'} | {r[4]} |")
    else:
        print("(无角色数据)")


def _truncate(text, max_len=80):
    """截断文本"""
    if not text:
        return "-"
    text = text.replace("\n", " ")
    if len(text) > max_len:
        return text[:max_len] + "..."
    return text


def main():
    parser = argparse.ArgumentParser(description="DB -> 精确上下文生成器")
    parser.add_argument("--chapter", type=int, help="目标章节号（全局）")
    parser.add_argument("--mode", choices=["write", "expand", "analyze"], default="write",
                        help="上下文模式: write/expand/analyze")
    parser.add_argument("--dashboard", action="store_true", help="输出创作进度仪表盘")
    args = parser.parse_args()

    if not args.chapter and not args.dashboard:
        print("用法: python db_context.py --chapter 42 --mode write")
        print("      python db_context.py --dashboard")
        sys.exit(1)

    conn = get_conn()
    cur = conn.cursor()

    try:
        if args.dashboard:
            dashboard(cur)
        elif args.mode == "write":
            context_write(cur, args.chapter)
        elif args.mode == "expand":
            context_expand(cur, args.chapter)
        elif args.mode == "analyze":
            context_analyze(cur, args.chapter)
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
