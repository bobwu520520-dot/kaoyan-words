import re

content = open('exam.html', encoding='utf-8').read()
matches = list(re.finditer(r'id=["\'](sec-[^"\']+)["\']', content))
for m in matches:
    idx = m.start()
    tag_start = content.rfind('<', 0, idx)
    tag_end = content.find('>', idx)
    print(m.group(1), content[tag_start:tag_end+1])



