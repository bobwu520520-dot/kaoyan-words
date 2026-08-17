# -*- coding: utf-8 -*-
"""quality_score 重算:与前端 app.js completenessBadge 一致的 10 分制
7 必选(音标/词性/释义/核心义/例句/中译/搭配)各 1 分
僻义 0.5 + 词族 0.5 + 来源可靠性(manual/curated/verified 0.5, ecdict 0.3)
总分 >=7.5 A, >=6.0 B, >=4.0 C, 否则 D
"""
import json, sys, re

sys.stdout.reconfigure(encoding='utf-8')
PATH = 'data/words.json'
d = json.load(open(PATH, encoding='utf-8'))
words = d['words']

def score(x):
    pts = 0.0
    for f in ('phonetic', 'pos', 'translation', 'exam_meaning', 'example_en', 'example_zh', 'collocation_hint'):
        if x.get(f):
            pts += 1
    if x.get('secondary_meanings'):
        pts += 0.5
    if x.get('word_family'):
        pts += 0.5
    src = str(x.get('source') or '')
    if re.search(r'manual|curated|verified', src):
        pts += 0.5
    elif 'ecdict' in src:
        pts += 0.3
    if pts >= 7.5:
        return 'A'
    if pts >= 6.0:
        return 'B'
    if pts >= 4.0:
        return 'C'
    return 'D'

n = 0
for x in words:
    s = score(x)
    if x.get('quality_score') != s:
        x['quality_score'] = s
        n += 1
json.dump(d, open(PATH, 'w', encoding='utf-8'), ensure_ascii=False)
from collections import Counter
print('更新:', n, '新分布:', dict(Counter(x['quality_score'] for x in words)))
