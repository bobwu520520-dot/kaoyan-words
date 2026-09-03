import json

CONFUSABLE_PAIRS = [
    ("adapt", "adopt", "adapt 适应/改编 (adapt to) ↔ adopt 采纳/收养 (adopt a policy)"),
    ("adopt", "adapt", "adopt 采纳/收养 (adopt a policy) ↔ adapt 适应/改编 (adapt to)"),
    ("adept", "adapt", "adept 熟练的/内行的 ↔ adapt 适应/改编"),
    ("access", "assess", "access 进入/获取途径 (have access to) ↔ assess 评估/估价 (assess the impact)"),
    ("assess", "access", "assess 评估/估价 (assess the impact) ↔ access 进入/获取途径 (have access to)"),
    ("excess", "access", "excess 过度/超过 ↔ access 进入/获取途径"),
    ("affect", "effect", "affect (动词) 影响 ↔ effect (名词) 效果/影响；(动词) 产生/引起"),
    ("effect", "affect", "effect (名词) 效果/影响 ↔ affect (动词) 影响"),
    ("altogether", "all together", "altogether 完全/总共 ↔ all together 一同/全部在一块"),
    ("cite", "site", "cite 引用/传唤 ↔ site 遗址/地点/网站 ↔ sight 视力/景象"),
    ("site", "cite", "site 遗址/地点/网站 ↔ cite 引用/传唤 ↔ sight 视力/景象"),
    ("sight", "cite", "sight 视力/景象 ↔ cite 引用/传唤 ↔ site 遗址/地点"),
    ("complement", "compliment", "complement 补充/互补物 ↔ compliment 赞美/恭维"),
    ("compliment", "complement", "compliment 赞美/恭维 ↔ complement 补充/互补物"),
    ("comprehensible", "comprehensive", "comprehensible 可理解的 ↔ comprehensive 全面的/综合的"),
    ("comprehensive", "comprehensible", "comprehensive 全面的/综合的 ↔ comprehensible 可理解的"),
    ("conscious", "conscientious", "conscious 有意识的/神志清醒的 ↔ conscientious 认真的/尽责的"),
    ("conscientious", "conscious", "conscientious 认真的/尽责的 ↔ conscious 有意识的/神志清醒的"),
    ("considerable", "considerate", "considerable 相当大的/重要的 ↔ considerate 体贴的/考虑周到的"),
    ("considerate", "considerable", "considerate 体贴的/考虑周到的 ↔ considerable 相当大的/重要的"),
    ("continual", "continuous", "continual 频频发生的/屡次的 (有间断) ↔ continuous 持续不断的 (无间断)"),
    ("continuous", "continual", "continuous 持续不断的 (无间断) ↔ continual 频频发生的/屡次的 (有间断)"),
    ("desert", "dessert", "desert 沙漠/抛弃 ↔ dessert 甜点/餐后甜品"),
    ("dessert", "desert", "dessert 甜点/餐后甜品 ↔ desert 沙漠/抛弃"),
    ("economic", "economical", "economic 经济学的/经济上的 ↔ economical 节俭的/合算的"),
    ("economical", "economic", "economical 节俭的/合算的 ↔ economic 经济学的/经济上的"),
    ("elicit", "illicit", "elicit 引出/诱出 (elicit a response) ↔ illicit 违法的/不正当的"),
    ("illicit", "elicit", "illicit 违法的/不正当的 ↔ elicit 引出/诱出"),
    ("eminent", "imminent", "eminent 杰出的/著名的 ↔ imminent 即将发生的/逼近的"),
    ("imminent", "eminent", "imminent 即将发生的/逼近的 ↔ eminent 杰出的/著名的"),
    ("historic", "historical", "historic 具有历史意义的/划时代的 ↔ historical 历史上的/有关历史的"),
    ("historical", "historic", "historical 历史上的/有关历史的 ↔ historic 具有历史意义的/划时代的"),
    ("industrial", "industrious", "industrial 工业的/产业的 ↔ industrious 勤奋的/勤劳的"),
    ("industrious", "industrial", "industrious 勤奋的/勤劳的 ↔ industrial 工业的/产业的"),
    ("ingenious", "ingenuous", "ingenious 心灵手巧的/精巧的 ↔ ingenuous 天真无邪的/坦率的"),
    ("ingenuous", "ingenious", "ingenuous 天真无邪的/坦率的 ↔ ingenious 心灵手巧的/精巧的"),
    ("intense", "intensive", "intense 剧烈的/强烈的 (intense pressure) ↔ intensive 集中的/精细的 (intensive reading)"),
    ("intensive", "intense", "intensive 集中的/精细的 (intensive reading) ↔ intense 剧烈的/强烈的"),
    ("judicial", "judicious", "judicial 司法的/审判的 ↔ judicious 明智的/审慎的"),
    ("judicious", "judicial", "judicious 明智的/审慎的 ↔ judicial 司法的/审判的"),
    ("moral", "morale", "moral 道德的/寓意 ↔ morale 士气/斗志"),
    ("morale", "moral", "morale 士气/斗志 ↔ moral 道德的/寓意"),
    ("persecute", "prosecute", "persecute 迫害/残害 ↔ prosecute 起诉/告发"),
    ("prosecute", "persecute", "prosecute 起诉/告发 ↔ persecute 迫害/残害"),
    ("perspective", "prospective", "perspective 视角/透视图/远景 ↔ prospective 前瞻性的/未来的/预期的"),
    ("prospective", "perspective", "prospective 前瞻性的/未来的/预期的 ↔ perspective 视角/透视图/远景"),
    ("principal", "principle", "principal 主要的/校长/本金 ↔ principle 原则/原理/信条"),
    ("principle", "principal", "principle 原则/原理/信条 ↔ principal 主要的/校长/本金"),
    ("sensible", "sensitive", "sensible 明智的/通情达理的 ↔ sensitive 敏感的/体贴的/易受刺激的"),
    ("sensitive", "sensible", "sensitive 敏感的/体贴的/易受刺激的 ↔ sensible 明智的/通情达理的"),
    ("stationary", "stationery", "stationary 静止的/固定的 ↔ stationery 文具/信纸"),
    ("stationery", "stationary", "stationery 文具/信纸 ↔ stationary 静止的/固定的"),
    ("statute", "status", "statute 法令/成文法 ↔ status 地位/状态 ↔ stature 身高/声望"),
    ("status", "statute", "status 地位/状态 ↔ statute 法令/成文法 ↔ stature 身高/声望"),
    ("stature", "status", "stature 身高/声望 ↔ status 地位/状态 ↔ statute 法令/成文法"),
    ("sympathy", "empathy", "sympathy 同情心/同情 ↔ empathy 同理心/感同身受/共情"),
    ("empathy", "sympathy", "empathy 同理心/感同身受/共情 ↔ sympathy 同情心/同情"),
    ("transient", "transition", "transient 短暂的/转瞬即逝的 ↔ transition 过渡/转变"),
    ("transition", "transient", "transition 过渡/转变 ↔ transient 短暂的/转瞬即逝的"),
    ("valuable", "invaluable", "valuable 贵重的/有价值的 ↔ invaluable 无价的/极宝贵的 (≠无价值的)"),
    ("invaluable", "valuable", "invaluable 无价的/极宝贵的 (≠无价值的) ↔ valuable 贵重的/有价值的"),
    ("priceless", "worthless", "priceless 无价的/极其珍贵的 ↔ worthless 无价值的/一文不值的"),
    ("worthless", "priceless", "worthless 无价值的/一文不值的 ↔ priceless 无价的/极其珍贵的"),
]

with open(r'd:\谷歌反重力\kaoyan_vocab_v9\data\words.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

word_map = {w['word'].lower(): w for w in d['words']}

added_count = 0
for w1, w2, tip in CONFUSABLE_PAIRS:
    w1_lower = w1.lower()
    if w1_lower in word_map:
        w_entry = word_map[w1_lower]
        existing = w_entry.get('confusable_words') or []
        if not any(tip in str(e) or w2 in str(e) for e in existing):
            existing.append(tip)
            w_entry['confusable_words'] = existing
            added_count += 1

print(f'Successfully injected/updated {added_count} confusable word pairs!')

with open(r'd:\谷歌反重力\kaoyan_vocab_v9\data\words.json', 'w', encoding='utf-8') as f:
    json.dump(d, f, ensure_ascii=False, indent=2)

print('Updated data/words.json successfully!')
