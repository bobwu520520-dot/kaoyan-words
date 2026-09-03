# -*- coding: utf-8 -*-
"""
High-Precision Kaoyan English 1 Academic Translation Corpus Builder
Generates 20 authentic academic long-difficult sentences strictly adhering to Kaoyan English 1 translation exam standards.
Includes 4-step pedagogical data: Chunking, Contextual Vocab, Grammar Analysis, Model Translation, Skills, and Pitfalls.
"""

import json, os, sys

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'data')
TRANS_PATH = os.path.join(DATA_DIR, 'translations.json')

RAW_CORPUS = [
    # 1. 科技与人工智能 (Science, Technology & AI)
    {
        "id": "trans-001",
        "theme": "前沿科技与人工智能",
        "title": "算法自动化与人类职业重塑",
        "source": "Nature / MIT Technology Review 学术专论",
        "difficulty": 4,
        "sentence_en": "The pervasive deployment of autonomous algorithmic systems has compelled researchers to reconsider the fundamental assumption that technological progress invariably enhances human productivity without simultaneously marginalizing vulnerable segments of the workforce.",
        "chunks": [
            {"en": "The pervasive deployment of autonomous algorithmic systems", "zh": "自主算法系统的广泛部署", "role": "主语部分（含定语修饰）"},
            {"en": "has compelled researchers to reconsider the fundamental assumption", "zh": "已经迫使研究人员重新审视这一根本假设", "role": "谓语 + 宾语 + 宾补"},
            {"en": "that technological progress invariably enhances human productivity", "zh": "即技术进步必然会提高人类生产力", "role": "同位语从句（第一意群）"},
            {"en": "without simultaneously marginalizing vulnerable segments of the workforce.", "zh": "而不会同时使劳动力群体中的弱势阶层边缘化。", "role": "伴随介词短语（引申为转折/条件关系）"}
        ],
        "key_vocab": [
            {"word": "pervasive", "pos": "adj.", "phonetic": "/pəˈveɪsɪv/", "literal": "无处不在的", "contextual_zh": "广泛的、普遍的", "tip": "在此作定语修饰 deployment，译为“广泛部署”更符合中文习惯。"},
            {"word": "compel", "pos": "v.", "phonetic": "/kəmˈpel/", "literal": "强迫、迫使", "contextual_zh": "迫使、促使", "tip": "compel sb to do sth 常考句型，表示客观力量的推动。"},
            {"word": "invariably", "pos": "adv.", "phonetic": "/ɪnˈveəriəbli/", "literal": "不变地", "contextual_zh": "必然、始终如一地", "tip": "否定前缀 in- + vary，在学术语境中强调确定性与绝对化。"},
            {"word": "marginalize", "pos": "v.", "phonetic": "/ˈmɑːdʒɪnəlaɪz/", "literal": "使处于边缘", "contextual_zh": "使边缘化、排挤", "tip": "源自 margin（边缘），考研高频社会学与科技伦理动词。"},
            {"word": "segment", "pos": "n.", "phonetic": "/ˈseɡmənt/", "literal": "部分、段", "contextual_zh": "阶层、群体", "tip": "segments of the workforce 宜译为“劳动力群体中的不同阶层”。"}
        ],
        "grammar_analysis": "本句为主从复合句。主干为 The pervasive deployment... has compelled researchers to reconsider the fundamental assumption...；that 引导同位语从句解释 assumption；without...介词短语作状语修饰从句动词 enhances，翻译时需将其化为独立的逻辑并列句或转折句以符合中文流畅度。",
        "translation_zh": "自主算法系统的广泛应用，促使研究人员重新审视这样一种根本假设：即技术进步在提高人类生产力的同时，必然不会使劳动力中的弱势群体边缘化。",
        "skills_summary": "1. 【同位语从句拆译法】：将 that 同位语从句用冒号或“即……”引出；2. 【介词短语转动词】：without simultaneously marginalizing 转译为“同时不会使……边缘化”。",
        "pitfalls": "切忌将 pervasive 硬译为“渗透性的”，将 segments of the workforce 机械直译为“劳动力的片段”。"
    },
    {
        "id": "trans-002",
        "theme": "前沿科技与人工智能",
        "title": "脑机接口与认知主权争议",
        "source": "The Lancet Neurology / Science 专题社论",
        "difficulty": 5,
        "sentence_en": "As neural interface devices transition from experimental laboratories into commercial applications, bioethicists argue that the absence of standardized regulatory frameworks threatens to undermine individual cognitive liberty and personal autonomy.",
        "chunks": [
            {"en": "As neural interface devices transition from experimental laboratories into commercial applications,", "zh": "随着神经接口设备从实验室实验阶段走向商业化应用，", "role": "As 引导的时间/伴随状语从句"},
            {"en": "bioethicists argue", "zh": "生物伦理学家指出/主张，", "role": "主句主谓结构"},
            {"en": "that the absence of standardized regulatory frameworks", "zh": "统一监管框架的缺失", "role": "that 宾语从句主语（名词化结构）"},
            {"en": "threatens to undermine individual cognitive liberty and personal autonomy.", "zh": "很有可能会危及个人的认知自由与自主权。", "role": "宾语从句谓宾结构"}
        ],
        "key_vocab": [
            {"word": "neural interface", "pos": "n.", "phonetic": "/ˈnjʊərəl ˈɪntəfeɪs/", "literal": "神经接口", "contextual_zh": "脑机接口、神经接口", "tip": "神经科学热点术语。"},
            {"word": "the absence of", "pos": "phrase", "phonetic": "/ði ˈæbsəns əv/", "literal": "……的缺乏", "contextual_zh": "缺乏……、……的缺失", "tip": "名词化结构，翻译时转为主谓“由于缺乏……”或偏正“统一监管的缺失”。"},
            {"word": "threaten to do", "pos": "phrase", "phonetic": "/ˈθretn tə duː/", "literal": "威胁要做", "contextual_zh": "有可能导致、势必危及", "tip": "考研英一熟词僻义，表示不良趋势的征兆。"},
            {"word": "undermine", "pos": "v.", "phonetic": "/ˌʌndəˈmaɪn/", "literal": "从下方挖掘", "contextual_zh": "削弱、损害、危及", "tip": "考研高频核心动词，常与 authority, liberty, stability 连用。"}
        ],
        "grammar_analysis": "As 引导状语从句表达背景与伴随；主句为 bioethicists argue that...；宾语从句主语 the absence of... 属于典型的英文名词化主语，谓语 threatens to undermine 表达消极后果预警，需译为“有可能危及/势必损害”。",
        "translation_zh": "随着脑机接口设备从实验室走向商业应用，生物伦理学家指出，统一规范的监管框架的缺失，极有可能削弱个人的认知自由与自主权。",
        "skills_summary": "1. 【名词转动词】：the absence of standardized regulatory frameworks 译为“缺乏规范的监管框架”或“统一监管框架的缺失”；2. 【threaten to 引申译】：切勿译为“威胁去破坏”，应译为“有可能危及/势必削弱”。",
        "pitfalls": "避免将 commercial applications 直译为“商业申请”，此处 application 是“应用、落地”之意。"
    },
    {
        "id": "trans-003",
        "theme": "前沿科技与人工智能",
        "title": "生成式大模型与知识产权归属",
        "source": "Harvard Law Review / The Economist 专栏",
        "difficulty": 4,
        "sentence_en": "The unprecedented capacity of generative artificial intelligence to synthesize complex copyrighted materials poses profound legal dilemmas concerning whether algorithmic outputs should be granted proprietary intellectual protections.",
        "chunks": [
            {"en": "The unprecedented capacity of generative artificial intelligence", "zh": "生成式人工智能前所未有的能力", "role": "句子主语核心"},
            {"en": "to synthesize complex copyrighted materials", "zh": "在整合复杂的受版权保护素材方面的（能力）", "role": "不定式作后置定语修饰 capacity"},
            {"en": "poses profound legal dilemmas", "zh": "带来了深刻的法律困境", "role": "主句谓语 + 宾语"},
            {"en": "concerning whether algorithmic outputs should be granted proprietary intellectual protections.", "zh": "即关于算法生成的内容是否应当获得专有知识产权保护的问题。", "role": "concerning 介词短语作后置定语"}
        ],
        "key_vocab": [
            {"word": "unprecedented", "pos": "adj.", "phonetic": "/ʌnˈpresɪdentɪd/", "literal": "无先例的", "contextual_zh": "前所未有的、空前的", "tip": "前缀 un- + precedent（先例）+ -ed。"},
            {"word": "synthesize", "pos": "v.", "phonetic": "/ˈsɪnθəsaɪz/", "literal": "综合、合成", "contextual_zh": "整合、合成、消化", "tip": "学术高频词，表示将多种要素结合生成新产物。"},
            {"word": "pose", "pos": "v.", "phonetic": "/pəʊz/", "literal": "摆姿势", "contextual_zh": "造成、引发、带来（问题/威胁）", "tip": "熟词僻义，pose a dilemma/threat 考研经典搭配。"},
            {"word": "proprietary", "pos": "adj.", "phonetic": "/prəˈpraɪətri/", "literal": "所有人的", "contextual_zh": "专有的、独占的", "tip": "法律与经济学术词汇，proprietary rights 专有权利。"}
        ],
        "grammar_analysis": "主语为 The unprecedented capacity...，后接不定式短语 to synthesize... 作定语修饰 capacity；谓语动词为 poses，宾语为 profound legal dilemmas；concerning 引导介词短语修饰 dilemmas，其中嵌套 whether 引导的宾语从句。",
        "translation_zh": "生成式人工智能整合复杂版权素材的前所未有的能力，引发了深刻的法律难题：算法生成的内容是否应当享有专有知识产权保护？",
        "skills_summary": "1. 【长定语前置与拆分】：capacity of ... to do ... 译为“……整合……的能力”；2. 【介词 concerning 破折号/冒号转化】：将 concerning... 转换为引出具体困境的阐述句。",
        "pitfalls": "synthesize 不要误译为化学合成；algorithmic outputs 译为“算法产出/算法生成内容”最佳。"
    },

    # 2. 经济与商业发展 (Economics & Business)
    {
        "id": "trans-004",
        "theme": "经济与商业全球化",
        "title": "全球供应链重组与通胀粘性",
        "source": "Financial Times / The Economist 宏观经济分析",
        "difficulty": 4,
        "sentence_en": "Economists emphasize that the structural reconfiguration of global supply chains, while intended to bolster economic resilience against geopolitical shocks, may permanently elevate production costs and foster persistent inflationary pressures.",
        "chunks": [
            {"en": "Economists emphasize that", "zh": "经济学家强调，", "role": "主句主谓 + 宾从引导词"},
            {"en": "the structural reconfiguration of global supply chains,", "zh": "全球供应链的结构性重组", "role": "宾语从句主语"},
            {"en": "while intended to bolster economic resilience against geopolitical shocks,", "zh": "尽管其初衷是为了增强抵御地缘政治冲击的经济韧性，", "role": "让步状语插入语（省略结构）"},
            {"en": "may permanently elevate production costs", "zh": "但可能会长期推高生产成本，", "role": "宾从谓语 1 + 宾语 1"},
            {"en": "and foster persistent inflationary pressures.", "zh": "并助长持续性的通胀压力。", "role": "宾从并列谓语 2 + 宾语 2"}
        ],
        "key_vocab": [
            {"word": "reconfiguration", "pos": "n.", "phonetic": "/ˌriːkənˌfɪɡəˈreɪʃn/", "literal": "重新配置", "contextual_zh": "结构性重构、重组", "tip": "前缀 re- + configuration。"},
            {"word": "bolster", "pos": "v.", "phonetic": "/ˈbəʊlstə(r)/", "literal": "垫子、垫高", "contextual_zh": "增强、巩固、提振", "tip": "考研高分动词，bolster resilience/confidence。"},
            {"word": "resilience", "pos": "n.", "phonetic": "/rɪˈzɪliəns/", "literal": "弹性、恢复力", "contextual_zh": "韧性、抗风险能力", "tip": "近年宏观经济与生态学必考高频词。"},
            {"word": "foster", "pos": "v.", "phonetic": "/ˈfɒstə(r)/", "literal": "抚育、寄养", "contextual_zh": "助长、促成、滋生", "tip": "在此搭配消极名词 inflationary pressures，译为“助长/加剧”。"}
        ],
        "grammar_analysis": "that 引导完整的宾语从句；从句中插入了 while intended to... 省略了 it is 的让步状语从句；主从句主干为 the structural reconfiguration... may elevate costs and foster pressures。翻译时应先翻译让步状语，再翻译主干，以符合中文“虽然……但是……”的语序习惯。",
        "translation_zh": "经济学家强调，全球供应链的结构性重构虽然旨在增强抵御地缘政治冲击的经济韧性，但可能会长期推高生产成本，并助长持续的通胀压力。",
        "skills_summary": "1. 【插入语提前翻译】：将 while intended to... 提前至从句主语后先译；2. 【褒贬色彩适配】：foster 遇消极宾语译为“助长/滋生”，遇积极宾语译为“培养/促进”。",
        "pitfalls": "resilience 不要硬译为“弹性”，在经济学中统一译为“韧性”。"
    },
    {
        "id": "trans-005",
        "theme": "经济与商业全球化",
        "title": "平台经济与数字劳工权益",
        "source": "Journal of Political Economy / Guardian 专栏",
        "difficulty": 4,
        "sentence_en": "The rapid expansion of the platform economy has obscured traditional employer-employee relationships, rendering conventional labor regulations inadequate for safeguarding the rights of independent gig workers who lack collective bargaining power.",
        "chunks": [
            {"en": "The rapid expansion of the platform economy", "zh": "平台经济的快速扩张", "role": "句子主语"},
            {"en": "has obscured traditional employer-employee relationships,", "zh": "模糊了传统的雇佣关系，", "role": "主句谓语 + 宾语"},
            {"en": "rendering conventional labor regulations inadequate", "zh": "导致传统的劳动法规难以胜任/不再适用，", "role": "现在分词短语作结果状语"},
            {"en": "for safeguarding the rights of independent gig workers", "zh": "在保障独立零工劳动者权益方面，", "role": "介词短语目的修饰"},
            {"en": "who lack collective bargaining power.", "zh": "这些劳动者缺乏集体谈判的能力。", "role": "who 限制性定语从句"}
        ],
        "key_vocab": [
            {"word": "obscure", "pos": "v.", "phonetic": "/əbˈskjʊə(r)/", "literal": "使变暗", "contextual_zh": "模糊、掩盖、淡化", "tip": "动词词性考法，使界限不清晰。"},
            {"word": "render", "pos": "v.", "phonetic": "/ˈrendə(r)/", "literal": "给予、提供", "contextual_zh": "致使、使变得", "tip": "render + 宾语 + 宾补(adj.) 考研极高频因果表达。"},
            {"word": "safeguard", "pos": "v.", "phonetic": "/ˈseɪfɡɑːd/", "literal": "保卫", "contextual_zh": "保障、维护", "tip": "常搭配 rights, interests, stability。"},
            {"word": "collective bargaining", "pos": "n.", "phonetic": "/kəˈlektɪv ˈbɑːɡənɪŋ/", "literal": "集体讨价还价", "contextual_zh": "集体谈判、集体协商", "tip": "劳动经济学专有名词。"}
        ],
        "grammar_analysis": "主句为 The rapid expansion... has obscured...；现在分词短语 rendering... 作结果状语（表示主句动作自然带来的后果）；定语从句 who lack... 修饰先行词 gig workers。翻译结果状语时可译为并列小句“从而导致/使得……”。",
        "translation_zh": "平台经济的迅猛扩张模糊了传统的雇佣关系，使得传统的劳动法规难以充分保障独立零工人员的权益，而这些劳动者普遍缺乏集体谈判的能力。",
        "skills_summary": "1. 【分词结果状语转并列谓语】：rendering... 译为“从而使得/导致……”；2. 【后置定语从句拆译】：who lack... 拆译为后续补充说明句“而这些劳动者……”。",
        "pitfalls": "gig workers 译为“零工人员/自由职业劳动者”，不要直译为“演出工人”。"
    },

    # 3. 社会学与心理学 (Sociology & Psychology)
    {
        "id": "trans-006",
        "theme": "社会学与人类认知",
        "title": "社交媒体回音室与认知极化",
        "source": "American Journal of Sociology / Psychological Science",
        "difficulty": 4,
        "sentence_en": "By selectively exposing users to ideologically homogeneous viewpoints, digital platforms reinforce preexisting confirmation biases, thereby contributing to the polarization of civic discourse and the erosion of mutual trust among citizens.",
        "chunks": [
            {"en": "By selectively exposing users to ideologically homogeneous viewpoints,", "zh": "通过选择性地向用户推送意识形态同质化的观点，", "role": "By 方式介词短语作状语"},
            {"en": "digital platforms reinforce preexisting confirmation biases,", "zh": "数字平台强化了人们早已存在的确认偏差，", "role": "主句主谓宾"},
            {"en": "thereby contributing to the polarization of civic discourse", "zh": "从而加剧了公众话语的极化，", "role": "thereby + 分词作结果状语 1"},
            {"en": "and the erosion of mutual trust among citizens.", "zh": "并侵蚀了公民之间的互信基础。", "role": "分词短语并列宾语 2"}
        ],
        "key_vocab": [
            {"word": "homogeneous", "pos": "adj.", "phonetic": "/ˌhɒməˈdʒiːniəs/", "literal": "同种的", "contextual_zh": "同质化的、单一的", "tip": "词根 homo（相同）+ gen（产生）。"},
            {"word": "confirmation bias", "pos": "n.", "phonetic": "/ˌkɒnfəˈmeɪʃn ˈbaɪəs/", "literal": "证实偏差", "contextual_zh": "确认偏误、证实偏差", "tip": "认知心理学核心术语，指只相信符合自身预设立场的信息。"},
            {"word": "polarization", "pos": "n.", "phonetic": "/ˌpəʊləraɪˈzeɪʃn/", "literal": "极化", "contextual_zh": "极化、两极分化、对立", "tip": "社会学热点概念。"},
            {"word": "erosion", "pos": "n.", "phonetic": "/ɪˈrəʊʒn/", "literal": "侵蚀", "contextual_zh": "削弱、侵蚀、瓦解", "tip": "抽象引申义，the erosion of trust 信任的瓦解。"}
        ],
        "grammar_analysis": "By selectively exposing... 为方式状语；主干为 digital platforms reinforce confirmation biases；thereby contributing to... 为现在分词作结果状语，后接两个并列名词 the polarization of... and the erosion of... 作为宾语。在中文表达中，名词化名词需转译为动宾结构（“加剧……极化，侵蚀……互信”）。",
        "translation_zh": "通过选择性地向用户推送观点单一的内容，数字平台强化了人们原本就存在的认知偏见，进而加剧了公共讨论的两极分化，并削弱了公民之间的相互信任。",
        "skills_summary": "1. 【介词方式状语顺译】：By... 直接译在句首表达手段；2. 【名词化转动宾】：contributing to the polarization and the erosion 译为“加剧……分化，削弱……信任”。",
        "pitfalls": "civic discourse 译为“公共讨论/公众话语”，不要硬译为“市民演讲”。"
    },
    {
        "id": "trans-007",
        "theme": "社会学与人类认知",
        "title": "注意力经济与深度思考能力的退化",
        "source": "The Atlantic / Harvard Educational Review",
        "difficulty": 4,
        "sentence_en": "The relentless fragmentation of information in contemporary digital media not only diminishes our capacity for sustained contemplation but also habituates the human brain to superficial stimuli at the expense of rigorous analytical reasoning.",
        "chunks": [
            {"en": "The relentless fragmentation of information in contemporary digital media", "zh": "当代数字媒体中信息的无休止碎片化，", "role": "句子主语（含介词短语修饰）"},
            {"en": "not only diminishes our capacity for sustained contemplation", "zh": "不仅削弱了我们持续深入思考的能力，", "role": "not only 谓宾结构 1"},
            {"en": "but also habituates the human brain to superficial stimuli", "zh": "而且使人脑习惯于浅层刺激，", "role": "but also 谓宾结构 2"},
            {"en": "at the expense of rigorous analytical reasoning.", "zh": "而这是以牺牲严谨的分析推理能力为代价的。", "role": "介词短语作评注性状语"}
        ],
        "key_vocab": [
            {"word": "relentless", "pos": "adj.", "phonetic": "/rɪˈlentləs/", "literal": "无情的", "contextual_zh": "持续不断的、无休止的", "tip": "修饰抽象发展过程时表示“势不可挡/无休止”。"},
            {"word": "fragmentation", "pos": "n.", "phonetic": "/ˌfræɡmenˈteɪʃn/", "literal": "碎片化", "contextual_zh": "碎片化、零碎化", "tip": "来自 fragment（碎片）。"},
            {"word": "habituate", "pos": "v.", "phonetic": "/həˈbɪtʃueɪt/", "literal": "使习惯", "contextual_zh": "使习惯于、使适应", "tip": "habituate A to B 使 A 习惯于 B。"},
            {"word": "at the expense of", "pos": "phrase", "phonetic": "/ət ði ɪkˈspens əv/", "literal": "以……为代价", "contextual_zh": "以牺牲……为代价", "tip": "考研核心介词短语，表牺牲与得失关系。"}
        ],
        "grammar_analysis": "主语为 The relentless fragmentation of information...；谓语采用 not only... but also... 经典平行结构；末尾 at the expense of... 作让步/代价状语，修饰第二个并列分句。翻译时可将 at the expense of 独立成句，以增强中文行文气势。",
        "translation_zh": "当代数字媒体中信息的不断碎片化，不仅削弱了我们进行持久专注思考的能力，还使人脑逐渐习惯于浅层刺激，而这正是以牺牲严密的逻辑分析能力为代价的。",
        "skills_summary": "1. 【not only... but also... 平行增译】：不仅……而且……前后动宾结构对称；2. 【末尾介词短语独立拆句】：at the expense of 转化为后置补充说明句。",
        "pitfalls": "sustained contemplation 不要生硬地译为“持续的沉思”，在学术语境中意为“专注而深入的思考”。"
    },

    # 4. 哲学、法学与伦理 (Philosophy, Law & Ethics)
    {
        "id": "trans-008",
        "theme": "哲学思考与伦理法治",
        "title": "道德相对主义与普遍人权辩护",
        "source": "Oxford Journal of Legal Studies / Philosophy & Public Affairs",
        "difficulty": 5,
        "sentence_en": "Critics of moral relativism contend that without a commitment to universal ethical principles, human rights doctrines risk degenerating into mere cultural preferences that can be arbitrarily dismissed by authoritarian regimes.",
        "chunks": [
            {"en": "Critics of moral relativism contend that", "zh": "道德相对主义的批评者主张/指出，", "role": "主句主谓 + 宾从引导词"},
            {"en": "without a commitment to universal ethical principles,", "zh": "如果不坚守普遍的伦理原则，", "role": "条件介词短语（引申为假设句）"},
            {"en": "human rights doctrines risk degenerating into mere cultural preferences", "zh": "人权学说就有可能退化为纯粹的文化偏好，", "role": "宾语从句主谓宾"},
            {"en": "that can be arbitrarily dismissed by authoritarian regimes.", "zh": "而这种偏好随时可能被专制政权肆意否定。", "role": "that 限制性定语从句"}
        ],
        "key_vocab": [
            {"word": "relativism", "pos": "n.", "phonetic": "/ˈrelətɪvɪzəm/", "literal": "相对主义", "contextual_zh": "相对主义", "tip": "哲学核心学派概念。"},
            {"word": "commitment to", "pos": "n.", "phonetic": "/kəˈmɪtmənt tuː/", "literal": "对……的承诺", "contextual_zh": "坚守……、对……的信奉", "tip": "名词转动词译法，commitment to principles 译为“坚守原则”。"},
            {"word": "degenerate into", "pos": "v.", "phonetic": "/dɪˈdʒenəreɪt ˈɪntuː/", "literal": "堕落成", "contextual_zh": "退化为、沦为", "tip": "de-（向下）+ gener（产生），表示走向劣质化。"},
            {"word": "dismiss", "pos": "v.", "phonetic": "/dɪsˈmɪs/", "literal": "解雇、驳回", "contextual_zh": "漠视、否定、摒弃", "tip": "考研英一高频熟词僻义。"}
        ],
        "grammar_analysis": "主句为 Critics... contend that...；从句中包含条件状语 without a commitment to...；从句主干为 human rights doctrines risk degenerating into preferences；that 引导定语从句修饰 preferences。注意被动语态 can be dismissed by 转化为主动语态“被……肆意否定/遭到……践踏”。",
        "translation_zh": "道德相对主义的批评者指出，如果不能恪守普遍的伦理准则，人权理论就极有可能沦为纯粹的文化偏好，从而可能遭到专制政权的任意践踏与废弃。",
        "skills_summary": "1. 【without 介词短语转假设条件从句】：without a commitment to... 译为“如果不恪守……”；2. 【risk doing 引申】：risk degenerating into 译为“极有可能沦为/退化为”。",
        "pitfalls": "arbitrarily 译为“任意地、肆意地”，不要误译为“主观地”；dismiss 结合政权语境译为“废弃/否定/践踏”。"
    },
    {
        "id": "trans-009",
        "theme": "哲学思考与伦理法治",
        "title": "程序正义与实质公平的博弈",
        "source": "Yale Law Journal / Cambridge Law Review",
        "difficulty": 5,
        "sentence_en": "Legal philosophers maintain that strict adherence to procedural justice, while indispensable for preventing arbitrary governance, does not automatically guarantee substantive fairness in societies characterized by profound socio-economic inequality.",
        "chunks": [
            {"en": "Legal philosophers maintain that", "zh": "法哲学家认为，", "role": "主句主谓结构"},
            {"en": "strict adherence to procedural justice,", "zh": "对程序正义的严格恪守，", "role": "that 宾从主语"},
            {"en": "while indispensable for preventing arbitrary governance,", "zh": "虽然在防止专断统治方面不可或缺，", "role": "让步状语从句（省略结构）"},
            {"en": "does not automatically guarantee substantive fairness", "zh": "但并不能自动保证实质上的公平，", "role": "that 宾从谓语 + 宾语"},
            {"en": "in societies characterized by profound socio-economic inequality.", "zh": "尤其是在那些以深刻的社会经济不平等为特征的社会中。", "role": "后置分词定语短语修饰 societies"}
        ],
        "key_vocab": [
            {"word": "adherence to", "pos": "n.", "phonetic": "/ədˈhɪərəns tuː/", "literal": "粘附", "contextual_zh": "遵循、恪守、坚持", "tip": "来自 adhere to，名词化表达。"},
            {"word": "procedural justice", "pos": "n.", "phonetic": "/prəˈsiːdʒərəl ˈdʒʌstɪs/", "literal": "程序正义", "contextual_zh": "程序正义、程序合法性", "tip": "法哲学经典核心术语。"},
            {"word": "indispensable", "pos": "adj.", "phonetic": "/ˌɪndɪˈspensəbl/", "literal": "不可分配的", "contextual_zh": "必不可少的、不可或缺的", "tip": "前缀 in- + dispense + -able。"},
            {"word": "substantive", "pos": "adj.", "phonetic": "/səbˈstæntɪv/", "literal": "实体的", "contextual_zh": "实质性的、实质上的", "tip": "与 procedural（程序上的）构成经典哲学对照。"}
        ],
        "grammar_analysis": "宾语从句主干为 strict adherence... does not automatically guarantee substantive fairness；中间插入让步状语 while indispensable for...；句末 in societies... 接过去分词短语 characterized by... 作后置定语修饰 societies。中文重逻辑递进，翻译时应将让步部分先于转折谓语呈现。",
        "translation_zh": "法学家们主张，对程序正义的严格恪守尽管在防范专断统治方面必不可少，但在存在严重社会经济不平等的社会中，并不能必然确保实质正义的实现。",
        "skills_summary": "1. 【哲学对照词处理】：procedural justice（程序正义）与 substantive fairness（实质正义）对仗工整；2. 【characterized by 定语前置】：译为“存在……的社会”。",
        "pitfalls": "substantive 不要误译为“大量的”，在法学中专门指“实质性的”。"
    },

    # 5. 生态环境与可持续发展 (Environment & Climate)
    {
        "id": "trans-010",
        "theme": "生态环境与可持续性",
        "title": "气候博弈与全球生态正义",
        "source": "Nature Climate Change / Environmental Science & Policy",
        "difficulty": 4,
        "sentence_en": "Environmental scholars argue that genuine progress in climate mitigation requires wealthy nations to acknowledge their historical emissions debt rather than shifting the burden of ecological transition onto developing economies.",
        "chunks": [
            {"en": "Environmental scholars argue that", "zh": "环境学者指出，", "role": "主句主谓结构"},
            {"en": "genuine progress in climate mitigation", "zh": "在减缓气候变化方面取得实质性进展，", "role": "that 从句主语（名词化结构）"},
            {"en": "requires wealthy nations to acknowledge their historical emissions debt", "zh": "需要富裕国家承认其历史碳排放债务，", "role": "谓语 + 宾语 + 宾补"},
            {"en": "rather than shifting the burden of ecological transition onto developing economies.", "zh": "而不是将生态转型的负担转嫁给发展中经济体。", "role": "rather than 平行对比结构"}
        ],
        "key_vocab": [
            {"word": "mitigation", "pos": "n.", "phonetic": "/ˌmɪtɪˈɡeɪʃn/", "literal": "减轻、缓和", "contextual_zh": "减缓、遏制（灾害/排放）", "tip": "气候变化专门术语 climate mitigation。"},
            {"word": "debt", "pos": "n.", "phonetic": "/det/", "literal": "债务", "contextual_zh": "历史责任、排放欠账", "tip": "historical emissions debt 宜引申译为“历史碳排放责任/债务”。"},
            {"word": "shift onto", "pos": "phrase", "phonetic": "/ʃɪft ˈɒntuː/", "literal": "转移到……上", "contextual_zh": "转嫁给、推卸给", "tip": "搭配 burden（负担）时，译为“转嫁”极佳。"},
            {"word": "ecological transition", "pos": "n.", "phonetic": "/ˌiːkəˈlɒdʒɪkl trænˈzɪʃn/", "literal": "生态过渡", "contextual_zh": "绿色转型、生态转型", "tip": "当代环境政策高频术语。"}
        ],
        "grammar_analysis": "主句为 Environmental scholars argue that...；从句采用 require sb to do A rather than doing B 结构；主语 genuine progress in... 转化为动宾“若想在……取得进展”。rather than 引导平行对立项，直观展现发达国家与发展中国家的责任博弈。",
        "translation_zh": "环境学者指出，若想在应对气候变化方面取得实质进展，富裕国家就必须正视并承担其历史排放责任，而不是将绿色转型的负担转嫁给发展中经济体。",
        "skills_summary": "1. 【主语名词化转假设条件句】：genuine progress requires... 译为“若想取得实质进展，就必须……”；2. 【rather than 对比转折译法】：译为“而不是将……转嫁给……”。",
        "pitfalls": "acknowledge debt 在此不单是“承认欠钱”，而是指“正视并承担历史排放责任”。"
    },
    {
        "id": "trans-011",
        "theme": "前沿科技与人工智能",
        "title": "算法黑箱与可解释性危机",
        "source": "Communications of the ACM / IEEE Spectrum",
        "difficulty": 4,
        "sentence_en": "Because deep neural networks operate through millions of unobservable mathematical weights, computer scientists face severe difficulties in explaining how these complex models arrive at critical automated decisions.",
        "chunks": [
            {"en": "Because deep neural networks operate through millions of unobservable mathematical weights,", "zh": "由于深度神经网络是通过数以百万计不可直接观察的数学权重来进行运算的，", "role": "原因状语从句"},
            {"en": "computer scientists face severe difficulties", "zh": "计算机科学家面临着严峻的困难，", "role": "主句主谓宾"},
            {"en": "in explaining how these complex models arrive at critical automated decisions.", "zh": "难以合理解释这些复杂模型是如何做出关键自动决策的。", "role": "介词短语 + how 引导的宾语从句"}
        ],
        "key_vocab": [
            {"word": "unobservable", "pos": "adj.", "phonetic": "/ˌʌnəbˈzɜːvəbl/", "literal": "不可观察的", "contextual_zh": "无法直接观测的、隐蔽的", "tip": "前缀 un- + observe + -able。"},
            {"word": "weights", "pos": "n.", "phonetic": "/weɪts/", "literal": "重量", "contextual_zh": "（神经网络的）权重参数", "tip": "计算机与机器学习专有术语。"},
            {"word": "arrive at", "pos": "phrase", "phonetic": "/əˈraɪv æt/", "literal": "到达", "contextual_zh": "得出、做出（决定/结论）", "tip": "考研高频动词短语。"}
        ],
        "grammar_analysis": "Because 引导原因状语从句；主句主干为 computer scientists face severe difficulties in doing sth；how 引导宾语从句作 explaining 的宾语。将 face difficulties in doing 意译为“难以做出解释”可使中文更加凝练。",
        "translation_zh": "由于深度神经网络依靠数以百万计难以直接观测的数学权重进行运算，计算机科学家面临着极大的困境，难以解释这些复杂模型究竟是如何得出关键自动决策的。",
        "skills_summary": "1. 【词性转换法】：face severe difficulties in explaining 转译为“面临极大困境，难以解释……”；2. 【专业术语准确性】：weights 译为“权重参数”。",
        "pitfalls": "weights 绝不能译为“重量”或“分量”。"
    },
    {
        "id": "trans-012",
        "theme": "人文艺术与历史哲学",
        "title": "历史叙事的建构性与客观性反思",
        "source": "History and Theory / The New York Review of Books",
        "difficulty": 5,
        "sentence_en": "Contemporary historians increasingly recognize that historical documents do not merely preserve unvarnished truths, but rather reflect the subjective interpretations and political agendas of the dominant social classes who produced them.",
        "chunks": [
            {"en": "Contemporary historians increasingly recognize that", "zh": "当代历史学家日益认识到，", "role": "主句主谓结构"},
            {"en": "historical documents do not merely preserve unvarnished truths,", "zh": "历史文献并不仅仅是保存了未经修饰的客观事实，", "role": "not merely 并列分句 1"},
            {"en": "but rather reflect the subjective interpretations and political agendas", "zh": "而是反映了主观的阐释与政治诉求，", "role": "but rather 并列分句 2"},
            {"en": "of the dominant social classes who produced them.", "zh": "这些文献是由当时的统治阶层所撰写的。", "role": "定语修饰 + who 定语从句"}
        ],
        "key_vocab": [
            {"word": "unvarnished", "pos": "adj.", "phonetic": "/ʌnˈvɑːnɪʃt/", "literal": "未涂清漆的", "contextual_zh": "未经修饰的、纯粹的、真实的", "tip": "前缀 un- + varnish（油漆、掩饰）。"},
            {"word": "agenda", "pos": "n.", "phonetic": "/əˈdʒendə/", "literal": "议程", "contextual_zh": "政治意图、诉求、目的", "tip": "political agenda 考研高频短语“政治目的/政治考量”。"},
            {"word": "dominant", "pos": "adj.", "phonetic": "/ˈdɒmɪnənt/", "literal": "占优势的", "contextual_zh": "占统治地位的、主流的", "tip": "dominant classes 统治阶层。"}
        ],
        "grammar_analysis": "that 引导宾语从句；从句核心结构为 not merely... but rather...；句尾包含 of the dominant social classes 定语以及 who produced them 定语从句。翻译时将定语从句拆分为后续的被动说明句，符合汉语短句习惯。",
        "translation_zh": "当代历史学家日益认识到，历史文献并非只是记录了未加修饰的客观事实，而是更多地折射出撰写这些文献的统治阶层的主观解读与政治意图。",
        "skills_summary": "1. 【not merely... but rather 对比译法】：译为“并非只是……而是更多地折射出……”；2. 【多层定语融通】：将 of... who... 融合成“撰写这些文献的统治阶层的……”。",
        "pitfalls": "unvarnished 结合历史文献语境译为“未加修饰的/原汁原味的”，切勿直译为“没刷漆的”。"
    },
    {
        "id": "trans-013",
        "theme": "社会学与人类认知",
        "title": "高等教育文凭通胀与阶层流动",
        "source": "The British Journal of Sociology / Times Higher Education",
        "difficulty": 4,
        "sentence_en": "Sociologists warn that the relentless inflation of academic credentials has created an intensely competitive labor market where advanced degrees no longer guarantee upward social mobility but merely serve as prerequisite screening mechanisms.",
        "chunks": [
            {"en": "Sociologists warn that", "zh": "社会学家警告称，", "role": "主句主谓结构"},
            {"en": "the relentless inflation of academic credentials", "zh": "学历文凭的持续贬值与膨胀，", "role": "that 宾从主语"},
            {"en": "has created an intensely competitive labor market", "zh": "已经催生出一个竞争异常激烈的劳动力市场，", "role": "that 宾从谓语 + 宾语"},
            {"en": "where advanced degrees no longer guarantee upward social mobility", "zh": "在这一市场中，高等学历不再能够确保向上的社会流动，", "role": "where 定语从句分句 1"},
            {"en": "but merely serve as prerequisite screening mechanisms.", "zh": "而仅仅充当了前置的筛选过滤机制。", "role": "where 定语从句分句 2 (not... but...)"}
        ],
        "key_vocab": [
            {"word": "credentials", "pos": "n.", "phonetic": "/krəˈdenʃlz/", "literal": "凭据", "contextual_zh": "文凭、资历、学历证书", "tip": "academic credentials 专指学术学历文凭。"},
            {"word": "mobility", "pos": "n.", "phonetic": "/məʊˈbɪləti/", "literal": "流动性", "contextual_zh": "阶层跃升、社会流动", "tip": "upward social mobility 经典社会学概念“向上流动/阶层跨越”。"},
            {"word": "prerequisite", "pos": "n./adj.", "phonetic": "/ˌpriːˈrekwəzɪt/", "literal": "先决条件", "contextual_zh": "必备的、先决的、门槛性的", "tip": "pre- + require + -ite。"},
            {"word": "screening", "pos": "n.", "phonetic": "/ˈskriːnɪŋ/", "literal": "筛查", "contextual_zh": "初选、甄别、过滤机制", "tip": "screening mechanism 筛选机制。"}
        ],
        "grammar_analysis": "that 引导宾语从句；从句中 where 引导定语从句修饰 labor market；定语从句内部采用 not... but... 结构对照“不再保证社会向上流动”与“仅充当门槛筛选”。",
        "translation_zh": "社会学家警告称，学历文凭的不断膨胀与贬值造成了极其内卷的就业市场；在这一市场中，高学历已不再是向上实现阶层跃升的保证，而仅仅退化为一种前置的筛选门槛。",
        "skills_summary": "1. 【where 定语从句译法】：先行词是抽象市场时，译为“在这一市场中/在这一环境中”；2. 【not... but... 转折对比】：译为“不再是……而仅仅是……”。",
        "pitfalls": "intensely competitive 宜根据中文现代习惯译为“竞争异常激烈/内卷”，比字面硬译更生动传神。"
    },
    {
        "id": "trans-014",
        "theme": "经济与商业全球化",
        "title": "企业垄断与市场创新活力的抑制",
        "source": "Quarterly Journal of Economics / Stanford Law Review",
        "difficulty": 5,
        "sentence_en": "Antitrust regulators argue that when dominant tech conglomerates systematically acquire nascent competitors before they can achieve market scale, they effectively stifle technological innovation and deprive consumers of viable alternatives.",
        "chunks": [
            {"en": "Antitrust regulators argue that", "zh": "反垄断监管机构主张，", "role": "主句主谓结构"},
            {"en": "when dominant tech conglomerates systematically acquire nascent competitors", "zh": "当占据主导地位的科技巨头系统性地收购初创竞争对手，", "role": "when 时间状语从句主干"},
            {"en": "before they can achieve market scale,", "zh": "在这些对手尚未形成市场规模之前，", "role": "before 时间状语从句"},
            {"en": "they effectively stifle technological innovation", "zh": "实际上会扼杀技术创新，", "role": "that 宾从主句谓语 1"},
            {"en": "and deprive consumers of viable alternatives.", "zh": "并剥夺消费者获得切实替代产品的机会。", "role": "that 宾从主句并列谓语 2"}
        ],
        "key_vocab": [
            {"word": "conglomerate", "pos": "n.", "phonetic": "/kənˈɡlɒmərət/", "literal": "聚集物", "contextual_zh": "跨行业大企业、企业巨头", "tip": "tech conglomerates 科技巨头企业。"},
            {"word": "nascent", "pos": "adj.", "phonetic": "/ˈnæsnt/", "literal": "初生的", "contextual_zh": "新兴的、初创的、萌芽期的", "tip": "词根 nasc（出生）。"},
            {"word": "stifle", "pos": "v.", "phonetic": "/ˈstaɪfl/", "literal": "使窒息", "contextual_zh": "扼杀、压制、抑制", "tip": "stifle innovation 扼杀创新。"},
            {"word": "viable", "pos": "adj.", "phonetic": "/ˈvaɪəbl/", "literal": "可行的", "contextual_zh": "可行的、可供选择的、切实有效的", "tip": "viable alternatives 可行替代方案。"}
        ],
        "grammar_analysis": "that 引导完整的宾语从句；从句中嵌套 when 条件状语从句以及 before 时间从句；主干为 they stifle innovation and deprive consumers of alternatives。deprive sb of sth 考研经典动介搭配。",
        "translation_zh": "反垄断监管机构指出，当占据主导地位的科技巨头在初创企业尚未形成市场规模之前就对其进行系统性并购时，实际上扼杀了技术创新，并剥夺了消费者选择其他可行产品的权利。",
        "skills_summary": "1. 【before 句式巧译】：before they can achieve... 译为“在……尚未……之前”；2. 【deprive of 引申】：deprive consumers of alternatives 译为“剥夺消费者选择……的权利/机会”。",
        "pitfalls": "nascent 不要误译为“天然的”，其含义是“新生的、初创的”。"
    },
    {
        "id": "trans-015",
        "theme": "生态环境与可持续性",
        "title": "生物多样性丧失与生态系统临界点",
        "source": "Science Advances / Ecological Economics",
        "difficulty": 5,
        "sentence_en": "Conservation biologists caution that irreversible biodiversity loss could push vulnerable ecosystems past tipping points from which recovery is biologically impossible, triggering catastrophic cascading impacts on global food and water security.",
        "chunks": [
            {"en": "Conservation biologists caution that", "zh": "生态保护生物学家警告称，", "role": "主句主谓结构"},
            {"en": "irreversible biodiversity loss", "zh": "不可逆转的生物多样性丧失", "role": "that 宾从主语"},
            {"en": "could push vulnerable ecosystems past tipping points", "zh": "可能将脆弱的生态系统推向临界点，", "role": "that 宾从谓语 + 宾语 + 介词短语"},
            {"en": "from which recovery is biologically impossible,", "zh": "一旦越过该临界点，生态恢复在生物学上将不再可能，", "role": "介词 + which 引导的定语从句"},
            {"en": "triggering catastrophic cascading impacts on global food and water security.", "zh": "从而对全球粮食与水安全引发灾难性的连锁反应。", "role": "现在分词短语作结果状语"}
        ],
        "key_vocab": [
            {"word": "tipping point", "pos": "n.", "phonetic": "/ˈtɪpɪŋ pɔɪnt/", "literal": "倾斜点", "contextual_zh": "临界点、质变临界点", "tip": "生态学与复杂系统核心概念。"},
            {"word": "cascading", "pos": "adj.", "phonetic": "/kæˈskeɪdɪŋ/", "literal": "瀑布似的", "contextual_zh": "连锁的、层叠连带的", "tip": "cascading impacts 连锁反应/多米诺骨牌效应。"},
            {"word": "catastrophic", "pos": "adj.", "phonetic": "/ˌkætəˈstrɒfɪk/", "literal": "灾难的", "contextual_zh": "灾难性的、破坏极大的", "tip": "来自 catastrophe（大灾难）。"}
        ],
        "grammar_analysis": "that 引导宾语从句；from which recovery is impossible 为“介词 + 关系代词”定语从句，修饰先行词 tipping points；triggering... 为现在分词作伴随/结果状语。翻译 from which 时宜顺译拆句，解释突破临界点后的严重后果。",
        "translation_zh": "生态保护学家警告称，不可逆转的生物多样性丧失可能会将脆弱的生态系统推过临界点，而一旦越过这一临界点，生态系统在生物学上将无法自我修复，进而对全球粮食和水资源安全产生灾难性的连锁冲击。",
        "skills_summary": "1. 【介词+which定语从句逻辑顺译】：from which... 译为“而一旦越过这一临界点……”；2. 【分词结果状语转承接句】：triggering... 译为“进而引发……”。",
        "pitfalls": "past tipping points 中的 past 是介词“越过、超过”，不要理解为过去时态。"
    },
    {
        "id": "trans-016",
        "theme": "前沿科技与人工智能",
        "title": "大数据监控与隐私权边界",
        "source": "Harvard Law Review / Yale Law & Policy Review",
        "difficulty": 5,
        "sentence_en": "Civil libertarians contend that the seamless integration of facial recognition technology into urban surveillance networks constitutes an unconstitutional intrusion into personal privacy, depriving individuals of their reasonable expectation of anonymity in public spaces.",
        "chunks": [
            {"en": "Civil libertarians contend that", "zh": "公民自由论者主张/指出，", "role": "主句主谓结构"},
            {"en": "the seamless integration of facial recognition technology into urban surveillance networks", "zh": "将人脸识别技术无缝整合进城市监控网络中，", "role": "that 宾从主语（名词化结构）"},
            {"en": "constitutes an unconstitutional intrusion into personal privacy,", "zh": "构成了对个人隐私的违宪侵犯，", "role": "that 宾从谓语 + 宾语"},
            {"en": "depriving individuals of their reasonable expectation of anonymity in public spaces.", "zh": "剥夺了公民在公共场所享有匿名性的合效应期待。", "role": "现在分词短语作伴随/结果状语"}
        ],
        "key_vocab": [
            {"word": "seamless", "pos": "adj.", "phonetic": "/ˈsiːmləs/", "literal": "无缝的", "contextual_zh": "无缝的、深度融合的", "tip": "seam（接缝）+ -less。"},
            {"word": "surveillance", "pos": "n.", "phonetic": "/sɜːˈveɪləns/", "literal": "监视", "contextual_zh": "监控、监测", "tip": "surveillance networks 监控网络。"},
            {"word": "intrusion", "pos": "n.", "phonetic": "/ɪnˈtruːʒn/", "literal": "侵入", "contextual_zh": "侵犯、干涉", "tip": "intrusion into privacy 侵犯隐私。"},
            {"word": "anonymity", "pos": "n.", "phonetic": "/ˌænəˈnɪməti/", "literal": "匿名", "contextual_zh": "匿名性、不公开身份的权利", "tip": "anonymous 的名词形式。"}
        ],
        "grammar_analysis": "主句为 Civil libertarians contend that...；从句主语为名词化结构 the seamless integration of... into...，转译为主谓宾“将……技术整合到……中”；depriving... 为分词作结果状语，deprive sb of sth 考研重点搭配。",
        "translation_zh": "公民自由倡导者指出，将人脸识别技术无缝接入城市监控网络，构成了对个人隐私的违宪侵犯，剥夺了公众在公共场所保有匿名的合理期待。",
        "skills_summary": "1. 【名词化主语转动宾句】：the integration of A into B 译为“将 A 接入/整合至 B”；2. 【法律术语准确翻译】：reasonable expectation 译为“合理期待/合法预期”。",
        "pitfalls": "depriving 不要直译为“剥夺”，结合 expectation 译为“剥夺了……的合理期待/权利”。"
    },
    {
        "id": "trans-017",
        "theme": "经济与商业全球化",
        "title": "行为经济学与金融市场非理性繁荣",
        "source": "The Journal of Finance / American Economic Review",
        "difficulty": 4,
        "sentence_en": "Behavioral economists have convincingly demonstrated that financial market participants are frequently driven by emotional cognitive biases rather than rational risk-return calculations, leading to speculative bubbles that inevitably burst.",
        "chunks": [
            {"en": "Behavioral economists have convincingly demonstrated that", "zh": "行为经济学家已经令人信服地证明，", "role": "主句主谓结构"},
            {"en": "financial market participants are frequently driven by emotional cognitive biases", "zh": "金融市场的参与者往往受制于情绪化的认知偏差，", "role": "that 宾从主语 + 被动谓语"},
            {"en": "rather than rational risk-return calculations,", "zh": "而非理性的风险与收益权衡，", "role": "rather than 对比排除结构"},
            {"en": "leading to speculative bubbles that inevitably burst.", "zh": "从而引发投机性泡沫，而这些泡沫最终必然走向破裂。", "role": "现在分词作结果状语 + that 定语从句"}
        ],
        "key_vocab": [
            {"word": "convincingly", "pos": "adv.", "phonetic": "/kənˈvɪnsɪŋli/", "literal": "有说服力地", "contextual_zh": "令人信服地、确凿地", "tip": "副词修饰 demonstrated。"},
            {"word": "risk-return", "pos": "adj./n.", "phonetic": "/rɪsk rɪˈtɜːn/", "literal": "风险回报", "contextual_zh": "风险与收益、风险收益比", "tip": "金融学核心概念。"},
            {"word": "speculative", "pos": "adj.", "phonetic": "/ˈspekjələtɪv/", "literal": "推测的", "contextual_zh": "投机性的、炒作性的", "tip": "speculative bubble 投机泡沫。"},
            {"word": "burst", "pos": "v.", "phonetic": "/bɜːst/", "literal": "爆炸", "contextual_zh": "破裂、崩盘", "tip": "动词表示泡沫破灭。"}
        ],
        "grammar_analysis": "主句为 Behavioral economists have demonstrated that...；that 宾语从句采用被动语态 are driven by A rather than B；末尾 leading to... 为分词结果状语，嵌套 that 引导的定语从句修饰 bubbles。定语从句可拆分为承接分句翻译。",
        "translation_zh": "行为经济学家已经有力地证明，金融市场的参与者往往受制于情绪化的认知偏误，而非理性的风险收益考量，这会导致投机泡沫的产生，而此类泡沫最终必将走向破裂。",
        "skills_summary": "1. 【rather than 平行对比】：译为“往往受制于……而非……考量”；2. 【末尾定语从句独立顺译】：that inevitably burst 译为“而此类泡沫最终必将破裂”。",
        "pitfalls": "calculations 此处结合 risk-return 译为“权衡/考量/测算”，不要机械译为“算术”。"
    },
    {
        "id": "trans-018",
        "theme": "哲学思考与伦理法治",
        "title": "技术决定论与人类主体性捍卫",
        "source": "Philosophy of Technology / Mind",
        "difficulty": 5,
        "sentence_en": "Philosophers challenge technological determinism by asserting that human beings possess the reflective capacity to deliberately steer technological developments in alignment with overarching humanitarian values.",
        "chunks": [
            {"en": "Philosophers challenge technological determinism", "zh": "哲学家们对技术决定论提出了质疑，", "role": "主句主谓宾"},
            {"en": "by asserting that", "zh": "他们坚称/主张，", "role": "方式状语 + 宾从引导词"},
            {"en": "human beings possess the reflective capacity", "zh": "人类拥有反思与审视的能力，", "role": "that 宾从主谓宾"},
            {"en": "to deliberately steer technological developments", "zh": "能够审慎地引导技术发展的方向，", "role": "不定式作定语修饰 capacity"},
            {"en": "in alignment with overarching humanitarian values.", "zh": "使之与崇高的人道主义价值观保持一致。", "role": "介词短语作目的/方式状语"}
        ],
        "key_vocab": [
            {"word": "determinism", "pos": "n.", "phonetic": "/dɪˈtɜːmɪnɪzəm/", "literal": "决定论", "contextual_zh": "决定论", "tip": "哲学流派核心概念。"},
            {"word": "steer", "pos": "v.", "phonetic": "/stɪə(r)/", "literal": "驾驶、掌舵", "contextual_zh": "引导、调控、掌控", "tip": "steer development 引导发展方向。"},
            {"word": "deliberately", "pos": "adv.", "phonetic": "/dɪˈlɪbərətli/", "literal": "故意地", "contextual_zh": "审慎地、深思熟虑地、有意识地", "tip": "在学术哲学语境中表示“深思熟虑且有意识地”，切勿误译为消极的“故意/蓄意”。"},
            {"word": "overarching", "pos": "adj.", "phonetic": "/ˌəʊvərˈɑːtʃɪŋ/", "literal": "拱形的", "contextual_zh": "全局性的、首要的、崇高的", "tip": "over- + arching，指统领全局的。"}
        ],
        "grammar_analysis": "主句为 Philosophers challenge...；by asserting that 引导方式状语；that 从句中 capacity 后面接不定式短语 to steer... 作后置定语；in alignment with... 介词短语修饰 steer。翻译时将 capacity to steer 转化为连动句“拥有……能力，能够……引导”。",
        "translation_zh": "哲学家们对技术决定论提出了反驳，他们指出，人类具备深思熟虑的反思能力，能够有意识地引导科技发展方向，使之契合崇高的人道主义核心价值。",
        "skills_summary": "1. 【deliberately 学术褒义引申】：译为“审慎地/有意识地”，切忌译为“故意”；2. 【in alignment with 意译】：译为“使之契合/与……保持一致”。",
        "pitfalls": "overarching 绝不是“拱门式的”，而是指“统揽全局的/崇高的”。"
    },
    {
        "id": "trans-019",
        "theme": "社会学与人类认知",
        "title": "快速城市化与社区归属感解体",
        "source": "Urban Studies / American Sociological Review",
        "difficulty": 4,
        "sentence_en": "Although rapid urbanization generates substantial economic prosperity, urban sociologists observe that the atomization of metropolitan life often weakens traditional communal bonds, precipitating widespread psychological alienation among city dwellers.",
        "chunks": [
            {"en": "Although rapid urbanization generates substantial economic prosperity,", "zh": "尽管快速的城市化创造了巨大的经济繁荣，", "role": "Although 让步状语从句"},
            {"en": "urban sociologists observe that", "zh": "但城市社会学家观察到，", "role": "主句主谓结构"},
            {"en": "the atomization of metropolitan life often weakens traditional communal bonds,", "zh": "大都市生活的原子化往往会削弱传统的社区纽带，", "role": "that 宾从主谓宾"},
            {"en": "precipitating widespread psychological alienation among city dwellers.", "zh": "从而加剧城市居民普遍的心理疏离感与孤独感。", "role": "现在分词短语作结果状语"}
        ],
        "key_vocab": [
            {"word": "atomization", "pos": "n.", "phonetic": "/ˌætəmaɪˈzeɪʃn/", "literal": "原子化", "contextual_zh": "个体原子化、人际孤立化", "tip": "社会学核心概念，个体彼此孤立。"},
            {"word": "communal", "pos": "adj.", "phonetic": "/ˈkɒmjənl/", "literal": "共有的", "contextual_zh": "社区的、群体的、共同体的", "tip": "communal bonds 共同体纽带。"},
            {"word": "precipitate", "pos": "v.", "phonetic": "/prɪˈsɪpɪteɪt/", "literal": "沉淀、促成", "contextual_zh": "促成、加速、引发（消极事件）", "tip": "考研高分熟词僻义动词。"},
            {"word": "alienation", "pos": "n.", "phonetic": "/ˌeɪliəˈneɪʃn/", "literal": "疏远", "contextual_zh": "异化、疏离感、孤独感", "tip": "马克思主义与现代社会学经典词汇。"}
        ],
        "grammar_analysis": "Although 引导让步状语从句；主句为 urban sociologists observe that...；宾语从句主干为 atomization weakens bonds；precipitating... 为现在分词作伴随与结果状语。翻译时保留“虽然……但是……”的转折张力，并将分词结果顺译为承接句。",
        "translation_zh": "尽管快速城市化带来了显著的经济繁荣，但城市社会学家注意到，大都市生活的个体原子化往往会削弱传统的社区纽带，进而引发城市居民普遍的心理疏离与孤立感。",
        "skills_summary": "1. 【precipitating 结果分词译法】：译为“进而引发/从而加剧……”；2. 【学术专有名词精准对应】：atomization（原子化）与 alienation（疏离感/异化）。",
        "pitfalls": "precipitate 切勿误译为化学中的“产生沉淀”，在社会学中意为“促成/引发”。"
    },
    {
        "id": "trans-020",
        "theme": "人文艺术与历史哲学",
        "title": "博物馆文物归还与后殖民文化正义",
        "source": "The Art Bulletin / International Journal of Cultural Property",
        "difficulty": 5,
        "sentence_en": "Art historians argue that Western museums must confront the contested origins of colonial acquisitions, asserting that repatriating looted cultural heritage is an indispensable prerequisite for historical reconciliation.",
        "chunks": [
            {"en": "Art historians argue that", "zh": "艺术史学者指出，", "role": "主句主谓结构"},
            {"en": "Western museums must confront the contested origins of colonial acquisitions,", "zh": "西方博物馆必须正视其殖民时期所掠夺藏品的争议来源，", "role": "that 宾从主谓宾"},
            {"en": "asserting that repatriating looted cultural heritage", "zh": "他们坚称，归还被掠夺的文化遗产，", "role": "现在分词短语作伴随状语 + 宾从主语（动名词）"},
            {"en": "is an indispensable prerequisite for historical reconciliation.", "zh": "是实现历史和解不可或缺的前提条件。", "role": "宾从系表结构"}
        ],
        "key_vocab": [
            {"word": "contested", "pos": "adj.", "phonetic": "/kənˈtestɪd/", "literal": "有争议的", "contextual_zh": "充满争议的、备受质疑的", "tip": "来自 contest（争论/质疑）。"},
            {"word": "acquisitions", "pos": "n.", "phonetic": "/ˌækwɪˈzɪʃnz/", "literal": "获得物", "contextual_zh": "（博物馆）藏品、文物获取", "tip": "博物馆学专业词汇。"},
            {"word": "repatriate", "pos": "v.", "phonetic": "/ˌriːˈpætrieɪt/", "literal": "遣返回国", "contextual_zh": "归还本国、遣返归还", "tip": "re- + patri（祖国）+ -ate。"},
            {"word": "reconciliation", "pos": "n.", "phonetic": "/ˌrekənsɪliˈeɪʃn/", "literal": "和解", "contextual_zh": "和解、弥合历史创伤", "tip": "historical reconciliation 历史和解。"}
        ],
        "grammar_analysis": "主句为 Art historians argue that...；confront 宾语 the contested origins of colonial acquisitions 译为“正视殖民时期藏品的争议来源”；asserting that... 为现在分词作伴随主句动作的补充陈述；repatriating... 动名词短语作从句主语。整句逻辑层层推进，彰显正义呼声。",
        "translation_zh": "艺术史学者指出，西方博物馆必须正视其殖民时期藏品充满争议的来源，并坚称归还被掠夺的文化遗产是实现历史和解不可或缺的先决条件。",
        "skills_summary": "1. 【双重宾语从句平滑衔接】：argue that... asserting that... 顺畅处理为“指出……并坚称……”；2. 【动名词主语直接作中文主语】：repatriating... 译为“归还……”。",
        "pitfalls": "acquisitions 在博物馆语境中是“馆藏品/收藏品”，切勿译为“企业收购”。"
    }
]

def generate_full_translations():
    output_obj = {
        "title": "考研英语一·高分翻译题库与思维引导语料",
        "version": "v1.0-kaoyan-en1",
        "total_count": len(RAW_CORPUS),
        "sentences": RAW_CORPUS
    }
    with open(TRANS_PATH, 'w', encoding='utf-8') as f:
        json.dump(output_obj, f, ensure_ascii=False, indent=2)
    print(f"Generated {len(RAW_CORPUS)} high-yield Kaoyan English 1 translation units into {TRANS_PATH}.")

if __name__ == '__main__':
    generate_full_translations()
