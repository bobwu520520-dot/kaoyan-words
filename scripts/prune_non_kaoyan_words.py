# -*- coding: utf-8 -*-
import json, os, sys, re
sys.stdout.reconfigure(encoding='utf-8')

WORDS_PATH = r'd:\谷歌反重力\kaoyan_vocab_v9\data\words.json'
AI_EX_PATH = r'd:\谷歌反重力\kaoyan_vocab_v9\data\ai_examples.json'

with open(WORDS_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)

words = data['words']
original_count = len(words)
print(f'Original word count: {original_count}')

# 1. Non-exam obscure trivia, rare animals, rare plants, chemical trivia, proper nouns
OBSCURE_TRIVIA = {
    'aardvark', 'aardvarks', 'abacus', 'abalone', 'abalones', 'abattoir', 'aerie', 'aero',
    'aerobatic', 'aerobatics', 'aerodrome', 'aerodromes', 'aerostat', 'aerostats', 'aesthete',
    'aesthetes', 'afar', 'albatross', 'albatrosses', 'alpaca', 'amide', 'amides', 'amidships',
    'amine', 'amino', 'ammeter', 'ammeters', 'ammo', 'ammonia', 'ammonite', 'ammonites',
    'ammonium', 'amethyst', 'acrobat', 'adductor', 'aerobe', 'aerolite', 'agape', 'agar',
    'agate', 'akimbo', 'alb', 'alga', 'alkali', 'alluvium', 'aloe', 'altocumulus', 'ambergris',
    'ameba', 'amice', 'amoeba', 'amphora', 'anaconda', 'angstrom', 'aniline', 'anise',
    'anteater', 'antelope', 'anthill', 'anthracite', 'anvil', 'aphid', 'apiary', 'apron',
    'aqueduct', 'arabesque', 'arbalest', 'arcana', 'architrave', 'armadillo', 'armature',
    'arquebus', 'arrowroot', 'artemisia', 'artichoke', 'asbestos', 'ascorbic', 'aspen',
    'asphodel', 'aspidistra', 'astrolabe', 'aubergine', 'augur', 'auk', 'avocet', 'axle',
    'azalea', 'azure', 'baboon', 'badger', 'bagpipe', 'balalaika', 'baldric', 'baleen',
    'ballista', 'balm', 'balsa', 'bandicoot', 'banjo', 'baobab', 'barbette', 'barbican',
    'barbiturate', 'barcarole', 'bard', 'bargee', 'barkentine', 'barleycorn', 'barometer',
    'barouche', 'barracuda', 'barratry', 'baryon', 'basalt', 'basenji', 'basilisk', 'basset',
    'bassoon', 'bastion', 'bathyscaphe', 'batiste', 'batrachian', 'bauxite', 'bayonet',
    'beagle', 'beaver', 'bedizen', 'bedlamite', 'beechnut', 'beetle', 'begonia', 'belay',
    'belladonna', 'bellwether', 'beluga', 'benison', 'benzine', 'beret', 'bergamot',
    'berkelium', 'beryllium', 'betel', 'bezant', 'biconcave', 'bidentate', 'bier', 'bigwig',
    'bilberry', 'billhook', 'bimetallic', 'binnacle', 'biosensor', 'bipedal', 'biretta',
    'biscuit', 'bismuth', 'bison', 'bistort', 'bivalve', 'blackfly', 'blackleg', 'blaze',
    'blazon', 'bleb', 'blepharitis', 'blintz', 'bloater', 'blowfly', 'blowpipe',
    'blunderbuss', 'boar', 'bobbin', 'bobcat', 'bobsleigh', 'bodice', 'bodkin', 'bolas',
    'bolero', 'boll', 'bolshevik', 'bombard', 'bombazine', 'bonanza', 'bonbon', 'bonito',
    'borage', 'borax', 'borborygmus', 'borderer', 'boreas', 'boron', 'borscht', 'boson',
    'botfly', 'boudoir', 'bouillabaisse', 'boule', 'bourdon', 'bourse', 'boustrophedon',
    'bowsprit', 'brachial', 'brachiopod', 'bracken', 'braggadocio', 'brahma', 'bramble',
    'brank', 'brassard', 'brattice', 'bravura', 'bray', 'bream', 'breccia', 'brevet',
    'brimstone', 'brioche', 'briquette', 'brisket', 'bristlecone', 'brittleness', 'broadbill',
    'broadcloth', 'broadsword', 'brocade', 'brochette', 'brogan', 'brogue', 'bromeliad',
    'bromide', 'bronchus', 'brontosaurus', 'brouhaha', 'brucellosis', 'bruschetta', 'bryophyte',
    'bubonic', 'buckram', 'buckthorn', 'buckwheat', 'buffoonery', 'bullock', 'bullring',
    'bulrush', 'bumbershoot', 'bungalow', 'bunghole', 'bunting', 'buphagus', 'buprestid',
    'burgrave', 'burin', 'burlap', 'burdock', 'bushbaby', 'bushmaster', 'bustard', 'busybody',
    'butanone', 'buttercup', 'butterfat', 'butterwort', 'butyric', 'byre', 'byway', 'zebra',
    'alloway', 'alpin', 'alway', 'amain', 'amende', 'amuser'
}

