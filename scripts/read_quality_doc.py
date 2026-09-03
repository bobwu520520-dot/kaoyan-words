# -*- coding: utf-8 -*-
import os, sys

sys.stdout.reconfigure(encoding='utf-8')
base = r'd:\谷歌反重力\kaoyan_vocab_v9'

with open(os.path.join(base, 'DATA_QUALITY.md'), 'r', encoding='utf-8') as f:
    text = f.read()
    print("=== DATA_QUALITY.md ===")
    print(text)
