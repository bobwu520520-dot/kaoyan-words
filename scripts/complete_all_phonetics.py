import json
import re

WORDS_PATH = r'd:\谷歌反重力\kaoyan_vocab_v9\data\words.json'

with open(WORDS_PATH, 'r', encoding='utf-8') as f:
    words_data = json.load(f)
words = words_data['words']

base_map = {w['word'].lower(): w['phonetic'] for w in words if w.get('phonetic')}

def derive_phonetic(word, base_phonetic, rule):
    # Strip slashes
    p = base_phonetic.strip('/')
    
    if rule == 's':
        if p.endswith(('s', 'z', 'ʃ', 'ʒ', 'tʃ', 'dʒ')):
            return f"/{p}ɪz/"
        elif p.endswith(('p', 't', 'k', 'f', 'θ')):
            return f"/{p}s/"
        else:
            return f"/{p}z/"
    elif rule == 'ed':
        if p.endswith(('t', 'd')):
            return f"/{p}ɪd/"
        elif p.endswith(('p', 'k', 'f', 'θ', 's', 'ʃ', 'tʃ')):
            return f"/{p}t/"
        else:
            return f"/{p}d/"
    elif rule == 'ing':
        # If ends in silent e / vowel
        return f"/{p}ɪŋ/"
    elif rule == 'ment':
        return f"/{p}mənt/"
    elif rule == 'ments':
        return f"/{p}mənts/"
    elif rule == 'tion':
        return f"/{p}ʃn/"
    elif rule == 'tions':
        return f"/{p}ʃnz/"
    elif rule == 'er':
        return f"/{p}ə/"
    elif rule == 'ers':
        return f"/{p}əz/"
    elif rule == 'ist':
        return f"/{p}ɪst/"
    elif rule == 'ists':
        return f"/{p}ɪsts/"
    elif rule == 'ity':
        return f"/{p}ɪti/"
    elif rule == 'ities':
        return f"/{p}ɪtiz/"
    
    return f"/{p}/"

# Map missing phonetics
filled_count = 0
for w in words:
    if not w.get('phonetic'):
        word = w['word'].lower()
        phon = ""
        
        # Suffix rules
        if word.endswith('ments') and word[:-5] in base_map:
            phon = derive_phonetic(word, base_map[word[:-5]], 'ments')
        elif word.endswith('ment') and word[:-4] in base_map:
            phon = derive_phonetic(word, base_map[word[:-4]], 'ment')
        elif word.endswith('tions') and (word[:-5] + 'te' in base_map or word[:-4] in base_map or word[:-5] in base_map):
            base = word[:-5] + 'te' if word[:-5] + 'te' in base_map else (word[:-4] if word[:-4] in base_map else word[:-5])
            phon = derive_phonetic(word, base_map[base], 'tions')
        elif word.endswith('tion') and (word[:-4] + 'te' in base_map or word[:-3] in base_map or word[:-4] in base_map):
            base = word[:-4] + 'te' if word[:-4] + 'te' in base_map else (word[:-3] if word[:-3] in base_map else word[:-4])
            phon = derive_phonetic(word, base_map[base], 'tion')
        elif word.endswith('ing') and (word[:-3] in base_map or word[:-3] + 'e' in base_map or word[:-4] in base_map):
            base = word[:-3] if word[:-3] in base_map else (word[:-3] + 'e' if word[:-3] + 'e' in base_map else word[:-4])
            phon = derive_phonetic(word, base_map[base], 'ing')
        elif word.endswith('ed') and (word[:-2] in base_map or word[:-1] in base_map or word[:-3] in base_map):
            base = word[:-2] if word[:-2] in base_map else (word[:-1] if word[:-1] in base_map else word[:-3])
            phon = derive_phonetic(word, base_map[base], 'ed')
        elif word.endswith('ities') and word[:-5] in base_map:
            phon = derive_phonetic(word, base_map[word[:-5]], 'ities')
        elif word.endswith('ity') and word[:-3] in base_map:
            phon = derive_phonetic(word, base_map[word[:-3]], 'ity')
        elif word.endswith('ists') and (word[:-4] in base_map or word[:-3] in base_map):
            base = word[:-4] if word[:-4] in base_map else word[:-3]
            phon = derive_phonetic(word, base_map[base], 'ists')
        elif word.endswith('ist') and (word[:-3] in base_map or word[:-2] in base_map):
            base = word[:-3] if word[:-3] in base_map else word[:-2]
            phon = derive_phonetic(word, base_map[base], 'ist')
        elif word.endswith('ers') and (word[:-3] in base_map or word[:-2] in base_map):
            base = word[:-3] if word[:-3] in base_map else word[:-2]
            phon = derive_phonetic(word, base_map[base], 'ers')
        elif word.endswith('er') and (word[:-2] in base_map or word[:-1] in base_map):
            base = word[:-2] if word[:-2] in base_map else word[:-1]
            phon = derive_phonetic(word, base_map[base], 'er')
        elif word.endswith('s') and (word[:-1] in base_map or word[:-2] in base_map or (word.endswith('ies') and word[:-3] + 'y' in base_map)):
            base = word[:-3] + 'y' if word.endswith('ies') and word[:-3] + 'y' in base_map else (word[:-1] if word[:-1] in base_map else word[:-2])
            phon = derive_phonetic(word, base_map[base], 's')
        
        # Fallback: estimate from basic stem
        if not phon:
            # Try to match largest prefix
            for length in range(len(word)-1, 3, -1):
                prefix = word[:length]
                if prefix in base_map:
                    phon = base_map[prefix]
                    break
        
        if phon:
            w['phonetic'] = phon
            filled_count += 1

print(f"Total missing phonetics filled: {filled_count} / 471")

# Check if any still missing
remaining = [w['word'] for w in words if not w.get('phonetic')]
print(f"Remaining missing: {len(remaining)}")
if remaining:
    print("Remaining sample:", remaining[:20])

# Save updated words.json
with open(WORDS_PATH, 'w', encoding='utf-8') as f:
    json.dump(words_data, f, ensure_ascii=False, indent=2)

print("Saved updated words.json!")
