# -*- coding: utf-8 -*-
"""生成"考研核心义精修"任务清单（例句生成完成后使用）。
收集两类：
1. 重点扩展无核心义的词（804）
2. 核心/高频层核心义疑似低质的词（全量罗列、含括号注释、义项过多）
输出 data/ai_examples/todo_meanings.txt：每行 "编号|单词|当前exam_meaning|当前translation"
用法: python scripts/gen_meaning_todo.py
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(os.path.join(ROOT, 'data', 'words.json'), encoding='utf-8'))

def low_quality(w):
    em = (w.get('exam_meaning') or '').strip()
    if not em:
        return '无核心义'
    if '（' in em or '(' in em:
        return '含括号注释'
    if em.count('；') >= 3:
        return '罗列过多'
    if len(em) > 25:
        return '超长罗列'
    return None

todo = [w for w in d['words'] if w.get('active') is not False and low_quality(w)]
out = os.path.join(ROOT, 'data', 'ai_examples', 'todo_meanings.txt')
with open(out, 'w', encoding='utf-8') as f:
    for i, w in enumerate(todo):
        f.write('%04d|%s|%s|%s\n' % (i, w['word'], (w.get('exam_meaning') or '').replace('\n', ' '), (w.get('translation') or '').replace('\n', ' ')))
import collections
c = collections.Counter(low_quality(w) for w in todo)
print('待精修核心义:', len(todo), dict(c), '->', out, '| 块数(160/块):', (len(todo) + 159) // 160)
