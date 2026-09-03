# -*- coding: utf-8 -*-
"""
High-Precision Etymological & Morphological Root Engine for Kaoyan Lexicon
Decomposes academic English words into prefix + Latin/Greek root + suffix + mnemonic gloss.
"""

import json, os, sys, re

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'data')

# Comprehensive Classical Prefix Dictionary
PREFIXES = [
    ('retro', 'retro- (向后、往回)'),
    ('counter', 'counter- (相反、反对)'),
    ('contra', 'contra- (相反、对抗)'),
    ('contro', 'contro- (相反、对照)'),
    ('extra', 'extra- (超出、额外)'),
    ('hyper', 'hyper- (过度、极度)'),
    ('inter', 'inter- (在...之间、相互)'),
    ('intra', 'intra- (在...内部)'),
    ('intro', 'intro- (向内、入内)'),
    ('micro', 'micro- (微小)'),
    ('macro', 'macro- (宏观、巨大)'),
    ('multi', 'multi- (多、多样)'),
    ('omni', 'omni- (全、全能)'),
    ('trans', 'trans- (穿过、转变、转移)'),
    ('super', 'super- (超级、在上方、过度)'),
    ('under', 'under- (在下方、不足)'),
    ('anti', 'anti- (反对、抗击)'),
    ('auto', 'auto- (自身、自动)'),
    ('circum', 'circum- (围绕、周围)'),
    ('tele', 'tele- (远距离)'),
    ('sub', 'sub- (在...下方、次级)'),
    ('suc', 'suc- (在...下方、随后)'),
    ('suf', 'suf- (在...下方)'),
    ('sug', 'sug- (在...下方、暗中)'),
    ('sup', 'sup- (在...下方、支持)'),
    ('sur', 'sur- (在...之上、超过)'),
    ('sus', 'sus- (在...下方、自下而上支撑)'),
    ('sym', 'sym- (共同、相同)'),
    ('syn', 'syn- (共同、聚合)'),
    ('col', 'col- (共同、聚合)'),
    ('com', 'com- (共同、加强语气)'),
    ('con', 'con- (共同、加强语气)'),
    ('cor', 'cor- (共同、相互)'),
    ('co', 'co- (共同、联合)'),
    ('dis', 'dis- (分开、相反、不)'),
    ('dif', 'dif- (分开、不同)'),
    ('dia', 'dia- (穿过、二者之间)'),
    ('pre', 'pre- (在...之前、预先)'),
    ('pro', 'pro- (向前、赞同、支持)'),
    ('per', 'per- (贯穿、完全、彻底)'),
    ('post', 'post- (在...之后)'),
    ('para', 'para- (半、类似、在旁)'),
    ('over', 'over- (过度、在上方)'),
    ('fore', 'fore- (在前、预先)'),
    ('non', 'non- (非、不)'),
    ('mis', 'mis- (错误、不当)'),
    ('mal', 'mal- (恶、不良)'),
    ('out', 'out- (超越、在外部)'),
    ('ab', 'ab- (离开、偏离)'),
    ('ad', 'ad- (朝向、加强)'),
    ('ac', 'ac- (朝向、加强)'),
    ('af', 'af- (朝向、加强)'),
    ('ag', 'ag- (朝向、加强)'),
    ('al', 'al- (朝向、加强)'),
    ('an', 'an- (无、不、非)'),
    ('ap', 'ap- (朝向、加强)'),
    ('ar', 'ar- (朝向、加强)'),
    ('as', 'as- (朝向、加强)'),
    ('at', 'at- (朝向、加强)'),
    ('de', 'de- (向下、去除、否定)'),
    ('ex', 'ex- (出、向外、前任)'),
    ('ef', 'ef- (出、向外)'),
    ('em', 'em- (使进入、置于...之中)'),
    ('en', 'en- (使进入、使成为)'),
    ('in', 'in- (不、非 或 向内、进入)'),
    ('im', 'im- (不、非 或 向内、进入)'),
    ('il', 'il- (不、非)'),
    ('ir', 'ir- (不、非)'),
    ('re', 're- (再、反复、向后、回)'),
    ('un', 'un- (不、非、取消)'),
    ('se', 'se- (分开、隔离)')
]

