# -*- coding: utf-8 -*-
import json, os, sys, re

sys.stdout.reconfigure(encoding='utf-8')

base = r'd:\谷歌反重力\kaoyan_vocab_v9'
with open(os.path.join(base, 'data', 'words.json'), 'r', encoding='utf-8') as f:
    words_data = json.load(f)

words = words_data['words']
print('Total words in words.json:', len(words))

active_words = [w for w in words if w.get('active') is not False]
print('Active words:', len(active_words))

tier_stats = {}
for w in active_words:
    t = w.get('tier', 'unknown')
    tier_stats[t] = tier_stats.get(t, 0) + 1
print('Tiers:', tier_stats)

no_en = [w for w in active_words if not (w.get('example_en') or '').strip()]
no_zh = [w for w in active_words if not (w.get('example_zh') or '').strip()]
both_present = [w for w in active_words if (w.get('example_en') or '').strip() and (w.get('example_zh') or '').strip()]

print(f'Active words with no example_en: {len(no_en)}')
print(f'Active words with no example_zh: {len(no_zh)}')
print(f'Active words with both en & zh: {len(both_present)}')

# Also check ai_examples.json
ai_file = os.path.join(base, 'data', 'ai_examples.json')
if os.path.exists(ai_file):
    with open(ai_file, 'r', encoding='utf-8') as f:
        ai_data = json.load(f)
    ai_s = ai_data.get('s', {})
    print(f'ai_examples.json total keys: {len(ai_s)}')
    ai_for_active = [w['word'] for w in active_words if w['word'] in ai_s]
    print(f'ai_examples present for active words: {len(ai_for_active)} / {len(active_words)}')

# Check types of issues in current words.json examples
issues = {
    'no_example': [],
    'no_translation': [],
    'too_short': [], # < 6 words
    'word_missing': [], # target word not in example_en
    'translation_bad': [],
}

def word_in_sentence(word, text):
    stem = re.escape(word)
    alt = re.escape(word[:-1]) + r'\w*' if word.endswith('e') else None
    pat = r'\b(' + stem + r'\w*' + (('|' + alt) if alt else '') + r')'
    return re.search(pat, text, re.I) is not None

for w in active_words:
    en = (w.get('example_en') or '').strip()
    zh = (w.get('example_zh') or '').strip()
    wd = w.get('word', '')
    
    if not en:
        issues['no_example'].append(wd)
        continue
    if not zh:
        issues['no_translation'].append(wd)
    elif len(en.split()) < 6:
        issues['too_short'].append((wd, en, zh))
    elif not word_in_sentence(wd, en):
        issues['word_missing'].append((wd, en, zh))

print(f"Issue counts: no_example={len(issues['no_example'])}, no_translation={len(issues['no_translation'])}, too_short={len(issues['too_short'])}, word_missing={len(issues['word_missing'])}")

print('\nSample too_short examples:')
for wd, en, zh in issues['too_short'][:10]:
    print(f"  [{wd}] EN: {en} | ZH: {zh}")

print('\nSample word_missing examples:')
for wd, en, zh in issues['word_missing'][:10]:
    print(f"  [{wd}] EN: {en} | ZH: {zh}")

print('\nSample no_translation words (first 10):')
print(' ', issues['no_translation'][:10])

# Inspect where ai_examples are used in frontend
print('\nChecking what frontend reads: app.js, study.js, catalog.js')
