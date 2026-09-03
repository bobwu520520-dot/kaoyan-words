# -*- coding: utf-8 -*-
"""
Inspect missing fields in words.json to plan enrichment.
"""

import json, os, sys

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'data')

with open(os.path.join(DATA_DIR, 'words.json'), 'r', encoding='utf-8') as f:
    data = json.load(f)

words = [w for w in data['words'] if w.get('active') is not False]
print(f"Total active words: {len(words)}")

no_phonetic = [w for w in words if not w.get('phonetic')]
no_exam = [w for w in words if not w.get('exam_meaning')]
no_colloc = [w for w in words if not w.get('collocation_hint')]
no_pos = [w for w in words if not w.get('pos')]

print(f"Missing phonetic: {len(no_phonetic)}")
print(f"Missing exam_meaning: {len(no_exam)}")
print(f"Missing collocation_hint: {len(no_colloc)}")
print(f"Missing pos: {len(no_pos)}")

if no_pos:
    print(f"Sample missing POS: {[w['word'] for w in no_pos[:10]]}")
if no_phonetic:
    print(f"Sample missing phonetic: {[w['word'] for w in no_phonetic[:10]]}")
