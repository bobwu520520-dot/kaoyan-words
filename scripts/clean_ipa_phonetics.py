# -*- coding: utf-8 -*-
"""
clean_ipa_phonetics.py - 标准 IPA 国际音标精准清洗转换器
将词库中残留的 ASCII 近似音标、单词拼写泄漏（如 -ness, -ment, kk, ddʒ）清洗为牛津/剑桥权威标准 IPA 音标。
"""

import json, os, sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

CLEAN_IPA_MAP = {
    "abruptness": "/əˈbrʌptnəs/",
    "absoluteness": "/ˈæbsəluːtnəs/",
    "accompli": "/əˈkɒmpliː/",
    "accreted": "/əˈkriːtɪd/",
    "accumulatively": "/əˈkjuːmjələtɪvli/",
    "accusingly": "/əˈkjuːzɪŋli/",
    "accustom": "/əˈkʌstəm/",
    "acquaint": "/əˈkweɪnt/",
    "acquaintance": "/əˈkweɪntəns/",
    "acquiescent": "/ˌækwiˈesnt/",
    "acquirer": "/əˈkwaɪərə/",
    "acquisitive": "/əˈkwɪzətɪv/",
    "acuteness": "/əˈkjuːtnəs/",
    "adjournment": "/əˈdʒɜːnmənt/",
    "adjustable": "/əˈdʒʌstəbl/",
    "admonishment": "/ədˈmɒnɪʃmənt/",
    "adornment": "/əˈdɔːnmənt/",
    "advisement": "/ədˈvaɪzmənt/",
    "anyway": "/ˈeniweɪ/",
    "augment": "/ɔːɡˈment/",
    "badge": "/bædʒ/",
    "basement": "/ˈbeɪsmənt/",
    "bear": "/beə/",
    "belt": "/belt/",
    "bend": "/bend/",
    "black": "/blæk/",
    "bless": "/bles/",
    "cell": "/sel/",
    "cement": "/sɪˈment/",
    "compartment": "/kəmˈpɑːtmənt/",
    "complement": "/ˈkɒmplɪmənt/",
    "criminal": "/ˈkrɪmɪnl/",
    "empowerment": "/ɪmˈpaʊəmənt/",
    "enrollment": "/ɪnˈrəʊlmənt/",
    "estimate": "/ˈestɪmeɪt/",
    "explain": "/ɪkˈspleɪn/",
    "fell": "/fel/",
    "friend": "/frend/",
    "grudge": "/ɡrʌdʒ/",
    "harassment": "/ˈhærəsmənt/",
    "harness": "/ˈhɑːnɪs/",
    "hedge": "/hedʒ/",
    "hell": "/hel/",
    "installment": "/ɪnˈstɔːlmənt/",
    "lack": "/læk/",
    "meanwhile": "/ˈmiːnwaɪl/",
    "net": "/net/",
    "occasional": "/əˈkeɪʒənl/",
    "occupancy": "/ˈɒkjəpənsi/",
    "occurrence": "/əˈkʌrəns/",
    "ornament": "/ˈɔːnəmənt/",
    "pledge": "/pledʒ/",
    "porridge": "/ˈpɒrɪdʒ/",
    "predicament": "/prɪˈdɪkəmənt/",
    "reckless": "/ˈrekləs/",
    "refreshment": "/rɪˈfreʃmənt/",
    "sentiment": "/ˈsentɪmənt/",
    "tempt": "/tempt/",
    "test": "/test/",
    "torment": "/ˈtɔːment/",
    "vessel": "/ˈvesl/",
    "wedge": "/wedʒ/",
    "wellness": "/ˈwelnəs/",
    "instalment": "/ɪnˈstɔːlmənt/",
    "refinement": "/rɪˈfaɪnmənt/",
    "ridge": "/rɪdʒ/",
    "senseless": "/ˈsensləs/",
    "astonishment": "/əˈstɒnɪʃmənt/",
    "deportment": "/dɪˈpɔːtmənt/",
    "detriment": "/ˈdetrɪmənt/",
    "dodge": "/dɒdʒ/",
    "ebb": "/eb/",
    "ecclesiastical": "/ɪˌkliːziˈæstɪkl/",
    "enhancement": "/ɪnˈhɑːnsmənt/",
    "ferment": "/fəˈment/",
    "finesse": "/fɪˈnes/",
    "hapless": "/ˈhæpləs/",
    "increment": "/ˈɪŋkrəmənt/",
    "lament": "/ləˈment/",
    "occlude": "/əˈkluːd/",
    "peccadillo": "/ˌpekəˈdɪləʊ/",
    "presentiment": "/prɪˈzentɪmənt/",
    "resentment": "/rɪˈzentmənt/",
    "relentless": "/rɪˈlentləs/",
    "succor": "/ˈsʌkə/",
    "thankless": "/ˈθæŋkləs/",
    "understatement": "/ˌʌndəˈsteɪtmənt/",
    "entrapment": "/ɪnˈtræpmənt/",
    "impeachment": "/ɪmˈpiːtʃmənt/",
    "indictment": "/ɪnˈdaɪtmənt/",
    "parliament": "/ˈpɑːləmənt/",
    "procurement": "/prəˈkjʊəmənt/",
    "reinforcement": "/ˌriːɪnˈfɔːsmənt/",
    "endangered": "/ɪnˈdeɪndʒəd/",
    "russian": "/ˈrʌʃn/",
    "scarce": "/skeəs/",
    "set": "/set/",
    "sex": "/seks/",
    "landfill": "/ˈlændfɪl/",
    "pollutant": "/pəˈluːtənt/",
    "interdisciplinary": "/ˌɪntəˌdɪsəˈplɪnəri/",
    "acoustically": "/əˈkuːstɪkli/",
    "additionally": "/əˈdɪʃənəli/",
    "additive": "/ˈædətɪv/",
    "addressable": "/əˈdresəbl/",
    "addressee": "/ˌædreˈsiː/",
    "admissibility": "/ədˌmɪsəˈbɪləti/",
    "admissible": "/ədˈmɪsəbl/",
    "applaud": "/əˈplɔːd/",
    "appreciable": "/əˈpriːʃəbl/",
    "ascend": "/əˈsend/",
    "ashamed": "/əˈʃeɪmd/",
    "somewhat": "/ˈsʌmwɒt/",
    "spare": "/speə/",
    "spell": "/spel/",
    "stem": "/stem/",
    "student-centered": "/ˈstjuːdnt ˈsentəd/",
    "tense": "/tens/",
    "thread": "/θred/",
    "trend": "/trend/",
    "wear": "/weə/",
    "well": "/wel/",
    "well-being": "/ˈwel biːɪŋ/",
    "wheel": "/wiːl/",
    "whenever": "/wenˈevə/",
    "widespread": "/ˈwaɪdspred/",
    "yell": "/jel/",
    "yet": "/jet/",
    "destined": "/ˈdestɪnd/",
    "situated": "/ˈsɪtʃueɪtɪd/",
    "wicked": "/ˈwɪkɪd/",
    "wretched": "/ˈretʃɪd/",
    "infrared": "/ˌɪnfrəˈred/",
    "so-called": "/ˌsəʊ ˈkɔːld/",
    "antiquated": "/ˈæntɪkweɪtɪd/",
    "convoluted": "/ˈkɒnvəluːtɪd/",
    "disheveled": "/dɪˈʃevld/",
    "elated": "/ɪˈleɪtɪd/",
    "emaciated": "/ɪˈmeɪʃieɪtɪd/",
    "entrenched": "/ɪnˈtrentʃt/",
    "hardheaded": "/ˌhɑːdˈhedɪd/",
    "infatuated": "/ɪnˈfætʃueɪtɪd/",
    "ingrained": "/ɪnˈɡreɪnd/",
    "intercede": "/ˌɪntəˈsiːd/",
    "jaded": "/ˈdʒeɪdɪd/",
    "protracted": "/prəˈtræktɪd/",
    "tainted": "/ˈteɪntɪd/",
    "gifted": "/ˈɡɪftɪd/",
    "impede": "/ɪmˈpiːd/",
    "embed": "/ɪmˈbed/"
}

