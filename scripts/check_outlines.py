# -*- coding: utf-8 -*-
import os, sys

sys.stdout.reconfigure(encoding='utf-8')
base = r'd:\谷歌反重力\kaoyan_vocab_v9'
outline_dir = os.path.join(base, 'data', 'outline')

for f in sorted(os.listdir(outline_dir)):
    p = os.path.join(outline_dir, f)
    with open(p, 'r', encoding='utf-8') as fl:
        content = fl.read()
        print(f"=== {f} ({len(content)} chars) ===")
        print(content[:300])
        print("...\n")
