# -*- coding: utf-8 -*-
"""一键打包 v9 发布 zip 到 D:\\Google。
排除：构建中间产物（data/ai_examples/ 分块、todo 清单）、本地备份、开发脚本缓存。
用法: python scripts/pack_v9.py
"""
import os, zipfile, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = r'D:\Google'
os.makedirs(OUT_DIR, exist_ok=True)
name = '考研词汇v9_' + datetime.datetime.now().strftime('%m%d') + '.zip'
out = os.path.join(OUT_DIR, name)

EXCLUDE_DIRS = {'.git', 'node_modules', 'gen'}
EXCLUDE_FILES = {
    'words.backup-4003.json',      # 本地备份
    'todo_words.txt',              # 例句生成中间清单
    'missing.json',                # 合并校验中间产物
    'test_study.js',               # 开发测试
}

count = 0
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for dirpath, dirnames, filenames in os.walk(ROOT):
        rel = os.path.relpath(dirpath, ROOT)
        parts = set(rel.split(os.sep))
        if parts & EXCLUDE_DIRS or 'ai_examples' in parts:
            dirnames[:] = []
            continue
        for fn in filenames:
            if fn in EXCLUDE_FILES:
                continue
            if rel == 'scripts' and not fn.endswith('.py'):
                continue
            full = os.path.join(dirpath, fn)
            arc = os.path.relpath(full, ROOT)
            z.write(full, arc)
            count += 1

print('打包完成:', out)
print('文件数:', count, '| 大小: %.1f KB' % (os.path.getsize(out) / 1024))
