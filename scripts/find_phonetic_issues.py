# -*- coding: utf-8 -*-
import json, re, sys, urllib.request, time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

with open(r'd:\谷歌反重力\kaoyan_vocab_v9\data\words.json', 'r', encoding='utf-8') as f:
    wdata = json.load(f)

words = wdata['words']

flagged = []
for w in words:
    word = w['word']
    ph = w.get('phonetic', '').strip()
    
    # Check criteria:
    # 1. Phonetic ends with 'ness', 'ment', 'less', 'ed' (raw English spelling inside phonetic)
    # 2. Phonetic has 'kk', 'dd', 'bb', 'pp', 'llm'
    # 3. Pseudo-ASCII phonetics: 'ik'splein', 'hwail', 'eniwei', 'estimeit', 'kriminəl'
    # 4. No slashes or missing leading/trailing slash while containing raw spelling
    c1 = bool(re.search(r'(ness|ment|less)/?$', ph))
    c2 = bool(re.search(r'(kk|ddʒ|llm)', ph))
    c3 = bool(re.search(r"(ik'|hwail|eniwei|estimeit|krimin)", ph))
    c4 = ph.startswith('/') and ph.endswith('/') and re.match(r"^/[a-z :\'\",]+/$", ph) and not any(c in ph for c in 'ɪəʌæɒɔʊɜθðʃʒŋɑːɔːiːuː')
    
    if c1 or c2 or c3 or c4:
        flagged.append((word, ph))

print(f"Total flagged words: {len(flagged)}")
with open(r'd:\谷歌反重力\kaoyan_vocab_v9\data\flagged_phonetics.json', 'w', encoding='utf-8') as f:
    json.dump(flagged, f, ensure_ascii=False, indent=2)
