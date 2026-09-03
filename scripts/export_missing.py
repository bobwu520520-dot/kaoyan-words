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

# Get words missing in ai_s
missing_list = []
for w in active_words:
    wd = w['word']
    if wd not in ai_s:
        missing_list.append({
            'word': wd,
            'pos': w.get('pos', ''),
            'translation': w.get('translation', ''),
            'exam_meaning': w.get('exam_meaning', ''),
            'collocation_hint': w.get('collocation_hint', ''),
            'tier': w.get('tier', '')
        })

print(f"Total words missing in ai_examples.json: {len(missing_list)}")

# Save to data/ai_examples_todo.json
with open(os.path.join(base, 'data', 'ai_examples_todo.json'), 'w', encoding='utf-8') as f:
    json.dump(missing_list, f, ensure_ascii=False, indent=2)

print("Saved to data/ai_examples_todo.json")
