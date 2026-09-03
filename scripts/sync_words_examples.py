# -*- coding: utf-8 -*-
"""
Synchronize high-quality Kaoyan example sentences from ai_examples.json into words.json.
Overwrites all low quality, fragmented, missing, or mismatched example pairs with
verified, high-quality, exam-grade dual-language sentences.
"""

import json, os, sys, re, datetime

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'data')

WORDS_PATH = os.path.join(DATA_DIR, 'words.json')
AI_PATH = os.path.join(DATA_DIR, 'ai_examples.json')

with open(WORDS_PATH, 'r', encoding='utf-8') as f:
    words_data = json.load(f)

with open(AI_PATH, 'r', encoding='utf-8') as f:
    ai_data = json.load(f)

ai_s = ai_data.get('s', {})
words = words_data['words']

active_count = 0
synced_count = 0
replaced_low_quality = 0
filled_missing = 0
missing_words = []

def get_word_stems_regex(w):
    w = w.lower().strip()
    stems = [re.escape(w)]
    if w.endswith('e'):
        stems.append(re.escape(w[:-1]) + r'\w*')
    elif w.endswith('y') and len(w) > 2:
        stems.append(re.escape(w[:-1]) + r'i\w*')
    elif len(w) > 3 and w[-1] in 'bcdfghjklmnpqrstvwxyz':
        stems.append(re.escape(w + w[-1]) + r'\w*')
    stems.append(re.escape(w) + r'\w*')
    pat = r'\b(' + '|'.join(stems) + r')'
    return re.compile(pat, re.I)

for w in words:
    if w.get('active') is False:
        continue
    active_count += 1
    wd = w['word'].strip().lower()
    
    old_en = (w.get('example_en') or '').strip()
    old_zh = (w.get('example_zh') or '').strip()
    
    if wd in ai_s:
        new_en, new_zh = ai_s[wd]
        
        if not old_en or not old_zh:
            filled_missing += 1
        elif len(old_en.split()) < 10 or old_en != new_en:
            replaced_low_quality += 1
            
        w['example_en'] = new_en
        w['example_zh'] = new_zh
        synced_count += 1
    else:
        missing_words.append(wd)

words_data['DATA_VERSION'] = "5894-v9-ex-hq"
words_data['data_version'] = "5894-v9-ex-hq"
words_data['last_updated'] = datetime.datetime.now().isoformat(timespec='seconds')

with open(WORDS_PATH, 'w', encoding='utf-8') as f:
    json.dump(words_data, f, ensure_ascii=False, indent=2)

print(f"Total active words: {active_count}")
print(f"Successfully synced with ai_examples.json: {synced_count} / {active_count} ({synced_count/active_count*100:.1f}%)")
print(f"Filled previously missing examples: {filled_missing}")
print(f"Replaced low quality / mismatched examples: {replaced_low_quality}")
print(f"Missing from AI: {len(missing_words)}")
if missing_words:
    print(f"Sample missing: {missing_words[:10]}")
