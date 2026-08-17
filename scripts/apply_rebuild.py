# -*- coding: utf-8 -*-
"""词库重建应用脚本:删除词形词条+罕见动物,添加 words_add_1~4 新词(红宝书2027风格)"""
import json, re, sys

PATH = 'data/words.json'
d = json.load(open(PATH, encoding='utf-8'))
words = d['words']
print('应用前:', d['count'], len(words))

# ---------- 1. 删除:词形词条 + 罕见动物 ----------
INFLECTION = re.compile(
    r'(的(过去式|过去分词|复数|现在分词|第三人称单数)|（复数）|\(复数\)|的复数形式)'
)
PROTECT = {'being', 'born', 'crew', 'found', 'thought'}  # 核心词,仅翻译附带变位说明
RARE_ANIMALS = {  # 罕见动物,考研不可能考(用户点名 aardvark 类)
    'aardvark', 'abalone', 'albacore', 'alewife', 'alligator',
    'alpaca', 'adder', 'aerie',
}

def is_inflection(x):
    return bool(INFLECTION.search(x.get('translation', '') or '') or
                INFLECTION.search(x.get('note', '') or ''))

del_set = set()
for x in words:
    if x['word'] in PROTECT:
        continue
    if is_inflection(x):
        del_set.add(x['word'])
    if x['word'] in RARE_ANIMALS:
        del_set.add(x['word'])

before = len(words)
words = [x for x in words if x['word'] not in del_set]
print('删除:', before - len(words), '个 ->', sorted(del_set)[:12], '...')

# ---------- 2. 添加新词 ----------
TIER_MAP = {'H': '高频重点', 'E': '重点扩展', 'N': '普通扩展'}
PRIORITY = {'H': '★★★☆☆', 'E': '★★☆☆☆', 'N': '★☆☆☆☆'}

existing = {x['word'].lower() for x in words}
added, skipped = 0, 0
for i in range(1, 5):
    for line in open(f'words_add_{i}.txt', encoding='utf-8'):
        line = line.strip()
        if not line:
            continue
        parts = line.split('|')
        if len(parts) != 4:
            print('BAD LINE:', line); continue
        word, pos, trans, mark = [p.strip() for p in parts]
        key = word.lower()
        if key in existing:
            skipped += 1
            continue
        tier = TIER_MAP.get(mark, '重点扩展')
        words.append({
            'word': word, 'phonetic': '', 'pos': pos, 'translation': trans,
            'tag': '扩展补全', 'example_en': '', 'example_zh': '',
            'tier': tier, 'active': True, 'quality': 'curated-2026',
            'true_priority': PRIORITY.get(mark, '★★☆☆☆'),
            'exam_meaning': '', 'collocation_hint': '',
            'note': '扩展补全：未完成本地释义核验，不进入默认背词队列；查词时可在线补全。',
            'studyEligible': True, 'secondary_meanings': '',
            'source': 'curated-2026', 'quality_score': 'D',
            'exam_frequency': None, 'exam_years': [], 'exam_types': [], 'exam_contexts': [],
        })
        existing.add(key)
        added += 1

print('新增:', added, '跳过(已存在):', skipped)

# ---------- 3. 写回 ----------
new_count = len(words)
d['words'] = words
d['count'] = new_count
d['active_count'] = new_count
d['data_version'] = f'{new_count}-v9'
d['DATA_VERSION'] = f'{new_count}-v9'
json.dump(d, open(PATH, 'w', encoding='utf-8'), ensure_ascii=False)
print('应用后:', new_count, '版本:', d['data_version'])

# 分层统计
from collections import Counter
print('分层:', dict(Counter(x['tier'] for x in words)))
