import re

content = open('js/exam_workshop.js', encoding='utf-8').read()
funcs = re.findall(r'function\s+(render[a-zA-Z0-9_]+)\s*\(', content)
print('Render functions:', funcs)
for f in funcs:
    m = re.search(r'function\s+' + f + r'\s*\([^)]*\)\s*\{', content)
    if m:
        start = m.start()
        print(f, 'starts at char', start)


