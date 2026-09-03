# -*- coding: utf-8 -*-
"""
Smart Sentence Generator for Postgraduate Exam Vocabulary.
Generates academic-level English sentences and accurate Chinese translations
tailored to Kaoyan reading contexts (Science, Economics, Social Sciences, Law, Humanities, Psychology).
"""

import json, os, sys, re, random

sys.stdout.reconfigure(encoding='utf-8')
base = r'd:\谷歌反重力\kaoyan_vocab_v9'

# Curated academic domain contexts & collocation templates
# To ensure maximum realism, we define contextual domain templates for verbs, nouns, adjectives, and adverbs.

def clean_text(s):
    if not s:
        return ""
    # Remove HTML, trailing punctuation, extra spaces
    s = re.sub(r'<[^>]+>', '', s)
    s = s.strip().rstrip('；;,，。')
    return s

def extract_primary_meaning(translation, exam_meaning):
    if exam_meaning and len(exam_meaning.strip()) > 1:
        # e.g., "处理，解决（address the problem）" -> "处理解决"
        t = re.sub(r'[\(（].*?[\)）]', '', exam_meaning).strip()
        t = t.split('；')[0].split('，')[0].split(';')[0].split(',')[0].strip()
        if t:
            return t
    t = re.sub(r'[\(（].*?[\)）]', '', translation).strip()
    t = t.split('；')[0].split('，')[0].split(';')[0].split(',')[0].strip()
    return t or "相关方面"

# Let's create an extensive curated mapping for known core and high frequency words
# plus robust rule-based academic builders for any remaining vocabulary.

