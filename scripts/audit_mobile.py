# -*- coding: utf-8 -*-
import os, sys, re

BASE_DIR = r'd:\谷歌反重力\kaoyan_vocab_v9'

def audit_mobile():
    print("==================================================")
    print("       MOBILE VIEWPORT & RESPONSIVE AUDIT         ")
    print("==================================================")

    html_files = ['study.html', 'translate.html', 'memory.html', 'index.html', 'words.html']
    css_path = os.path.join(BASE_DIR, 'css', 'style.css')
    
    with open(css_path, 'r', encoding='utf-8') as f:
        css_content = f.read()

    issues = []

    for hf in html_files:
        hp = os.path.join(BASE_DIR, hf)
        with open(hp, 'r', encoding='utf-8') as f:
            html = f.read()

        print(f"\n--- Checking {hf} ---")
        
        # 1. Check viewport meta
        if 'name="viewport"' not in html:
            issues.append(f"{hf}: Missing viewport meta tag!")
        else:
            print(f"  [OK] Viewport meta tag present")

        # 2. Check bottom nav bar vs mobile-nav
        has_nav = 'nav class="nav"' in html or 'nav class="mobile-nav"' in html or 'bottom-nav' in html
        print(f"  [Info] Navigation elements found: {has_nav}")

        # 3. Check for fixed bottom overlapping risks
        if 'padding-bottom' not in html and 'padding-bottom' not in css_content:
            issues.append(f"{hf}: Possible bottom overlap with fixed mobile bar")

    print("\n==================================================")
    print(f"Initial Scan Complete. Issues: {len(issues)}")
    print("==================================================")

if __name__ == '__main__':
    audit_mobile()
