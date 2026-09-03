# -*- coding: utf-8 -*-
import json, os, sys, glob

sys.stdout.reconfigure(encoding='utf-8')
base = r'd:\谷歌反重力\kaoyan_vocab_v9'

print("Checking subdirectories in data:")
for root, dirs, files in os.walk(os.path.join(base, 'data')):
    print(f"Directory: {root}")
    for f in files:
        p = os.path.join(root, f)
        print(f"  - {f} ({os.path.getsize(p)} bytes)")

print("\nChecking scripts:")
for root, dirs, files in os.walk(os.path.join(base, 'scripts')):
    print(f"Directory: {root}")
    for f in files:
        p = os.path.join(root, f)
        print(f"  - {f} ({os.path.getsize(p)} bytes)")
