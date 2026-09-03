# -*- coding: utf-8 -*-
import os, sys, glob

sys.stdout.reconfigure(encoding='utf-8')
base = r'd:\谷歌反重力\kaoyan_vocab_v9'
ai_dir = os.path.join(base, 'data', 'ai_examples')
os.makedirs(ai_dir, exist_ok=True)

files = os.listdir(ai_dir)
print(f"Files in data/ai_examples/ ({len(files)}):")
for f in files:
    p = os.path.join(ai_dir, f)
    print(f"  {f}: {os.path.getsize(p)} bytes")
