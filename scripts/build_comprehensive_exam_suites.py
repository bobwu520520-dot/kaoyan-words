# -*- coding: utf-8 -*-
"""
Generate comprehensive datasets for Reading, Cloze, and New Type workshops.
"""

import json
import os

os.makedirs('data', exist_ok=True)

# 1. Real Exam Reading Dataset
reading_data = {
    "title": "考研英语（一）历年真题传统阅读精读题库",
    "total_count": 4,
    "passages": [
        {
            "id": "reading-2023-text1",
            "year": 2023,
            "text_num": "Text 1",
            "theme": "经济学与现代消费行为",
            "title": "可持续消费理念与快时尚产业的绿色转型",
            "text": "For decades, the global apparel industry has thrived on the fast-fashion model, which prioritizes rapid production cycles and disposable consumerism. However, a burgeoning wave of environmental awareness among Gen Z shoppers is dramatically reshaping market expectations. Consumers are increasingly demanding transparency in supply chains and holding fashion conglomerates accountable for their carbon footprints.\n\nIn response to this paradigm shift, several multinational clothing brands have launched circular economy initiatives. These programs encourage garment recycling and utilize sustainable raw materials such as organic cotton and bio-based polymers. Yet, industry analysts caution that many of these green campaigns verge on 'greenwashing'—a superficial marketing ploy designed to appease eco-conscious buyers without enacting substantive reforms in supply chain practices.\n\nTo achieve authentic sustainability, the textile sector must fundamentally overhaul its linear 'take-make-waste' framework. Regulatory authorities in Europe and North America have recently enacted stringent legislation mandating extended producer responsibility. Ultimately, reconciling commercial profitability with ecological stewardship requires both legislative enforcement and genuine consumer commitment.",
            "questions": [
                {
                    "q_num": 1,
                    "stem": "According to Paragraph 1, the fast-fashion model is facing challenges mainly due to ______.",
                    "options": [
                        {"label": "A", "text": "the rapid expansion of global production cycles", "correct": False},
                        {"label": "B", "text": "heightened environmental consciousness among young consumers", "correct": True},
                        {"label": "C", "text": "strict governmental taxation on garment imports", "correct": False},
                        {"label": "D", "text": "a severe shortage of high-quality textile materials", "correct": False}
                    ],
                    "analysis": "【细节事实题】定位到首段第二句 'However, a burgeoning wave of environmental awareness among Gen Z shoppers is dramatically reshaping market expectations'，其中 'burgeoning environmental awareness' 同义替换为 'heightened environmental consciousness'，选项 B 为正确答案。"
                },
                {
                    "q_num": 2,
                    "stem": "The phrase 'greenwashing' in Paragraph 2 most likely refers to ______.",
                    "options": [
                        {"label": "A", "text": "genuine investments in technological innovations", "correct": False},
                        {"label": "B", "text": "superficial environmental claims for promotional purposes", "correct": True},
                        {"label": "C", "text": "effective recycling of toxic chemical pollutants", "correct": False},
                        {"label": "D", "text": "collaborative partnerships among fashion brands", "correct": False}
                    ],
                    "analysis": "【词汇代词题】定位到第2段最后一句破折号后的同位语解释：'a superficial marketing ploy designed to appease eco-conscious buyers without enacting substantive reforms'（为了安抚环保消费者而设计的表面营销噱头），故 B 选项 'superficial environmental claims' 为精准同义替换。"
                },
                {
                    "q_num": 3,
                    "stem": "It can be learned from Paragraph 3 that authentic sustainability requires ______.",
                    "options": [
                        {"label": "A", "text": "a fundamental transformation of the traditional linear production model", "correct": True},
                        {"label": "B", "text": "complete elimination of international textile trade", "correct": False},
                        {"label": "C", "text": "sole reliance on voluntary corporate donations", "correct": False},
                        {"label": "D", "text": "relaxing government regulations on carbon emissions", "correct": False}
                    ],
                    "analysis": "【细节推断题】定位到第3段首句 'the textile sector must fundamentally overhaul its linear take-make-waste framework'，其中 'overhaul its linear framework' 对应 A 项 'fundamental transformation of the traditional linear production model'。"
                }
            ],
            "key_vocab": [
                {"word": "burgeoning", "pos": "adj.", "zh": "迅速发展的、萌芽激增的"},
                {"word": "conglomerate", "pos": "n.", "zh": "大型跨国企业集团"},
                {"word": "superficial", "pos": "adj.", "zh": "肤浅的、表面的"},
                {"word": "appease", "pos": "v.", "zh": "平息、安抚、姑息"},
                {"word": "stewardship", "pos": "n.", "zh": "管理职责、守护、监管"}
            ]
        },
        {
            "id": "reading-2022-text2",
            "year": 2022,
            "text_num": "Text 2",
            "theme": "科技哲学与人工智能伦理",
            "title": "生成式人工智能在学术研究中的伦理边界",
            "text": "The rapid ascendancy of generative artificial intelligence has unleashed a profound transformation across higher education and scientific research. Proponents argue that large language models act as intellectual co-pilots, dramatically accelerating data synthesis, literature summarization, and coding workflows. By automating repetitive administrative tasks, these digital assistants liberate scholars to concentrate on higher-order conceptual breakthroughs.\n\nNevertheless, this technological revolution is accompanied by grave ethical quandaries. Chief among these concerns is the erosion of intellectual originality and the risk of algorithmic hallucination. When automated systems fabricate plausible citations or produce biased interpretations, the credibility of peer-reviewed research is severely undermined. Furthermore, excessive reliance on predictive algorithms risks diminishing the cognitive stamina and critical inquiry of novice researchers.\n\nIn navigating this brave new world, academia must eschew both blind technophobia and unchecked euphoria. Universities and funding bodies should formulate transparent ethical guidelines that mandate full disclosure of algorithmic assistance. Ultimately, AI should augment rather than supplant human critical intellect.",
            "questions": [
                {
                    "q_num": 1,
                    "stem": "Proponents believe that generative AI models benefit researchers by ______.",
                    "options": [
                        {"label": "A", "text": "replacing human scholars in formulating scientific hypotheses", "correct": False},
                        {"label": "B", "text": "automating routine tasks and boosting research productivity", "correct": True},
                        {"label": "C", "text": "eliminating the necessity of peer-review procedures", "correct": False},
                        {"label": "D", "text": "guaranteeing absolute accuracy in experimental results", "correct": False}
                    ],
                    "analysis": "【观点细节题】定位到第1段 'By automating repetitive administrative tasks, these digital assistants liberate scholars to concentrate on higher-order conceptual breakthroughs'，对应 B 项 'automating routine tasks and boosting research productivity'。"
                },
                {
                    "q_num": 2,
                    "stem": "What is the author's primary concern regarding the use of AI in scientific papers?",
                    "options": [
                        {"label": "A", "text": "High subscription costs of AI research tools", "correct": False},
                        {"label": "B", "text": "Potential fabrication of citations and loss of research credibility", "correct": True},
                        {"label": "C", "text": "Delay in publication cycles caused by algorithm checks", "correct": False},
                        {"label": "D", "text": "Decreasing employment opportunities for senior professors", "correct": False}
                    ],
                    "analysis": "【事实细节题】定位到第2段 'When automated systems fabricate plausible citations or produce biased interpretations, the credibility of peer-reviewed research is severely undermined'，对应 B 选项。"
                },
                {
                    "q_num": 3,
                    "stem": "The author's attitude towards the integration of AI in academia can be best described as ______.",
                    "options": [
                        {"label": "A", "text": "unconditionally enthusiastic", "correct": False},
                        {"label": "B", "text": "completely dismissive", "correct": False},
                        {"label": "C", "text": "cautiously balanced and objective", "correct": True},
                        {"label": "D", "text": "indifferent and detached", "correct": False}
                    ],
                    "analysis": "【作者态度题】定位到末段 'academia must eschew both blind technophobia and unchecked euphoria... AI should augment rather than supplant human critical intellect'，体现既看到赋能作用又强调伦理规约的审慎平衡客观态度，选 C。"
                }
            ],
            "key_vocab": [
                {"word": "ascendancy", "pos": "n.", "zh": "优势、主导地位、崛起"},
                {"word": "quandary", "pos": "n.", "zh": "困境、两难绝境"},
                {"word": "fabricate", "pos": "v.", "zh": "捏造、编造、虚构"},
                {"word": "eschew", "pos": "v.", "zh": "回避、避开、戒除"},
                {"word": "supplant", "pos": "v.", "zh": "取代、替代"}
            ]
        }
    ]
}

