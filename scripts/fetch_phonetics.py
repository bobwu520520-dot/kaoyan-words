# -*- coding: utf-8 -*-
"""音标补全:先 bank2000 本地匹配,再 api.dictionaryapi.dev 抓取(增量,断点续传)"""
import json, time, sys

sys.stdout.reconfigure(encoding='utf-8')
PATH = 'data/words.json'
d = json.load(open(PATH, encoding='utf-8'))
words = d['words']

bank = json.load(open('data/bank2000.json', encoding='utf-8'))['words']
bank_map = {}
for x in bank:
    bank_map[x['word'].lower()] = x

# 1) bank 匹配
filled = 0
for x in words:
    if x.get('phonetic'):
        continue
    b = bank_map.get(x['word'].lower())
    if b and b.get('phonetic'):
        ph = b['phonetic'].strip()
        if ph and not ph.startswith('/') and not ph.startswith('['):
            ph = '/' + ph + '/'
        if len(ph) >= 3 and not any('\u4e00' <= c <= '\u9fff' for c in ph):
            x['phonetic'] = ph
            filled += 1
print('bank 匹配:', filled, '剩余:', sum(1 for x in words if not x.get('phonetic')))

json.dump(d, open(PATH, 'w', encoding='utf-8'), ensure_ascii=False)

# 2) API 抓取(仅当命令行带 --api)
if '--api' in sys.argv:
    import urllib.request
    todo = [x for x in words if not x.get('phonetic')]
    print('API 待抓:', len(todo))
    proxy = urllib.request.ProxyHandler({'http': 'http://127.0.0.1:7897', 'https': 'http://127.0.0.1:7897'})
    opener = urllib.request.build_opener(proxy)
    opener.addheaders = [('User-Agent', 'Mozilla/5.0')]
    ok = fail = 0
    for i, x in enumerate(todo):
        w = x['word']
        try:
            with opener.open(f'https://api.dictionaryapi.dev/api/v2/entries/en/{w}', timeout=10) as r:
                data = json.loads(r.read().decode('utf-8'))
            ph = ''
            for entry in data:
                ph = entry.get('phonetic') or ''
                if not ph and entry.get('phonetics'):
                    ph = entry['phonetics'][0].get('text') or ''
                if ph:
                    break
            if ph:
                x['phonetic'] = ph
                ok += 1
            else:
                fail += 1
        except Exception:
            fail += 1
        if i % 25 == 0:
            json.dump(d, open(PATH, 'w', encoding='utf-8'), ensure_ascii=False)
        time.sleep(0.15)
    json.dump(d, open(PATH, 'w', encoding='utf-8'), ensure_ascii=False)
    print('API 完成: 成功', ok, '失败', fail)
