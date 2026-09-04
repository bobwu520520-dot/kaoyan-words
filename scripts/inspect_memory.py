content = open('memory.html', encoding='utf-8').read()
import re
panels = re.findall(r'class=["\']panel[^"\']*["\']', content)
print('Panels count:', len(panels))
ids = re.findall(r'id=["\']([^"\']+)["\']', content)
print('IDs:', ids[:30])
