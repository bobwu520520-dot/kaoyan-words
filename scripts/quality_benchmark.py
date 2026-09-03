# -*- coding: utf-8 -*-
import json, os, sys, re

sys.stdout.reconfigure(encoding='utf-8')
base = r'd:\谷歌反重力\kaoyan_vocab_v9'

with open(os.path.join(base, 'data', 'words.json'), 'r', encoding='utf-8') as f:
    words_data = json.load(f)

words = words_data['words']
active_words = [w for w in words if w.get('active') is not False]

with open(os.path.join(base, 'data', 'ai_examples.json'), 'r', encoding='utf-8') as f:
    ai_data = json.load(f)
ai_s = ai_data.get('s', {})

print(f"Total active words: {len(active_words)}")

def is_high_quality(en, zh, word):
    if not en or not zh:
        return False, "missing_field"
    en = en.strip()
    zh = zh.strip()
    words_list = en.split()
    if len(words_list) < 8:
        return False, "too_short"
    
    # Check if target word in en
    w = word.lower().strip()
    stems = [re.escape(w)]
    if w.endswith('e'):
        stems.append(re.escape(w[:-1]) + r'\w*')
    elif w.endswith('y') and len(w) > 2:
        stems.append(re.escape(w[:-1]) + r'i\w*')
    elif len(w) > 3 and w[-1] in 'bcdfghjklmnpqrstvwxyz':
        stems.append(re.escape(w + w[-1]) + r'\w*')
    stems.append(re.escape(w) + r'\w*')
    pat = re.compile(r'\b(' + '|'.join(stems) + r')', re.I)
    if not pat.search(en):
        return False, "no_target_word"
    
    # Check for dictionary definition fragments / formulaic patterns
    if en.lower().startswith('to ') and len(words_list) < 10 and not any(p in en for p in ['.', '!', '?']):
        return False, "phrase_fragment"
    if en.lower().startswith('the ') and len(words_list) < 8 and not any(p in en for p in ['.', '!', '?']):
        return False, "phrase_fragment"
    if en.lower().startswith('an ') and len(words_list) < 8 and not any(p in en for p in ['.', '!', '?']):
        return False, "phrase_fragment"
    if en.lower().startswith('a ') and len(words_list) < 8 and not any(p in en for p in ['.', '!', '?']):
        return False, "phrase_fragment"
    
    return True, "ok"

# Let's test ai_examples.json
ai_good = 0
ai_bad = 0
ai_bad_samples = []
for w, pair in ai_s.items():
    if isinstance(pair, dict):
        en_val = pair.get('en', '')
        zh_val = pair.get('zh', '')
    elif isinstance(pair, (list, tuple)):
        en_val = pair[0] if len(pair) > 0 else ''
        zh_val = pair[1] if len(pair) > 1 else ''
    else:
        en_val, zh_val = '', ''
    ok, reason = is_high_quality(en_val, zh_val, w)
    if ok:
        ai_good += 1
    else:
        ai_bad += 1
        ai_bad_samples.append((w, en_val, zh_val, reason))

print(f"ai_examples.json: {ai_good} high quality, {ai_bad} need improvement")
if ai_bad_samples:
    print("Sample bad in ai_examples.json:")
    for item in ai_bad_samples[:5]:
        print(f"  [{item[0]}] reason={item[3]} | EN: {item[1]} | ZH: {item[2]}")

# Let's test words.json
words_good = 0
words_bad = 0
words_bad_items = []
for w in active_words:
    wd = w['word']
    en = w.get('example_en', '')
    zh = w.get('example_zh', '')
    ok, reason = is_high_quality(en, zh, wd)
    if ok:
        words_good += 1
    else:
        words_bad += 1
        words_bad_items.append((w, reason))

print(f"words.json active words: {words_good} high quality, {words_bad} low quality/missing")
