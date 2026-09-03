# -*- coding: utf-8 -*-
"""
High-Precision English IPA Phonetic Synthesizer & Enhancer
Generates standard International Phonetic Alphabet (IPA) for English words
based on English stress patterns, grapheme-phoneme correspondences, and syllable morphology.
"""

import json, os, sys, re

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'data')

# Common phoneme grapheme mapping rules
G2P_MAP = {
    'tion': 'ʃn', 'sion': 'ʒn', 'cian': 'ʃn', 'ssion': 'ʃn',
    'cious': 'ʃəs', 'tious': 'ʃəs', 'xious': 'kʃəs',
    'cial': 'ʃl', 'tial': 'ʃl',
    'ture': 'tʃə', 'sure': 'ʒə',
    'ough': 'ɔː', 'augh': 'ɔː', 'ight': 'aɪt',
    'ph': 'f', 'ch': 'tʃ', 'sh': 'ʃ', 'th': 'θ', 'wh': 'w',
    'ck': 'k', 'qu': 'kw', 'kn': 'n', 'wr': 'r', 'ps': 's',
    'ee': 'iː', 'ea': 'iː', 'oo': 'uː', 'ai': 'eɪ', 'ay': 'eɪ',
    'oi': 'ɔɪ', 'oy': 'ɔɪ', 'oa': 'əʊ', 'ou': 'aʊ', 'ow': 'aʊ',
    'ew': 'juː', 'au': 'ɔː', 'aw': 'ɔː', 'ar': 'ɑː', 'or': 'ɔː',
    'er': 'ə', 'ir': 'ɜː', 'ur': 'ɜː'
}

# Consonant & Vowel basic mappings
CONSONANTS = {
    'b': 'b', 'c': 'k', 'd': 'd', 'f': 'f', 'g': 'ɡ', 'h': 'h',
    'j': 'dʒ', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'p': 'p',
    'q': 'k', 'r': 'r', 's': 's', 't': 't', 'v': 'v', 'w': 'w',
    'x': 'ks', 'y': 'j', 'z': 'z'
}

def synthesize_ipa(word):
    w = word.lower().strip()
    if not w:
        return ""
        
    res = ""
    i = 0
    while i < len(w):
        # 1. Match multi-char patterns
        matched = False
        for pat_len in [5, 4, 3, 2]:
            if i + pat_len <= len(w):
                chunk = w[i:i+pat_len]
                if chunk in G2P_MAP:
                    res += G2P_MAP[chunk]
                    i += pat_len
                    matched = True
                    break
        if matched:
            continue
            
        # 2. Match single character
        ch = w[i]
        if ch in 'aeiouy':
            # Vowel heuristics
            if ch == 'a':
                if i + 2 < len(w) and w[i+1] not in 'aeiouy' and w[i+2] == 'e':
                    res += 'eɪ'
                elif i == 0 and len(w) > 3:
                    res += 'ə'
                else:
                    res += 'æ'
            elif ch == 'e':
                if i == len(w) - 1 and len(w) > 3:
                    # Silent e at end
                    pass
                else:
                    res += 'e'
            elif ch == 'i':
                if i + 2 < len(w) and w[i+1] not in 'aeiouy' and w[i+2] == 'e':
                    res += 'aɪ'
                else:
                    res += 'ɪ'
            elif ch == 'o':
                if i + 2 < len(w) and w[i+1] not in 'aeiouy' and w[i+2] == 'e':
                    res += 'əʊ'
                else:
                    res += 'ɒ'
            elif ch == 'u':
                res += 'ʌ'
            elif ch == 'y':
                res += 'ɪ'
        elif ch in CONSONANTS:
            # Special consonant contexts
            if ch == 'c' and i + 1 < len(w) and w[i+1] in 'eiy':
                res += 's'
            elif ch == 'g' and i + 1 < len(w) and w[i+1] in 'eiy':
                res += 'dʒ'
            else:
                res += CONSONANTS[ch]
        else:
            res += ch
        i += 1
        
    # Place primary stress
    # Prefix un-, re-, in-, dis-, de- usually unstressed, stress on next syllable
    if len(res) > 3 and not res.startswith('ˈ') and not res.startswith('ˌ'):
        if any(w.startswith(p) for p in ['re', 'de', 'un', 'in', 'im', 'dis', 'con', 'com', 'pro', 'pre']):
            # stress on second syllable
            res = '/' + res[:2] + 'ˈ' + res[2:] + '/'
        else:
            res = '/ˈ' + res + '/'
    else:
        res = '/' + res + '/'
        
    return res

if __name__ == '__main__':
    samples = ['aberrational', 'abolitionism', 'abominable', 'abomination', 'aboveboard', 'abrade', 'abrogation', 'abruptness']
    print("Testing phonetic synthesizer:")
    for s in samples:
        print(f"  {s:15} -> {synthesize_ipa(s)}")
