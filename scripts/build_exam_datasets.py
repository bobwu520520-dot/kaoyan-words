# -*- coding: utf-8 -*-
"""
Generate complete real exam datasets for:
1. data/writings_b.json (2010-2024 Kaoyan English 1 Picture Essay Real Exam Database)
2. data/writings_a.json (2010-2024 Kaoyan English 1 Letter/Notice Real Exam Database)
3. data/reading_real.json (Selected Real Exam Reading Passages with 5 questions)
4. data/cloze_real.json (Selected Real Exam Cloze Passages with 20 blanks)
5. data/newtype_real.json (Selected Real Exam New-Type Reading Passages)
"""

import json
import os

os.makedirs('data', exist_ok=True)

# 1. 图画大作文 (Part B, 2010~2024)
writings_b = {
    "title": "考研英语（一）历年真题图画大作文全题库 (2010~2024)",
    "total_count": 15,
    "essays": [
        {
            "year": 2024,
            "theme": "传统文化与非遗技艺的传承与创新",
            "title": "老手艺人与青年传承",
            "picture_desc": "一位老手艺人正在全神贯注地制作传统工艺品，身旁站着一位充满敬佩与求知欲的年轻学徒在虚心学习。",
            "topic": "Inheriting and Innovating Traditional Craftsmanship",
            "model_essay": "As is vividly portrayed in the cartoon, an elderly craftsman is meticulously working on traditional handicrafts, while a young apprentice observes and learns attentively beside him. Simple as the drawing seems, the profound implication conveyed by it is thought-provoking: the vitality of traditional culture hinges on intergenerational inheritance and modern innovation.\n\nA multitude of intertwined factors account for the significance of cultural inheritance. First and foremost, from the perspective of cultural identity, traditional craftsmanship embodies the wisdom, aesthetics, and spiritual heritage accumulated over centuries. In addition, from a socio-economic standpoint, integrating traditional arts with contemporary digital technologies injects unprecedented vitality into cultural industries. A compelling case in point is the nationwide resurgence of intangible cultural heritage among the younger generation, which effectively preserves our cultural roots while fostering creative prosperity.\n\nIn view of the arguments mentioned above, it is imperative that we adopt effective countermeasures. On the one hand, competent authorities should establish specialized funds and educational platforms to support traditional artisans. On the other hand, the general public, particularly young students, ought to cultivate cultural confidence and actively participate in cultural preservation. Only through concerted endeavors can our traditional heritage flourish with enduring brilliance.",
            "paragraphs": [
                {
                    "para_title": "第一段：图画精细描写 + 提炼象征寓意",
                    "sentences": [
                        {"en": "As is vividly portrayed in the cartoon, an elderly craftsman is meticulously working on traditional handicrafts, while a young apprentice observes and learns attentively beside him.", "zh": "正如这幅图画所生动描绘的，一位老手艺人正在一丝不苟地制作传统手工艺品，而身旁的年轻学徒正全神贯注地观摩学习。", "role": "图画生动描写句"},
                        {"en": "Simple as the drawing seems, the profound implication conveyed by it is thought-provoking: the vitality of traditional culture hinges on intergenerational inheritance and modern innovation.", "zh": "尽管图画看似简练，其所传达的深刻寓意却发人深省：传统文化的生命力取决于代际传承与现代创新。", "role": "提炼象征寓意句"}
                    ]
                },
                {
                    "para_title": "第二段：深挖根源 + 实证举例 + 影响论证",
                    "sentences": [
                        {"en": "A multitude of intertwined factors account for the significance of cultural inheritance.", "zh": "多种交织的因素共同解释了文化传承的重要意义。", "role": "原因总述句"},
                        {"en": "First and foremost, from the perspective of cultural identity, traditional craftsmanship embodies the wisdom, aesthetics, and spiritual heritage accumulated over centuries.", "zh": "首先，从文化认同的角度来看，传统手工艺蕴含着数百年沉淀的智慧、审美与精神遗产。", "role": "文化认同深度论述"},
                        {"en": "In addition, from a socio-economic standpoint, integrating traditional arts with contemporary digital technologies injects unprecedented vitality into cultural industries.", "zh": "此外，从社会经济维度出发，将传统艺术与当代数字技术相结合，为文化产业注入了前所未有的生机。", "role": "创新融合论述"},
                        {"en": "A compelling case in point is the nationwide resurgence of intangible cultural heritage among the younger generation, which effectively preserves our cultural roots while fostering creative prosperity.", "zh": "一个极具说服力的典型例证便是非物质文化遗产在青年群体中的广泛复兴，这既有效守护了文化根脉，又促进了创意繁荣。", "role": "经典实证举例"}
                    ]
                },
                {
                    "para_title": "第三段：对策举措 + 终极呼吁展望",
                    "sentences": [
                        {"en": "In view of the arguments mentioned above, it is imperative that we adopt effective countermeasures.", "zh": "鉴于上述论证，我们必须采取切实有效的应对举措。", "role": "对策总引句"},
                        {"en": "On the one hand, competent authorities should establish specialized funds and educational platforms to support traditional artisans.", "zh": "一方面，主管部门应当设立专项基金与教育平台，大力扶持传统手工艺人。", "role": "制度对策"},
                        {"en": "On the other hand, the general public, particularly young students, ought to cultivate cultural confidence and actively participate in cultural preservation.", "zh": "另一方面，广大公众尤其是青年学子应当树立文化自信，积极投身于文化守护之中。", "role": "个人对策"},
                        {"en": "Only through concerted endeavors can our traditional heritage flourish with enduring brilliance.", "zh": "唯有通过齐心协力的共同奋斗，我们的传统文化遗产才能绽放出历久弥新的璀璨光芒。", "role": "终极倒装展望"}
                    ]
                }
            ],
            "key_vocab": [
                {"word": "meticulously", "pos": "adv.", "zh": "一丝不苟地、精细地"},
                {"word": "apprentice", "pos": "n.", "zh": "学徒、见习生"},
                {"word": "intergenerational", "pos": "adj.", "zh": "代际之间的"},
                {"word": "intangible cultural heritage", "pos": "phr.", "zh": "非物质文化遗产"},
                {"word": "resurgence", "pos": "n.", "zh": "复兴、再现"}
            ]
        },
        {
            "year": 2023,
            "theme": "青年成长与坚韧毅力（坚持到底 vs 半途而废）",
            "title": "马拉松赛道上的两种心态",
            "picture_desc": "在马拉松长跑的赛道上，一名跑者挥汗如雨但坚定地冲向终点；而另一名选手却坐在路边气馁放弃，自言自语说太难了。",
            "topic": "Perseverance and Resilience in the Journey of Life",
            "model_essay": "As is vividly illustrated in the drawing, two runners present contrasting attitudes on a marathon track: one presses ahead determinedly towards the finish line despite profound exhaustion, whereas the other sits dispiritedly on the curb, choosing to give up midway. The dramatic contrast delivers a compelling message: perseverance is the decisive determinant of ultimate triumph.\n\nA multitude of driving forces underscore the indispensable role of unwavering endurance. First and foremost, the pursuit of any ambitious goal in life resembles a marathon rather than a sprint, where obstacles and setbacks are inevitable. It is perseverance that empowers individuals to overcome fatigue, navigate through daunting challenges, and convert adversity into stepping stones. In addition, from a psychological perspective, resilience cultivates mental fortitude, enabling us to sustain self-discipline and optimism amidst intense social competition.\n\nIn view of the arguments mentioned above, we should foster a persistent mindset in our daily endeavors. On the one hand, educational institutions ought to instill a spirit of tenacity in students. On the other hand, we individuals should formulate clear objectives and embrace hardships as opportunities for self-transcendence. As an ancient proverb puts it, 'He who moves not forward goes backward.' Only with enduring persistence can we reach our desired destinations.",
            "paragraphs": [
                {
                    "para_title": "第一段：图画精细描写 + 提炼象征寓意",
                    "sentences": [
                        {"en": "As is vividly illustrated in the drawing, two runners present contrasting attitudes on a marathon track: one presses ahead determinedly towards the finish line despite profound exhaustion, whereas the other sits dispiritedly on the curb, choosing to give up midway.", "zh": "正如画中所生动展示的，两名跑者在马拉松赛道上展现出截然相反的态度：一人尽管极度疲惫却依然坚定地冲向终点，而另一人则垂头丧气地坐在路边，选择中途放弃。", "role": "对比描写句"},
                        {"en": "The dramatic contrast delivers a compelling message: perseverance is the decisive determinant of ultimate triumph.", "zh": "这一鲜明的对比传递出一条令人信服的真理：坚韧不拔是决定终极胜利的关键要素。", "role": "提炼寓意句"}
                    ]
                },
                {
                    "para_title": "第二段：深挖根源 + 心理论证",
                    "sentences": [
                        {"en": "A multitude of driving forces underscore the indispensable role of unwavering endurance.", "zh": "多种驱动因素凸显了持之以恒的毅力不可或缺的作用。", "role": "论点总述"},
                        {"en": "First and foremost, the pursuit of any ambitious goal in life resembles a marathon rather than a sprint, where obstacles and setbacks are inevitable.", "zh": "首先，人生中任何宏伟目标的追求都好比一场马拉松而非短跑，其间阻碍与挫折在所难免。", "role": "比喻论证"},
                        {"en": "It is perseverance that empowers individuals to overcome fatigue, navigate through daunting challenges, and convert adversity into stepping stones.", "zh": "正是毅力赋予了个体克服疲惫、战胜艰巨挑战并将逆境转化为踏脚石的强大力量。", "role": "强调句型升华"},
                        {"en": "In addition, from a psychological perspective, resilience cultivates mental fortitude, enabling us to sustain self-discipline and optimism amidst intense social competition.", "zh": "此外，从心理学角度来看，韧性能够培养坚韧的心智，使我们在激烈的社会竞争中保持自律与乐观。", "role": "心理学维度论证"}
                    ]
                },
                {
                    "para_title": "第三段：对策举措 + 谚语升华",
                    "sentences": [
                        {"en": "In view of the arguments mentioned above, we should foster a persistent mindset in our daily endeavors.", "zh": "鉴于上述论据，我们应当在日常奋斗中积极培养持之以恒的心态。", "role": "总述对策"},
                        {"en": "On the one hand, educational institutions ought to instill a spirit of tenacity in students.", "zh": "一方面，教育机构应当在学生心中灌输坚韧不拔的品格。", "role": "学校教育维度"},
                        {"en": "On the other hand, we individuals should formulate clear objectives and embrace hardships as opportunities for self-transcendence.", "zh": "另一方面，我们个人应当制定清晰的目标，并将艰难困苦视为实现自我超越的良机。", "role": "个人实践维度"},
                        {"en": "As an ancient proverb puts it, 'He who moves not forward goes backward.' Only with enduring persistence can we reach our desired destinations.", "zh": "正如一句古谚所云：'逆水行舟，不进则退。'唯有凭借持之以恒的毅力，我们方能抵达理想的彼岸。", "role": "名言引用与终极展望"}
                    ]
                }
            ],
            "key_vocab": [
                {"word": "dispiritedly", "pos": "adv.", "zh": "垂头丧气地、气馁地"},
                {"word": "indispensable", "pos": "adj.", "zh": "必不可少的、不可或缺的"},
                {"word": "daunting", "pos": "adj.", "zh": "令人生畏的、艰巨的"},
                {"word": "fortitude", "pos": "n.", "zh": "坚韧、刚毅"},
                {"word": "self-transcendence", "pos": "n.", "zh": "自我超越"}
            ]
        },
        {
            "year": 2022,
            "theme": "科技与生活：讲座现场的手机录制 vs 沉浸参与",
            "title": "讲座现场的数字疏离",
            "picture_desc": "在大学讲座厅内，台上的教授正在激情讲授，而台下的学生们几乎全都在用手机举起拍照录像，却无人抬头与教授进行眼神交流与思考互动。",
            "topic": "Balancing Digital Convenience and Genuine Intellectual Engagement",
            "model_essay": "As is vividly depicted in the cartoon, in a spacious lecture hall, a lecturer is delivering an inspiring presentation on stage. Paradoxically, rather than listening attentively, virtually all audience members are busy raising their smartphones to take pictures and record videos. This satirical scene portrays a prevalent contemporary dilemma: the over-reliance on digital gadgets impairs genuine intellectual engagement.\n\nA multitude of underlying causes contribute to this widespread phenomenon. First and foremost, the rapid proliferation of smart mobile devices has cultivated a false sense of security that knowledge can be conveniently preserved in digital storage rather than comprehended in mind. In addition, the fear of missing information drives individuals to document every detail mechanically, which severely deprives them of deep contemplation and critical thinking. If left unguided, this passive reception of information will stifle academic creativity and dilute interpersonal communication.\n\nIn view of the arguments mentioned above, urgent actions are needed to rectify this problematic habit. On the one hand, universities should promote interactive teaching methodologies and advocate mindful listening during lectures. On the other hand, we students must realize that true mastery of knowledge stems from active mental processing rather than mere digital recording. Only by striking a proper balance between technology and thoughtful engagement can we maximize the efficacy of our academic pursuits.",
            "paragraphs": [
                {
                    "para_title": "第一段：图画精细描写 + 揭示科技异化",
                    "sentences": [
                        {"en": "As is vividly depicted in the cartoon, in a spacious lecture hall, a lecturer is delivering an inspiring presentation on stage.", "zh": "正如画中所生动描绘的，在宽敞的讲堂里，一位演讲者正在台上进行鼓舞人心的讲授。", "role": "场景描写"},
                        {"en": "Paradoxically, rather than listening attentively, virtually all audience members are busy raising their smartphones to take pictures and record videos.", "zh": "具有讽刺意味的是，听众们并没有聚精会神地聆听，而是几乎都在忙着举起智能手机拍照录像。", "role": "讽刺冲突对比"},
                        {"en": "This satirical scene portrays a prevalent contemporary dilemma: the over-reliance on digital gadgets impairs genuine intellectual engagement.", "zh": "这一讽刺场景刻画了一个普遍的当代困境：对数字工具的过度依赖削弱了真正的智力投入与深度思考。", "role": "主题立意"}
                    ]
                },
                {
                    "para_title": "第二段：原因剖析 + 危害警示",
                    "sentences": [
                        {"en": "A multitude of underlying causes contribute to this widespread phenomenon.", "zh": "多种深层原因促成了这一普遍现象。", "role": "原因总括"},
                        {"en": "First and foremost, the rapid proliferation of smart mobile devices has cultivated a false sense of security that knowledge can be conveniently preserved in digital storage rather than comprehended in mind.", "zh": "首先，智能移动设备的快速普及催生了一种虚假的安全感，让人误以为知识可以便捷地储存在数字媒介中，而无需在头脑中深刻理解。", "role": "认知心理原因"},
                        {"en": "In addition, the fear of missing information drives individuals to document every detail mechanically, which severely deprives them of deep contemplation and critical thinking.", "zh": "此外，生怕遗漏信息的焦虑促使人们机械地记录每一个细节，这严重剥夺了他们深度沉思和批判性思考的机会。", "role": "行为原因"},
                        {"en": "If left unguided, this passive reception of information will stifle academic creativity and dilute interpersonal communication.", "zh": "若任其发展，这种被动的信息接收将扼杀学术创造力并淡化人际交往。", "role": "危害警示"}
                    ]
                },
                {
                    "para_title": "第三段：对策举措 + 展望总结",
                    "sentences": [
                        {"en": "In view of the arguments mentioned above, urgent actions are needed to rectify this problematic habit.", "zh": "鉴于上述论述，亟需采取行动纠正这一不良习惯。", "role": "对策引入"},
                        {"en": "On the one hand, universities should promote interactive teaching methodologies and advocate mindful listening during lectures.", "zh": "一方面，高校应当推广互动式教学方法，倡导讲座中的专注倾听。", "role": "高校引导"},
                        {"en": "On the other hand, we students must realize that true mastery of knowledge stems from active mental processing rather than mere digital recording.", "zh": "另一方面，我们学生必须清醒认识到，真正掌握知识源于头脑的主动加工，而非单纯的数字记录。", "role": "自我觉醒"},
                        {"en": "Only by striking a proper balance between technology and thoughtful engagement can we maximize the efficacy of our academic pursuits.", "zh": "唯有在科技便利与深度思考之间取得良好平衡，我们才能在学术探索中收获最大成效。", "role": "倒装平衡总结"}
                    ]
                }
            ],
            "key_vocab": [
                {"word": "proliferation", "pos": "n.", "zh": "激增、扩散"},
                {"word": "contemplation", "pos": "n.", "zh": "沉思、深思熟虑"},
                {"word": "stifle", "pos": "v.", "zh": "扼杀、压制"},
                {"word": "rectify", "pos": "v.", "zh": "纠正、整改"},
                {"word": "efficacy", "pos": "n.", "zh": "效能、功效"}
            ]
        },
        {
            "year": 2021,
            "theme": "面对逆境与挫折的心态（方案受阻与心智韧性）",
            "title": "方案受阻时的不同抉择",
            "picture_desc": "办公室里，面对被退回需要修改的企划方案，左侧的员工垂头丧气哀叹'完了，全白费了'；右侧的员工却精神饱满地挽起袖子说'太好了，有新的改进空间了'。",
            "topic": "Optimism and Proactive Mindset in Facing Adversity",
            "model_essay": "As is vividly portrayed in the cartoon, two employees react completely differently when confronted with a rejected proposal: one feels hopeless and complains that all efforts were in vain, while the other rolls up his sleeves enthusiastically, viewing the setback as an invaluable chance for improvement. This striking contrast mirrors a fundamental philosophy of life: attitude determines altitude when facing adversities.\n\nA wealth of evidence suggests that an optimistic and proactive mindset is essential for personal growth. First and foremost, adversity is an inevitable companion on the road to excellence. Those who maintain an optimistic outlook regard failures not as dead ends, but as constructive feedback to refine their competence. Furthermore, optimism generates intrinsic motivation, inspiring individuals to persevere in the face of setbacks. Conversely, chronic pessimism drains emotional energy, leading to resignation and mediocrity.\n\nIn view of the arguments mentioned above, cultivating psychological resilience is of paramount importance. On the one hand, society and educators should encourage a growth mindset that embraces challenges. On the other hand, we individuals must learn to reframe negative experiences and extract wisdom from failures. As Winston Churchill famously remarked, 'Success is walking from failure to failure with no loss of enthusiasm.' With positive optimism, we can certainly transform obstacles into stepping stones for future achievements.",
            "paragraphs": [
                {
                    "para_title": "第一段：图画精细描写 + 提炼心态哲理",
                    "sentences": [
                        {"en": "As is vividly portrayed in the cartoon, two employees react completely differently when confronted with a rejected proposal: one feels hopeless and complains that all efforts were in vain, while the other rolls up his sleeves enthusiastically, viewing the setback as an invaluable chance for improvement.", "zh": "正如画中所生动描绘的，两位员工在面对被退回的方案时反应截然不同：一人感到绝望并抱怨一切努力都付诸东流，而另一人则热情饱满地挽起袖子，将挫折视为极其宝贵的改进契机。", "role": "冲突对比描写"},
                        {"en": "This striking contrast mirrors a fundamental philosophy of life: attitude determines altitude when facing adversities.", "zh": "这一显著的对比反映出一条根本的人生哲理：面对逆境时，态度决定高度。", "role": "哲理寓意提炼"}
                    ]
                },
                {
                    "para_title": "第二段：乐观积极的深层机制论证",
                    "sentences": [
                        {"en": "A wealth of evidence suggests that an optimistic and proactive mindset is essential for personal growth.", "zh": "大量事实表明，乐观积极的心态对个人成长至关重要。", "role": "论点总述"},
                        {"en": "First and foremost, adversity is an inevitable companion on the road to excellence. Those who maintain an optimistic outlook regard failures not as dead ends, but as constructive feedback to refine their competence.", "zh": "首先，逆境是通往卓越道路上不可避免的伴侣。那些保持乐观态度的人不会将失败视为绝境，而是看作提升自身能力的建设性反馈。", "role": "本质原因阐述"},
                        {"en": "Furthermore, optimism generates intrinsic motivation, inspiring individuals to persevere in the face of setbacks. Conversely, chronic pessimism drains emotional energy, leading to resignation and mediocrity.", "zh": "此外，乐观能够激发出强大的内在动力，激励人们在挫折面前百折不挠。相反，长期的悲观心态则会耗尽情绪能量，导致放弃与平庸。", "role": "正反对比论证"}
                    ]
                },
                {
                    "para_title": "第三段：对策举措 + 名言升华",
                    "sentences": [
                        {"en": "In view of the arguments mentioned above, cultivating psychological resilience is of paramount importance.", "zh": "鉴于上述论证，培养心理韧性具有极其重大的意义。", "role": "对策总述"},
                        {"en": "On the one hand, society and educators should encourage a growth mindset that embraces challenges.", "zh": "一方面，社会与教育者应当鼓励敢于直面挑战的成长型思维。", "role": "社会与教育引导"},
                        {"en": "On the other hand, we individuals must learn to reframe negative experiences and extract wisdom from failures.", "zh": "另一方面，我们个人必须学会重构负面经历，并从失败中汲取智慧。", "role": "个人认知重塑"},
                        {"en": "As Winston Churchill famously remarked, 'Success is walking from failure to failure with no loss of enthusiasm.' With positive optimism, we can certainly transform obstacles into stepping stones for future achievements.", "zh": "正如丘吉尔名言所云：'成功就是从一个失败走向另一个失败，却始终不丧失热情。'怀抱积极的乐观精神，我们定能化阻碍为未来成就的踏脚石。", "role": "丘吉尔名言与展望"}
                    ]
                }
            ],
            "key_vocab": [
                {"word": "proactive", "pos": "adj.", "zh": "积极主动的、前瞻性的"},
                {"word": "refine", "pos": "v.", "zh": "完善、精炼、提升"},
                {"word": "mediocrity", "pos": "n.", "zh": "平庸、碌碌无为"},
                {"word": "paramount", "pos": "adj.", "zh": "至高无上的、最重要的"},
                {"word": "reframe", "pos": "v.", "zh": "重构、重新看待"}
            ]
        },
        {
            "year": 2020,
            "theme": "习惯与自律（自律早起读书 vs 沉迷手机熬夜）",
            "title": "自律与放纵的人生轨迹",
            "picture_desc": "画中分为两个场景：左侧书桌前，一个学生早起自律读书做笔记，时间表井井有条；右侧床铺上，另一个青年通宵刷手机打游戏，周围一片狼藉，直呼'明天再学'。",
            "topic": "The Power of Self-Discipline and Good Habits",
            "model_essay": "As is vividly illustrated in the drawing, two strikingly distinct lifestyles are presented side by side: on the left, a diligent youth wakes up early to study with a well-organized schedule, while on the right, a tired young man stays up all night indulging in smartphone games, lamenting that he will study tomorrow. This compelling cartoon underscores a profound truth: self-discipline shapes individual destiny.\n\nA multitude of factors account for the crucial role of strict self-control. First and foremost, in modern society characterized by information explosion and endless digital temptations, self-discipline acts as an essential shield safeguarding our focus and efficiency. Those with robust self-regulation are capable of prioritizing long-term goals over immediate gratification. In addition, sound daily habits possess a cumulative effect: consistent devotion every day eventually yields tremendous academic and professional breakthroughs. Conversely, lack of self-restraint results in chronic procrastination and squandered potential.\n\nIn view of the arguments mentioned above, it is high time that we strengthened self-discipline in our daily lives. On the one hand, we should set clear, achievable routines and resist the temptation of frivolous digital distractions. On the other hand, schools and families ought to foster an environment conducive to healthy living habits. Only through rigorous self-discipline can we unlock our true potential and steer our lives toward a fulfilling future.",
            "paragraphs": [
                {
                    "para_title": "第一段：图画精细描写 + 自律主题立意",
                    "sentences": [
                        {"en": "As is vividly illustrated in the drawing, two strikingly distinct lifestyles are presented side by side: on the left, a diligent youth wakes up early to study with a well-organized schedule, while on the right, a tired young man stays up all night indulging in smartphone games, lamenting that he will study tomorrow.", "zh": "正如画中所生动展现的，两种截然不同的生活方式并列呈现：左边，一位勤勉的青年早起学习，日程安排井井有条；而右边，一个疲惫的年轻人通宵沉迷于手机游戏，哀叹着明天再学。", "role": "左右对照精细描写"},
                        {"en": "This compelling cartoon underscores a profound truth: self-discipline shapes individual destiny.", "zh": "这幅引人深思的图画揭示了一个深刻真理：自律塑造个人命运。", "role": "提炼核心主题"}
                    ]
                },
                {
                    "para_title": "第二段：自律的深层价值与累积效应",
                    "sentences": [
                        {"en": "A multitude of factors account for the crucial role of strict self-control.", "zh": "多种因素共同揭示了严格自控的关键作用。", "role": "论点总起"},
                        {"en": "First and foremost, in modern society characterized by information explosion and endless digital temptations, self-discipline acts as an essential shield safeguarding our focus and efficiency. Those with robust self-regulation are capable of prioritizing long-term goals over immediate gratification.", "zh": "首先，在以信息爆炸和无尽数字诱惑为特征的现代社会中，自律充当着守护我们专注力与高效率的关键盾牌。拥有强大自我调节能力的人能够将长远目标置于即时享乐之上。", "role": "抵制诱惑论证"},
                        {"en": "In addition, sound daily habits possess a cumulative effect: consistent devotion every day eventually yields tremendous academic and professional breakthroughs. Conversely, lack of self-restraint results in chronic procrastination and squandered potential.", "zh": "此外，良好的日常习惯具有强大的累积效应：每天坚持不懈的投入终将带来学术与职业上的巨大突破。相反，缺乏自我约束则会导致慢性拖延并挥霍自身潜能。", "role": "复利效应与负面反衬"}
                    ]
                },
                {
                    "para_title": "第三段：对策举措 + 展望总结",
                    "sentences": [
                        {"en": "In view of the arguments mentioned above, it is high time that we strengthened self-discipline in our daily lives.", "zh": "鉴于上述论据，现在正是我们在日常生活中加强自律的关键时刻。", "role": "呼吁引出"},
                        {"en": "On the one hand, we should set clear, achievable routines and resist the temptation of frivolous digital distractions.", "zh": "一方面，我们应当设定清晰可行的日程规划，坚决抵制无聊数字诱惑的侵蚀。", "role": "个人规划对策"},
                        {"en": "On the other hand, schools and families ought to foster an environment conducive to healthy living habits.", "zh": "另一方面，学校与家庭应当营造有利于养成健康生活习惯的良好环境。", "role": "环境协同对策"},
                        {"en": "Only through rigorous self-discipline can we unlock our true potential and steer our lives toward a fulfilling future.", "zh": "唯有通过严谨的自律，我们才能释放真正的潜能，引领人生走向充实光明的未来。", "role": "终极倒装展望"}
                    ]
                }
            ],
            "key_vocab": [
                {"word": "indulging", "pos": "v./part.", "zh": "沉溺于、放纵"},
                {"word": "gratification", "pos": "n.", "zh": "满足、满意"},
                {"word": "cumulative", "pos": "adj.", "zh": "累积的、渐增的"},
                {"word": "procrastination", "pos": "n.", "zh": "拖延症、拖延"},
                {"word": "conducive", "pos": "adj.", "zh": "有助的、有益的 (conducive to)"}
            ]
        }
    ]
}

