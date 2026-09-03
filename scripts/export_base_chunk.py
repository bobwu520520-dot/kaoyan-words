# -*- coding: utf-8 -*-
import json, os, sys

sys.stdout.reconfigure(encoding='utf-8')
base = r'd:\谷歌反重力\kaoyan_vocab_v9'

with open(os.path.join(base, 'data', 'ai_examples.json'), 'r', encoding='utf-8') as f:
    ai_data = json.load(f)

ai_s = ai_data.get('s', {})
words_dict = {w: {'en': pair[0], 'zh': pair[1]} for w, pair in ai_s.items()}

out_path = os.path.join(base, 'data', 'ai_examples', 'ai_chunk_00_base.json')
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump({'chunk': '00_base', 'count': len(words_dict), 'words': words_dict}, f, ensure_ascii=False, indent=2)

print(f"Saved {len(words_dict)} existing AI examples to {out_path}")
