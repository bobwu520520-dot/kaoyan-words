# -*- coding: utf-8 -*-
import zipfile, os, sys, json

sys.stdout.reconfigure(encoding='utf-8')
d_google = r'D:\Google'
v7_zip = os.path.join(d_google, 'kaoyan-words-English1-5500-最终优化版-v7.zip')

with zipfile.ZipFile(v7_zip, 'r') as z:
    with z.open('data/api_examples.jsonl') as f:
        lines = [f.readline().decode('utf-8') for _ in range(10)]
        print(f"Sample 10 lines from v7 api_examples.jsonl:")
        for line in lines:
            if line.strip():
                print(line.strip()[:150])
