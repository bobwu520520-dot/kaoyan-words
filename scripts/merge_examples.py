# -*- coding: utf-8 -*-
"""合并 api_examples.jsonl 到 words.json,并检查例句含目标词"""
import json, sys, re

sys.stdout.reconfigure(encoding='utf-8')
PATH = 'data/words.json'
d = json.load(open(PATH, encoding='utf-8'))
words = {x['word']: x for x in d['words']}

IRREG = {'be','am','is','are','was','were','been','being','bear','bore','borne','born','beat','beaten',
'become','became','begin','began','begun','bend','bent','bet','bid','bade','bidden','bind','bound',
'bite','bit','bitten','bleed','bled','blow','blew','blown','break','broke','broken','breed','bred',
'bring','brought','build','built','burn','burnt','buy','bought','cast','catch','caught','choose',
'chose','chosen','cling','clung','come','came','cost','creep','crept','cut','deal','dealt','dig',
'dug','do','did','done','draw','drew','drawn','dream','dreamt','drink','drank','drunk','drive',
'drove','driven','dwell','dwelt','eat','ate','eaten','fall','fell','fallen','feed','fed','feel',
'felt','fight','fought','find','found','flee','fled','fling','flung','fly','flew','flown','forbid',
'forbade','forbidden','forget','forgot','forgotten','forgive','forgave','forgiven','freeze','froze',
'frozen','get','got','gotten','give','gave','given','go','went','gone','grind','ground','grow',
'grew','grown','hang','hung','have','had','hear','heard','hide','hid','hidden','hit','hold','held',
'hurt','keep','kept','kneel','knelt','know','knew','known','lay','laid','lead','led','lean','leant',
'leap','leapt','learn','learnt','leave','left','lend','lent','let','lie','lay','lain','light','lit',
'lose','lost','make','made','mean','meant','meet','met','mistake','mistook','mistaken','overcome',
'overcame','pay','paid','put','quit','read','rid','ride','rode','ridden','ring','rang','rung',
'rise','rose','risen','run','ran','say','said','see','saw','seen','seek','sought','sell','sold',
'send','sent','set','shake','shook','shaken','shine','shone','shoot','shot','show','showed','shown',
'shrink','shrank','shrunk','shut','sing','sang','sung','sink','sank','sunk','sit','sat','sleep',
'slept','slide','slid','smell','smelt','sow','sowed','sown','speak','spoke','spoken','speed','sped',
'spell','spelt','spend','spent','spill','spilt','spin','spun','spit','spat','split','spoil','spoilt',
'spread','spring','sprang','sprung','stand','stood','steal','stole','stolen','stick','stuck',
'sting','stung','stink','stank','stunk','stride','strode','stridden','strike','struck','strive',
'strove','striven','swear','swore','sworn','sweep','swept','swell','swelled','swollen','swim',
'swam','swum','swing','swung','take','took','taken','teach','taught','tear','tore','torn','tell',
'told','think','thought','throw','threw','thrown','thrust','tread','trod','trodden','understand',
'understood','undertake','undertook','undertaken','upset','wake','woke','woken','wear','wore',
'worn','weave','wove','woven','weep','wept','wet','win','won','wind','wound','withdraw','withdrew',
'withdrawn','withhold','withheld','withstand','withstood','write','wrote','written'}

def has_inflection(word):
    w = word.lower()
    if re.search(r'[^a-z]', w):
        return {w}
    forms = {w}
    if w.endswith('ies') and len(w) > 3:
        forms.add(w[:-3] + 'y')
    if w.endswith('es') and len(w) > 2:
        forms.add(w[:-2])
    if w.endswith('s') and len(w) > 2 and not w.endswith('ss'):
        forms.add(w[:-1])
    if w.endswith('ing') and len(w) > 4:
        base = w[:-3]
        forms.add(base)
        if len(base) > 1 and base[-1] == base[-2]:
            forms.add(base[:-1])
        else:
            forms.add(base + 'e')
    if w.endswith('ed') and len(w) > 3:
        base = w[:-2]
        forms.add(base)
        if len(base) > 1 and base[-1] == base[-2]:
            forms.add(base[:-1])
        else:
            forms.add(base + 'e')
    return forms

def contains_word(sent, word):
    """句子中的单词还原为可能基词,目标词原形/变体命中即算包含"""
    if not sent:
        return False
    w = word.lower()
    toks = re.findall(r'[a-zA-Z]+', sent.lower())
    for t in toks:
        if w in has_inflection(t):
            return True
    return False

merged = 0
bad = []
for line in open('api_examples.jsonl', encoding='utf-8'):
    line = line.strip()
    if not line:
        continue
    obj = json.loads(line)
    x = words.get(obj['word'])
    if not x:
        continue
    if x.get('example_en'):
        continue
    ex = obj['example_en'].strip()
    if not contains_word(ex, obj['word']):
        bad.append(obj['word'])
        continue
    x['example_en'] = ex
    if obj.get('example_zh'):
        x['example_zh'] = obj['example_zh'].strip()
    cols = [c for c in (obj.get('collocations') or []) if c]
    if cols:
        x['collocation_hint'] = '；'.join(cols)
    merged += 1

print('合并:', merged, '不含目标词跳过:', len(bad), bad[:10])
d['words'] = list(words.values())
json.dump(d, open(PATH, 'w', encoding='utf-8'), ensure_ascii=False)
print('例句覆盖:', sum(1 for x in d['words'] if x.get('example_en')), '/', len(d['words']))
