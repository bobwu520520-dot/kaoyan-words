# -*- coding: utf-8 -*-
"""
High quality Kaoyan example generator and optimizer.
Generates / validates / merges high quality postgraduate exam-level example sentences.
"""

import json, os, sys, re

sys.stdout.reconfigure(encoding='utf-8')
base = r'd:\谷歌反重力\kaoyan_vocab_v9'

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

def is_valid_high_quality_example(en, zh, word):
    if not en or not zh:
        return False, "missing"
    en = en.strip()
    zh = zh.strip()
    words = en.split()
    if len(words) < 8:
        return False, "too_short"
    if len(words) > 40:
        return False, "too_long"
    
    # Check target word
    pat = get_word_stems_regex(word)
    if not pat.search(en):
        return False, "target_word_missing"
    
    # Check punctuation
    if not any(en.endswith(p) for p in ['.', '!', '?', '"', "'", '”', '’']):
        return False, "no_ending_punctuation"
    
    # Check bad fragments
    lower_en = en.lower()
    if lower_en.startswith('to ') and len(words) < 10 and not any(p in en for p in ['.', '!', '?']):
        return False, "fragment"
    if (lower_en.startswith('a ') or lower_en.startswith('an ') or lower_en.startswith('the ')) and len(words) < 8:
        return False, "fragment"
    
    return True, "ok"

# Load words.json and ai_examples.json
with open(os.path.join(base, 'data', 'words.json'), 'r', encoding='utf-8') as f:
    words_data = json.load(f)

with open(os.path.join(base, 'data', 'ai_examples.json'), 'r', encoding='utf-8') as f:
    ai_data = json.load(f)

ai_s = ai_data.get('s', {})

active_words = [w for w in words_data['words'] if w.get('active') is not False]
print(f"Total active words: {len(active_words)}")
print(f"Existing AI examples: {len(ai_s)}")

# Find words needing generation or improvement
need_work = []
for w in active_words:
    wd = w['word']
    if wd in ai_s:
        en, zh = ai_s[wd]
        ok, reason = is_valid_high_quality_example(en, zh, wd)
        if not ok:
            need_work.append((w, reason))
    else:
        need_work.append((w, "missing_in_ai"))

print(f"Words needing high quality generation: {len(need_work)}")
