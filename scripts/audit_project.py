# -*- coding: utf-8 -*-
import os
import re
import json

base_dir = r'd:\谷歌反重力\kaoyan_vocab_v9'

html_files = [f for f in os.listdir(base_dir) if f.endswith('.html')]
print("Found HTML files:", html_files)

missing_assets = []
for hf in html_files:
    fpath = os.path.join(base_dir, hf)
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Scripts
    scripts = re.findall(r'<script[^>]+src=[\'"]([^\'"]+)[\'"]', content, re.I)
    for s in scripts:
        if s.startswith('http'):
            continue
        full_p = os.path.join(base_dir, s)
        if not os.path.exists(full_p):
            missing_assets.append((hf, 'script', s))

    # Links
    links = re.findall(r'<link[^>]+href=[\'"]([^\'"]+)[\'"]', content, re.I)
    for l in links:
        if l.startswith('http') or l.startswith('data:'):
            continue
        clean = l.split('?')[0]
        full_p = os.path.join(base_dir, clean)
        if not os.path.exists(full_p):
            missing_assets.append((hf, 'link', clean))

    # Imgs
    imgs = re.findall(r'<img[^>]+src=[\'"]([^\'"]+)[\'"]', content, re.I)
    for im in imgs:
        if im.startswith('http') or im.startswith('data:'):
            continue
        clean = im.split('?')[0]
        full_p = os.path.join(base_dir, clean)
        if not os.path.exists(full_p):
            missing_assets.append((hf, 'img', clean))

if missing_assets:
    print("MISSING ASSETS FOUND:")
    for ma in missing_assets:
        print(f"  [{ma[0]}] {ma[1]}: {ma[2]}")
else:
    print("ALL HTML local assets exist! (100% OK)")

print("\n--- Auditing DOM IDs used in JS against HTML ---")
pairs = [
    ('exam.html', 'js/exam_workshop.js'),
    ('study.html', 'js/study.js'),
    ('memory.html', 'js/memory.js'),
    ('words.html', 'js/catalog.js'),
    ('translate.html', 'js/translate.js'),
]

for html_file, js_file in pairs:
    html_path = os.path.join(base_dir, html_file)
    js_path = os.path.join(base_dir, js_file)
    
    with open(html_path, 'r', encoding='utf-8') as f:
        html_text = f.read()
    with open(js_path, 'r', encoding='utf-8') as f:
        js_text = f.read()

    # Find all IDs defined in HTML
    html_ids = set(re.findall(r'id=[\'"]([a-zA-Z0-9_-]+)[\'"]', html_text))
    # Also find IDs dynamically generated in JS strings
    js_defined_ids = set(re.findall(r'id=[\'\\"]([a-zA-Z0-9_-]+)[\'\\"]', js_text))
    all_available_ids = html_ids.union(js_defined_ids)

    # Find all getElementById calls in JS
    js_queried_ids = re.findall(r'getElementById\([\'"]([a-zA-Z0-9_-]+)[\'"]\)', js_text)

    missing_ids = []
    for qid in set(js_queried_ids):
        if qid not in all_available_ids:
            missing_ids.append(qid)

    if missing_ids:
        print(f"[{html_file} <-> {js_file}] Missing IDs ({len(missing_ids)}): {missing_ids}")
    else:
        print(f"[{html_file} <-> {js_file}] All {len(set(js_queried_ids))} getElementById references match! (100% OK)")

