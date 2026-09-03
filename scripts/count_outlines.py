# -*- coding: utf-8 -*-
import json, os, sys

sys.stdout.reconfigure(encoding='utf-8')
base = r'd:\谷歌反重力\kaoyan_vocab_v9'

outline_dir = os.path.join(base, 'data', 'outline')
for f in sorted(os.listdir(outline_dir)):
    p = os.path.join(outline_dir, f)
    with open(p, 'r', encoding='utf-8') as fl:
        lines = [line.strip() for line in fl if line.strip()]
        print(f"{f}: {len(lines)} lines")
