# -*- coding: utf-8 -*-
"""为 v9 新增高频词从 Free Dictionary API 拉取音标（限速，断点可重跑）"""
import json, time, urllib.request, os
P = 'data/words.json'
d = json.load(open(P, encoding='utf-8'))
todo = [w for w in d['words'] if not w.get('phonetic') and w.get('active') is not False]
print('待补音标:', len(todo))
ok = fail = 0
for i, w in enumerate(todo):
    try:
        req = urllib.request.Request('https://api.dictionaryapi.dev/api/v2/entries/en/'+w['word'], headers={'User-Agent':'kaoyan-v9'})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read().decode('utf-8'))
        ph = ''
        if isinstance(data, list) and data:
            ph = data[0].get('phonetic') or ''
            if not ph:
                for p in data[0].get('phonetics', []):
                    if p.get('text'): ph = p['text']; break
        if ph:
            w['phonetic'] = ph; ok += 1
        else:
            fail += 1
    except Exception:
        fail += 1
    if (i+1) % 30 == 0:
        json.dump(d, open(P, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        print('进度 %d/%d ok=%d' % (i+1, len(todo), ok))
    time.sleep(2.5)
json.dump(d, open(P, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('完成 ok=%d fail=%d' % (ok, fail))
