import json

WORDS_PATH = r'd:\谷歌反重力\kaoyan_vocab_v9\data\words.json'
AI_PATH = r'd:\谷歌反重力\kaoyan_vocab_v9\data\ai_examples.json'

with open(WORDS_PATH, 'r', encoding='utf-8') as f:
    words_data = json.load(f)
words = words_data['words']

with open(AI_PATH, 'r', encoding='utf-8') as f:
    ai_raw = json.load(f)
ai_data = ai_raw.get('s', {})

SPECIFIC_POLISHED_WORDS = {
    "undermine": [
        "Unregulated shadow banking activities risk undermining public confidence in the stability of the entire national financial system.",
        "缺乏监管的影子银行活动可能会从根本上削弱公众对整个国家金融体系稳定性的信心。"
    ],
    "undermines": [
        "Pervasive cynicism regarding political institutions undermines civic participation and weakens foundational democratic accountability.",
        "对政治体制普遍存在的愤世嫉俗情绪削弱了公民的参政意愿，并动摇了民主问责的基本根基。"
    ],
    "undermined": [
        "The credibility of the landmark clinical trial was severely undermined when whistleblowers exposed undeclared conflicts of financial interest.",
        "当举报人揭露未经申报的经济利益冲突时，这项开创性临床试验的公信力受到了严重损害。"
    ],
    "undermining": [
        "Unchecked algorithmic bias in lending decisions risks undermining equitable access to capital for historically disadvantaged communities.",
        "信贷审批决策中未经审查的算法偏见，可能会破坏历史上弱势群体平等获取资本的机会。"
    ],
    "destabilize": [
        "Geopolitical escalations in energy-producing regions have the potential to destabilize international commodity markets and trigger widespread inflation.",
        "主要产油地区的地缘政治局势升级可能会打破国际大宗商品市场的稳定性，并引发广泛的通胀浪潮。"
    ],
    "exacerbate": [
        "Severe fiscal austerity measures can inadvertently exacerbate socioeconomic inequalities during periods of deep macroeconomic recession.",
        "在严重的宏观经济衰退期间，严厉的财政紧缩政策可能会在无意中进一步加剧社会经济不平等。"
    ],
    "jeopardize": [
        "Failing to enforce stringent carbon emission caps will jeopardize global efforts to keep temperature rise within sustainable limits.",
        "未能严格执行碳排放上限管控，将危及全球将气温上升控制在可持续范围内的整体努力。"
    ],
    "hinder": [
        "Excessive bureaucratic red tape continues to hinder entrepreneurial innovation and slow the growth of dynamic technology startups.",
        "过度的官僚繁文缛节仍在阻碍创业创新步伐，并拖慢了充满活力的科技初创企业的成长。"
    ],
    "impede": [
        "Protectionist trade tariffs inevitably impede the efficient allocation of resources across interconnected global supply chains.",
        "贸易保护主义关税不可避免地会阻碍相互依存的全球供应链中资源的高效配置。"
    ],
    "compromise": [
        "Corporate executives should never compromise rigorous environmental standards merely to achieve short-term quarterly profit targets.",
        "企业高管绝不应当仅仅为了追求短期季度利润目标而牺牲妥协严格的环境保护标准。"
    ],
    "erode": [
        "Persistent inflation can rapidly erode the purchasing power of fixed-income households, lowering their overall standard of living.",
        "持续的通货膨胀会迅速侵蚀固定收入家庭的实际购买力，从而降低其整体生活水平。"
    ],
    "meticulous": [
        "The forensic accountant conducted a meticulous examination of the balance sheets, uncovering millions in hidden offshore transactions.",
        "法务会计师对财务资产负债表进行了极其严谨细致的核查，揭露了数百万美元隐藏的离岸交易。"
    ],
    "relentless": [
        "The relentless pace of technological obsolescence forces modern manufacturing firms to continuously upgrade their production lines.",
        "技术淘汰更新的无情步伐，迫使现代制造企业必须对其生产线进行持续不断的迭代升级。"
    ],
    "vulnerable": [
        "Coastal metropolitan areas remain exceptionally vulnerable to rising sea levels and intense storm surges caused by planetary climate disruption.",
        "受全球气候恶化影响，沿海大都市极易受到海平面上升与剧烈风暴潮的严重冲击与威胁。"
    ],
    "zeal": [
        "While intellectual zeal drives groundbreaking scientific discoveries, empirical skepticism remains essential for validating experimental findings.",
        "尽管求知的学术热情能够推动开创性的科学发现，但严谨的实证怀疑精神对于验证实验结论依然不可或缺。"
    ]
}

word_map = {w['word'].lower(): w for w in words}
for word, (en_sent, zh_sent) in SPECIFIC_POLISHED_WORDS.items():
    word_l = word.lower()
    ai_data[word_l] = [en_sent, zh_sent]
    if word_l in word_map:
        word_map[word_l]['example_en'] = en_sent
        word_map[word_l]['example_zh'] = zh_sent

# Save
with open(AI_PATH, 'w', encoding='utf-8') as f:
    json.dump({'s': ai_data}, f, ensure_ascii=False, indent=2)

with open(WORDS_PATH, 'w', encoding='utf-8') as f:
    json.dump(words_data, f, ensure_ascii=False, indent=2)

print(f"Applied semantic precision fixes to {len(SPECIFIC_POLISHED_WORDS)} key words.")
