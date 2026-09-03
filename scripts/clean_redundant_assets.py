# -*- coding: utf-8 -*-
"""
clean_redundant_assets.py - 自动清理与筛选生产环境/APK运行所需资源的工具脚本

功能：
1. 精确识别运行时必需资产与构建中间产物
2. 为 Android APK 与生产包提供精简的 assets 过滤复制逻辑
3. 避免将 python 脚本、构建中间件 (ai_chunk_*.json, *_todo.json, bank2000.json, outline/ 等) 打入 APK
"""

import os
import shutil

# 必须打包进生产环境/APK的运行时文件与目录规则
RUNTIME_EXTENSIONS = {'.html', '.css', '.js', '.json', '.webmanifest', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.txt'}

# 严格排除的目录
EXCLUDED_DIR_NAMES = {
    '.git', '.agents', '.gemini', '__pycache__', 'node_modules', 
    'scripts', 'outline', 'ai_examples', 'gen', 'build'
}

# 明确排除的数据中间文件
EXCLUDED_DATA_FILES = {
    'ai_examples_todo.json',
    'bank2000.json',
    'example_fill_report.json',
    'example_todo_high_frequency.json',
    'manual.json',
    'words.backup-4003.json',
    'todo_words.txt',
    'missing.json',
    'test_study.js',
    'dict_54k.json',
    'dict_54k_bundle.js'
}

def is_runtime_file(rel_path):
    """判断文件是否属于生产环境运行时文件"""
    parts = rel_path.replace('\\', '/').split('/')
    
    # 检查是否在排除目录中
    for p in parts[:-1]:
        if p in EXCLUDED_DIR_NAMES:
            return False
            
    filename = parts[-1]
    
    # 检查是否是明确排除的文件
    if filename in EXCLUDED_DATA_FILES:
        return False
        
    # 排除 python 脚本、markdown 文档（除有特殊需求外）、临时文件
    ext = os.path.splitext(filename)[1].lower()
    if ext in {'.py', '.pyc', '.bat', '.sh', '.md'}:
        return False
        
    if ext not in RUNTIME_EXTENSIONS:
        return False
        
    return True

def copy_runtime_assets(src_root, dest_assets_dir):
    """将 src_root 中的纯运行时文件复制到 dest_assets_dir，自动剥离全部冗余"""
    if os.path.exists(dest_assets_dir):
        shutil.rmtree(dest_assets_dir)
    os.makedirs(dest_assets_dir, exist_ok=True)
    
    copied_count = 0
    total_bytes = 0
    
    for root, dirs, files in os.walk(src_root):
        # 实时修剪搜索目录
        dirs[:] = [d for d in dirs if d not in EXCLUDED_DIR_NAMES]
        
        rel_root = os.path.relpath(root, src_root)
        if rel_root == '.':
            target_dir = dest_assets_dir
        else:
            target_dir = os.path.join(dest_assets_dir, rel_root)
            
        for f in files:
            full_src = os.path.join(root, f)
            rel_file = os.path.relpath(full_src, src_root)
            
            if is_runtime_file(rel_file):
                os.makedirs(target_dir, exist_ok=True)
                dest_file = os.path.join(target_dir, f)
                shutil.copy2(full_src, dest_file)
                copied_count += 1
                total_bytes += os.path.getsize(dest_file)
                
    print(f"[OK] Successfully synced clean runtime assets: {copied_count} files ({total_bytes / (1024*1024):.2f} MB)")
    return copied_count, total_bytes

if __name__ == '__main__':
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    test_out = os.path.join(project_root, 'build_test_assets')
    copy_runtime_assets(project_root, test_out)
    shutil.rmtree(test_out, ignore_errors=True)
