# -*- coding: utf-8 -*-
"""
Master Kaoyan English 1 & 2 Academic Synonym Expander v4.0
Expands academic synonym networks across the 5,619 Kaoyan syllabus dataset.
Strictly ensures 100% vocabulary validity within the Kaoyan syllabus.
"""

import json, os, sys, re
from collections import defaultdict

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'data')
WORDS_PATH = os.path.join(DATA_DIR, 'words.json')

MASTER_CLUSTERS = [
    # Verbs
    ['advocate', 'champion', 'promote', 'endorse', 'uphold', 'espouse', 'support', 'favor', 'further', 'foster'],
    ['dispute', 'challenge', 'contest', 'refute', 'contradict', 'question', 'doubt', 'oppose', 'rebut', 'counter'],
    ['demonstrate', 'manifest', 'illustrate', 'exemplify', 'reveal', 'indicate', 'signify', 'display', 'exhibit', 'express', 'reflect'],
    ['hypothesize', 'postulate', 'speculate', 'theorize', 'conjecture', 'presume', 'assume', 'suppose', 'posit'],
    ['deduce', 'infer', 'derive', 'conclude', 'gather', 'reason'],
    ['scrutinize', 'inspect', 'examine', 'investigate', 'probe', 'explore', 'audit', 'scan', 'dissect'],
    ['undermine', 'impair', 'compromise', 'sabotage', 'erode', 'damage', 'weaken', 'ruin', 'spoil', 'undercut'],
    ['bolster', 'reinforce', 'strengthen', 'fortify', 'sustain', 'boost', 'enhance', 'solidify', 'consolidate', 'shore'],
    ['facilitate', 'foster', 'cultivate', 'stimulate', 'spur', 'propel', 'encourage', 'nurture', 'quicken', 'prompt'],
    ['hinder', 'impede', 'hamper', 'obstruct', 'inhibit', 'curb', 'retard', 'block', 'restrain', 'check', 'thwart'],
    ['exacerbate', 'aggravate', 'worsen', 'intensify', 'heighten', 'inflame', 'deepen'],
    ['alleviate', 'mitigate', 'ease', 'relieve', 'moderate', 'soothe', 'lessen', 'allay', 'lighten', 'cushion'],
    ['abolish', 'eliminate', 'eradicate', 'terminate', 'extinguish', 'annul', 'cancel', 'dismiss', 'nullify'],
    ['simulate', 'imitate', 'emulate', 'reproduce', 'replicate', 'mimic', 'copy', 'mirror', 'model'],
    ['alter', 'modify', 'transform', 'convert', 'shift', 'mutate', 'vary', 'adapt', 'revise', 'adjust'],
    ['surmount', 'overcome', 'conquer', 'triumph', 'vanquish', 'prevail', 'beat'],
    ['accommodate', 'adapt', 'adjust', 'conform', 'acclimate', 'tailor', 'reconcile'],
    ['elucidate', 'clarify', 'explicate', 'expound', 'demystify', 'interpret', 'illuminate', 'unfold'],
    ['acknowledge', 'concede', 'admit', 'recognize', 'grant', 'confess', 'accept', 'own'],
    ['accumulate', 'amass', 'gather', 'collect', 'accrue', 'hoard', 'assemble', 'pile'],
    ['overlook', 'neglect', 'ignore', 'disregard', 'bypass', 'omit', 'slight'],
    ['resist', 'defy', 'withstand', 'oppose', 'confront', 'repel', 'rebuff'],
    ['comply', 'conform', 'adhere', 'abide', 'observe', 'yield', 'submit', 'obey'],
    ['acquire', 'obtain', 'attain', 'secure', 'procure', 'derive', 'gain', 'earn', 'win'],
    ['deprive', 'divest', 'strip', 'forfeit', 'dispossess', 'bereave', 'rob'],
    ['provoke', 'irritate', 'infuriate', 'incite', 'instigate', 'arouse', 'agitate', 'kindle'],
    ['evaluate', 'assess', 'appraise', 'gauge', 'estimate', 'rate', 'judge', 'weigh'],
    ['synthesize', 'integrate', 'amalgamate', 'blend', 'merge', 'fuse', 'combine', 'unify', 'incorporate'],
    ['delineate', 'depict', 'portray', 'narrate', 'recount', 'describe', 'render', 'characterize'],
    ['perpetuate', 'maintain', 'preserve', 'retain', 'sustain', 'continue', 'uphold', 'prolong'],
    ['deter', 'dissuade', 'discourage', 'inhibit', 'prevent', 'daunt', 'avert'],
    ['reconcile', 'harmonize', 'coordinate', 'align', 'integrate', 'balance', 'attune'],
    ['feign', 'simulate', 'disguise', 'mask', 'camouflage', 'pretend', 'counterfeit'],
    ['concur', 'assent', 'consent', 'agree', 'approve', 'endorse', 'accede'],
    ['dispel', 'dissipate', 'disperse', 'banish', 'eliminate', 'resolve', 'scatter'],
    ['abandon', 'relinquish', 'forsake', 'surrender', 'renounce', 'discard', 'yield', 'quit'],
    ['abbreviate', 'shorten', 'condense', 'abridge', 'truncate', 'compress', 'curtail'],
    ['absorb', 'assimilate', 'digest', 'incorporate', 'imbibe', 'ingest', 'soak'],
    ['accelerate', 'expedite', 'hasten', 'quicken', 'precipitate', 'speed', 'rush'],
    ['acclaim', 'applaud', 'praise', 'commend', 'laud', 'extol', 'hail', 'cheer'],
    ['aggravate', 'exasperate', 'provoke', 'annoy', 'irritate', 'vex', 'bother'],
    ['allocate', 'apportion', 'distribute', 'allot', 'assign', 'designate', 'share'],
    ['anticipate', 'foresee', 'predict', 'forecast', 'envisage', 'project', 'await'],
    ['apprehend', 'arrest', 'capture', 'seize', 'catch', 'trap'],
    ['articulate', 'enunciate', 'pronounce', 'voice', 'utter', 'express', 'state'],
    ['aspire', 'yearn', 'crave', 'desire', 'long', 'aim', 'strive', 'seek'],
    ['attribute', 'ascribe', 'impute', 'credit', 'assign', 'refer'],
    ['authorize', 'sanction', 'permit', 'allow', 'license', 'empower', 'approve'],
    ['calculate', 'compute', 'reckon', 'estimate', 'gauge', 'quantify'],
    ['cease', 'terminate', 'halt', 'discontinue', 'conclude', 'stop', 'quit', 'end'],
    ['coincide', 'concur', 'agree', 'overlap', 'accord', 'synchronize'],
    ['collaborate', 'cooperate', 'participate', 'unite', 'combine', 'conspire'],
    ['compensate', 'reimburse', 'recompense', 'remunerate', 'indemnify', 'repay', 'reward'],
    ['comprehend', 'understand', 'grasp', 'perceive', 'fathom', 'apprehend'],
    ['conceal', 'hide', 'disguise', 'screen', 'veil', 'mask', 'cover'],
    ['confine', 'restrict', 'limit', 'circumscribe', 'bound', 'constrain', 'imprison'],
    ['contemplate', 'ponder', 'meditate', 'reflect', 'deliberate', 'consider', 'muse'],
    ['cultivate', 'nurture', 'foster', 'develop', 'tend', 'grow', 'plant'],
    ['curtail', 'cut', 'reduce', 'diminish', 'shorten', 'abbreviate', 'lessen'],
    ['deceive', 'delude', 'mislead', 'dupe', 'beguile', 'cheat', 'trick', 'fool'],
    ['decay', 'deteriorate', 'decompose', 'rot', 'spoil', 'degrade', 'wither'],
    ['decompose', 'disintegrate', 'breakdown', 'dissolve', 'decay', 'rot'],
    ['denounce', 'condemn', 'censure', 'criticize', 'reproach', 'blame', 'attack'],
    ['deteriorate', 'degenerate', 'worsen', 'decline', 'decay', 'languish', 'retrograde'],
    ['diminish', 'decrease', 'dwindle', 'shrink', 'subside', 'wane', 'fade', 'drop'],
    ['discharge', 'release', 'emit', 'dismiss', 'eject', 'excrete', 'vent'],
    ['discriminate', 'distinguish', 'differentiate', 'discern', 'segregate', 'separate'],
    ['disperse', 'scatter', 'diffuse', 'dissipate', 'distribute', 'spread'],
    ['dominate', 'prevail', 'command', 'control', 'govern', 'rule', 'monopolize'],
    ['elaborate', 'expand', 'amplify', 'develop', 'embellish', 'detail', 'explain'],
    ['embody', 'personify', 'exemplify', 'incarnate', 'manifest', 'represent', 'incorporate'],
    ['enforce', 'implement', 'execute', 'administer', 'apply', 'impose', 'carry out'],
    ['enlighten', 'illuminate', 'instruct', 'educate', 'inform', 'teach', 'edify'],
    ['entail', 'involve', 'necessitate', 'require', 'demand', 'imply', 'occasion'],
    ['eradicate', 'exterminate', 'uproot', 'extirpate', 'annihilate', 'destroy', 'wipe'],
    ['evoke', 'arouse', 'elicit', 'awaken', 'conjure', 'induce', 'provoke', 'call'],
    ['exempt', 'excuse', 'relieve', 'release', 'spare', 'absolve', 'free'],
    ['expand', 'extend', 'dilate', 'broaden', 'widen', 'enlarge', 'swell', 'grow'],
    ['expire', 'lapse', 'terminate', 'perish', 'die', 'cease', 'end'],
    ['fabricate', 'manufacture', 'construct', 'invent', 'concoct', 'forge', 'make'],
    ['fluctuate', 'vacillate', 'oscillate', 'waver', 'vary', 'shift', 'swing'],
    ['forbid', 'prohibit', 'ban', 'bar', 'outlaw', 'veto', 'prevent'],
    ['generate', 'produce', 'yield', 'create', 'spawn', 'breed', 'originate', 'cause'],
    ['guarantee', 'pledge', 'warrant', 'assure', 'insure', 'secure', 'promise'],
    ['highlight', 'accentuate', 'emphasize', 'underscore', 'stress', 'feature', 'spotlight'],
    ['ignite', 'kindle', 'inflame', 'spark', 'trigger', 'stimulate', 'provoke'],
    ['illuminate', 'brighten', 'light', 'clarify', 'elucidate', 'explain'],
    ['immerse', 'submerge', 'dip', 'plunge', 'absorb', 'engross', 'drown'],
    ['impair', 'damage', 'harm', 'injure', 'mar', 'disable', 'hurt', 'spoil'],
    ['impose', 'inflict', 'levy', 'exact', 'enforce', 'dictate', 'apply'],
    ['incline', 'lean', 'tend', 'tilt', 'slope', 'slant', 'dispose'],
    ['incorporate', 'integrate', 'merge', 'absorb', 'blend', 'include', 'embody'],
    ['induce', 'persuade', 'prompt', 'provoke', 'cause', 'engender', 'bring'],
    ['inhabit', 'occupy', 'dwell', 'reside', 'populate', 'live', 'settle'],
    ['initiate', 'commence', 'launch', 'inaugurate', 'originate', 'start', 'begin'],
    ['inspect', 'examine', 'audit', 'scrutinize', 'survey', 'check', 'view'],
    ['inspire', 'motivate', 'stimulate', 'encourage', 'animate', 'galvanize', 'spark'],
    ['instigate', 'incite', 'provoke', 'foment', 'stimulate', 'trigger', 'spur'],
    ['integrate', 'combine', 'unify', 'merge', 'synthesize', 'coordinate', 'fuse'],
    ['intervene', 'intercede', 'mediate', 'interfere', 'intrude', 'step'],
    ['invoke', 'summon', 'appeal', 'call', 'solicit', 'conjure', 'cite'],
    ['isolate', 'segregate', 'detach', 'insulate', 'quarantine', 'separate'],
    ['magnify', 'enlarge', 'amplify', 'exaggerate', 'inflate', 'expand', 'boost'],
    ['manipulate', 'maneuver', 'handle', 'control', 'influence', 'rig', 'exploit'],
    ['navigate', 'sail', 'steer', 'pilot', 'maneuver', 'guide', 'direct'],
    ['nullify', 'annul', 'invalidate', 'negate', 'void', 'cancel', 'repeal'],
    ['nurture', 'foster', 'cherish', 'nourish', 'cultivate', 'tend', 'feed'],
    ['originate', 'arise', 'derive', 'spring', 'emanate', 'stem', 'begin'],
    ['penetrate', 'pierce', 'permeate', 'pervade', 'puncture', 'bore', 'enter'],
    ['perceive', 'discern', 'detect', 'notice', 'recognize', 'sense', 'see'],
    ['postpone', 'delay', 'defer', 'suspend', 'shelve', 'adjourn', 'stall'],
    ['predominate', 'prevail', 'dominate', 'reign', 'rule', 'govern'],
    ['prescribe', 'dictate', 'ordain', 'decree', 'direct', 'stipulate', 'order'],
    ['proclaim', 'declare', 'announce', 'broadcast', 'promulgate', 'herald'],
    ['reconcile', 'harmonize', 'settle', 'resolve', 'pacify', 'accommodate'],
    ['reinforce', 'strengthen', 'fortify', 'bolster', 'support', 'buttress', 'back'],
    ['relinquish', 'surrender', 'abandon', 'renounce', 'cede', 'yield', 'quit'],
    ['restrain', 'curb', 'constrain', 'repress', 'suppress', 'inhibit', 'hold'],
    ['retrieve', 'recover', 'regain', 'reclaim', 'restore', 'fetch', 'save'],
    ['salvage', 'rescue', 'recover', 'save', 'retrieve', 'redeem', 'reclaim'],
    ['scrutinize', 'examine', 'inspect', 'probe', 'scan', 'study', 'audit'],
    ['stimulate', 'spark', 'provoke', 'galvanize', 'activate', 'arouse', 'spur'],
    ['strive', 'struggle', 'endeavor', 'labor', 'toil', 'fight', 'try', 'aim'],
    ['substitute', 'replace', 'displace', 'supplant', 'switch', 'alternate', 'exchange'],
    ['suppress', 'quell', 'stifle', 'curb', 'crush', 'silence', 'subdue'],
    ['surpass', 'exceed', 'transcend', 'outdo', 'excel', 'outstrip', 'top'],
    ['sustain', 'maintain', 'support', 'uphold', 'preserve', 'prolong', 'bear'],
    ['terminate', 'conclude', 'cease', 'end', 'abort', 'discontinue', 'finish'],
    ['transform', 'metamorphose', 'transmute', 'convert', 'alter', 'change'],
    ['trigger', 'precipitate', 'provoke', 'spark', 'ignite', 'induce', 'cause'],
    ['undermine', 'weaken', 'subvert', 'damage', 'erode', 'threaten', 'shake'],
    ['undertake', 'assume', 'embark', 'attempt', 'commence', 'handle', 'start'],
    ['validate', 'confirm', 'corroborate', 'substantiate', 'verify', 'authenticate', 'ratify'],
    ['vanish', 'disappear', 'evaporate', 'fade', 'dissolve', 'recede', 'die'],
    ['verify', 'confirm', 'authenticate', 'validate', 'certify', 'check', 'prove'],
    ['vibrate', 'oscillate', 'quiver', 'shake', 'tremble', 'pulsate', 'swing'],
    ['withstand', 'endure', 'resist', 'brave', 'bear', 'survive', 'sustain'],
    ['yield', 'surrender', 'submit', 'concede', 'relinquish', 'produce', 'grant'],

    # Nouns
    ['criterion', 'benchmark', 'standard', 'gauge', 'norm', 'yardstick', 'touchstone', 'metric', 'measure'],
    ['dilemma', 'predicament', 'plight', 'quandary', 'impasse', 'crisis', 'deadlock', 'hardship', 'bind'],
    ['controversy', 'dispute', 'conflict', 'friction', 'contention', 'discord', 'clash', 'debate', 'strife'],
    ['obstacle', 'barrier', 'hurdle', 'impediment', 'hindrance', 'handicap', 'obstruction', 'snag'],
    ['prejudice', 'bias', 'preconception', 'partiality', 'slant', 'dogma'],
    ['tendency', 'trend', 'inclination', 'propensity', 'predisposition', 'drift', 'lean', 'bent'],
    ['incentive', 'motivation', 'impetus', 'stimulus', 'spur', 'drive', 'provocation', 'inducement', 'catalyst'],
    ['perspective', 'viewpoint', 'standpoint', 'angle', 'outlook', 'stance', 'posture', 'slant', 'position'],
    ['prosperity', 'affluence', 'wealth', 'opulence', 'thriving', 'boom', 'fortune', 'plenty'],
    ['poverty', 'destitution', 'deprivation', 'scarcity', 'deficiency', 'shortage', 'dearth', 'privation'],
    ['outcome', 'consequence', 'implication', 'repercussion', 'aftermath', 'result', 'effect', 'sequel'],
    ['domain', 'realm', 'sphere', 'arena', 'territory', 'field', 'sector', 'scope', 'orbit', 'province'],
    ['transition', 'transformation', 'shift', 'evolution', 'mutation', 'progression', 'transit', 'turn'],
    ['paradigm', 'pattern', 'model', 'framework', 'blueprint', 'prototype', 'mold', 'standard', 'archetype'],
    ['foundation', 'cornerstone', 'pillar', 'groundwork', 'basis', 'underpinning', 'bedrock', 'base'],
    ['shortcoming', 'defect', 'flaw', 'drawback', 'deficiency', 'blemish', 'weakness', 'fault', 'imperfection'],
    ['innovation', 'breakthrough', 'advancement', 'revolution', 'leap', 'pioneering', 'novelty', 'creation'],
    ['downturn', 'recession', 'slump', 'decline', 'deterioration', 'decay', 'depression', 'drop'],
    ['coalition', 'alliance', 'partnership', 'collaboration', 'confederation', 'synergy', 'league', 'union'],
    ['autonomy', 'independence', 'sovereignty', 'liberty', 'freedom'],
    ['competence', 'proficiency', 'capability', 'capacity', 'expertise', 'aptitude', 'skill', 'ability'],
    ['discrepancy', 'divergence', 'inconsistency', 'disparity', 'variance', 'mismatch', 'difference', 'deviation'],
    ['cohesion', 'solidarity', 'unity', 'harmony', 'concord', 'integrity'],
    ['hypothesis', 'postulate', 'premise', 'proposition', 'supposition', 'conjecture', 'assumption', 'thesis'],
    ['equilibrium', 'balance', 'stability', 'poise', 'symmetry', 'harmony'],
    ['catastrophe', 'disaster', 'calamity', 'tragedy', 'upheaval', 'debacle', 'adversity', 'cataclysm'],
    ['tribute', 'accolade', 'homage', 'eulogy', 'praise', 'commendation', 'honor', 'salute'],
    ['precursor', 'forerunner', 'predecessor', 'ancestor', 'antecedent', 'harbinger', 'herald'],
    ['contingency', 'possibility', 'eventuality', 'uncertainty', 'accident', 'chance', 'emergency'],
    ['manifestation', 'expression', 'embodiment', 'demonstration', 'sign', 'indication', 'token'],
    ['magnitude', 'scale', 'extent', 'scope', 'volume', 'dimension', 'size', 'immensity'],
    ['imperative', 'necessity', 'prerequisite', 'requirement', 'obligation', 'mandate', 'duty'],
    ['abundance', 'profusion', 'copiousness', 'plenitude', 'wealth', 'overflow', 'glut', 'surfeit'],
    ['accord', 'agreement', 'concord', 'consensus', 'harmony', 'pact', 'treaty', 'compact'],
    ['admiration', 'esteem', 'respect', 'regard', 'reverence', 'veneration', 'worship'],
    ['adversary', 'opponent', 'antagonist', 'rival', 'foe', 'enemy', 'competitor'],
    ['affliction', 'distress', 'suffering', 'tribulation', 'anguish', 'hardship', 'grief', 'pain'],
    ['aggression', 'hostility', 'assault', 'attack', 'offense', 'invasion', 'combat'],
    ['agony', 'torment', 'torture', 'misery', 'anguish', 'distress', 'pain', 'suffering'],
    ['ambition', 'aspiration', 'goal', 'objective', 'desire', 'aim', 'target', 'dream'],
    ['amenity', 'comfort', 'facility', 'convenience', 'service', 'resource'],
    ['anomaly', 'aberration', 'irregularity', 'abnormality', 'peculiarity', 'exception', 'deviation'],
    ['appetite', 'craving', 'hunger', 'relish', 'taste', 'desire', 'liking'],
    ['apprehension', 'dread', 'anxiety', 'misgiving', 'trepidation', 'fear', 'worry'],
    ['ardor', 'fervor', 'zeal', 'passion', 'enthusiasm', 'warmth', 'eagerness'],
    ['arrogance', 'haughtiness', 'insolence', 'conceit', 'pride', 'vanity', 'presumption'],
    ['artisan', 'craftsman', 'mechanic', 'technician', 'workman', 'laborer'],
    ['aspect', 'facet', 'dimension', 'feature', 'phase', 'side', 'angle'],
    ['assault', 'attack', 'onslaught', 'offensive', 'aggression', 'charge', 'raid'],
    ['assemblage', 'gathering', 'crowd', 'throng', 'multitude', 'assembly', 'collection'],
    ['assurance', 'confidence', 'certainty', 'pledge', 'guarantee', 'conviction', 'promise'],
    ['asylum', 'sanctuary', 'refuge', 'shelter', 'haven', 'retreat', 'harbor'],
    ['attachment', 'affection', 'devotion', 'fondness', 'affinity', 'loyalty', 'bond'],
    ['attribute', 'trait', 'quality', 'characteristic', 'property', 'feature', 'mark'],
    ['audacity', 'boldness', 'daring', 'impudence', 'nerve', 'temerity', 'courage'],
    ['authority', 'expert', 'specialist', 'master', 'scholar', 'jurisdiction', 'power'],
    ['bounty', 'generosity', 'munificence', 'reward', 'premium', 'prize', 'gift'],
    ['breach', 'rupture', 'fracture', 'infringement', 'violation', 'rift', 'break'],
    ['calamity', 'catastrophe', 'disaster', 'adversity', 'misfortune', 'plight', 'tragedy'],
    ['capacity', 'ability', 'capability', 'faculty', 'aptitude', 'talent', 'potential'],
    ['cavity', 'hollow', 'hole', 'crater', 'pit', 'socket', 'void'],
    ['censure', 'blame', 'reproach', 'condemnation', 'reproof', 'criticism', 'scorn'],
    ['champion', 'advocate', 'defender', 'protector', 'proponent', 'victor', 'winner'],
    ['chaos', 'turmoil', 'confusion', 'disorder', 'pandemonium', 'havoc', 'bedlam'],
    ['charity', 'philanthropy', 'benevolence', 'generosity', 'alms', 'kindness', 'mercy'],
    ['chasm', 'abyss', 'gorge', 'canyon', 'ravine', 'crevasse', 'gap'],
    ['circuit', 'orbit', 'cycle', 'revolution', 'compass', 'perimeter', 'loop'],
    ['clarity', 'clearness', 'lucidity', 'transparency', 'plainness', 'coherence'],
    ['clause', 'provision', 'stipulation', 'condition', 'article', 'section', 'term'],
    ['clientele', 'customers', 'patrons', 'clients', 'buyers', 'market'],
    ['climax', 'culmination', 'pinnacle', 'apex', 'zenith', 'peak', 'crest', 'top'],
    ['clutter', 'disorder', 'mess', 'litter', 'jumble', 'heap', 'confusion'],
    ['commodity', 'merchandise', 'goods', 'product', 'ware', 'cargo'],
    ['compassion', 'sympathy', 'empathy', 'pity', 'mercy', 'tenderness', 'kindness'],
    ['competitor', 'rival', 'opponent', 'challenger', 'contestant', 'adversary'],
    ['complaisance', 'deference', 'compliance', 'courtesy', 'obligingness', 'politeness'],
    ['complement', 'supplement', 'counterpart', 'addition', 'fulfillment', 'balance'],
    ['complexity', 'intricacy', 'complication', 'sophistication', 'perplexity', 'depth'],
    ['compliance', 'conformity', 'obedience', 'adherence', 'submission', 'consent'],
    ['component', 'element', 'constituent', 'ingredient', 'factor', 'part', 'unit'],
    ['composure', 'serenity', 'equanimity', 'calmness', 'placidity', 'tranquility', 'poise'],
    ['compression', 'condensation', 'compaction', 'constriction', 'crush', 'squeeze'],
    ['compulsion', 'coercion', 'constraint', 'obligation', 'pressure', 'force', 'drive'],
    ['concept', 'notion', 'idea', 'conception', 'thought', 'theory', 'view'],
    ['concession', 'compromise', 'allowance', 'grant', 'adjustment', 'surrender'],
    ['concurrence', 'agreement', 'harmony', 'cooperation', 'union', 'coincidence'],
    ['condemnation', 'censure', 'denunciation', 'reproval', 'blame', 'sentence'],
    ['condolence', 'sympathy', 'consolation', 'compassion', 'pity', 'solace'],
    ['confederation', 'alliance', 'coalition', 'federation', 'league', 'union', 'bloc'],
    ['confidence', 'assurance', 'reliance', 'trust', 'faith', 'certainty', 'belief'],
    ['confinement', 'imprisonment', 'custody', 'detention', 'restriction', 'captivity'],
    ['confirmation', 'verification', 'corroboration', 'ratification', 'proof', 'endorsement'],
    ['conformity', 'compliance', 'agreement', 'congruence', 'consistency', 'accord'],
    ['confrontation', 'clash', 'encounter', 'conflict', 'showdown', 'contest'],
    ['confusion', 'perplexity', 'bewilderment', 'disorientation', 'turmoil', 'chaos'],
    ['congestion', 'overcrowding', 'clogging', 'bottleneck', 'blockage', 'jam'],
    ['conjecture', 'speculation', 'guess', 'surmise', 'hypothesis', 'presumption'],
    ['connoisseur', 'expert', 'specialist', 'judge', 'authority', 'critic'],
    ['conscience', 'scruple', 'morality', 'principles', 'ethics', 'duty', 'honor'],
    ['consequence', 'outcome', 'result', 'effect', 'upshot', 'aftermath', 'product'],
    ['conservation', 'preservation', 'protection', 'saving', 'maintenance', 'care'],
    ['consistency', 'coherence', 'uniformity', 'constancy', 'regularity', 'stability'],
    ['consolation', 'solace', 'comfort', 'relief', 'sympathy', 'support'],
    ['conspiracy', 'plot', 'scheme', 'intrigue', 'machination', 'collusion', 'cabal'],
    ['constancy', 'faithfulness', 'loyalty', 'fidelity', 'devotion', 'steadfastness'],
    ['consternation', 'dismay', 'alarm', 'panic', 'terror', 'horror', 'shock'],
    ['constraint', 'restraint', 'restriction', 'limitation', 'curb', 'check', 'bound'],
    ['consummation', 'completion', 'culmination', 'fulfillment', 'perfection', 'end'],
    ['contagion', 'infection', 'epidemic', 'pestilence', 'plague', 'virus', 'taint'],
    ['contempt', 'scorn', 'disdain', 'derision', 'disrespect', 'slight', 'ridicule'],
    ['contention', 'dispute', 'discord', 'quarrel', 'struggle', 'rivalry', 'strife'],
    ['contortion', 'distortion', 'deformation', 'twisting', 'warp', 'crookedness'],
    ['contract', 'agreement', 'covenant', 'compact', 'pact', 'treaty', 'deal'],
    ['contradiction', 'paradox', 'inconsistency', 'discrepancy', 'conflict', 'denial'],
    ['contrition', 'remorse', 'repentance', 'penitence', 'sorrow', 'guilt', 'regret'],
    ['contrivance', 'device', 'gadget', 'apparatus', 'invention', 'scheme', 'trick'],
    ['convalescence', 'recovery', 'recuperation', 'rehabilitation', 'healing'],
    ['convention', 'custom', 'practice', 'tradition', 'protocol', 'assembly', 'treaty'],
    ['convergence', 'confluence', 'junction', 'merging', 'union', 'focus', 'meeting'],
    ['conviction', 'belief', 'certainty', 'faith', 'opinion', 'creed', 'view'],
    ['convulsion', 'spasm', 'paroxysm', 'fit', 'turmoil', 'upheaval', 'shake'],
    ['corporation', 'enterprise', 'company', 'firm', 'conglomerate', 'business'],
    ['corroboration', 'confirmation', 'verification', 'authentication', 'evidence', 'proof'],
    ['corruption', 'depravity', 'dishonesty', 'fraud', 'bribery', 'venality', 'decay'],
    ['counsel', 'advice', 'guidance', 'recommendation', 'instruction', 'direction', 'lawyer'],
    ['countenance', 'expression', 'visage', 'complexion', 'mien', 'look', 'face'],
    ['counterpart', 'equivalent', 'peer', 'colleague', 'match', 'parallel', 'twin'],
    ['courtesy', 'politeness', 'civility', 'urbanity', 'chivalry', 'gallantry', 'respect'],
    ['craft', 'skill', 'workmanship', 'artisan', 'trade', 'vessel', 'guile'],
    ['credibility', 'plausibility', 'believability', 'reliability', 'trustworthiness', 'credit'],
    ['crisis', 'emergency', 'predicament', 'turning point', 'quandary', 'dilemma', 'pinch'],
    ['criterion', 'standard', 'benchmark', 'measure', 'yardstick', 'test', 'rule'],
    ['cruelty', 'brutality', 'barbarity', 'savagery', 'ferocity', 'harshness', 'spite'],
    ['culmination', 'climax', 'apogee', 'zenith', 'peak', 'pinnacle', 'apex', 'top'],
    ['curiosity', 'inquisitiveness', 'novelty', 'wonder', 'marvel', 'oddity', 'interest'],
    ['custom', 'tradition', 'convention', 'habit', 'practice', 'usage', 'ritual'],
    ['cynic', 'skeptic', 'pessimist', 'misanthrope', 'doubter', 'scoffer'],

    # Adjectives
    ['prominent', 'conspicuous', 'salient', 'marked', 'striking', 'noticeable', 'notable', 'distinct', 'eminent'],
    ['fundamental', 'essential', 'crucial', 'vital', 'cardinal', 'underlying', 'primary', 'core', 'basic', 'elemental'],
    ['intricate', 'complex', 'complicated', 'sophisticated', 'elaborate', 'entangled', 'perplexing'],
    ['ambiguous', 'obscure', 'vague', 'indistinct', 'nebulous', 'opaque', 'equivocal', 'fuzzy', 'dim'],
    ['vulnerable', 'fragile', 'susceptible', 'delicate', 'brittle', 'defenseless', 'exposed', 'tender'],
    ['prevalent', 'pervasive', 'widespread', 'ubiquitous', 'rampant', 'epidemic', 'universal', 'common', 'general'],
    ['indispensable', 'imperative', 'essential', 'vital', 'crucial', 'mandatory', 'requisite', 'necessary', 'compulsory'],
    ['latent', 'implicit', 'tacit', 'underlying', 'potential', 'unspoken', 'covert', 'dormant'],
    ['fierce', 'intense', 'severe', 'acute', 'drastic', 'vehement', 'rigorous', 'sharp', 'keen'],
    ['transient', 'fleeting', 'ephemeral', 'temporary', 'provisional', 'momentary', 'brief'],
    ['perpetual', 'enduring', 'permanent', 'lasting', 'persistent', 'continuous', 'eternal', 'unceasing', 'abiding'],
    ['objective', 'impartial', 'unbiased', 'dispassionate', 'detached', 'fair', 'equitable', 'neutral'],
    ['stringent', 'rigorous', 'strict', 'severe', 'rigid', 'stern', 'austere', 'harsh', 'exacting'],
    ['feasible', 'viable', 'practicable', 'workable', 'realistic', 'attainable', 'achievable'],
    ['skeptical', 'dubious', 'cynical', 'suspicious', 'distrustful', 'mistrustful', 'incredulous', 'hesitant'],
    ['abundant', 'plentiful', 'copious', 'ample', 'bountiful', 'profuse', 'exuberant', 'lavish', 'rich'],
    ['acute', 'astute', 'sharp', 'perceptive', 'discerning', 'insightful', 'shrewd', 'penetrating', 'clever'],
    ['trivial', 'negligible', 'insignificant', 'marginal', 'minor', 'petty', 'paltry', 'frivolous', 'slight'],
    ['absurd', 'ridiculous', 'irrational', 'preposterous', 'ludicrous', 'nonsensical', 'foolish', 'senseless'],
    ['paradoxical', 'contradictory', 'incompatible', 'conflicting', 'opposing', 'dissonant', 'incongruous', 'opposite'],
    ['arbitrary', 'whimsical', 'capricious', 'random', 'unwarranted', 'discretionary', 'despotic'],
    ['authentic', 'genuine', 'legitimate', 'veritable', 'real', 'true', 'valid'],
    ['cautious', 'prudent', 'wary', 'circumspect', 'vigilant', 'heedful', 'discreet', 'guarded'],
    ['drastic', 'radical', 'extreme', 'severe', 'intense', 'revolutionary'],
    ['empirical', 'experiential', 'practical', 'observed', 'pragmatic', 'experimental', 'factual'],
    ['flagrant', 'glaring', 'blatant', 'outrageous', 'egregious', 'scandalous', 'overt'],
    ['homogeneous', 'uniform', 'consistent', 'identical', 'alike', 'unvarying', 'standard'],
    ['heterogeneous', 'diverse', 'varied', 'miscellaneous', 'motley', 'assorted', 'mixed', 'different'],
    ['imminent', 'impending', 'approaching', 'looming', 'forthcoming', 'near', 'threatening'],
    ['meticulous', 'scrupulous', 'painstaking', 'punctilious', 'fastidious', 'thorough', 'careful', 'exact'],
    ['nominal', 'symbolic', 'token', 'titular', 'formal', 'minimal', 'insignificant'],
    ['ominous', 'inauspicious', 'foreboding', 'sinister', 'threatening', 'menacing', 'baleful'],
    ['plausible', 'credible', 'believable', 'reasonable', 'conceivable', 'persuasive', 'tenable'],
    ['redundant', 'superfluous', 'excessive', 'unnecessary', 'surplus', 'repetitive'],
    ['stagnant', 'sluggish', 'static', 'inactive', 'dormant', 'motionless', 'idle', 'inert'],
    ['tedious', 'monotonous', 'laborious', 'tiresome', 'dreary', 'dull', 'boring', 'wearisome'],
    ['unprecedented', 'unparalleled', 'novel', 'unequaled', 'groundbreaking', 'peerless', 'unmatched'],
    ['versatile', 'adaptable', 'flexible', 'multifaceted', 'resourceful', 'all-round', 'handy'],
    ['abrupt', 'sudden', 'curt', 'brusque', 'blunt', 'precipitous', 'hasty'],
    ['accessible', 'approachable', 'attainable', 'available', 'intelligible', 'open', 'easy'],
    ['accurate', 'precise', 'exact', 'correct', 'faithful', 'true', 'strict'],
    ['aesthetic', 'artistic', 'tasteful', 'elegant', 'exquisite', 'beautiful', 'graceful'],
    ['affluent', 'wealthy', 'rich', 'prosperous', 'opulent', 'flush'],
    ['alien', 'foreign', 'extraneous', 'exotic', 'strange', 'unfamiliar', 'distant'],
    ['altruistic', 'unselfish', 'benevolent', 'philanthropic', 'generous', 'charitable', 'kind'],
    ['amiable', 'affable', 'genial', 'cordial', 'pleasant', 'friendly', 'warm'],
    ['ancient', 'archaic', 'primitive', 'antique', 'primordial', 'timeworn', 'old'],
    ['anonymous', 'unnamed', 'unidentified', 'nameless', 'unattributed', 'secret'],
    ['apparent', 'obvious', 'evident', 'manifest', 'patent', 'clear', 'plain', 'seeming'],
    ['appropriate', 'suitable', 'fitting', 'proper', 'apt', 'congruous', 'felicitous'],
    ['arduous', 'strenuous', 'laborious', 'taxing', 'exacting', 'difficult', 'hard'],
    ['articulate', 'eloquent', 'fluent', 'expressive', 'coherent', 'lucid', 'vocal'],
    ['austere', 'severe', 'stern', 'strict', 'ascetic', 'unadorned', 'plain', 'grim'],
    ['autonomous', 'independent', 'self-governing', 'sovereign', 'free'],
    ['backward', 'regressive', 'underdeveloped', 'retarded', 'rear', 'slow'],
    ['barren', 'sterile', 'infertile', 'desolate', 'arid', 'unproductive', 'bare'],
    ['benevolent', 'charitable', 'philanthropic', 'benign', 'kindly', 'generous', 'humane'],
    ['blunt', 'dull', 'brusque', 'frank', 'outspoken', 'direct', 'plain'],
    ['boisterous', 'noisy', 'rowdy', 'clamorous', 'unruly', 'tumultuous', 'wild'],
    ['brittle', 'fragile', 'frail', 'delicate', 'crisp', 'breakable'],
    ['candid', 'frank', 'outspoken', 'forthright', 'sincere', 'honest', 'plain'],
    ['capricious', 'fickle', 'whimsical', 'mercurial', 'erratic', 'unpredictable', 'fitful'],
    ['casual', 'accidental', 'informal', 'nonchalant', 'cursory', 'hasty', 'random'],
    ['chronic', 'habitual', 'persistent', 'inveterate', 'recurrent', 'lingering', 'constant'],
    ['coarse', 'rough', 'crude', 'vulgar', 'gross', 'harsh', 'unrefined'],
    ['coherent', 'consistent', 'logical', 'lucid', 'orderly', 'rational', 'sound'],
    ['cohesive', 'adhesive', 'unified', 'connected', 'solid', 'tight'],
    ['commendable', 'praiseworthy', 'laudable', 'creditable', 'estimable', 'admirable', 'worthy'],
    ['communal', 'collective', 'public', 'shared', 'cooperative', 'joint', 'common'],
    ['compatible', 'congruous', 'consistent', 'harmonious', 'agreeable', 'fitting', 'suitable'],
    ['competent', 'capable', 'qualified', 'proficient', 'adept', 'skilled', 'fit'],
    ['complacent', 'self-satisfied', 'smug', 'unconcerned', 'content', 'serene'],
    ['concise', 'brief', 'succinct', 'terse', 'compact', 'pithy', 'short'],
    ['confidential', 'secret', 'private', 'classified', 'intimate', 'covert'],
    ['congenial', 'compatible', 'pleasant', 'sympathetic', 'kindred', 'friendly', 'genial'],
    ['consecutive', 'successive', 'sequential', 'continuous', 'serial', 'following'],
    ['conservative', 'traditional', 'conventional', 'orthodox', 'cautious', 'moderate', 'sober'],
    ['conspicuous', 'noticeable', 'striking', 'prominent', 'manifest', 'obvious', 'salient'],
    ['contemporary', 'modern', 'present-day', 'coexistent', 'synchronous', 'current', 'latest'],
    ['cordial', 'warm', 'friendly', 'hearty', 'genial', 'affectionate', 'amicable'],
    ['cosmopolitan', 'worldly', 'sophisticated', 'universal', 'global', 'international', 'broad'],
    ['covert', 'secret', 'hidden', 'clandestine', 'stealthy', 'surreptitious', 'undercover'],
    ['crude', 'unrefined', 'raw', 'rough', 'primitive', 'coarse', 'vulgar', 'blunt'],
    ['cumulative', 'accumulative', 'collective', 'increasing', 'additive', 'aggregate'],
    ['customary', 'habitual', 'usual', 'traditional', 'conventional', 'routine', 'regular'],
    ['cynical', 'skeptical', 'distrustful', 'pessimistic', 'sarcastic', 'scornful', 'bitter'],

    # Adverbs
    ['predominantly', 'primarily', 'chiefly', 'mainly', 'principally', 'largely', 'mostly'],
    ['invariably', 'always', 'consistently', 'perpetually', 'regularly'],
    ['substantially', 'considerably', 'significantly', 'markedly', 'extensively', 'notably'],
    ['virtually', 'practically', 'almost', 'effectively', 'essentially', 'nearly'],
    ['presumably', 'supposedly', 'allegedly', 'seemingly', 'apparently', 'ostensibly'],
    ['spontaneously', 'instinctively', 'automatically', 'impulsively', 'naturally'],
    ['rigorously', 'strictly', 'stringently', 'meticulously', 'thoroughly', 'severely'],
    ['tentatively', 'provisionally', 'hesitantly', 'experimentally', 'cautiously'],
    ['unanimously', 'solidly', 'collectively', 'jointly', 'harmoniously', 'undivided'],
    ['inadvertently', 'unintentionally', 'accidentally', 'unwittingly', 'mistakenly'],
    ['consequently', 'therefore', 'accordingly', 'hence', 'thus'],
    ['conversely', 'contrarily', 'vice versa', 'inversely'],
    ['explicitly', 'clearly', 'specifically', 'expressly', 'categorically', 'plainly'],
    ['implicitly', 'tacitly', 'indirectly', 'subtly'],
    ['simultaneously', 'concurrently', 'coincidentally', 'together']
]

