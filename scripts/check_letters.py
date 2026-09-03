# -*- coding: utf-8 -*-
import json, os, sys

sys.stdout.reconfigure(encoding='utf-8')
base = r'd:\谷歌反重力\kaoyan_vocab_v9'

with open(os.path.join(base, 'data', 'ai_examples.json'), 'r', encoding='utf-8') as f:
    ai_data = json.load(f)
ai_s = ai_data.get('s', {})

letters = {}
for w in ai_s.keys():
    initial = w[0].lower()
    letters[initial] = letters.get(initial, 0) + 1

print("Letter distribution in ai_examples.json:")
for l in sorted(letters.keys()):
    print(f"  {l}: {letters[l]}")

with open(os.path.join(base, 'data', 'words.json'), 'r', encoding='utf-8') as f:
    words_data = json.load(f)
active_words = [w for w in words_data['words'] if w.get('active') is not False]
active_letters = {}
for w in active_words:
    initial = w['word'][0].lower()
    active_letters[initial] = active_letters.get(initial, 0) + 1

print("\nLetter distribution in active words:")
for l in sorted(active_letters.keys()):
    print(f"  {l}: total {active_letters[l]} (ai has {letters.get(l, 0)}, missing {active_letters[l] - letters.get(l, 0)})")
