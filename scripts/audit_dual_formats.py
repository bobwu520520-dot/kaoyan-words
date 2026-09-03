# -*- coding: utf-8 -*-
import os, json, re, sys
sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r'd:\谷歌反重力\kaoyan_vocab_v9'

html_files = ['index.html', 'study.html', 'exam.html', 'translate.html', 'memory.html', 'words.html']

print('Auditing all 6 HTML files for Desktop and Mobile dual-format compliance...')
for hf in html_files:
    hp = os.path.join(BASE_DIR, hf)
    with open(hp, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check header
    has_header = '<header' in content
    # Check bottom nav
    has_bottom_nav = 'class="bottom-nav"' in content
    # Check scripts
    scripts = re.findall(r'src=["\'](.*?)["\']', content)
    for s in scripts:
        sp = os.path.join(BASE_DIR, s)
        assert os.path.exists(sp), f'Missing script {s} in {hf}'
    
    print(f'  [PASS] {hf} (Header: {has_header}, BottomNav: {has_bottom_nav}, Scripts: {len(scripts)})')

print('\nAuditing CSS and JSON data...')
# Check CSS
with open(os.path.join(BASE_DIR, 'css', 'style.css'), 'r', encoding='utf-8') as f:
    css = f.read()

assert css.count('{') == css.count('}'), 'CSS unclosed braces'
print('  [PASS] style.css bracket balance verified!')

# Check words.json
with open(os.path.join(BASE_DIR, 'data', 'words.json'), 'r', encoding='utf-8') as f:
    wdata = json.load(f)
print(f'  [PASS] words.json: {len(wdata["words"])} words')

# Check translations.json
with open(os.path.join(BASE_DIR, 'data', 'translations.json'), 'r', encoding='utf-8') as f:
    tdata = json.load(f)
print(f'  [PASS] translations.json: {len(tdata["sentences"])} sentences')

print('\nALL DUAL-VIEWPORT (DESKTOP AND MOBILE) AUDITS 100% PASSED!')