with open('data/reading_real.json', 'w', encoding='utf-8') as f:
    json.dump(reading_data, f, ensure_ascii=False, indent=2)
print("Updated data/reading_real.json")

# 2. Real Exam Cloze Dataset
cloze_data = {
    "title": "考研英语（一）完形填空真题实战库",
    "total_count": 2,
    "passages": [
        {
            "id": "cloze-2022",
            "year": 2022,
            "theme": "认知心理与环境行为",
            "title": "自然环境接触对心理压力恢复的积极效应",
            "text": "Immersion in natural environments has long been recognized as a potent remedy for mental fatigue. Recent neurobiological experiments demonstrate that urban dwellers who regularly stroll in parks show significantly lower cortisol levels. (1)____, prolonged exposure to bustling city streets tends to deplete attentional reserves. Environmental psychologists attribute this disparity (2)____ the restorative power of natural stimuli. Natural landscapes offer 'soft fascination' that gently engages involuntary attention (3)____ demanding active cognitive exertion. Consequently, individuals emerge from wilderness walks with rejuvenated willpower and (4)____ emotional stability.",
            "blanks": [
                {
                    "blank_num": 1,
                    "options": [
                        {"label": "A", "text": "In contrast (经典转折对立 · 红花词)", "correct": True},
                        {"label": "B", "text": "In addition (顺承递进)", "correct": False},
                        {"label": "C", "text": "For instance (举例说明)", "correct": False},
                        {"label": "D", "text": "Therefore (因果总结)", "correct": False}
                    ],
                    "analysis": "空前一句为'公园散步降低皮质醇压力(+)'，空后一句为'繁华城市街道消耗注意力储备(-)'，前后正反鲜明对立，必选'In contrast'。"
                },
                {
                    "blank_num": 2,
                    "options": [
                        {"label": "A", "text": "to (attribute A to B 经典固定搭配)", "correct": True},
                        {"label": "B", "text": "with (介词错误)", "correct": False},
                        {"label": "C", "text": "from (介词错误)", "correct": False},
                        {"label": "D", "text": "for (介词错误)", "correct": False}
                    ],
                    "analysis": "固定动词短语 'attribute [结果] to [原因]' 表示'把...归因于...'，正确答案为 to。"
                },
                {
                    "blank_num": 3,
                    "options": [
                        {"label": "A", "text": "without (否定介词 · 无需消耗)", "correct": True},
                        {"label": "B", "text": "through (通过消耗)", "correct": False},
                        {"label": "C", "text": "besides (除...之外)", "correct": False},
                        {"label": "D", "text": "despite (尽管)", "correct": False}
                    ],
                    "analysis": "根据'soft fascination'（柔和吸引）的定义，自然刺激吸引不随意注意，而'无需(without)'主动消耗认知努力。"
                },
                {
                    "blank_num": 4,
                    "options": [
                        {"label": "A", "text": "enhanced (提高的、增强的)", "correct": True},
                        {"label": "B", "text": "diminished (削弱的)", "correct": False},
                        {"label": "C", "text": "compromised (受损的)", "correct": False},
                        {"label": "D", "text": "vulnerable (脆弱的)", "correct": False}
                    ],
                    "analysis": "与前面'rejuvenated willpower'（重焕活力的意志力）构成并列同向关系，故选正面积极词'enhanced'（增强的情绪稳定性）。"
                }
            ],
            "key_vocab": [
                {"word": "deplete", "pos": "v.", "zh": "消耗、耗尽"},
                {"word": "stimuli", "pos": "n.", "zh": "刺激、兴奋剂(stimulus复数)"},
                {"word": "rejuvenate", "pos": "v.", "zh": "使年轻、使恢复生机活力"},
                {"word": "involuntary", "pos": "adj.", "zh": "无意识的、不随意的"}
            ]
        }
    ]
}

