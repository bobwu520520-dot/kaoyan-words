# -*- coding: utf-8 -*-
"""合并 api_mnemonics.jsonl 到 words.json:
- mnemonics 助记(全量)
- exam_meaning 考研精简义(仅填空缺的,不覆盖人工核验的 verified-source/manual)
"""
import json, sys

sys.stdout.reconfigure(encoding='utf-8')
PATH = 'data/words.json'
d = json.load(open(PATH, encoding='utf-8'))
wmap = {x['word']: x for x in d['words']}

mn = em = 0
bad = 0
for line in open('api_mnemonics.jsonl', encoding='utf-8'):
    line = line.strip()
    if not line:
        continue
    o = json.loads(line)
    x = wmap.get(o['word'])
    if not x:
        continue
    if o.get('mnemonic'):
        x['mnemonics'] = o['mnemonic'].strip()
        mn += 1
    meaning = (o.get('meaning') or '').strip()
    if meaning and not x.get('exam_meaning'):
        # 只补空缺; 已有(人工/词典核验)的一律保留
        x['exam_meaning'] = meaning
        em += 1

print('助记合并:', mn, '| 考研义补全:', em)
d['words'] = list(wmap.values())
d['data_version'] = '6013-v9.2'
d['DATA_VERSION'] = '6013-v9.2'
json.dump(d, open(PATH, 'w', encoding='utf-8'), ensure_ascii=False)
print('版本:', d['data_version'], '| exam_meaning 覆盖:', sum(1 for x in d['words'] if x.get('exam_meaning')), '/', len(d['words']))
print('mnemonics 覆盖:', sum(1 for x in d['words'] if x.get('mnemonics')), '/', len(d['words']))
