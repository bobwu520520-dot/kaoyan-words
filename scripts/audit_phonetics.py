# -*- coding: utf-8 -*-
import json, re, sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

with open(r'd:\谷歌反重力\kaoyan_vocab_v9\data\words.json', 'r', encoding='utf-8') as f:
    wdata = json.load(f)

words = wdata['words']
print(f"Total words: {len(words)}")

# Check specific examples mentioned by user:
# explain /ik'splein/
# anyway /eniwei/
# meanwhile /mi:nhwail/
# criminal /kriminəl/
# abruptness /ˈəbrʌptness/
# adjournment /ˈəddʒaʊrnment/
# enrollment /ˈenrɒllment/
# accreted /ˈəkkreted/
# estimate /estimeit/

test_words = ['explain', 'anyway', 'meanwhile', 'criminal', 'abruptness', 'adjournment', 'enrollment', 'accreted', 'estimate']
for w in words:
    if w['word'] in test_words:
        print(f"Found sample: {w['word']} -> {w.get('phonetic')}")

# Identify all non-standard IPA phonetics
non_standard = []
for w in words:
    ph = w.get('phonetic', '')
    word = w['word']
    
    # 1. ASCII sound approximations or raw English spellings inside phonetics
    bad = False
    if re.search(r'(ness|ment|less|ed)/?$', ph):
        bad = True
    if re.search(r'(kk|dd|bb|pp|ll|ss)', ph.replace('ness','').replace('less','')):
        bad = True
    if re.match(r"^/?[a-z' :;]+/?$", ph) and not any(c in ph for c in 'əɪʌæɒɔʊɜθðʃʒŋɑːɔːiːuː'):
        bad = True
    if 'hw' in ph or "ik'" in ph or "estimeit" in ph:
        bad = True
        
    if bad:
        non_standard.append((word, ph))

print(f"\nTotal non-standard/ASCII phonetics found: {len(non_standard)}")
with open(r'd:\谷歌反重力\kaoyan_vocab_v9\data\non_standard_phonetics.json', 'w', encoding='utf-8') as f:
    json.dump(non_standard, f, ensure_ascii=False, indent=2)
print("Saved to data/non_standard_phonetics.json")
