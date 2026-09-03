import json
import os

TRANSLATIONS_PATH = r'd:\谷歌反重力\kaoyan_vocab_v9\data\translations.json'

with open(TRANSLATIONS_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Comprehensive enrichment dictionary keyed by sentence ID
ENRICHMENTS = {
    "trans-001": {
        "skeleton": "The pervasive deployment... has compelled researchers to reconsider the fundamental assumption...",
        "skeleton_label": "主语: The pervasive deployment... | 谓语: has compelled | 宾语: researchers | 宾补: to reconsider the fundamental assumption...",
        "literal_flaw": "【生硬字面译】自动算法系统的无所不在的部署已经强迫研究员去重新考虑根本的假设，即技术进步不变地提高人类生产率，而不同时使劳动力的脆弱片段边缘化。（语序僵硬，多处死译）",
        "scoring_rubric": [
            {"score": 0.5, "item": "主干（自主算法系统的广泛应用/部署，促使研究人员重新审视…）翻译准确"},
            {"score": 0.5, "item": "that 同位语从句正确转化为中文解释性分句（“即技术进步必然会提高人类生产力…”）"},
            {"score": 0.5, "item": "without 介词短语转换为否定转折/伴随逻辑（“同时不会使……边缘化”）"},
            {"score": 0.5, "item": "核心词汇（pervasive 广泛/普遍；marginalizing 使边缘化；workforce 劳动力群体）语境引申得当且无错别字"}
        ]
    },
    "trans-002": {
        "skeleton": "bioethicists argue that the absence of standardized regulatory frameworks threatens to undermine...",
        "skeleton_label": "状语从句: As neural interface devices transition... | 主句主谓: bioethicists argue | 宾语从句: that the absence... threatens to undermine...",
        "literal_flaw": "【生硬字面译】当神经接口设备从实验实验室过渡进入商业应用时，生物伦理学家争论说标准化管理框架的缺席威胁破坏个体的认知自由和个人自主。（过渡直译生硬，缺乏学术语感）",
        "scoring_rubric": [
            {"score": 0.5, "item": "As 引导的时间/伴随状语从句语序调整自然（“随着神经接口设备从实验室阶段走向商业化应用…”）"},
            {"score": 0.5, "item": "主句及宾语从句主干（“生物伦理学家指出/警告……”）表达准确"},
            {"score": 0.5, "item": "the absence of 转译为否定概念（“缺乏/缺少标准化的监管框架…”）"},
            {"score": 0.5, "item": "核心术语（neural interface 神经接口；regulatory frameworks 监管框架；cognitive liberty 认知自由）准确翻译"}
        ]
    },
    "trans-003": {
        "skeleton": "Economists suggest that integrating automated analytics may mitigate short-term disruptions, yet it cannot eliminate systemic disparities...",
        "skeleton_label": "主干: Economists suggest that [从句1: integrating... may mitigate...] yet [从句2: it cannot eliminate...]",
        "literal_flaw": "【生硬字面译】经济学家建议整合自动分析可以减轻短期分裂，然而它不能消灭系统性的差异，如果政策制定者不采取积极措施。（从句修饰语序混乱，后置条件未前置）",
        "scoring_rubric": [
            {"score": 0.5, "item": "宾语从句内 yet 连接的让步/转折逻辑（“虽然可能缓解……但无法消除……”）翻译流畅"},
            {"score": 0.5, "item": "unless 引导的否定条件状语从句语序恰当，前置或顺译（“除非决策者采取积极措施…”）"},
            {"score": 0.5, "item": "主干动词短语（integrating automated analytics 整合/引入自动化分析工具）译法规范"},
            {"score": 0.5, "item": "难词（mitigate 缓解/减轻；disruptions 冲击/震荡；systemic disparities 系统性差距）精准引申"}
        ]
    },
    "trans-004": {
        "skeleton": "Scholars emphasize that reliance on algorithmic decision-making risks reinforcing biases, particularly when systems are trained on datasets...",
        "skeleton_label": "主干: Scholars emphasize that [主语: reliance... | 谓语: risks reinforcing | 宾语: historical socio-economic biases] | 状语: particularly when...",
        "literal_flaw": "【生硬字面译】学者强调依靠算法决定制作有强化历史社会经济偏见的风险，特别是当系统在反映深层不平等的数据集上被训练的时候。（机械翻译动名词与被动语态）",
        "scoring_rubric": [
            {"score": 0.5, "item": "主句主干及 risks doing sth（“过度依赖算法决策可能会加剧/强化……”）翻译地道"},
            {"score": 0.5, "item": "when 引导的时间状语从句语序合理，被动语态被动转主动（“特别是在利用……数据集对系统进行训练时…”）"},
            {"score": 0.5, "item": "that reflect 定语从句与先行词 datasets 融合流畅（“反映深层不平等历史的……”）"},
            {"score": 0.5, "item": "学术词汇（reliance 依赖；socio-economic biases 社会经济偏见；deep-seated 根深蒂固的/深层的）准确翻译"}
        ]
    },
    "trans-005": {
        "skeleton": "Global supply chains have become vulnerable to shocks, demonstrating that efficiency cannot compensate for fragility...",
        "skeleton_label": "主干: Global supply chains have become vulnerable to geopolitical shocks | 伴随状语: demonstrating that efficiency cannot compensate for fragility...",
        "literal_flaw": "【生硬字面译】全球供应链接已经变得容易受地缘政治休克的伤害，证明了过度追求无摩擦的效率不能补偿结构性的脆弱。（休克死译，无摩擦未能语境引申）",
        "scoring_rubric": [
            {"score": 0.5, "item": "主句（“全球供应链在地缘政治冲突/动荡面前变得愈发脆弱…”）表达通顺"},
            {"score": 0.5, "item": "现在分词 demonstrating 作结果/伴随状语转化为引出论断（“这表明/充分证明了……”）"},
            {"score": 0.5, "item": "cannot compensate for 的语境对应（“无法弥补……/难以抵消……”）"},
            {"score": 0.5, "item": "专有名词与难词（frictionless efficiency 极度追求效率/零阻力效率；structural fragility 结构性脆弱）翻译准确"}
        ]
    },
    "trans-006": {
        "skeleton": "Monetary authorities are navigating a dilemma, where raising rates threatens recovery, whereas maintaining policy risks inflation.",
        "skeleton_label": "主干: Monetary authorities are navigating a policy dilemma | 定语从句: where raising rates... whereas maintaining...",
        "literal_flaw": "【生硬字面译】货币权威们正在航行一个复杂的政策困境，在那里加息威胁破坏脆弱的复苏，然而维持宽松政策冒着根深蒂固通货膨胀的危险。（navigating 死译为航行）",
        "scoring_rubric": [
            {"score": 0.5, "item": "navigating a policy dilemma 动宾搭配语境转化（“正面临着……两难困境/权衡抉择”）"},
            {"score": 0.5, "item": "where 关系副词引导的定语从句拆译为具体阐述（“一方面加息可能危及……，另一方面维持……”）"},
            {"score": 0.5, "item": "whereas 对比连词翻译成对称有力的排比句式"},
            {"score": 0.5, "item": "金融经管词汇（monetary authorities 货币当局/央行；fragile recovery 脆弱的复苏；entrenching inflation 使通胀根深蒂固）得当"}
        ]
    },
    "trans-007": {
        "skeleton": "Corporate executives face pressures to reconcile obligations with demands, which challenges traditional models...",
        "skeleton_label": "主干: Corporate executives face growing pressures to reconcile [A] with [B] | 非限制性定语从句: which challenges traditional models...",
        "literal_flaw": "【生硬字面译】公司的执行者们面对增长的压力去和解对股东的短期财政义务与对可持续性的长期社会要求，这挑战了传统的最大化利益的模型。（reconcile 死译为和解）",
        "scoring_rubric": [
            {"score": 0.5, "item": "reconcile A with B 词组准确翻译（“平衡/兼顾……与……”）"},
            {"score": 0.5, "item": "to do 不定式作定语修饰 pressures 翻译通顺自然"},
            {"score": 0.5, "item": "which 引导的非限制性定语从句修饰前面整个事件（“这一趋势对传统的……构成了挑战”）"},
            {"score": 0.5, "item": "经管词汇（corporate executives 企业高管；fiduciary obligations 信托/财务义务；profit-maximization 利润最大化）表达地道"}
        ]
    },
    "trans-008": {
        "skeleton": "Sociologists contend that fragmentation cannot be attributed to polarization, but stems from institutional erosion.",
        "skeleton_label": "主干: Sociologists contend that [主语: fragmentation... | 谓语1: cannot be attributed to... | 谓语2: but stems from...]",
        "literal_flaw": "【生硬字面译】社会学家主张当代公共话语的碎片化不能单纯被归因于数字平台上的意识形态两极分化，而是源于对机构信任的渐进侵蚀。（被动语态死译）",
        "scoring_rubric": [
            {"score": 0.5, "item": "not... but... 并列否定转折结构（“不能单纯归咎于……，而是源于……”）流畅表达"},
            {"score": 0.5, "item": "主语部分 fragmentation of contemporary public discourse（“当代公共舆论话语的碎片化/割裂”）准确翻译"},
            {"score": 0.5, "item": "stems from 与 institutional erosion 动宾与修饰处理妥当（“源于人们对建制/权威机构信任的逐步瓦解”）"},
            {"score": 0.5, "item": "学术词汇（ideological polarization 意识形态极化；gradual erosion 渐进式侵蚀/瓦解）"}
        ]
    },
    "trans-009": {
        "skeleton": "Cognitive psychologists demonstrate that exposure to information diminishes attention spans and impairs capacity...",
        "skeleton_label": "主干: Cognitive psychologists demonstrate that [主语: prolonged exposure to...] [谓语1: diminishes attention spans] and [谓语2: impairs the capacity to synthesize...]",
        "literal_flaw": "【生硬字面译】认知心理学家证明长期暴露于碎片化信息减少人们的注意力跨度，并且损害综合复杂论点的能力。（暴露于直译生硬，跨度需引申）",
        "scoring_rubric": [
            {"score": 0.5, "item": "exposure to 介词短语语境引申为动词化动作（“长期接触/沉浸于……”）"},
            {"score": 0.5, "item": "diminishes and impairs 两个动宾并列结构（“缩短注意力集中时间，并削弱……的能力”）翻译对称"},
            {"score": 0.5, "item": "to synthesize complex arguments 不定式定语后置转前置修饰 capacity（“综合/归纳复杂论点的能力”）"},
            {"score": 0.5, "item": "认知科学术语（cognitive psychologists 认知心理学家；fragmented information 碎片化信息；attention spans 注意力持续时长）准确"}
        ]
    },
    "trans-010": {
        "skeleton": "The transformation of urban spaces has altered patterns, as rapid gentrification displaces communities and deepens segregation.",
        "skeleton_label": "主干: The transformation... has altered patterns | 伴随/原因从句: as rapid gentrification [谓语1: displaces communities] and [谓语2: deepens segregation]",
        "literal_flaw": "【生硬字面译】城市空间的转变已经深刻改变了传统的邻里模式，因为快速的绅士化取代了历史社区并且加深了社会经济的分离。（绅士化死译未解释，分离未到位）",
        "scoring_rubric": [
            {"score": 0.5, "item": "as 引导的原因/伴随状语从句语序得当（“随着快速推进的城市贵族化/中产阶级化……”）"},
            {"score": 0.5, "item": "displaces communities 动宾搭配语境化（“迫使历史原住街区居民迁离/流离失所…”）"},
            {"score": 0.5, "item": "deepens socio-economic segregation 准确传达“加剧社会阶层隔离/分化”"},
            {"score": 0.5, "item": "社会学术语（gentrification 贵族化/中产阶层化；socio-economic segregation 阶层隔离）翻译精准"}
        ]
    },
    "trans-011": {
        "skeleton": "Moral philosophers argue that moral responsibility cannot be delegated to algorithms, since ethical reasoning demands deliberation...",
        "skeleton_label": "主干: Moral philosophers argue that moral responsibility cannot be delegated to algorithms | 原因从句: since ethical reasoning demands empathetic deliberation...",
        "literal_flaw": "【生硬字面译】道德哲学家主张真正道德责任不能被委托给自主算法，因为伦理推理要求移情的深思熟虑，这是计算逻辑本质上缺乏的。（移情直译生硬，缺乏哲学韵味）",
        "scoring_rubric": [
            {"score": 0.5, "item": "cannot be delegated to 动宾语境化处理（“不能托付给/让渡给……”）"},
            {"score": 0.5, "item": "since 引导的原因状语从句翻译自然连贯（“因为伦理推演需要富有同理心的深思熟虑…”）"},
            {"score": 0.5, "item": "which 定语从句准确修饰 empathetic deliberation（“而这正是计算逻辑本质上所欠缺的”）"},
            {"score": 0.5, "item": "哲学伦理术语（moral responsibility 道德责任；empathetic deliberation 感同身受的审慎思考；computational logic 计算逻辑）"}
        ]
    },
    "trans-012": {
        "skeleton": "Legal scholars debate whether privacy should be conceptualized as an individual right or as a collective good...",
        "skeleton_label": "主干: Legal scholars debate whether [privacy should be conceptualized as [A] or as [B]] | 定语从句: that safeguards democratic institutions...",
        "literal_flaw": "【生硬字面译】法学学者争论是否数字隐私应该被概念化为一个可让渡的个体权利，还是作为一个集体公共品，那保卫民主机构防止监视资本主义。（句子严重欧化）",
        "scoring_rubric": [
            {"score": 0.5, "item": "whether A or B 选择宾语从句的对称结构（“是将……视为……，还是将其定义为……”）"},
            {"score": 0.5, "item": "should be conceptualized as 被动语态转主动概念化表达"},
            {"score": 0.5, "item": "that safeguards 定语从句修饰 collective good（“旨在保护民主制度免受……侵害的公共财富/利益”）"},
            {"score": 0.5, "item": "法学与政治学专有名词（alienable individual right 可让渡的个人权利；collective good 公共品；surveillance capitalism 监控资本主义）"}
        ]
    },
    "trans-013": {
        "skeleton": "The principle of judicial independence requires that judges remain insulated from pressures, ensuring decisions reflect interpretation...",
        "skeleton_label": "主干: The principle... requires that judges remain insulated from... | 伴随状语: ensuring decisions reflect rigorous interpretation...",
        "literal_flaw": "【生硬字面译】司法独立的原则要求法官保持被绝缘于暂时的政治压力，确保裁决反映对宪法先例的严格解释。（被绝缘于死译，违背中文习惯）",
        "scoring_rubric": [
            {"score": 0.5, "item": "requires that 虚拟语气从句（“要求法官不受……干扰/免受……影响”）"},
            {"score": 0.5, "item": "insulated from 隐喻的语境引申（“免受……干预/与……相隔离”）"},
            {"score": 0.5, "item": "ensuring 现在分词作结果状语引申（“从而确保司法裁决能够体现……”）"},
            {"score": 0.5, "item": "法学核心词（judicial independence 司法独立；transitory political pressures 一时的政治压力；constitutional precedent 宪法判例）"}
        ]
    },
    "trans-014": {
        "skeleton": "Climate scientists warn that climate tipping points may trigger feedbacks, accelerating destabilization...",
        "skeleton_label": "主干: Climate scientists warn that [主语: surpassing tipping points] [谓语: may trigger] [宾语: irreversible feedbacks] | 伴随状语: accelerating the destabilization of ecosystems...",
        "literal_flaw": "【生硬字面译】气候科学家警告跨越不可逆的气候倾倒点可能触发不可逆的反馈，加速极地生态系统的去稳定化，超出人类适应的范围。（倾倒点严重误译，去稳定化生硬）",
        "scoring_rubric": [
            {"score": 0.5, "item": "climate tipping points 核心专有名词准确翻译（“气候临界点”）"},
            {"score": 0.5, "item": "trigger irreversible planetary feedbacks 动宾搭配流畅（“引发不可逆的地球系统连锁反馈机制”）"},
            {"score": 0.5, "item": "accelerating 现在分词状语转化（“进而加速……的崩溃，使其超出人类适应能力”）"},
            {"score": 0.5, "item": "生态学术语（planetary feedbacks 地球连锁反馈；destabilization 破坏/失稳/崩溃；human adaptation 人类适应能力）"}
        ]
    },
    "trans-015": {
        "skeleton": "The transition demands that governments redesign fiscal frameworks, rather than merely incentivizing choices.",
        "skeleton_label": "主干: The transition... demands that governments redesign fiscal frameworks | 对比状语: rather than merely incentivizing voluntary consumer choices.",
        "literal_flaw": "【生硬字面译】向低碳经济的过渡要求政府重新设计长期的财政框架，而不是仅仅激励自愿的消费者选择。（财政框架未通顺，缺乏学术张力）",
        "scoring_rubric": [
            {"score": 0.5, "item": "demands that 引导的宾语从句准确传达政论要求语气"},
            {"score": 0.5, "item": "redesign structural fiscal and industrial frameworks 动宾完整（“重构中长期财政与产业政策框架”）"},
            {"score": 0.5, "item": "rather than 对比排除结构处理（“而不仅仅停留在……层面”）"},
            {"score": 0.5, "item": "经管生态术语（low-carbon economy 低碳经济；fiscal and industrial frameworks 财税与产业框架；voluntary consumer choices 自发性消费选择）"}
        ]
    },
    "trans-016": {
        "skeleton": "Ecologists emphasize that biodiversity is indispensable for ecosystem resilience, which provides buffers against disruption.",
        "skeleton_label": "主干: Ecologists emphasize that biodiversity is indispensable for ecosystem resilience | 非限制性定语从句: which provides vital buffers against environmental disruption.",
        "literal_flaw": "【生硬字面译】生态学家强调生物多样性对于维持生态系统弹性是不可缺少的，这提供对抗环境分裂的重要缓冲。（弹性与分裂直译生硬）",
        "scoring_rubric": [
            {"score": 0.5, "item": "is indispensable for 词组翻译（“对……而言至关重要/必不可少”）"},
            {"score": 0.5, "item": "ecosystem resilience 专有术语准确翻译（“生态系统恢复力/韧性”）"},
            {"score": 0.5, "item": "which 引导的定语从句流畅转化为补充说明分句（“它能提供关键缓冲，以抵御……”）"},
            {"score": 0.5, "item": "生态环境词汇（biodiversity 生物多样性；environmental disruption 环境突变/扰动；vital buffers 关键缓冲）"}
        ]
    },
    "trans-017": {
        "skeleton": "Literary historians observe that the novel flourished by democratizing narrative perspective and reflecting anxieties.",
        "skeleton_label": "主干: Literary historians observe that the novel flourished [状语: not merely by democratizing... but by reflecting...]",
        "literal_flaw": "【生硬字面译】文学历史学家观察到现代小说在十九世纪繁荣，不仅通过使叙事视角民主化，而且通过反映新城市中产阶级的心理焦虑。（民主化死译）",
        "scoring_rubric": [
            {"score": 0.5, "item": "observe that 引导的宾语从句自然引出论述（“文学史学者指出/认为……”）"},
            {"score": 0.5, "item": "not merely by... but by... 双重方式状语结构（“不仅在于它使……平民化/大众化，更在于它深刻反映了……”）"},
            {"score": 0.5, "item": "democratizing narrative perspective 动宾引申（“使叙事视角走向大众化/平民化”）"},
            {"score": 0.5, "item": "人文学术词汇（literary historians 文学史家；urban middle class 城市中产阶级；psychological anxieties 心理焦虑）"}
        ]
    },
    "trans-018": {
        "skeleton": "Philosophers question the distinction, pointing out that historical narratives are interpretations shaped by perspectives.",
        "skeleton_label": "主干: Contemporary philosophers question the sharp distinction between [A] and [B] | 伴随状语: pointing out that [narratives are interpretations shaped by...] ",
        "literal_flaw": "【生硬字面译】当代哲学家质疑客观事实和主观解释之间的尖锐区别，指出历史叙事必然是被文化视角塑造的选择性解释。（尖锐区别死译）",
        "scoring_rubric": [
            {"score": 0.5, "item": "question the sharp distinction between A and B（“质疑……与……之间的泾渭分明/绝对对立”）"},
            {"score": 0.5, "item": "pointing out that 现在分词引出补充论据（“并明确指出……”）"},
            {"score": 0.5, "item": "shaped by prevailing cultural perspectives 过去分词后置定语前置（“受到特定时期主导文化视角的深刻影响/塑造”）"},
            {"score": 0.5, "item": "哲学与史学术语（sharp distinction 截然划分/绝对界限；historical narratives 历史叙事；selective interpretations 选择性解读）"}
        ]
    },
    "trans-019": {
        "skeleton": "The preservation of heritage requires that conservators balance integrity with modernization, lest traditions become artifacts.",
        "skeleton_label": "主干: The preservation... requires that conservators balance [A] with [B] | 目的/结果从句: lest living traditions become obsolete artifacts.",
        "literal_flaw": "【生硬字面译】非物质文化遗产的保护要求保护者平衡历史的真实性与当代的可理解性，唯恐活着的传统变成废弃的博物馆手工艺品。（唯恐死译，显得文白夹杂）",
        "scoring_rubric": [
            {"score": 0.5, "item": "requires that 引导的宾语从句虚拟语气翻译通顺（“要求保护工作者权衡/兼顾……”）"},
            {"score": 0.5, "item": "balance historical integrity with contemporary intelligibility 动宾对称处理（“兼顾历史的原真性与当代的易理解性”）"},
            {"score": 0.5, "item": "lest 引导的连词从句翻译（“以免使……沦为……”）"},
            {"score": 0.5, "item": "文化术语（intangible cultural heritage 非物质文化遗产；living traditions 活态传统；obsolete museum artifacts 陈旧的博物馆展品）"}
        ]
    },
    "trans-020": {
        "skeleton": "Higher education institutions are urged to cultivate critical inquiry, rather than merely transmitting vocational knowledge.",
        "skeleton_label": "主干: Higher education institutions are urged to cultivate critical inquiry and ethical reasoning | 对比状语: rather than merely transmitting specialized vocational knowledge.",
        "literal_flaw": "【生硬字面译】高等教育机构被敦促去培养批判性质疑和伦理推理，而不是仅仅传输专门的职业知识。（被动语态与传输死译）",
        "scoring_rubric": [
            {"score": 0.5, "item": "are urged to do sth 被动语态转主动表达（“人们呼吁高等教育机构……/大学应当……”）"},
            {"score": 0.5, "item": "cultivate critical inquiry and ethical reasoning 并列动宾搭配规范（“注重培养学生的批判性思维与伦理推演能力”）"},
            {"score": 0.5, "item": "rather than 对比状语自然引出否定项（“而不能仅仅局限于传授……”）"},
            {"score": 0.5, "item": "高等教育术语（critical inquiry 批判性探究/思辨能力；ethical reasoning 伦理审思；vocational knowledge 职业技能知识）"}
        ]
    }
}

for sent in data.get('sentences', []):
    sid = sent['id']
    if sid in ENRICHMENTS:
        enr = ENRICHMENTS[sid]
        sent['skeleton'] = enr['skeleton']
        sent['skeleton_label'] = enr['skeleton_label']
        sent['literal_flaw'] = enr['literal_flaw']
        sent['scoring_rubric'] = enr['scoring_rubric']

with open(TRANSLATIONS_PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Successfully enriched {len(data['sentences'])} sentences in {TRANSLATIONS_PATH}")