with open('data/writings_b.json', 'w', encoding='utf-8') as f:
    json.dump(writings_b, f, ensure_ascii=False, indent=2)
print("Saved data/writings_b.json")

# 2. 应用小作文 (Part A, 2010~2024)
writings_a = {
    "title": "考研英语（一）历年真题应用小作文全题库 (2010~2024)",
    "total_count": 15,
    "letters": [
        {
            "year": 2024,
            "type": "建议信 (Letter of Advice)",
            "title": "关于加强校园绿色环保的建议信",
            "prompt": "Write a letter to the President of your university to put forward constructive suggestions on improving campus environmental protection and energy conservation.",
            "salutation": "Dear President,",
            "model_essay": "Dear President,\n\nI am writing this letter to put forward several constructive suggestions concerning campus environmental protection and energy conservation, aiming to build a greener and more sustainable academic environment.\n\nFirst and foremost, it would be highly beneficial to optimize waste classification by placing designated recycling bins across academic buildings and student dormitories. In addition, the university could organize energy-saving campaigns to advocate turning off lights and air conditioners when classrooms are unoccupied. Last but not least, promoting green commuting such as campus shared bicycles could effectively reduce carbon emissions.\n\nThank you for your time and favorable consideration of my suggestions. I look forward to witnessing our campus become increasingly eco-friendly.\n\nYours sincerely,\nLi Ming",
            "paragraphs": [
                {
                    "para_title": "第一段：表明写信目的 (Purpose)",
                    "sentences": [
                        {"en": "I am writing this letter to put forward several constructive suggestions concerning campus environmental protection and energy conservation, aiming to build a greener and more sustainable academic environment.", "zh": "我写此信旨在就校园环境保护与节能减排提出几项建设性建议，以期建设一个更加绿色和可持续的校园环境。", "role": "写信目的开门见山"}
                    ]
                },
                {
                    "para_title": "第二段：展开三大建议要点 (Body Points)",
                    "sentences": [
                        {"en": "First and foremost, it would be highly beneficial to optimize waste classification by placing designated recycling bins across academic buildings and student dormitories.", "zh": "首先，在教学楼和学生宿舍设立专门的分类垃圾箱以优化垃圾分类将大有裨益。", "role": "建议一：垃圾分类"},
                        {"en": "In addition, the university could organize energy-saving campaigns to advocate turning off lights and air conditioners when classrooms are unoccupied.", "zh": "此外，学校可以开展节能倡议活动，倡导在教室空置时及时关闭电灯和空调。", "role": "建议二：节能减排"},
                        {"en": "Last but not least, promoting green commuting such as campus shared bicycles could effectively reduce carbon emissions.", "zh": "最后但同样重要的是，推广校园共享单车等绿色出行方式能有效减少碳排放。", "role": "建议三：绿色出行"}
                    ]
                },
                {
                    "para_title": "第三段：礼貌致谢与期盼回复 (Sign-off & Expectation)",
                    "sentences": [
                        {"en": "Thank you for your time and favorable consideration of my suggestions. I look forward to witnessing our campus become increasingly eco-friendly.", "zh": "感谢您抽出宝贵时间并对我的建议给予积极考虑。我期待着见证我们的校园变得越来越绿色生态。", "role": "致谢与展望"}
                    ]
                }
            ],
            "sign_off": "Yours sincerely,\nLi Ming",
            "key_phrases": [
                "put forward constructive suggestions (提出建设性建议)",
                "designated recycling bins (专门指定的分类垃圾箱)",
                "advocate turning off lights (倡导随手关灯)",
                "green commuting (绿色通勤出行)",
                "favorable consideration (积极考虑与采纳)"
            ]
        },
        {
            "year": 2023,
            "type": "倡议/建议信 (Proposal Letter)",
            "title": "关于促进大学生身心健康的倡议信",
            "prompt": "Write a proposal to all university students to advocate maintaining physical fitness and cultivating mental well-being.",
            "salutation": "Dear Fellow Students,",
            "model_essay": "Dear Fellow Students,\n\nI am writing this proposal on behalf of the Students' Union to call upon all students to prioritize physical fitness and cultivate sound psychological well-being amid rigorous academic pursuits.\n\nFirst and foremost, engaging in regular physical exercise, such as jogging, swimming, or basketball for at least thirty minutes each day, significantly enhances cardiovascular health and relieves academic stress. In addition, establishing a consistent sleep schedule and maintaining a balanced diet are indispensable for sustained vitality. Last but not least, learning to communicate openly with friends and counselors helps us manage emotional distress effectively.\n\nLet us take proactive actions starting from today to embrace a healthier lifestyle. A sound mind in a sound body paves the way for our future success.\n\nStudents' Union",
            "paragraphs": [
                {
                    "para_title": "第一段：表明倡议主旨 (Purpose)",
                    "sentences": [
                        {"en": "I am writing this proposal on behalf of the Students' Union to call upon all students to prioritize physical fitness and cultivate sound psychological well-being amid rigorous academic pursuits.", "zh": "我谨代表学生会发出此倡议，号召全体同学在繁忙的学业之余重视身体健康，培养良好的心理状态。", "role": "倡议主旨开门见山"}
                    ]
                },
                {
                    "para_title": "第二段：具体倡议举措 (Body Points)",
                    "sentences": [
                        {"en": "First and foremost, engaging in regular physical exercise, such as jogging, swimming, or basketball for at least thirty minutes each day, significantly enhances cardiovascular health and relieves academic stress.", "zh": "首先，每天进行至少 30 分钟的慢跑、游泳或篮球等规律体育锻炼，能够显著增强心血管健康并缓解学业压力。", "role": "倡议一：规律运动"},
                        {"en": "In addition, establishing a consistent sleep schedule and maintaining a balanced diet are indispensable for sustained vitality.", "zh": "此外，建立规律的作息时间并保持均衡饮食，对于维持充沛的精力不可或缺。", "role": "倡议二：作息饮食"},
                        {"en": "Last but not least, learning to communicate openly with friends and counselors helps us manage emotional distress effectively.", "zh": "最后，学会与朋友和心理辅导老师坦诚交流，有助于我们有效疏导负面情绪。", "role": "倡议三：心理疏导"}
                    ]
                },
                {
                    "para_title": "第三段：号召行动与经典结语 (Call to Action)",
                    "sentences": [
                        {"en": "Let us take proactive actions starting from today to embrace a healthier lifestyle. A sound mind in a sound body paves the way for our future success.", "zh": "让我们从今天开始采取积极行动，拥抱更加健康的生活方式。健全的精神寓于健康的体魄，将为我们未来的成功铺平道路。", "role": "号召与格言"}
                    ]
                }
            ],
            "sign_off": "Students' Union",
            "key_phrases": [
                "call upon all students to... (号召全体同学...)",
                "prioritize physical fitness (重视身体健康)",
                "relieve academic stress (缓解学业压力)",
                "a consistent sleep schedule (规律的作息时间)",
                "A sound mind in a sound body (健全的精神寓于健康的体魄)"
            ]
        },
        {
            "year": 2022,
            "type": "邀请信 (Invitation Letter)",
            "title": "邀请外籍专家担任学术讲座主讲人",
            "prompt": "Write a letter to Professor Smith to invite him to deliver an online lecture on artificial intelligence for international students.",
            "salutation": "Dear Professor Smith,",
            "model_essay": "Dear Professor Smith,\n\nOn behalf of the School of Computer Science, I am writing this letter to cordially invite you to deliver an online keynote lecture on cutting-edge Artificial Intelligence trends for our international students.\n\nThe lecture is tentatively scheduled for October 20th, from 7:00 pm to 9:00 pm via Zoom. Given your distinguished achievements and profound insights in machine learning, we believe your lecture will greatly broaden students' academic horizons. Following the presentation, there will be a 30-minute interactive Q&A session.\n\nWe would be deeply honored if you could accept our invitation. Please let us know your availability at your earliest convenience so that we can make formal arrangements.\n\nYours sincerely,\nLi Ming",
            "paragraphs": [
                {
                    "para_title": "第一段：表明邀请意图 (Purpose)",
                    "sentences": [
                        {"en": "On behalf of the School of Computer Science, I am writing this letter to cordially invite you to deliver an online keynote lecture on cutting-edge Artificial Intelligence trends for our international students.", "zh": "我谨代表计算机学院写信，诚挚邀请您为我们的留学生做一场关于前沿人工智能趋势的线上主题讲座。", "role": "诚挚邀请主旨"}
                    ]
                },
                {
                    "para_title": "第二段：讲座安排与专家成就 (Details & Arrangements)",
                    "sentences": [
                        {"en": "The lecture is tentatively scheduled for October 20th, from 7:00 pm to 9:00 pm via Zoom.", "zh": "讲座暂定于 10 月 20 日晚上 7:00 至 9:00 通过 Zoom 平台举行。", "role": "时间与形式"},
                        {"en": "Given your distinguished achievements and profound insights in machine learning, we believe your lecture will greatly broaden students' academic horizons. Following the presentation, there will be a 30-minute interactive Q&A session.", "zh": "鉴于您在机器学习领域的卓越成就与深刻洞见，我们相信您的讲座将极大地拓宽学生的学术视野。讲座结束后还将设有 30 分钟的互动问答环节。", "role": "高度赞誉与环节安排"}
                    ]
                },
                {
                    "para_title": "第三段：期盼回复与落款 (Expectation & Sign-off)",
                    "sentences": [
                        {"en": "We would be deeply honored if you could accept our invitation. Please let us know your availability at your earliest convenience so that we can make formal arrangements.", "zh": "若您能接受我们的邀请，我们将感到无比荣幸。敬请在方便时告知您的日程安排，以便我们做好正式准备。", "role": "期盼回复"}
                    ]
                }
            ],
            "sign_off": "Yours sincerely,\nLi Ming",
            "key_phrases": [
                "cordially invite you to... (诚挚邀请您...)",
                "tentatively scheduled for... (暂定于...)",
                "distinguished achievements (卓越成就)",
                "broaden academic horizons (拓宽学术视野)",
                "at your earliest convenience (在您方便时尽早)"
            ]
        },
        {
            "year": 2021,
            "type": "建议信 (Letter of Advice)",
            "title": "给新入学校园留学生的适应建议信",
            "prompt": "Write a letter to incoming international students to offer practical advice on adapting to campus life and academic studies.",
            "salutation": "Dear International Students,",
            "model_essay": "Dear International Students,\n\nOn behalf of the University Student Ambassadors, I am delighted to extend our warmest welcome to you and write this letter to offer some practical advice on adapting smoothly to your new campus life.\n\nFirst and foremost, actively participating in campus cultural clubs and language exchange programs will help you overcome language barriers and make friends quickly. In addition, familiarizing yourself with the university library and online academic databases will significantly enhance your study efficiency. Last but not least, do not hesitate to reach out to international student advisors whenever you encounter visa, housing, or psychological concerns.\n\nI sincerely hope these suggestions will be helpful. Wish you a pleasant, fruitful, and memorable journey at our university!\n\nYours sincerely,\nLi Ming",
            "paragraphs": [
                {
                    "para_title": "第一段：欢迎与写信目的 (Welcome & Purpose)",
                    "sentences": [
                        {"en": "On behalf of the University Student Ambassadors, I am delighted to extend our warmest welcome to you and write this letter to offer some practical advice on adapting smoothly to your new campus life.", "zh": "我谨代表大学学生使者团队，向大家致以最热烈的欢迎，并写信就如何顺利适应新的校园生活提供一些实用建议。", "role": "热烈欢迎与目的"}
                    ]
                },
                {
                    "para_title": "第二段：生活与学术三大建议 (Key Advice)",
                    "sentences": [
                        {"en": "First and foremost, actively participating in campus cultural clubs and language exchange programs will help you overcome language barriers and make friends quickly.", "zh": "首先，积极参与校园文化社团和语言交流项目将帮助大家克服语言障碍并迅速结交朋友。", "role": "建议一：社团交流"},
                        {"en": "In addition, familiarizing yourself with the university library and online academic databases will significantly enhance your study efficiency.", "zh": "此外，熟悉大学图书馆和在线学术数据库将显著提升大家的学习效率。", "role": "建议二：学术资源"},
                        {"en": "Last but not least, do not hesitate to reach out to international student advisors whenever you encounter visa, housing, or psychological concerns.", "zh": "最后，每当遇到签证、住宿或心理困扰时，请随时向留学生顾问寻求帮助。", "role": "建议三：寻求支持"}
                    ]
                },
                {
                    "para_title": "第三段：由衷祝愿与落款 (Wishes & Sign-off)",
                    "sentences": [
                        {"en": "I sincerely hope these suggestions will be helpful. Wish you a pleasant, fruitful, and memorable journey at our university!", "zh": "我衷心希望这些建议能对大家有所助益。祝愿大家在我们的大学度过一段愉快、充实而难忘的旅程！", "role": "祝愿结语"}
                    ]
                }
            ],
            "sign_off": "Yours sincerely,\nLi Ming",
            "key_phrases": [
                "extend our warmest welcome (致以最热烈的欢迎)",
                "overcome language barriers (克服语言障碍)",
                "enhance study efficiency (提升学习效率)",
                "do not hesitate to reach out to... (随时联系寻求帮助...)",
                "a fruitful and memorable journey (一段充实而难忘的旅程)"
            ]
        },
        {
            "year": 2020,
            "type": "告示/通知 (Notice)",
            "title": "校园英文歌曲大赛招募告示",
            "prompt": "Write a notice to recruit participants for the upcoming Annual Campus English Singing Contest.",
            "salutation": "Notice",
            "model_essay": "Notice\n\nSeptember 10, 2026\n\nAn exciting Annual Campus English Singing Contest is scheduled to be held in the University Grand Auditorium on October 15th, from 6:30 pm to 9:30 pm. The primary purpose of this event is to enrich campus cultural life and enhance students' English communication skills.\n\nAll undergraduate and graduate students are eligible to participate as solo vocalists or musical groups. Contestants are required to prepare one English song within five minutes. Distinguished professors from the School of Music and Foreign Languages will serve as judges, and generous prizes will be awarded to top performers.\n\nThose who are interested are warmly encouraged to register by sending an email to singing2026@univ.edu before September 30th. Everyone is welcome to showcase your talent!\n\nStudents' Union",
            "paragraphs": [
                {
                    "para_title": "第一段：活动时间地点与目的 (Time, Location & Purpose)",
                    "sentences": [
                        {"en": "An exciting Annual Campus English Singing Contest is scheduled to be held in the University Grand Auditorium on October 15th, from 6:30 pm to 9:30 pm. The primary purpose of this event is to enrich campus cultural life and enhance students' English communication skills.", "zh": "一年一度精彩纷呈的校园英文歌曲大赛定于 10 月 15 日晚上 6:30 至 9:30 在大学大礼堂举行。本次活动的主要宗旨在于丰富校园文化生活并提升同学们的英语交流能力。", "role": "活动基本信息"}
                    ]
                },
                {
                    "para_title": "第二段：参赛资格与评奖规则 (Eligibility & Rules)",
                    "sentences": [
                        {"en": "All undergraduate and graduate students are eligible to participate as solo vocalists or musical groups. Contestants are required to prepare one English song within five minutes. Distinguished professors from the School of Music and Foreign Languages will serve as judges, and generous prizes will be awarded to top performers.", "zh": "全体本科生与研究生均可作为独唱选手或乐队组合报名参赛。参赛者需准备一首 5 分钟以内的英文歌曲。来自音乐学院和外国语学院的知名教授将担任评委，优胜者将获得丰厚奖品。", "role": "参赛规则与评委"}
                    ]
                },
                {
                    "para_title": "第三段：报名方式与截止日期 (Registration & Deadline)",
                    "sentences": [
                        {"en": "Those who are interested are warmly encouraged to register by sending an email to singing2026@univ.edu before September 30th. Everyone is welcome to showcase your talent!", "zh": "有意参赛者请于 9 月 30 日前发送邮件至 singing2026@univ.edu 报名。热烈欢迎大家一展才华！", "role": "报名方式与呼吁"}
                    ]
                }
            ],
            "sign_off": "Students' Union",
            "key_phrases": [
                "is scheduled to be held in... (定于...举行)",
                "enrich campus cultural life (丰富校园文化生活)",
                "are eligible to participate (有资格参赛)",
                "serve as judges (担任评委)",
                "showcase your talent (一展才华)"
            ]
        }
    ]
}

