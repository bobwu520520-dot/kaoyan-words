# -*- coding: utf-8 -*-
"""
Sentence diversity and quality analyzer across all active words in words.json.
Identifies repetitive sentence frames, common starters, and simple structures.
"""

import json, os, sys, re
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'data')

with open(os.path.join(DATA_DIR, 'words.json'), 'r', encoding='utf-8') as f:
    data = json.load(f)

words = [w for w in data['words'] if w.get('active') is not False]
print(f"Total active words: {len(words)}")

starters = Counter()
templates_count = Counter()

for w in words:
    en = w.get('example_en', '').strip()
    words_list = en.split()
    if len(words_list) >= 4:
        st = ' '.join(words_list[:3])
        starters[st] += 1

print("\nTop 20 sentence starters:")
for st, cnt in starters.most_common(20):
    print(f"  [{cnt:>4} occurrences] {st}...")

# Check tier-specific distribution
core_words = [w for w in words if w.get('tier') == '核心高频']
high_words = [w for w in words if w.get('tier') == '高频重点']
ext_words = [w for w in words if w.get('tier') in ('重点扩展', '普通扩展')]

print(f"\nCore words: {len(core_words)}, High-freq words: {len(high_words)}, Extension: {len(ext_words)}")
