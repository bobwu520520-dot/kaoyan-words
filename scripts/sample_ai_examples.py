# -*- coding: utf-8 -*-
import json, os, sys

sys.stdout.reconfigure(encoding='utf-8')
base = r'd:\谷歌反重力\kaoyan_vocab_v9'

with open(os.path.join(base, 'data', 'ai_examples.json'), 'r', encoding='utf-8') as f:
    ai_data = json.load(f)

ai_s = ai_data.get('s', {})

keys = list(ai_s.keys())
print(f"Sample 15 entries from existing ai_examples.json:")
for k in keys[100:115]:
    en, zh = ai_s[k]
    print(f"[{k}] ({len(en.split())} words)")
    print(f"  EN: {en}")
    print(f"  ZH: {zh}\n")