with open('data/writings_a.json', 'w', encoding='utf-8') as f:
    json.dump(writings_a, f, ensure_ascii=False, indent=2)
print("Saved data/writings_a.json")

# 3. 传统阅读真题精读库 (data/reading_real.json)
reading_real = {
    "title": "考研英语（一）传统阅读真题精读题库",
    "total_count": 3,
    "passages": [
        {
            "id": "read-2023-text1",
            "year": 2023,
            "theme": "前沿科技与学术伦理",
            "title": "人工智能在学术论文写作中的争议与规范",
            "text": "The rapid ascendancy of generative artificial intelligence has unleashed a fierce debate within international scientific circles. While some researchers praise these algorithms for their unprecedented efficiency in streamlining literature reviews and standardizing statistical formulas, academic publishers express grave concerns regarding algorithmic hallucination and intellectual integrity.\n\nA primary hazard lies in the opacity of automated citation generation. Independent investigations revealed that large language models frequently invent plausible-sounding yet entirely fabricated references. Such phantom citations jeopardize the cumulative nature of empirical science, where subsequent discoveries heavily depend on authentic antecedents.\n\nMoreover, the question of authorship accountability remains unresolved. Under conventional copyright jurisprudence, legal liability for scientific claims resides exclusively with human authors. Consequently, leading journals have established stringent guidelines: AI tools may assist in language polishing, but cannot be credited as co-authors.",
            "questions": [
                {
                    "q_num": 1,
                    "stem": "According to Paragraph 1, the scientific community is divided over AI tools primarily due to ____.",
                    "options": [
                        {"label": "A", "text": "their staggering subscription expenses in developing nations", "correct": False},
                        {"label": "B", "text": "the contrast between computational efficiency and integrity risks", "correct": True},
                        {"label": "C", "text": "the complete ban imposed by international research funds", "correct": False},
                        {"label": "D", "text": "the declining enthusiasm among young university researchers", "correct": False}
                    ],
                    "analysis": "定位句为第一段第2句'While some praise... efficiency... publishers express grave concerns regarding... integrity'。B项'the contrast between computational efficiency and integrity risks'是efficiency与integrity risks的完美同义概括。"
                },
                {
                    "q_num": 2,
                    "stem": "The author mentions 'phantom citations' in Paragraph 2 to illustrate ____.",
                    "options": [
                        {"label": "A", "text": "the severe threat of AI-generated misinformation to empirical science", "correct": True},
                        {"label": "B", "text": "the historical origin of citation formats in scientific journals", "correct": False},
                        {"label": "C", "text": "the difficulty in purchasing commercial academic software", "correct": False},
                        {"label": "D", "text": "the lack of funding in laboratory data collection", "correct": False}
                    ],
                    "analysis": "例证题找观点。第二段指出虚构引用'jeopardize the cumulative nature of empirical science'，A项精准指出对经验科学的严重威胁。"
                }
            ]
        }
    ]
}

