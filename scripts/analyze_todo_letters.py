# -*- coding: utf-8 -*-
import json, os, sys

sys.stdout.reconfigure(encoding='utf-8')
base = r'd:\谷歌反重力\kaoyan_vocab_v9'

with open(os.path.join(base, 'data', 'ai_examples_todo.json'), 'r', encoding='utf-8') as f:
    todo = json.load(f)

by_letter = {}
for item in todo:
    l = item['word'][0].lower()
    if l not in by_letter:
        by_letter[l] = []
    by_letter[l].append(item)

print(f"Total words to generate: {len(todo)}")
for l in sorted(by_letter.keys()):
    print(f"Letter '{l}': {len(by_letter[l])} words")