def clean_term(s):
    return re.sub(r'[^a-zA-Z\-\s]', '', s).strip().lower()

def expand_master_synonyms():
    with open(WORDS_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    words_list = data.get('words', [])
    print(f"Loaded {len(words_list)} words from {WORDS_PATH}.")

    all_valid_words = set(w['word'].lower() for w in words_list)
    all_word_map = {w['word'].lower(): w for w in words_list}

    syn_graph = defaultdict(set)

    def add_syn_pair(w1, w2):
        w1 = w1.strip().lower()
        w2 = w2.strip().lower()
        if w1 and w2 and w1 != w2 and w1 in all_valid_words and w2 in all_valid_words:
            syn_graph[w1].add(w2)
            syn_graph[w2].add(w1)

    # 1. Ingest existing synonyms from words.json
    for w in words_list:
        w_main = w['word'].lower()
        if w.get('synonyms'):
            for item in w['synonyms'].split(','):
                item_clean = clean_term(item)
                if item_clean and item_clean in all_valid_words and item_clean != w_main:
                    add_syn_pair(w_main, item_clean)

    # 2. Ingest Master Clusters
    for cluster in MASTER_CLUSTERS:
        valid_items = [c.strip().lower() for c in cluster if c.strip().lower() in all_valid_words]
        for i in range(len(valid_items)):
            for j in range(i + 1, len(valid_items)):
                add_syn_pair(valid_items[i], valid_items[j])

    # 3. High-precision definition matching
    definition_map = defaultdict(set)
    for w in words_list:
        word = w['word'].lower()
        pos = w.get('pos', '')
        # Chinese meaning keywords
        meanings = w.get('exam_meaning') or w.get('translation') or ''
        parts = re.split(r'[,;；，、/]\s*', meanings)
        for part in parts:
            part = part.strip()
            # Clean part of speech prefixes
            part = re.sub(r'^[a-z]+\.\s*', '', part)
            if 2 <= len(part) <= 6:
                definition_map[(pos, part)].add(word)

    for (pos, d_key), w_set in definition_map.items():
        if 2 <= len(w_set) <= 8:
            w_list = list(w_set)
            for i in range(len(w_list)):
                for j in range(i + 1, len(w_list)):
                    w1, w2 = w_list[i], w_list[j]
                    if not (w1.startswith(w2) or w2.startswith(w1)):
                        add_syn_pair(w1, w2)

    tier_order = {'核心高频': 4, '高频重点': 3, '重点扩展': 2, '普通扩展': 1}

    def get_top_synonyms(target_w, syn_set):
        sorted_syns = sorted(
            list(syn_set),
            key=lambda item: (
                -tier_order.get(all_word_map[item].get('tier', '普通扩展'), 1),
                item
            )
        )
        return sorted_syns[:5]

    # Apply back
    enriched_count = 0
    total_syn_terms = 0

    for w in words_list:
        target = w['word'].lower()
        if target in syn_graph and syn_graph[target]:
            top_syns = get_top_synonyms(target, syn_graph[target])
            if top_syns:
                w['synonyms'] = ', '.join(top_syns)
                enriched_count += 1
                total_syn_terms += len(top_syns)
        else:
            w['synonyms'] = ''

    print(f"\n================ MASTER SYNONYM REPORT ================")
    print(f"Total words with 100% Kaoyan Syllabus Synonyms: {enriched_count} / {len(words_list)} ({enriched_count/len(words_list)*100:.1f}%)")
    print(f"Total synonym connections: {total_syn_terms}")
    print(f"Average synonyms per enriched word: {total_syn_terms/enriched_count:.2f}")

    # Validate 0 out-of-vocab
    out_of_vocab = 0
    for w in words_list:
        if w.get('synonyms'):
            for s in [x.strip() for x in w['synonyms'].split(',')]:
                if s not in all_valid_words:
                    out_of_vocab += 1
                    print(f"ERROR: Out-of-vocab synonym: {s} in {w['word']}")

    if out_of_vocab == 0:
        print("✓ VALIDATION PASSED: 100% Kaoyan Syllabus Compliant!")
    else:
        print(f"❌ VALIDATION FAILED: Found {out_of_vocab} out-of-vocab synonyms.")

    with open(WORDS_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Successfully saved updated dataset to {WORDS_PATH}.")

if __name__ == '__main__':
    expand_master_synonyms()
