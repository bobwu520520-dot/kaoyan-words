# -*- coding: utf-8 -*-
import json, os, sys

sys.stdout.reconfigure(encoding='utf-8')
base = r'd:\谷歌反重力\kaoyan_vocab_v9'

with open(os.path.join(base, 'data', 'ai_examples_todo.json'), 'r', encoding='utf-8') as f:
    todo = json.load(f)

core_todo = [x for x in todo if x['tier'] == '核心高频']
print(f"Core high frequency ({len(core_todo)}):")
for item in core_todo:
    print(f"  {item['word']} ({item['pos']}): {item['translation']} | {item['exam_meaning']}")
