# -*- coding: utf-8 -*-
import zipfile, os, sys, json

sys.stdout.reconfigure(encoding='utf-8')
d_google = r'D:\Google'

for f in sorted(os.listdir(d_google)):
    if f.endswith('.zip') and ('kaoyan' in f.lower() or '考研' in f or 'output' in f):
        zp = os.path.join(d_google, f)
        try:
            with zipfile.ZipFile(zp, 'r') as z:
                names = z.namelist()
                print(f"\n=== {f} ({len(names)} files) ===")
                ai_files = [n for n in names if 'ai' in n.lower() or 'example' in n.lower() or 'words.json' in n.lower()]
                for af in ai_files:
                    print(f"  - {af}")
        except Exception as e:
            print(f"Error reading {f}: {e}")
