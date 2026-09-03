import json
import re
import os

WORDS_PATH = r'd:\谷歌反重力\kaoyan_vocab_v9\data\words.json'
TRANS_PATH = r'd:\谷歌反重力\kaoyan_vocab_v9\data\translations.json'
AI_PATH = r'd:\谷歌反重力\kaoyan_vocab_v9\data\ai_examples.json'

with open(WORDS_PATH, 'r', encoding='utf-8') as f:
    words_data = json.load(f)
words = words_data['words']

with open(TRANS_PATH, 'r', encoding='utf-8') as f:
    trans_data = json.load(f)
sentences = trans_data['sentences']

with open(AI_PATH, 'r', encoding='utf-8') as f:
    ai_examples = json.load(f).get('s', {})

print("==================================================")
print("             DEEP SYSTEM AUDIT SUITE              ")
print("==================================================")

print(f"1. Total words in words.json: {len(words)}")
print(f"2. Total sentences in translations.json: {len(sentences)}")
print(f"3. Total AI academic examples: {len(ai_examples)}")

# Audit word fields
missing_phonetics = [w['word'] for w in words if not w.get('phonetic')]
missing_meanings = [w['word'] for w in words if not (w.get('exam_meaning') or w.get('translation'))]
missing_examples = [w['word'] for w in words if not (w.get('example_en') or w['word'].lower() in ai_examples)]
words_with_synonyms = [w for w in words if w.get('synonyms')]
words_with_roots = [w for w in words if w.get('root')]
words_with_obscure = [w for w in words if w.get('secondary_meanings')]

print("\n--- VOCABULARY DATA HEALTH ---")
print(f"- Missing phonetics: {len(missing_phonetics)}")
print(f"- Missing meanings: {len(missing_meanings)}")
print(f"- Missing examples: {len(missing_examples)}")
print(f"- Words with synonyms pairs: {len(words_with_synonyms)} ({len(words_with_synonyms)/len(words)*100:.1f}%)")
print(f"- Words with root/affix breakdowns: {len(words_with_roots)} ({len(words_with_roots)/len(words)*100:.1f}%)")
print(f"- Words with obscure/secondary exam meanings: {len(words_with_obscure)} ({len(words_with_obscure)/len(words)*100:.1f}%)")

# Audit translation corpus
print("\n--- TRANSLATION CORPUS HEALTH ---")
trans_missing_rubrics = [s['id'] for s in sentences if not s.get('scoring_rubric') or len(s['scoring_rubric']) < 4]
trans_missing_skeletons = [s['id'] for s in sentences if not s.get('skeleton')]
trans_missing_chunks = [s['id'] for s in sentences if not s.get('chunks')]
trans_missing_flaws = [s['id'] for s in sentences if not s.get('literal_flaw')]

print(f"- Sentences missing 4-point rubrics: {len(trans_missing_rubrics)}")
print(f"- Sentences missing skeleton tokens: {len(trans_missing_skeletons)}")
print(f"- Sentences missing chunks: {len(trans_missing_chunks)}")
print(f"- Sentences missing literal flaw analysis: {len(trans_missing_flaws)}")

# Audit HTML files existence and links
html_files = ['index.html', 'study.html', 'translate.html', 'words.html', 'memory.html']
print("\n--- HTML & ASSETS VERIFICATION ---")
for h in html_files:
    path = os.path.join(r'd:\谷歌反重力\kaoyan_vocab_v9', h)
    exists = os.path.exists(path)
    size = os.path.getsize(path) if exists else 0
    print(f"- {h:15}: {'EXISTS' if exists else 'MISSING'} ({size} bytes)")

print("\n==================================================")
