# -*- coding: utf-8 -*-
"""例句补全:bank2000 本地匹配 -> DeepSeek 批量生成(输出 api_examples.jsonl,不直接改 words.json)"""
import json, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.stdout.reconfigure(encoding='utf-8')
KEY = 'sk-1538c883f2374850a1079afd4e7e0598'
URL = 'https://api.deepseek.com/chat/completions'
OUT = 'api_examples.jsonl'

d = json.load(open('data/words.json', encoding='utf-8'))
words = d['words']
bank = json.load(open('data/bank2000.json', encoding='utf-8'))['words']
bank_map = {}
for x in bank:
    bank_map[x['word'].lower()] = x

# 已生成结果(断点续传)
done = {}
try:
    for line in open(OUT, encoding='utf-8'):
        line = line.strip()
        if line:
            obj = json.loads(line)
            done[obj['word']] = obj
except FileNotFoundError:
    pass

todo = []
for x in words:
    if x.get('example_en'):
        continue
    if x['word'] in done:
        continue
    b = bank_map.get(x['word'].lower())
    if b and b.get('example_en'):
        done[x['word']] = {'word': x['word'], 'example_en': b['example_en'],
                           'example_zh': b.get('example_zh') or '', 'collocations': [], 'usage': '', 'source': 'bank'}
        continue
    todo.append(x)

print('待 API 生成:', len(todo))

def call_api(x):
    tier = x.get('tier', '')
    full = tier == '高频重点'  # 高频重点:含中文+搭配;其余:英文例句
    prompt = (
        f'为考研英语词汇 "{x["word"]}" (词性: {x.get("pos","") or "—"}, 释义: {x.get("translation","")}) '
        f'写 1 个学术风格的英文例句, 28-45 词, 像考研阅读或议论文的真实句子, '
        f'必须包含目标词且用法正确, 不要机器翻译腔。'
        + ('同时给出中文翻译和 2-3 个高频搭配。严格 JSON: {"sentence":"...","translation":"...","collocations":["..",".."]}'
           if full else '只输出英文例句,不要其他内容。')
    )
    body = json.dumps({
        'model': 'deepseek-chat',
        'messages': [
            {'role': 'system', 'content': '你是考研英语词汇老师, 擅长写自然准确的学术例句。'},
            {'role': 'user', 'content': prompt},
        ],
        'temperature': 0.7, 'max_tokens': 220,
    }).encode('utf-8')
    req = urllib.request.Request(URL, data=body, headers={
        'Content-Type': 'application/json', 'Authorization': 'Bearer ' + KEY})
    proxy = urllib.request.ProxyHandler({'http': 'http://127.0.0.1:7897', 'https': 'http://127.0.0.1:7897'})
    opener = urllib.request.build_opener(proxy)
    with opener.open(req, timeout=30) as r:
        data = json.loads(r.read().decode('utf-8'))
    content = data['choices'][0]['message']['content'].strip()
    if full:
        import re
        content = re.sub(r'^```json\s*', '', content).replace('```', '').strip()
        obj = json.loads(content)
        return {'word': x['word'], 'example_en': obj['sentence'], 'example_zh': obj.get('translation', ''),
                'collocations': obj.get('collocations', []), 'usage': '', 'source': 'ai'}
    content = content.replace('\n', ' ').strip()
    return {'word': x['word'], 'example_en': content, 'example_zh': '', 'collocations': [], 'usage': '', 'source': 'ai'}

ok = fail = 0
with ThreadPoolExecutor(max_workers=4) as pool:
    futs = {pool.submit(call_api, x): x for x in todo}
    for i, fut in enumerate(as_completed(futs)):
        try:
            res = fut.result()
            if len(res['example_en']) >= 15:
                done[res['word']] = res
                ok += 1
            else:
                fail += 1
        except Exception:
            fail += 1
        if i % 20 == 0:
            with open(OUT, 'w', encoding='utf-8') as f:
                for v in done.values():
                    f.write(json.dumps(v, ensure_ascii=False) + '\n')
            print(f'进度 {i+1}/{len(todo)} 成功{ok} 失败{fail}', flush=True)

with open(OUT, 'w', encoding='utf-8') as f:
    for v in done.values():
        f.write(json.dumps(v, ensure_ascii=False) + '\n')
print('完成: 成功', ok, '失败', fail, '总计记录', len(done))
