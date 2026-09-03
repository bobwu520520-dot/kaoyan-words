# -*- coding: utf-8 -*-
import json, os, sys

sys.stdout.reconfigure(encoding='utf-8')
base = r'd:\谷歌反重力\kaoyan_vocab_v9'

with open(os.path.join(base, 'data', 'ai_examples_todo.json'), 'r', encoding='utf-8') as f:
    todo = json.load(f)

ae_words = [x for x in todo if x['word'][0].lower() in 'abcde']
print(f"Total words in A-E: {len(ae_words)}")
print("First 20 words in A-E:")
for x in ae_words[:20]:
    print(f"  {x['word']}: pos={x['pos']}, trans={x['translation'][:20]}, exam={x['exam_meaning'][:20]}, col={x['collocation_hint'][:20]}")