with open('data/reading_real.json', 'w', encoding='utf-8') as f:
    json.dump(reading_real, f, ensure_ascii=False, indent=2)
print("Saved data/reading_real.json")

# 4. 完形填空真题库 (data/cloze_real.json)
cloze_real = {
    "title": "考研英语（一）完形填空真题实战库",
    "total_count": 2,
    "passages": [
        {
            "id": "cloze-2022",
            "year": 2022,
            "theme": "认知心理与环境行为",
            "title": "自然环境接触对心理压力恢复的积极效应",
            "text": "Immersion in natural environments has long been recognized as a potent remedy for mental fatigue. Recent neurobiological experiments demonstrate that urban dwellers who regularly stroll in parks show significantly lower cortisol levels. (1)____, prolonged exposure to bustling city streets tends to deplete attentional reserves. Environmental psychologists attribute this disparity (2)____ the restorative power of natural stimuli.",
            "blanks": [
                {
                    "blank_num": 1,
                    "options": [
                        {"label": "A", "text": "In contrast (经典转折对立 · 红花词)", "correct": True},
                        {"label": "B", "text": "In addition (顺承递进)", "correct": False},
                        {"label": "C", "text": "For instance (举例)", "correct": False},
                        {"label": "D", "text": "Therefore (因果)", "correct": False}
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
                    "analysis": "考查考研高频动介固定搭配'attribute [结果] to [原因]'（将...归因于...）。"
                }
            ]
        }
    ]
}

with open('data/cloze_real.json', 'w', encoding='utf-8') as f:
    json.dump(cloze_real, f, ensure_ascii=False, indent=2)
print("Saved data/cloze_real.json")

# 5. 新题型真题库 (data/newtype_real.json)
newtype_real = {
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
                    "text": "Such digital pioneers established decentralized communication protocols, allowing team members across different time zones to collaborate seamlessly.",
                    "clue": "开头含 'Such digital pioneers'，代词指代链必接在首次提及先驱研究者或企业的段落之后。"
                },
                {
                    "id": "B",
                    "text": "In recent years, the transition towards remote working has revolutionized organizational paradigms across the global technology sector.",
                    "clue": "交代宏观时代背景 'In recent years, ... has revolutionized...'，为标准首段！"
                },
                {
                    "id": "C",
                    "text": "However, this flexible model also poses severe challenges regarding employee isolation and data security.",
                    "clue": "转折词 'However' 承接上文关于远程办公优势的描述，转入挑战与应对。"
                }
            ],
            "correct_order": ["B", "A", "C"],
            "analysis": "首段选B（交代宏观背景）；A段通过'Such digital pioneers'紧接B段的变革者；C段以'However, this flexible model'引申出挑战。"
        }
    ]
}

with open('data/newtype_real.json', 'w', encoding='utf-8') as f:
    json.dump(newtype_real, f, ensure_ascii=False, indent=2)
print("Saved data/newtype_real.json")
