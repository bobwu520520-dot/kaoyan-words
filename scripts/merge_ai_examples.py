# -*- coding: utf-8 -*-
"""合并 data/ai_examples/ai_chunk_*.json -> data/ai_examples.json，并校验覆盖率。

用法: python scripts/merge_ai_examples.py
输出:
  data/ai_examples.json   {"version":1,"generated_at":...,"count":N,"s":{word:[en,zh]}}
  data/ai_examples/missing.json  缺失/异常词清单
"""
import json, glob, os, re, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data')
OUT = os.path.join(DATA, 'ai_examples.json')

words = json.load(open(os.path.join(DATA, 'words.json'), encoding='utf-8'))['words']
vocab = [w['word'] for w in words if w.get('active') is not False]
vocab_set = set(vocab)

merged, conflicts = {}, []
for path in sorted(glob.glob(os.path.join(DATA, 'ai_examples', 'ai_chunk_*.json'))):
    try:
        chunk = json.load(open(path, encoding='utf-8'))
    except Exception as e:
        print('!! JSON 解析失败:', path, e); sys.exit(1)
    for w, item in (chunk.get('words') or {}).items():
        w = w.strip().lower()
        if w not in vocab_set:
            print('  ? 非词库单词跳过:', w); continue
        en = (item.get('en') or '').strip()
        zh = (item.get('zh') or '').strip()
        if not en or not zh:
            print('  ! 空例句:', w); continue
        if w in merged and merged[w][0] != en:
            conflicts.append(w)
        merged[w] = [en, zh]

missing = [w for w in vocab if w not in merged]
# 例句中未出现目标词（含简单屈折）的宽松检查
def covers(en, word):
    stem = re.escape(word)
    alt = re.escape(word[:-1]) + r'\\w*' if word.endswith('e') else None
    pat = r'\b(' + stem + r'\w*' + (('|' + alt) if alt else '') + r')'
    return re.search(pat, en, re.I) is not None
uncovered = [w for w, (en, zh) in merged.items() if not covers(en, w)]

json.dump({
    'version': 1,
    'generated_at': datetime.datetime.now().isoformat(timespec='seconds'),
    'count': len(merged),
    's': merged,
}, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

json.dump({'missing': missing, 'uncovered': uncovered, 'conflicts': conflicts},
          open(os.path.join(DATA, 'ai_examples', 'missing.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)

size = os.path.getsize(OUT)
print('词库词数:', len(vocab))
print('已生成例句:', len(merged), ' 缺失:', len(missing), ' 例句未含目标词:', len(uncovered), ' 冲突覆盖:', len(set(conflicts)))
print('输出:', OUT, '%.1f KB' % (size / 1024))
if missing[:20]: print('缺失示例:', ' '.join(missing[:20]))
if uncovered[:20]: print('未覆盖示例:', ' '.join(uncovered[:20]))