# 2. Irregular verb past tense / participle redundancies where lemma is already in the list
IRREGULAR_INFLECTIONS = {
    'kept': 'keep',
    'said': 'say',
    'taken': 'take',
    'taking': 'take',
    'waiting': 'wait',
    'called': 'call',
    'came': 'come',
    'carried': 'carry',
    'brought': 'bring',
    'began': 'begin',
    'asked': 'ask',
    'appeared': 'appear',
    'answered': 'answer',
    'applied': 'apply',
    'believed': 'believe',
    'stopped': 'stop',
    'showed': 'show',
    'felt': 'feel',
    'found': 'find',
    'gave': 'give',
    'gone': 'go',
    'went': 'go',
    'had': 'have',
    'held': 'hold',
    'knew': 'know',
    'known': 'know',
    'led': 'lead',
    'left': 'leave',
    'lost': 'lose',
    'made': 'make',
    'making': 'make',
    'met': 'meet',
    'paid': 'pay',
    'ran': 'run',
    'saw': 'see',
    'seen': 'see',
    'sent': 'send',
    'sat': 'sit',
    'spoke': 'speak',
    'spoken': 'speak',
    'stood': 'stand',
    'told': 'tell',
    'thought': 'think',
    'took': 'take',
    'understood': 'understand',
    'won': 'win',
    'written': 'write',
    'wrote': 'write',
    'tried': 'try'
}

# Preserve standard academic nouns/terms ending in -s/-ics/-ed/-ing
ACADEMIC_EXCEPTIONS = {
    'crisis', 'basis', 'analysis', 'hypothesis', 'thesis', 'oasis', 'parenthesis', 'synopsis',
    'species', 'series', 'status', 'canvas', 'bonus', 'focus', 'genius', 'stimulus', 'syllabus',
    'virus', 'apparatus', 'census', 'consensus', 'surplus', 'bias', 'chaos', 'lens', 'gas', 'yes',
    'this', 'thus', 'less', 'pass', 'class', 'glass', 'grass', 'dress', 'press', 'stress',
    'address', 'assess', 'possess', 'access', 'process', 'excess', 'recess', 'success', 'witness',
    'business', 'illness', 'fitness', 'awareness', 'darkness', 'weakness', 'thickness', 'richness',
    'freshness', 'politeness', 'kindness', 'blindness', 'sadness', 'madness', 'gladness',
    'fondness', 'boldness', 'coldness', 'hardiness', 'readiness', 'happiness', 'laziness',
    'loneliness', 'ugliness', 'tidiness', 'cleanliness', 'economics', 'electronics', 'genetics',
    'logistics', 'mechanics', 'optics', 'physics', 'politics', 'statistics', 'tactics',
    'telecommunications', 'ethics', 'mathematics', 'abhorrent', 'aberrant', 'abiding',
    'abundant', 'abstract', 'abrupt', 'absurd', 'adequate', 'adjacent', 'adverse', 'aesthetic',
    'affluent', 'aggressive', 'agile', 'alien', 'allied', 'alternate', 'ambiguous', 'ambitious',
    'amenable', 'amiable', 'amicable', 'ample', 'analogous', 'ancient', 'anonymous', 'apparent',
    'applicable', 'appropriate', 'approximate', 'arbitrary', 'archaic', 'arduous', 'arid',
    'arrogant', 'articulate', 'artificial', 'ascendant', 'aspiring', 'assertive', 'assiduous',
    'astringent', 'astute', 'atrocious', 'atypical', 'audacious', 'authentic', 'authoritative',
    'autonomous', 'available', 'avaricious', 'avid', 'awkward', 'learning', 'meaning',
    'building', 'feeling', 'warning', 'training', 'setting', 'gathering', 'housing', 'clothing',
    'painting', 'drawing', 'sibling', 'darling', 'ceiling', 'sterling', 'seedling', 'ruling',
    'listing', 'landing', 'holding', 'heading', 'finding', 'ending', 'cutting', 'crossing',
    'blessing', 'binding', 'bearing', 'banking', 'backing'
}

