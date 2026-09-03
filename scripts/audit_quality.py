# -*- coding: utf-8 -*-
import json, os, sys, re

sys.stdout.reconfigure(encoding='utf-8')
base = r'd:\谷歌反重力\kaoyan_vocab_v9'

with open(os.path.join(base, 'data', 'words.json'), 'r', encoding='utf-8') as f:
    words_data = json.load(f)

words = words_data['words']
active_words = [w for w in words if w.get('active') is not False]

with open(os.path.join(base, 'data', 'ai_examples.json'), 'r', encoding='utf-8') as f:
    ai_data = json.load(f)
ai_s = ai_data.get('s', {})

print(f"Total words: {len(words)}, Active words: {len(active_words)}")
print(f"Total entries in ai_examples.json: {len(ai_s)}")

def get_word_stems(w):
    w = w.lower().strip()
    stems = [re.escape(w)]
    if w.endswith('e'):
        stems.append(re.escape(w[:-1]) + r'\w*')
    elif w.endswith('y') and len(w) > 2:
        stems.append(re.escape(w[:-1]) + r'i\w*')
    elif len(w) > 3 and w[-1] in 'bcdfghjklmnpqrstvwxyz':
        # doubled consonant
        stems.append(re.escape(w + w[-1]) + r'\w*')
    stems.append(re.escape(w) + r'\w*')
    pat = r'\b(' + '|'.join(stems) + r')'
    return re.compile(pat, re.I)

# Check quality categories for each word
status_counts = {
    'good_in_ai': 0, # In ai_examples and good
    'mismatch_in_words': 0, # words.json en is short but zh is from ai
    'both_empty_in_words': 0,
    'en_empty_in_words': 0,
    'zh_empty_in_words': 0,
    'short_en_in_words': 0,
    'missing_target_word': 0,
    'good_in_words': 0,
}

mismatched_words = []
missing_in_both = []
low_quality_words = []

for w in active_words:
    wd = w['word']
    en = (w.get('example_en') or '').strip()
    zh = (w.get('example_zh') or '').strip()
    ai_pair = ai_s.get(wd)
    
    pat = get_word_stems(wd)
    en_has_word = bool(pat.search(en)) if en else False
    
    # Check if words.json has the mismatch (short en, but ai zh)
    if ai_pair and ai_pair[1] == zh and en != ai_pair[0]:
        mismatched_words.append((wd, en, zh, ai_pair[0]))
    
    # Is words.json example low quality?
    is_low_quality = False
    reasons = []
    
    if not en and not zh:
        is_low_quality = True
        reasons.append('both_empty')
    elif not en:
        is_low_quality = True
        reasons.append('missing_en')
    elif not zh:
        is_low_quality = True
        reasons.append('missing_zh')
    elif len(en.split()) < 7:
        is_low_quality = True
        reasons.append('too_short')
    elif not en_has_word:
        is_low_quality = True
        reasons.append('no_target_word')
    
    if is_low_quality:
        low_quality_words.append({
            'word': wd,
            'tier': w.get('tier'),
            'translation': w.get('translation'),
            'exam_meaning': w.get('exam_meaning'),
            'pos': w.get('pos'),
            'current_en': en,
            'current_zh': zh,
            'ai_pair': ai_pair,
            'reasons': reasons
        })

print(f"\nTotal words with low quality / missing examples in words.json: {len(low_quality_words)} / {len(active_words)}")
print(f"Mismatched words (short EN + AI ZH): {len(mismatched_words)}")

# Breakdown of low quality words by reasons
reason_dist = {}
for item in low_quality_words:
    r_key = "+".join(item['reasons'])
    reason_dist[r_key] = reason_dist.get(r_key, 0) + 1

print("\nLow quality reasons distribution in words.json:")
for r, c in sorted(reason_dist.items(), key=lambda x: -x[1]):
    print(f"  {r}: {c}")

# Check how many of low_quality_words can be directly fixed by ai_examples.json
fixable_by_ai = [item for item in low_quality_words if item['ai_pair'] and len(item['ai_pair'][0].split()) >= 7 and get_word_stems(item['word']).search(item['ai_pair'][0])]
print(f"\nCan be immediately fixed from ai_examples.json: {len(fixable_by_ai)}")

still_need_ai = [item for item in low_quality_words if not item['ai_pair'] or len(item['ai_pair'][0].split()) < 7 or not get_word_stems(item['word']).search(item['ai_pair'][0])]
print(f"Still need new high quality examples: {len(still_need_ai)}")

print(f"\nBreakdown of still_need_ai by tier:")
tier_need = {}
for item in still_need_ai:
    t = item['tier'] or 'unknown'
    tier_need[t] = tier_need.get(t, 0) + 1
for t, c in tier_need.items():
    print(f"  {t}: {c}")
