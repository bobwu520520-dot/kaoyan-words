# -*- coding: utf-8 -*-
import json, os, sys

sys.stdout.reconfigure(encoding='utf-8')
base = r'd:\谷歌反重力\kaoyan_vocab_v9'

with open(os.path.join(base, 'data', 'words.json'), 'r', encoding='utf-8') as f:
    words_data = json.load(f)

with open(os.path.join(base, 'data', 'ai_examples.json'), 'r', encoding='utf-8') as f:
    ai_data = json.load(f)

ai_s = ai_data.get('s', {})

print("Checking sample words in ai_examples.json:")
sample_words = ['abate', 'abduction', 'accessible', 'acclaim', 'scrutinize', 'abandon', 'paradox', 'empirical']
for sw in sample_words:
    if sw in ai_s:
        print(f"AI [{sw}]:\n  EN: {ai_s[sw][0]}\n  ZH: {ai_s[sw][1]}")
    else:
        print(f"AI [{sw}]: Not in ai_examples.json")

# Let's inspect words.json for those words
words_dict = {w['word']: w for w in words_data['words']}
print("\nChecking words.json for those words:")
for sw in sample_words:
    if sw in words_dict:
        w = words_dict[sw]
        print(f"WORDS.JSON [{sw}]:\n  example_en: {w.get('example_en')}\n  example_zh: {w.get('example_zh')}")

# Check how many words in words.json have mismatched / low quality examples
# Let's check how frontend loads examples
print("\nChecking frontend usage in js/app.js, js/study.js, js/catalog.js:")
for js_file in ['app.js', 'study.js', 'catalog.js']:
    p = os.path.join(base, 'js', js_file)
    with open(p, 'r', encoding='utf-8') as f:
        content = f.read()
        print(f"--- {js_file} ---")
        for line in content.split('\n'):
            if 'example' in line.lower() or 'ai_example' in line.lower():
                print(' ', line[:120])
