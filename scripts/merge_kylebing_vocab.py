# -*- coding: utf-8 -*-
"""
Fetch and merge KyleBing english-vocabulary into Kaoyan Vocab App.
1. Enriches 5,619 Kaoyan words with phrases and collocations.
2. Generates compact dict_54k.json for full 54,356 global word lookup.
"""

import urllib.request
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
CACHE_DIR = os.path.join(BASE_DIR, 'scripts', 'kylebing_cache')
os.makedirs(CACHE_DIR, exist_ok=True)

CATEGORIES = [
    ('初中', 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/1-%E5%88%9D%E4%B8%AD-%E9%A1%BA%E5%BA%8F.json'),
    ('高中', 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/2-%E9%AB%98%E4%B8%AD-%E9%A1%BA%E5%BA%8F.json'),
    ('四级', 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/3-CET4-%E9%A1%BA%E5%BA%8F.json'),
    ('六级', 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/4-CET6-%E9%A1%BA%E5%BA%8F.json'),
    ('考研', 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/5-%E8%80%83%E7%A0%94-%E9%A1%BA%E5%BA%8F.json'),
    ('托福', 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/6-%E6%89%98%E7%A6%8F-%E9%A1%BA%E5%BA%8F.json'),
    ('SAT', 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/7-SAT-%E9%A1%BA%E5%BA%8F.json'),
]

def download_or_get_cached(name, url):
    cache_file = os.path.join(CACHE_DIR, f'{name}.json')
    if os.path.exists(cache_file) and os.path.getsize(cache_file) > 10000:
        print(f'Using cached {name}: {cache_file}')
        with open(cache_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    print(f'Downloading {name} from {url}...')
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as resp:
        content = resp.read().decode('utf-8')
    with open(cache_file, 'w', encoding='utf-8') as f:
        f.write(content)
    return json.loads(content)

def main():
    print('=== Step 1: Loading KyleBing Vocabulary Datasets ===')
    # Dictionary mapping word.lower() -> dict with phrases, translations, categories
    global_dict = {} # word -> {'trans': str, 'phrases': list of {'p': str, 'c': str}, 'tags': set}

    # Priority order: 考研, 六级, 四级, 高中, 托福, SAT, 初中
    order = ['考研', '六级', '四级', '托福', 'SAT', '高中', '初中']
    cat_map = {name: url for name, url in CATEGORIES}

    for name in order:
        url = cat_map[name]
        try:
            items = download_or_get_cached(name, url)
            print(f'Loaded {name}: {len(items):,} items')
            for it in items:
                w = it.get('word', '').strip()
                if not w:
                    continue
                w_lower = w.lower()

                # Extract translations
                trans_list = []
                for t in it.get('translations', []):
                    tt = t.get('translation', '').strip()
                    tp = t.get('type', '').strip()
                    if tp and not tt.startswith(tp):
                        trans_list.append(f'{tp}. {tt}')
                    else:
                        trans_list.append(tt)
                trans_str = '；'.join(trans_list)

                # Extract phrases
                raw_phrases = it.get('phrases', [])
                phrases = []
                for p in raw_phrases:
                    p_text = p.get('phrase', '').strip()
                    p_cn = p.get('translation', '').strip()
                    if p_text and p_cn:
                        phrases.append({'p': p_text, 'c': p_cn})

                if w_lower not in global_dict:
                    global_dict[w_lower] = {
                        'word': w,
                        'trans': trans_str,
                        'phrases': phrases,
                        'tags': [name]
                    }
                else:
                    if name not in global_dict[w_lower]['tags']:
                        global_dict[w_lower]['tags'].append(name)
                    # Merge phrases without duplicates
                    existing_p = {x['p'].lower() for x in global_dict[w_lower]['phrases']}
                    for p in phrases:
                        if p['p'].lower() not in existing_p:
                            global_dict[w_lower]['phrases'].append(p)
                            existing_p.add(p['p'].lower())
                    if not global_dict[w_lower]['trans'] and trans_str:
                        global_dict[w_lower]['trans'] = trans_str
        except Exception as e:
            print(f'Failed to load {name}: {e}')

    print(f'Total unique words in global dictionary: {len(global_dict):,}')

    print('\n=== Step 2: Enriching Local 5,619 Kaoyan Vocabulary ===')
    words_file = os.path.join(DATA_DIR, 'words.json')
    with open(words_file, 'r', encoding='utf-8') as f:
        words_data = json.load(f)

    local_words = words_data['words']
    enriched_count = 0
    total_phrases_added = 0

    for item in local_words:
        w_lower = item['word'].lower()
        if w_lower in global_dict:
            k_entry = global_dict[w_lower]
            # Take top 5 most relevant phrases
            all_phrases = k_entry['phrases']
            if all_phrases:
                # Prefer concise phrases <= 4 words
                filtered = [p for p in all_phrases if len(p['p'].split()) <= 4]
                if not filtered:
                    filtered = all_phrases
                selected = filtered[:5]
                item['phrases'] = selected
                enriched_count += 1
                total_phrases_added += len(selected)
            else:
                item['phrases'] = []
        else:
            item['phrases'] = []

    print(f'Enriched {enriched_count}/{len(local_words)} Kaoyan words with {total_phrases_added:,} phrases!')

    # Save updated words.json
    with open(words_file, 'w', encoding='utf-8') as f:
        json.dump(words_data, f, ensure_ascii=False, indent=2)
    print(f'Saved updated {words_file}')

    # Update words_bundle.js
    words_bundle_file = os.path.join(DATA_DIR, 'words_bundle.js')
    bundle_content = 'window.__INITIAL_WORDS__ = ' + json.dumps(words_data, ensure_ascii=False) + ';\n'
    with open(words_bundle_file, 'w', encoding='utf-8') as f:
        f.write(bundle_content)
    print(f'Saved updated {words_bundle_file} ({os.path.getsize(words_bundle_file):,} bytes)')

    print('\n=== Step 3: Generating Compact 5.4万 Global Dictionary Index (dict_54k.json) ===')
    # Build a compact index: [ [word, trans, [ [p, c], ... ], tags_str], ... ]
    compact_list = []
    for w_lower in sorted(global_dict.keys()):
        entry = global_dict[w_lower]
        word = entry['word']
        trans = entry['trans']
        # Top 3 phrases formatted as [p, c]
        phrases = [[p['p'], p['c']] for p in entry['phrases'][:3]]
        tags = ','.join(entry['tags'])
        compact_list.append({
            'w': word,
            't': trans,
            'p': phrases,
            'g': tags
        })

    dict_54k_file = os.path.join(DATA_DIR, 'dict_54k.json')
    with open(dict_54k_file, 'w', encoding='utf-8') as f:
        json.dump(compact_list, f, ensure_ascii=False, separators=(',', ':'))
    print(f'Saved compact 5.4万 dictionary index to {dict_54k_file} ({os.path.getsize(dict_54k_file):,} bytes)')

    # Also generate dict_54k_bundle.js for zero-network/offline environments
    dict_bundle_file = os.path.join(DATA_DIR, 'dict_54k_bundle.js')
    with open(dict_bundle_file, 'w', encoding='utf-8') as f:
        f.write('window.__DICT_54K__ = ' + json.dumps(compact_list, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print(f'Saved {dict_bundle_file} ({os.path.getsize(dict_bundle_file):,} bytes)')

    print('\n=== ALL KYLEBING INTEGRATIONS COMPLETED SUCCESSFULLY! ===')

if __name__ == '__main__':
    main()