# Classical Roots with Core Concepts
ROOTS = [
    ('spect', 'spect/spic (看、观察)'),
    ('struct', 'struct (建造、构成)'),
    ('tract', 'tract (拉、吸引、抽出)'),
    ('dict', 'dict (说话、宣布)'),
    ('duct', 'duc/duct (引导、带来)'),
    ('port', 'port (搬运、携带)'),
    ('scrib', 'scrib/script (写、记录)'),
    ('script', 'scrib/script (写、记录)'),
    ('press', 'press (挤压、压迫)'),
    ('vis', 'vis/vid (看见)'),
    ('vid', 'vis/vid (看见)'),
    ('voc', 'voc/vok (叫喊、声音)'),
    ('vok', 'voc/vok (叫喊、声音)'),
    ('vert', 'vert/vers (转动、转变)'),
    ('vers', 'vert/vers (转动、转变)'),
    ('pel', 'pel/puls (推、驱动)'),
    ('puls', 'pel/puls (推、驱动)'),
    ('ject', 'ject (扔、投射)'),
    ('pend', 'pend/pens (悬挂、衡量、支付)'),
    ('pens', 'pend/pens (悬挂、衡量、支付)'),
    ('mit', 'mit/miss (送出、派遣)'),
    ('miss', 'mit/miss (送出、派遣)'),
    ('cess', 'ced/ceed/cess (行走、退让)'),
    ('ceed', 'ced/ceed/cess (行走、退让)'),
    ('cede', 'ced/ceed/cess (行走、退让)'),
    ('ced', 'ced/ceed/cess (行走、退让)'),
    ('cur', 'cur/curs (跑、流动、发生)'),
    ('curs', 'cur/curs (跑、流动、发生)'),
    ('fer', 'fer (带来、承受、运送)'),
    ('gen', 'gen/gener (出生、产生、种族)'),
    ('flu', 'flu/flux (流动)'),
    ('flux', 'flu/flux (流动)'),
    ('plic', 'plic/ply/plex (折叠、重叠)'),
    ('plex', 'plic/ply/plex (折叠、重叠)'),
    ('ply', 'plic/ply/plex (折叠、重叠)'),
    ('fact', 'fac/fact/fict (做、制造)'),
    ('fict', 'fac/fact/fict (做、制造)'),
    ('fect', 'fac/fact/fect (做、制造)'),
    ('fic', 'fac/fact/fic (做、制造)'),
    ('fac', 'fac/fact (做、制造)'),
    ('cap', 'cap/capt/cept (抓取、拿取、容纳)'),
    ('capt', 'cap/capt/cept (抓取、拿取、容纳)'),
    ('cept', 'cap/capt/cept (抓取、拿取、容纳)'),
    ('ceiv', 'ceiv/cept (抓取、接受)'),
    ('cip', 'cip/cept (抓取、拿取)'),
    ('tend', 'tend/tens/tent (伸展、倾向)'),
    ('tens', 'tend/tens/tent (伸展、倾向)'),
    ('tent', 'tend/tens/tent (伸展、倾向)'),
    ('serv', 'serv (保持、服务、观察)'),
    ('form', 'form (形状、形成)'),
    ('tain', 'tain/ten/tin (握住、保持、支撑)'),
    ('ten', 'tain/ten/tin (握住、保持、支撑)'),
    ('tin', 'tain/ten/tin (握住、保持、支撑)'),
    ('pos', 'pos/pon (放置、摆放)'),
    ('pon', 'pos/pon (放置、摆放)'),
    ('stat', 'stat/stit/sist (站立、设立、稳固)'),
    ('stit', 'stat/stit/sist (站立、设立、稳固)'),
    ('sist', 'stat/stit/sist (站立、设立、稳固)'),
    ('val', 'val/vail (强壮、价值)'),
    ('vail', 'val/vail (强壮、价值)'),
    ('clar', 'clar (清楚、明朗)'),
    ('path', 'path/pass (感受、受苦、疾病)'),
    ('pass', 'path/pass (感受、受苦、通道)'),
    ('scend', 'scend/scent (攀爬、上升)'),
    ('fid', 'fid/feder (信任、信念)'),
    ('cred', 'cred (相信、信任)'),
    ('chron', 'chron (时间)'),
    ('corp', 'corp (身体、组织)'),
    ('leg', 'leg/lig/lect (选择、收集、读、法律)'),
    ('lect', 'leg/lig/lect (选择、收集、读)'),
    ('lig', 'leg/lig/lect (绑、选择)'),
    ('viv', 'viv/vit (生命、生活)'),
    ('vit', 'viv/vit (生命、活力)'),
    ('err', 'err (漫游、犯错)'),
    ('rog', 'rog (要求、询问)'),
    ('rad', 'rad/ras (刮、擦、根)'),
    ('ras', 'rad/ras (刮、擦)'),
    ('turb', 'turb (混乱、骚动)'),
    ('tort', 'tort (扭曲、拧)'),
    ('vac', 'vac/van (空、虚无)'),
    ('van', 'vac/van (空、虚无)'),
    ('luc', 'luc/lum/lux (光、明亮)'),
    ('lum', 'luc/lum/lux (光、明亮)'),
    ('sol', 'sol (单独、太阳、安慰)'),
    ('rupt', 'rupt (断裂、破裂)'),
    ('sec', 'sec/sect (切割、切开)'),
    ('sect', 'sec/sect (切割、切开)'),
    ('quer', 'quer/quest/quir (寻求、询问)'),
    ('quest', 'quer/quest/quir (寻求、询问)'),
    ('quir', 'quer/quest/quir (寻求、询问)'),
    ('quis', 'quis/quest (寻求、获得)'),
    ('flu', 'flu/flux (流动)'),
    ('grad', 'grad/gress (步伐、行走、等级)'),
    ('gress', 'grad/gress (步伐、行走、等级)'),
    ('cide', 'cid/cide (切、杀、落下)'),
    ('cis', 'cis/cise (切、剪)'),
    ('cise', 'cis/cise (切、剪)'),
    ('fuse', 'fus/fuse (倾倒、融合)'),
    ('fus', 'fus/fuse (倾倒、融合)'),
    ('mort', 'mort (死亡)'),
    ('mor', 'mor/mort (死亡、风俗)'),
    ('nov', 'nov/neo (新)'),
    ('prim', 'prim/prin (第一、原始)'),
    ('prin', 'prim/prin (第一、主要的)'),
    ('sens', 'sens/sent (感觉、意识)'),
    ('sent', 'sens/sent (感觉、意识)'),
    ('sum', 'sum/sumpt (拿取、总计、消耗)'),
    ('sumpt', 'sum/sumpt (拿取、总计、消耗)'),
    ('aud', 'aud/audit (听)'),
    ('audit', 'aud/audit (听、审理)'),
    ('bene', 'bene/bon (好、善)'),
    ('mal', 'mal/male (坏、恶)'),
    ('magn', 'magn/maj (大、宏大)'),
    ('maj', 'magn/maj (大、多数)'),
    ('min', 'min/mini (小、少、突出)'),
    ('doc', 'doc/doct (教导、学说)'),
    ('doct', 'doc/doct (教导、学说)'),
    ('hab', 'hab/hibit (拥有、居住、拿)'),
    ('hibit', 'hab/hibit (拥有、拿、持)'),
    ('memor', 'memor (记忆、记得)'),
    ('norm', 'norm (规范、标准)'),
    ('orig', 'orig (起源、开始)'),
    ('sci', 'sci (知道、科学)'),
    ('temp', 'temp/tempor (时间、节制)'),
    ('tempor', 'temp/tempor (时间、时代)'),
    ('term', 'term/termin (界限、末端、术语)'),
    ('termin', 'term/termin (界限、终结)'),
    ('urb', 'urb (城市)'),
    ('civ', 'civ/cit (公民、城市)'),
    ('popul', 'popul/publ (人民、大众)'),
    ('publ', 'popul/publ (公众、大众)'),
    ('soci', 'soci (结伴、社会)'),
    ('jur', 'jur/jud/just (法律、正义、判断)'),
    ('jud', 'jur/jud/just (法律、审判)'),
    ('just', 'jur/jud/just (公正、法律)'),
    ('leg', 'leg/lex (法律、规则)'),
    ('medi', 'medi (中间、居中)'),
    ('centr', 'centr (中心)'),
    ('phon', 'phon (声音、语音)'),
    ('graph', 'graph/gram (写、画、图)'),
    ('gram', 'graph/gram (写、字、图)'),
    ('log', 'log/logy/loc (说话、学科、逻辑)'),
    ('loc', 'loc/loqu (说话 或 地方)'),
    ('loqu', 'loqu/loc (说话、交谈)'),
    ('nom', 'nom/onym (名字、法则)'),
    ('onym', 'nom/onym (名字)')
]

def decompose_word(word, trans=""):
    w = word.lower().strip()
    p_hit = None
    r_hit = None
    
    # 1. Match Prefix
    rem = w
    for p_key, p_desc in PREFIXES:
        if rem.startswith(p_key) and len(rem) > len(p_key) + 2:
            p_hit = p_desc
            rem = rem[len(p_key):]
            break
            
    # 2. Match Root
    for r_key, r_desc in ROOTS:
        if r_key in rem:
            r_hit = r_desc
            break
            
    if not r_hit and p_hit:
        for r_key, r_desc in ROOTS:
            if r_key in w:
                r_hit = r_desc
                break
                
    if p_hit and r_hit:
        return f"{p_hit} + {r_hit} → 词义引申"
    elif p_hit:
        return f"{p_hit} + 核心词干"
    elif r_hit:
        return f"{r_hit} 衍生派生词"
        
    return None

if __name__ == '__main__':
    test_words = ['aberrational', 'prohibit', 'substantiate', 'retrospect', 'contradict', 'intervene', 'sustainable', 'vulnerable', 'abrogation', 'inspect', 'predict', 'transform']
    print("Testing etymology engine:")
    for tw in test_words:
        res = decompose_word(tw)
        print(f"  {tw:15} -> {res}")
