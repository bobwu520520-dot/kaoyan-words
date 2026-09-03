# -*- coding: utf-8 -*-
import json, os, sys

sys.stdout.reconfigure(encoding='utf-8')
base = r'd:\谷歌反重力\kaoyan_vocab_v9'

with open(os.path.join(base, 'data', 'words.json'), 'r', encoding='utf-8') as f:
    words_data = json.load(f)

with open(os.path.join(base, 'data', 'ai_examples.json'), 'r', encoding='utf-8') as f:
    ai_data = json.load(f)
ai_s = ai_data.get('s', {})

active_words = [w for w in words_data['words'] if w.get('active') is not False]
missing_words = [w for w in active_words if w['word'] not in ai_s]

print(f"Total missing in ai_examples.json: {len(missing_words)}")
tier_counts = {}
for w in missing_words:
    t = w.get('tier', 'unknown')
    tier_counts[t] = tier_counts.get(t, 0) + 1

for t, c in tier_counts.items():
    print(f"  {t}: {c}")

print("\nSample missing words in each tier:")
for t in tier_counts.keys():
    samples = [w['word'] + ' (' + (w.get('translation') or '')[:15] + ')' for w in missing_words if w.get('tier') == t][:8]
    print(f"  [{t}]: {', '.join(samples)}")