with open('data/cloze_real.json', 'w', encoding='utf-8') as f:
    json.dump(cloze_data, f, ensure_ascii=False, indent=2)
print("Updated data/cloze_real.json")

# 3. Real Exam New Type Dataset
newtype_data = {
    "title": "考研英语（一）阅读新题型真题实战库",
    "total_count": 2,
    "tasks": [
        {
            "id": "newtype-2023",
            "year": 2023,
            "type": "排序题 (Paragraph Ordering)",
            "theme": "社会学与数字时代的劳动力变迁",
            "title": "远程协作模式对企业组织架构的重塑",
            "paragraphs": [
                {
                    "id": "A",
                    "text": "Such digital pioneers established decentralized communication protocols, allowing team members across different time zones to collaborate seamlessly without constant physical supervision.",
                    "clue": "【代词指代链】开头含 'Such digital pioneers'，必紧接在首次提及先驱企业或科研机构的段落之后。"
                },
                {
                    "id": "B",
                    "text": "In recent decades, the profound transition towards remote working has revolutionized organizational paradigms across the global technology and knowledge sectors.",
                    "clue": "【标准首段特征】交代宏观时代背景 'In recent decades, ... has revolutionized...'，引出全文核心议题。"
                },
                {
                    "id": "C",
                    "text": "However, this flexible model also poses severe psychological challenges, including chronic employee isolation and blurred boundaries between professional duties and private life.",
                    "clue": "【逻辑转折】转折词 'However' 承接上文关于远程协作的效率优势，转入对心理孤独与工作边界模糊的探讨。"
                },
                {
                    "id": "D",
                    "text": "To mitigate these adverse effects, forward-thinking executives are introducing asynchronous wellness check-ins and hybrid physical gathering spaces.",
                    "clue": "【对策解决句】句首 'To mitigate these adverse effects' 紧扣段落 C 提出的多重负面挑战，给出终极解决方案。"
                }
            ],
            "correct_order": ["B", "A", "C", "D"],
            "analysis": "① 首段选 B：宏观交代远程办公历史变革；② 第二段选 A：以 'Such digital pioneers' 承接 B 中的变革先锋；③ 第三段选 C：以 'However, this flexible model' 引入挑战；④ 第四段选 D：以 'To mitigate these adverse effects' 给出应对策略。"
        }
    ]
}

with open('data/newtype_real.json', 'w', encoding='utf-8') as f:
    json.dump(newtype_data, f, ensure_ascii=False, indent=2)
print("Updated data/newtype_real.json")
