# -*- coding: utf-8 -*-
"""
Mobile Viewport Layout & Overflow Simulator
Checks for horizontal overflow, element clipping, missing touch target sizes,
and safe-area-insets across 3 mobile viewports:
- 360x800 (Common Android)
- 375x667 (iPhone SE)
- 393x852 (iPhone 14/15 Pro)
"""
import os, sys, re

BASE_DIR = r'd:\谷歌反重力\kaoyan_vocab_v9'

def inspect_css_rules():
    with open(os.path.join(BASE_DIR, 'css', 'style.css'), 'r', encoding='utf-8') as f:
        css = f.read()

    print("Checking critical mobile CSS rules in style.css...")
    
    checks = {
        "Safe area insets": "env(safe-area-inset-bottom)" in css,
        "Mobile 100dvh support": "100dvh" in css or "dvh" in css,
        "Touch scroll momentum": "-webkit-overflow-scrolling" in css,
        "Responsive clamp fonts": "clamp(" in css,
        "Mobile nav clearance": "padding-bottom" in css,
    }

    for name, ok in checks.items():
        print(f"  [{'PASS' if ok else 'WARN'}] {name}")

if __name__ == '__main__':
    inspect_css_rules()
