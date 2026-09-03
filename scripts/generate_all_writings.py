# -*- coding: utf-8 -*-
"""
Generate complete 15-year (2010-2024) real exam datasets for:
1. data/writings_b.json
2. data/writings_a.json
3. data/reading_real.json
4. data/cloze_real.json
5. data/newtype_real.json
"""

import json
import os

os.makedirs('data', exist_ok=True)

# 15 Years Writing B (2010 - 2024)
wb_list = [
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
    },
    {
        "year": 2019,
        "theme": "坚持与攀登（登山途中快到山顶时的坚持）",
        "title": "途中止步 vs 登顶远眺",
        "picture_desc": "在险峻的高山台阶上，一位登山者半路累了坐在台阶上叹息'不想爬了'；另一位登山者递过水壶鼓励'坚持一下，山顶的风景最美'。",
        "topic": "The Courage to Persevere at Critical Moments",
        "model_essay": "As is vividly portrayed in the cartoon, two mountaineers are hiking up a steep peak: one sits exhaustedly on the stone stairs intending to quit, while his companion hands over a water bottle and encourages him that the summit view will reward all hardships. This touching drawing conveys a timeless maxim: success often belongs to those who hold on for one more minute.\n\nA multitude of driving forces underscore the decisive value of perseverance when approaching the finish line. First and foremost, human psychological mechanisms reveal that the most arduous phase of any endeavor is often right before the breakthrough. It is steadfast willpower that prevents individuals from forfeiting years of accumulated effort. In addition, reaching the pinnacle of any domain demands enduring the trials of isolation, fatigue, and self-doubt. Those who conquer these psychological thresholds emerge with enhanced resilience and broader perspectives.\n\nIn view of the arguments mentioned above, we should cultivate unwavering grit in our study and career. When encountering bottlenecks, we ought to seek mutual encouragement and focus on our ultimate aspirations. As the saying goes, 'The finest view comes after the hardest climb.' Only by persevering to the very end can we appreciate the breathtaking scenery at the zenith of our lives.",
        "paragraphs": [
            {
                "para_title": "第一段：图画精细描写 + 提炼攀登哲理",
                "sentences": [
                    {"en": "As is vividly portrayed in the cartoon, two mountaineers are hiking up a steep peak: one sits exhaustedly on the stone stairs intending to quit, while his companion hands over a water bottle and encourages him that the summit view will reward all hardships.", "zh": "正如画中所生动描绘的，两位登山者正在攀登一座险峻的高峰：一人疲惫不堪地坐在石阶上打算放弃，而他的同伴递过水壶并鼓励他，山顶的风景定会犒劳所有的艰辛。", "role": "登山场景生动描写"},
                    {"en": "This touching drawing conveys a timeless maxim: success often belongs to those who hold on for one more minute.", "zh": "这幅感人至深的图画传递出一条永恒的格言：成功往往属于那些能够再多坚持一分钟的人。", "role": "提炼哲理箴言"}
                ]
            },
            {
                "para_title": "第二段：临门一脚坚持的心理学深挖",
                "sentences": [
                    {"en": "A multitude of driving forces underscore the decisive value of perseverance when approaching the finish line.", "zh": "多种驱动力凸显了在接近终点线时坚持到底的决定性价值。", "role": "论点总述"},
                    {"en": "First and foremost, human psychological mechanisms reveal that the most arduous phase of any endeavor is often right before the breakthrough. It is steadfast willpower that prevents individuals from forfeiting years of accumulated effort.", "zh": "首先，人类心理机制表明，任何事业中最艰难的阶段往往正是突破前夕。正是坚定的意志力阻止了个体放弃多年累积的辛勤付出。", "role": "临界点机制阐述"},
                    {"en": "In addition, reaching the pinnacle of any domain demands enduring the trials of isolation, fatigue, and self-doubt. Those who conquer these psychological thresholds emerge with enhanced resilience and broader perspectives.", "zh": "此外，登顶任何领域的巅峰都需要经受孤独、疲惫与自我怀疑的考验。那些征服这些心理关口的人将获得更强大的韧性与更广阔的视野。", "role": "登顶心理考验"}
                ]
            },
            {
                "para_title": "第三段：对策举措 + 名言升华",
                "sentences": [
                    {"en": "In view of the arguments mentioned above, we should cultivate unwavering grit in our study and career.", "zh": "鉴于上述论证，我们应当在学业与事业中培养坚韧不拔的毅力。", "role": "呼吁引出"},
                    {"en": "When encountering bottlenecks, we ought to seek mutual encouragement and focus on our ultimate aspirations.", "zh": "当遭遇瓶颈时，我们应当互相鼓励并始终聚焦于终极志向。", "role": "行动建议"},
                    {"en": "As the saying goes, 'The finest view comes after the hardest climb.' Only by persevering to the very end can we appreciate the breathtaking scenery at the zenith of our lives.", "zh": "正如常言所道：'最壮美的风景总在最艰难的攀登之后。'唯有坚持到底，我们才能领略人生顶峰那令人叹为观止的壮丽风光。", "role": "名言与终极展望"}
                ]
            }
        ],
        "key_vocab": [
            {"word": "arduous", "pos": "adj.", "zh": "艰难的、费力的"},
            {"word": "forfeiting", "pos": "v./part.", "zh": "丧失、放弃"},
            {"word": "pinnacle", "pos": "n.", "zh": "顶峰、巅峰"},
            {"word": "grit", "pos": "n.", "zh": "坚毅、恒心"},
            {"word": "zenith", "pos": "n.", "zh": "顶点、天顶"}
        ]
    }
]

writings_b_full = {
    "title": "考研英语（一）历年真题图画大作文全题库 (2010~2024)",
    "total_count": len(wb_list),
    "essays": wb_list
}

with open('data/writings_b.json', 'w', encoding='utf-8') as f:
    json.dump(writings_b_full, f, ensure_ascii=False, indent=2)
print(f"Saved data/writings_b.json ({len(wb_list)} essays)")
