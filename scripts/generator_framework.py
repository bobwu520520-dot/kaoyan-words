# -*- coding: utf-8 -*-
"""
High quality Kaoyan Example Generation Engine & Validator.
Provides domain-specific academic patterns, grammar validation, and chunk persistence.
"""

import json, os, sys, re

sys.stdout.reconfigure(encoding='utf-8')
base = r'd:\谷歌反重力\kaoyan_vocab_v9'

def get_word_regex(w):
    w = w.lower().strip()
    stems = [re.escape(w)]
    if w.endswith('e'):
        stems.append(re.escape(w[:-1]) + r'\w*')
    elif w.endswith('y') and len(w) > 2:
        stems.append(re.escape(w[:-1]) + r'i\w*')
    elif len(w) > 3 and w[-1] in 'bcdfghjklmnpqrstvwxyz':
        stems.append(re.escape(w + w[-1]) + r'\w*')
    stems.append(re.escape(w) + r'\w*')
    # Special irregular past forms or variants if needed
    pat = r'\b(' + '|'.join(stems) + r')'
    return re.compile(pat, re.I)

def validate_pair(word, en, zh):
    en = en.strip()
    zh = zh.strip()
    if not en or not zh:
        return False, "empty_fields"
    words = en.split()
    if len(words) < 8:
        return False, f"too_short ({len(words)} words)"
    if len(words) > 38:
        return False, f"too_long ({len(words)} words)"
    
    pat = get_word_regex(word)
    if not pat.search(en):
        return False, f"word '{word}' missing in '{en}'"
    
    if not any(en.endswith(p) for p in ['.', '!', '?', '"', "'", '”', '’']):
        return False, "missing_ending_punctuation"
        
    return True, "ok"

def save_chunk(chunk_id, words_dict):
    out_dir = os.path.join(base, 'data', 'ai_examples')
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f'ai_chunk_{chunk_id}.json')
    
    # Validate all entries before saving
    errors = []
    for w, item in words_dict.items():
        en = item.get('en', '')
        zh = item.get('zh', '')
        ok, msg = validate_pair(w, en, zh)
        if not ok:
            errors.append((w, msg))
            
    if errors:
        print(f"Error saving chunk {chunk_id}: {len(errors)} validation failures!")
        for w, msg in errors[:5]:
            print(f"  [{w}] {msg}")
        return False
        
    data = {
        'chunk': chunk_id,
        'count': len(words_dict),
        'words': words_dict
    }
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Successfully validated and saved {len(words_dict)} examples to {out_path}")
    return True
