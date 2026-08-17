# -*- coding: utf-8 -*-
"""全库 AI 增强:考研精简义(1-3个义项) + 助记(词根词缀/联想/谐音)
输出 api_mnemonics.jsonl,增量断点;合并由 merge_mnemonics.py 完成
"""
import json, sys, time, urllib.request, re
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.stdout.reconfigure(encoding='utf-8')
KEY = 'sk-1538c883f2374850a1079afd4e7e0598'
URL = 'https://api.deepseek.com/chat/completions'
OUT = 'api_mnemonics.jsonl'

d = json.load(open('data/words.json', encoding='utf-8'))
words = d['words']
todo = [x for x in words if not x.get('mnemonics')]
print('待生成:', len(todo), '/', len(words), flush=True)

done = {}
try:
    for line in open(OUT, encoding='utf-8'):
        line = line.strip()
        if line:
            o = json.loads(line)
            done[o['word']] = o
except FileNotFoundError:
    pass
todo = [x for x in todo if x['word'] not in done]
print('断点续传后待生成:', len(todo), flush=True)

def call_api(x):
    prompt = (
        f'你是考研英语一词汇老师。单词 "{x["word"]}"，词性 {x.get("pos") or "—"}，'
        f'现有释义: {x.get("translation") or x.get("exam_meaning") or "无"}。'
        f'请严格输出 JSON:'
        f'{{"meaning":"考研中最常考的 1-3 个精简中文义项，用分号分隔，不要罗列生僻义",'
        f'"mnemonic":"50 字以内的中文助记，用词根词缀拆解/联想/谐音帮助记忆，风格口语化，不要编造词源"}}。'
        f'不要输出其他内容。'
    )
    body = json.dumps({
        'model': 'deepseek-chat',
        'messages': [
            {'role': 'system', 'content': '你是考研英语词汇老师，只输出合法 JSON。'},
            {'role': 'user', 'content': prompt},
        ],
        'temperature': 0.4, 'max_tokens': 220,
    }).encode('utf-8')
    req = urllib.request.Request(URL, data=body, headers={
        'Content-Type': 'application/json', 'Authorization': 'Bearer ' + KEY})
    proxy = urllib.request.ProxyHandler({'http': 'http://127.0.0.1:7897', 'https': 'http://127.0.0.1:7897'})
    opener = urllib.request.build_opener(proxy)
    with opener.open(req, timeout=30) as r:
        data = json.loads(r.read().decode('utf-8'))
    content = data['choices'][0]['message']['content'].strip()
    content = re.sub(r'^```json\s*', '', content).replace('```', '').strip()
    o = json.loads(content)
    meaning = (o.get('meaning') or '').strip()
    mn = (o.get('mnemonic') or '').strip()
    if not meaning and not mn:
        raise ValueError('empty')
    return {'word': x['word'], 'meaning': meaning, 'mnemonic': mn}

ok = fail = 0
with ThreadPoolExecutor(max_workers=4) as pool:
    futs = {pool.submit(call_api, x): x for x in todo}
    for i, fut in enumerate(as_completed(futs)):
        try:
            res = fut.result()
            done[res['word']] = res
            ok += 1
        except Exception:
            fail += 1
        if i % 25 == 0:
            with open(OUT, 'w', encoding='utf-8') as f:
                for v in done.values():
                    f.write(json.dumps(v, ensure_ascii=False) + '\n')
            print(f'进度 {i+1}/{len(todo)} 成功{ok} 失败{fail}', flush=True)

with open(OUT, 'w', encoding='utf-8') as f:
    for v in done.values():
        f.write(json.dumps(v, ensure_ascii=False) + '\n')
print('完成: 成功', ok, '失败', fail, '总计', len(done), flush=True)
