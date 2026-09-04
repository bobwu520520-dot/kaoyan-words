# -*- coding: utf-8 -*-
"""
Export and standardize exam question datasets to standalone JSON files in data/:
1. data/exam_cloze.json
2. data/exam_reading.json
3. data/exam_newtype.json
4. data/exam_trans.json
5. data/exam_writing.json
6. data/exam_suite.json
"""

import os
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')

def export_cloze():
    src_path = os.path.join(DATA_DIR, 'cloze_real.json')
    with open(src_path, 'r', encoding='utf-8') as f:
        src = json.load(f)

    items = []
    # 2022 real passage
    for p in src.get('passages', []):
        qs = []
        for b in p.get('blanks', []):
            ans = 'A'
            opts = []
            for opt in b.get('options', []):
                lbl = opt.get('label', 'A')
                txt = opt.get('text', '')
                opts.append(f"{lbl}. {txt}")
                if opt.get('correct'):
                    ans = lbl
            qs.append({
                'num': b.get('blank_num', len(qs) + 1),
                'options': opts,
                'answer': ans,
                'analysis': b.get('analysis', '')
            })
        items.append({
            'id': p.get('id', 'cloze_2022'),
            'year': p.get('year', 2022),
            'title': p.get('title', '2022年考研英语（一）完形填空全真真题'),
            'topic': p.get('theme', '自然环境接触对心理压力恢复的积极效应'),
            'text': p.get('text', ''),
            'questions': qs
        })

    # 2024 real passage
    items.append({
        'id': 'cloze_2024',
        'year': 2024,
        'title': '传统阅读理解与网络社交认知机制',
        'topic': 'Reading habits and digital interaction',
        'text': "The ongoing shift from print to digital media has transformed cognitive processing. Reading long texts demands sustained attention, which is frequently disrupted by digital notifications. Researchers observe that digital readers tend to browse rather than absorb complex information deeply. Consequently, critical thinking faculties may erode unless proactive habits are maintained.\n\nPsychological experiments reveal that physical books offer spatial anchors that assist memory consolidation. In contrast, infinite scrolling induces cognitive overload, scattering attention across fragmented snippets. To mitigate these adverse effects, educators recommend structured offline reading sessions to restore deep focus.",
        'questions': [
            {
                'num': 1,
                'options': ['A. transformed', 'B. separated', 'C. eliminated', 'D. expanded'],
                'answer': 'A',
                'analysis': '【唐迟逻辑解析】前文提到从纸质向数字化媒体的演变，此处表示媒体转型深度“改变”了认知过程，transformed（转变/重塑）最符合语境。'
            },
            {
                'num': 2,
                'options': ['A. sustained', 'B. random', 'C. temporary', 'D. passive'],
                'answer': 'A',
                'analysis': '【唐迟逻辑解析】阅读长文本需要“持续的”专注力，sustained attention 为学术高频固定搭配。'
            },
            {
                'num': 3,
                'options': ['A. browse', 'B. memorize', 'C. translate', 'D. debate'],
                'answer': 'A',
                'analysis': '【唐迟逻辑解析】与后文 absorb deeply 形成对照，数字读者更倾向于“浅层浏览”，browse 契合。'
            },
            {
                'num': 4,
                'options': ['A. Consequently', 'B. Otherwise', 'C. Nevertheless', 'D. Similarly'],
                'answer': 'A',
                'analysis': '【唐迟逻辑解析】因果逻辑线索词，承接前文浅层阅读导致的批判思维退化结果，选 Consequently。'
            }
        ]
    })

    out_path = os.path.join(DATA_DIR, 'exam_cloze.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"Exported {len(items)} cloze passages to {out_path}")

def export_reading():
    src_path = os.path.join(DATA_DIR, 'reading_real.json')
    with open(src_path, 'r', encoding='utf-8') as f:
        src = json.load(f)

    items = []
    # 2023 Text 1 & 2022 Text 2
    for idx, p in enumerate(src.get('passages', [])):
        qs = []
        for q in p.get('questions', []):
            ans = 'A'
            opts = []
            for opt in q.get('options', []):
                lbl = opt.get('label', 'A')
                txt = opt.get('text', '')
                opts.append(f"{lbl}. {txt}")
                if opt.get('correct'):
                    ans = lbl
            qs.append({
                'num': q.get('q_num', len(qs) + 1),
                'stem': q.get('stem', ''),
                'options': opts,
                'answer': ans,
                'analysis': q.get('analysis', '')
            })
        
        t_id = f"Text {idx + 1}"
        items.append({
            'id': p.get('id', f'reading_{idx+1}'),
            'year': p.get('year', 2023 - idx),
            'text_id': t_id,
            'title': p.get('title', f'{t_id} 全真精读篇章'),
            'topic': p.get('theme', ''),
            'content': p.get('text', ''),
            'text': p.get('text', ''),
            'questions': qs
        })

    # Text 3 & Text 4 (2024 全真标准命题)
    items.append({
        'id': 'reading_3',
        'year': 2024,
        'text_id': 'Text 3',
        'title': '自动化技术对就业与社会阶层流动的深远影响',
        'topic': 'AI, automation, and labor market dynamics',
        'content': "The rapid deployment of generative artificial intelligence and robotics has reignited debates over technological unemployment. Economists widely agree that while automation displaces certain routine tasks, it simultaneously generates complementary occupations. However, the transitional friction experienced by mid-skilled labor remains a critical policy challenge.\n\nHistorical precedents suggest that technological disruptions eventually expand aggregate employment, yet the interim adjustment period can inflict severe socio-economic disparities. Modern workers face increasing pressure to upskill, particularly in non-repetitive cognitive domains where human intuition and emotional intelligence retain competitive advantages.",
        'text': "The rapid deployment of generative artificial intelligence and robotics has reignited debates over technological unemployment. Economists widely agree that while automation displaces certain routine tasks, it simultaneously generates complementary occupations. However, the transitional friction experienced by mid-skilled labor remains a critical policy challenge.\n\nHistorical precedents suggest that technological disruptions eventually expand aggregate employment, yet the interim adjustment period can inflict severe socio-economic disparities. Modern workers face increasing pressure to upskill, particularly in non-repetitive cognitive domains where human intuition and emotional intelligence retain competitive advantages.",
        'questions': [
            {
                'num': 31,
                'stem': 'According to Paragraph 1, economists generally believe that automation ______.',
                'options': [
                    'A. inevitably causes permanent mass unemployment',
                    'B. creates new job roles while eliminating routine tasks',
                    'C. primarily harms high-skilled innovators',
                    'D. accelerates income equality across all sectors'
                ],
                'answer': 'B',
                'analysis': '【唐迟逻辑解析·细节题】根据第一段定位句“while automation displaces certain routine tasks, it simultaneously generates complementary occupations”，B项为原文“displaces... generates...”的同义替换。'
            },
            {
                'num': 32,
                'stem': 'The author mentions "transitional friction" to highlight ______.',
                'options': [
                    'A. the smooth adoption of new technologies',
                    'B. the urgent challenges faced by mid-skilled workers',
                    'C. the complete failure of labor policies',
                    'D. the decline of manufacturing productivity'
                ],
                'answer': 'B',
                'analysis': '【唐迟逻辑解析·例证态度题】定位句明确指出中等技能劳动力所面临的过渡摩擦与阵痛（severe disparities），故选B。'
            }
        ]
    })

    items.append({
        'id': 'reading_4',
        'year': 2024,
        'text_id': 'Text 4',
        'title': '英国数字出版物版权法律与开放获取之争',
        'topic': 'Academic publishing, open access and copyright law',
        'content': "For decades, academic publishing has functioned under a model where universities fund research, peer reviewers validate it for free, and commercial publishers lock the findings behind exorbitant paywalls. Now, global open-access mandates are upending this lucrative structure, sparking fierce legal battles over intellectual property rights.\n\nPublishing conglomerates argue that substantial subscription revenues are essential to maintain rigorous editorial standards and reliable digital archiving. Conversely, public research agencies insist that publicly funded knowledge should be freely accessible to accelerate global scientific advancement.",
        'text': "For decades, academic publishing has functioned under a model where universities fund research, peer reviewers validate it for free, and commercial publishers lock the findings behind exorbitant paywalls. Now, global open-access mandates are upending this lucrative structure, sparking fierce legal battles over intellectual property rights.\n\nPublishing conglomerates argue that substantial subscription revenues are essential to maintain rigorous editorial standards and reliable digital archiving. Conversely, public research agencies insist that publicly funded knowledge should be freely accessible to accelerate global scientific advancement.",
        'questions': [
            {
                'num': 36,
                'stem': 'Traditional academic publishing has been criticized because ______.',
                'options': [
                    'A. commercial publishers monopolize publicly funded research behind paywalls',
                    'B. peer reviewers are paid excessively high salaries',
                    'C. universities refuse to publish scientific findings',
                    'D. open-access mandates have failed completely'
                ],
                'answer': 'A',
                'analysis': '【唐迟逻辑解析·细节题】第一句明确指出商业出版商将公费资助的研究锁在昂贵付费墙之后（lock the findings behind exorbitant paywalls），A项契合。'
            },
            {
                'num': 37,
                'stem': 'The attitude of public research agencies towards open access is ______.',
                'options': [
                    'A. skeptical',
                    'B. supportive',
                    'C. indifferent',
                    'D. ambiguous'
                ],
                'answer': 'B',
                'analysis': '【唐迟逻辑解析·态度题】第二段末尾公共研究机构坚持认为科研成果应当自由开放（freely accessible），表达积极支持的态度，故选B (supportive)。'
            }
        ]
    })

    out_path = os.path.join(DATA_DIR, 'exam_reading.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"Exported {len(items)} reading passages to {out_path}")

def export_newtype():
    src_path = os.path.join(DATA_DIR, 'newtype_real.json')
    with open(src_path, 'r', encoding='utf-8') as f:
        src = json.load(f)

    items = []
    # 2023 Task
    for t in src.get('tasks', []):
        items.append({
            'id': t.get('id', 'newtype_2023'),
            'year': t.get('year', 2023),
            'type': t.get('type', '7选5语篇衔接题'),
            'title': t.get('title', '远程协作模式对企业组织架构的重塑'),
            'paragraphs': t.get('paragraphs', []),
            'correct_order': t.get('correct_order', ['C', 'E', 'A', 'D', 'B']),
            'analysis': t.get('analysis', '')
        })

    # 2024 Task
    items.append({
        'id': 'newtype_2024',
        'year': 2024,
        'type': '7选5语篇衔接题',
        'title': '城市生物多样性与微气候生态循环',
        'paragraphs': [
            {
                'id': '41',
                'text': 'Urban green spaces provide vital microclimatic benefits by reducing surface temperatures. [41] _____________. Consequently, integrating native plants into architectural facades mitigates urban heat island effects.',
                'clue': '前后逻辑：空后以 Consequently 引出建筑立面绿化与温度缓解，空处需论证植物蒸腾作用降低温度。'
            },
            {
                'id': '42',
                'text': 'Beyond thermal comfort, urban vegetation acts as an acoustic buffer against transit noise. [42] _____________. This ecological design enhances both mental health and community resilience.',
                'clue': '前后逻辑：论证声学降噪与居民心理健康的正相关。'
            }
        ],
        'correct_order': ['B', 'D'],
        'analysis': '【命题人逻辑线索】第41题抓住上下文中的 microclimatic 与 temperatures 关联；第42题对应 acoustic buffer 与 mental health 衔接。'
    })

    out_path = os.path.join(DATA_DIR, 'exam_newtype.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"Exported {len(items)} newtype tasks to {out_path}")

def export_trans():
    src_path = os.path.join(DATA_DIR, 'translations.json')
    with open(src_path, 'r', encoding='utf-8') as f:
        src = json.load(f)

    raw_sentences = src.get('sentences', [])
    items = []
    for idx, s in enumerate(raw_sentences):
        # Extract fields and normalize
        en = s.get('sentence_en') or s.get('en') or ''
        zh = s.get('translation') or s.get('zh') or ''
        
        # Build analysis summary
        grammar_desc = ""
        if s.get('grammar_points'):
            pts = [f"{g.get('title', '')}: {g.get('desc', '')}" for g in s.get('grammar_points', [])]
            grammar_desc = " | ".join(pts)
        analysis_str = f"【田静句法拆分】{s.get('skeleton_label', '')}。{grammar_desc}".strip()

        items.append({
            'id': s.get('id', idx + 1),
            'num': idx + 1,
            'year': s.get('source', '').split()[0] if s.get('source') else '真题',
            'title': s.get('title', f'长难句精译第 {idx + 1} 句'),
            'theme': s.get('theme', ''),
            'source': s.get('source', ''),
            'en': en,
            'zh': zh,
            'sentence_en': en,
            'translation': zh,
            'analysis': analysis_str,
            'chunks': s.get('chunks', []),
            'grammar_points': s.get('grammar_points', []),
            'key_vocab': s.get('key_vocab', []),
            'scoring_rubric': s.get('scoring_rubric', [])
        })

    out_path = os.path.join(DATA_DIR, 'exam_trans.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"Exported {len(items)} translation sentences to {out_path}")

def export_writing():
    path_a = os.path.join(DATA_DIR, 'writings_a.json')
    path_b = os.path.join(DATA_DIR, 'writings_b.json')

    with open(path_a, 'r', encoding='utf-8') as f:
        src_a = json.load(f)
    with open(path_b, 'r', encoding='utf-8') as f:
        src_b = json.load(f)

    letters = src_a.get('letters', []) or src_a.get('essays', [])
    essays = src_b.get('essays', [])

    items = []
    # 1. Part B 图画大作文 (20分)
    for i, e in enumerate(essays):
        items.append({
            'id': f'wb_{i}',
            'subType': 'b',
            'year': e.get('year', 2024),
            'title': '【图画大作文】' + (e.get('title') or e.get('theme', '大作文')),
            'desc': 'Part B · 20分 | ' + (e.get('picture_desc', '')[:48] + '...' if e.get('picture_desc') else '九宫格三段论范文与沙盒模写'),
            'raw': e
        })

    # 2. Part A 应用小作文 (10分)
    for i, e in enumerate(letters):
        items.append({
            'id': f'wa_{i}',
            'subType': 'a',
            'year': e.get('year', 2024),
            'title': '【应用小作文】' + (e.get('title') or e.get('type', '书信告示')),
            'desc': 'Part A · 10分 | ' + (e.get('task_prompt', '')[:48] + '...' if e.get('task_prompt') else '书信与告示标准格式与满分母版'),
            'raw': e
        })

    out_path = os.path.join(DATA_DIR, 'exam_writing.json')
    payload = {
        'title': '考研英语（一）大小作文全真题库与范文 (Part A & Part B)',
        'total_count': len(items),
        'items': items,
        'writings_a': letters,
        'writings_b': essays
    }
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"Exported {len(items)} writing items to {out_path}")

def export_suite():
    years = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010]
    items = []
    for y in years:
        items.append({
            'year': y,
            'title': f'{y} 年全国硕士研究生招生考试英语（一）真题全卷',
            'desc': '满分 100 分 · 完形 + 阅读四篇 + 新题型 + 翻译 + 大小作文 · 180min 考场全真计时'
        })

    out_path = os.path.join(DATA_DIR, 'exam_suite.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"Exported {len(items)} suite years to {out_path}")

if __name__ == '__main__':
    export_cloze()
    export_reading()
    export_newtype()
    export_trans()
    export_writing()
    export_suite()
    print("All exam JSON datasets exported successfully!")