# Step 1: Remove '普通扩展' and OBSCURE_TRIVIA
stage1 = []
removed_trivia_count = 0
for w in words:
    wstr = w['word'].lower().strip()
    if w.get('tier') == '普通扩展':
        continue
    if wstr in OBSCURE_TRIVIA:
        removed_trivia_count += 1
        continue
    if wstr in IRREGULAR_INFLECTIONS:
        continue
    stage1.append(w)

print(f'After removing 普通扩展 & obscure trivia: {len(stage1)} (removed {original_count - len(stage1)})')

# Step 2: Lemmatize regular inflections
all_stage1_lemmas = set(w['word'].lower().strip() for w in stage1)
final_words = []
removed_inflections_count = 0

for w in stage1:
    wstr = w['word'].lower().strip()
    is_inf = False
    
    if wstr not in ACADEMIC_EXCEPTIONS:
        # Plural -s / -es / -ies
        if wstr.endswith('s') and len(wstr) > 3:
            if wstr[:-1] in all_stage1_lemmas:
                is_inf = True
            elif wstr.endswith('es') and wstr[:-2] in all_stage1_lemmas:
                is_inf = True
            elif wstr.endswith('ies') and (wstr[:-3] + 'y') in all_stage1_lemmas:
                is_inf = True
        # Past -ed / -ied
        elif wstr.endswith('ed') and len(wstr) > 4:
            if wstr[:-1] in all_stage1_lemmas or wstr[:-2] in all_stage1_lemmas:
                is_inf = True
            elif wstr.endswith('ied') and (wstr[:-3] + 'y') in all_stage1_lemmas:
                is_inf = True
            elif len(wstr) > 5 and wstr[-3] == wstr[-4] and wstr[:-3] in all_stage1_lemmas:
                is_inf = True
        # Participle -ing
        elif wstr.endswith('ing') and len(wstr) > 5 and not w.get('pos', '').startswith('n'):
            if wstr[:-3] in all_stage1_lemmas or (wstr[:-3] + 'e') in all_stage1_lemmas:
                is_inf = True
            elif len(wstr) > 6 and wstr[-4] == wstr[-5] and wstr[:-4] in all_stage1_lemmas:
                is_inf = True

    if is_inf:
        removed_inflections_count += 1
    else:
        final_words.append(w)

print(f'Removed regular inflection redundancies: {removed_inflections_count}')
print(f'Final pure Kaoyan vocabulary count: {len(final_words)}')

# Save updated words.json
data['count'] = len(final_words)
data['active_count'] = len(final_words)
data['words'] = final_words

with open(WORDS_PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('Updated data/words.json successfully!')

# Sync with ai_examples.json: remove orphan examples
with open(AI_EX_PATH, 'r', encoding='utf-8') as f:
    ai_ex = json.load(f)

valid_words = set(w['word'] for w in final_words)
cleaned_ai_s = {k: v for k, v in ai_ex.get('s', {}).items() if k in valid_words}
ai_ex['s'] = cleaned_ai_s

with open(AI_EX_PATH, 'w', encoding='utf-8') as f:
    json.dump(ai_ex, f, ensure_ascii=False, indent=2)

print(f'Cleaned ai_examples.json, retained {len(cleaned_ai_s)} high-standard academic examples.')
