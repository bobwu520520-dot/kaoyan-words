import re

def build():
    content = open('exam.html', encoding='utf-8').read()
    
    # Extract head styles or links
    # Notice exam.html has specific styles for workshops in <style>
    style_m = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
    extra_style = style_m.group(1) if style_m else ''
    
    # Extract method sections
    sec_ids = ['sec-reading', 'sec-trans', 'sec-cloze', 'sec-newtype', 'sec-writing-a', 'sec-writing-b', 'sec-strategy']
    method_htmls = {}
    for sid in sec_ids:
        # Match <section class="exam-section" id="sid"...> ... </section>
        pat = r'<section class=["\']exam-section["\'] id=["\']' + sid + r'["\'][^>]*>(.*?)</section>'
        m = re.search(pat, content, re.DOTALL)
        if m:
            inner = m.group(1)
            # Remove workshop root placeholders from methods
            inner = re.sub(r'<div id="[a-z0-9_-]+workshop-root"></div>', '', inner)
            # Remove previous sec-nav-footer from methods
            inner = re.sub(r'<div class="sec-nav-footer".*?</div>\s*</div>', '</div>', inner, flags=re.DOTALL)
            method_htmls[sid] = inner.strip()
    
    print(f"Extracted {len(method_htmls)} method sections.")

build()
