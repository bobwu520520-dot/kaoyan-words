# -*- coding: utf-8 -*-
"""音标补全第二轮:Pearson LDOCE5 接口(清洗 ◂▸ 等音节符号)"""
import json, sys, time, urllib.request, re

sys.stdout.reconfigure(encoding='utf-8')
PATH = 'data/words.json'
d = json.load(open(PATH, encoding='utf-8'))
words = d['words']
todo = [x for x in words if not x.get('phonetic')]
print('待补:', len(todo))

proxy = urllib.request.ProxyHandler({'http': 'http://127.0.0.1:7897', 'https': 'http://127.0.0.1:7897'})
opener = urllib.request.build_opener(proxy)
opener.addheaders = [('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')]

def clean(ph):
    ph = ph.replace('◂', '').replace('▸', '').replace('◂', '').strip()
    ph = re.sub(r'[^a-zA-Zˈˌːəæɑɒɔɜɪʊʌɜeɪaɪɔɪəʊaʊɛiːuːɡʃʒtʃdʒŋθðfvhwjklmnprstbczx]', '', ph)
    return ph

ok = fail = 0
for i, x in enumerate(todo):
    w = x['word']
    try:
        with opener.open(f'https://api.pearson.com/v2/dictionaries/ldoce5/entries?headword={w}&limit=2', timeout=12) as r:
            data = json.loads(r.read().decode('utf-8'))
        res = data.get('results') or []
        ph = ''
        for item in res:
            for pr in item.get('pronunciations') or []:
                if pr.get('ipa'):
                    ph = clean(pr['ipa'])
                    break
            if ph:
                break
        if ph:
            x['phonetic'] = '/' + ph + '/'
            ok += 1
        else:
            fail += 1
    except Exception:
        fail += 1
    if i % 30 == 0:
        json.dump(d, open(PATH, 'w', encoding='utf-8'), ensure_ascii=False)
        print(f'进度 {i+1}/{len(todo)} 成功{ok} 失败{fail}', flush=True)
    time.sleep(0.1)

json.dump(d, open(PATH, 'w', encoding='utf-8'), ensure_ascii=False)
print('完成: 成功', ok, '失败', fail, '剩余', sum(1 for x in words if not x.get('phonetic')))
