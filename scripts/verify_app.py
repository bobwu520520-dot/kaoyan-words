import json
import os
import re

base = r'd:\谷歌反重力\kaoyan_vocab_v9'

# 1. Check all JSON files
for jf in ['words.json', 'ai_examples.json', 'translations.json']:
    p = os.path.join(base, 'data', jf)
    with open(p, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f'JSON OK: {jf} (keys: {list(data.keys())})')

# 2. Check HTML files & script links
html_files = ['index.html', 'study.html', 'exam.html', 'translate.html', 'words.html', 'memory.html']
for hf in html_files:
    p = os.path.join(base, hf)
    with open(p, 'r', encoding='utf-8') as f:
        content = f.read()
    scripts = re.findall(r'src=["\'](.*?)["\']', content)
    for s in scripts:
        sp = os.path.join(base, s)
        assert os.path.exists(sp), f'Missing script: {s} in {hf}'
    print(f'HTML OK: {hf} (all {len(scripts)} scripts present)')

# 3. Check translations.json
trans_path = os.path.join(base, 'data', 'translations.json')
with open(trans_path, 'r', encoding='utf-8') as f:
    tr_data = json.load(f)
assert len(tr_data['sentences']) == 105, 'Expected 105 sentences'
for i, s in enumerate(tr_data['sentences']):
    assert 'sentence_en' in s and len(s['sentence_en']) > 10, f'Sentence {i} invalid en'
    zh = s.get('translation') or s.get('translation_zh')
    assert zh and len(zh) > 5, f'Sentence {i} invalid zh'
    assert 'chunks' in s and len(s['chunks']) >= 3, f'Sentence {i} invalid chunks'
    assert 'scoring_rubric' in s and len(s['scoring_rubric']) == 4, f'Sentence {i} invalid rubric'

print('SUCCESS: All 105 translation entries fully verified!')