import re

def clean_words_phonetics(words_path):
    with open(words_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    words = data['words']
    updated_count = 0
    
    for w in words:
        word = w['word']
        old_ph = w.get('phonetic', '')
        new_ph = old_ph
        
        if word in CLEAN_IPA_MAP:
            new_ph = CLEAN_IPA_MAP[word]
        else:
            # Systematic cleanup
            p = new_ph.strip()
            p = re.sub(r'ˈə([kdpbstf])\1', r'əˈ\1', p)
            p = re.sub(r'([bdfgklmnprstvz])\1', r'\1', p)
            p = p.replace('hw', 'w')
            p = re.sub(r'ællɪ', 'li', p)
            p = re.sub(r'taɪvelɪ', 'tɪvli', p)
            p = re.sub(r'sɪnɡlɪ', 'sɪŋli', p)
            p = re.sub(r'stɒm', 'stəm', p)
            p = re.sub(r'aɪtaɪv', 'ətɪv', p)
            p = re.sub(r'eness', 'nəs', p)
            p = re.sub(r'ness', 'nəs', p)
            p = re.sub(r'ment', 'mənt', p)
            p = re.sub(r'less', 'ləs', p)
            p = re.sub(r'aɪsement', 'aɪzmənt', p)
            p = re.sub(r'ddʒ', 'dʒ', p)
            p = re.sub(r'eɪmed', 'eɪmd', p)
            p = re.sub(r'əed', 'əd', p)
            new_ph = p

        # Ensure wrapping slashes
        new_ph = new_ph.strip()
        if new_ph and not (new_ph.startswith('/') and new_ph.endswith('/')):
            new_ph = f"/{new_ph.strip('/')}/"
            
        if old_ph != new_ph:
            w['phonetic'] = new_ph
            updated_count += 1

    with open(words_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"[OK] Successfully standardized IPA phonetics for {updated_count} words in {words_path}")
    return updated_count

if __name__ == '__main__':
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_words = os.path.join(project_root, 'data', 'words.json')
    clean_words_phonetics(target_words)
