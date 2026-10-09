
import os
import re
import unicodedata
import pinyin as PinyinConv
from hanziconv import HanziConv
from .map import findInMap
from .file import loadCsv
from dotenv import load_dotenv
from google.cloud import translate_v2 as translate

# .env
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account.json
load_dotenv()

HANZI_TO_ENGLISH_MAP = loadCsv('data/maps/Hanzi-English')
PINYIN_TONELESS_TO_ZHUYIN_MAP = loadCsv('data/maps/PinyinToneless-Zhuyin')

REPLACE_PINYIN = [
    # I cannot find an example with a first tone v
    # ['v', 'ǖ'],
    ['v̀', 'ǜ'],
    ['v̌', 'ǚ'],
    ['v́', 'ǘ'],
    ['v', 'ü'],
]

FORCE_SIMPLIFIED = [
    '了', '出', '回'
]

class Hanzi:
    def getAll():
        hanzi = set()
        # Iterate through the primary Hanzi Unicode range
        for i in range(0x4E00, 0x9FFF + 1):
            hanzi.add(chr(i))

        # Iterate through a supplementary Hanzi Unicode range (Extension A)
        for i in range(0x3400, 0x4DBF + 1):
            hanzi.add(chr(i))
        
        return hanzi

    def getPinyin(char):
        pinyin = PinyinConv.get(char)
        for replacement in REPLACE_PINYIN:
            pinyin = pinyin.replace(replacement[0], replacement[1])
        return pinyin
    
    def getTonelessPinyin(char):
        return PinyinConv.get(char, format="strip").replace('v', 'ü')

    def getTone(char):
        pinyinNumerical = PinyinConv.get(char, format="numerical")
        numbers = re.findall(r'\d+', pinyinNumerical)
        return numbers[0] if numbers else None
    
    def getTraditional(char):
        if char in FORCE_SIMPLIFIED:
            return char
        else:
            return HanziConv.toTraditional(char)
        
    # find the english definition of a single char
    def getEnglish(char):
        return findInMap(HANZI_TO_ENGLISH_MAP, char)
    
    def getZhuyin(char):
        toneless = Hanzi.getTonelessPinyin(char)
        return findInMap(PINYIN_TONELESS_TO_ZHUYIN_MAP, toneless)
        
    
class Pinyin:
    def stripTones(pinyin):
        nfkd_form = unicodedata.normalize('NFKD', pinyin)
        return "".join([c for c in nfkd_form if not unicodedata.combining(c)])


    
googleTranslateClient = translate.Client()

class Phrase:
    def getTraditional(phrase):
        traditional = []
        for char in phrase:
            traditional.append(Hanzi.getTraditional(char))
        separator = ""
        return separator.join(traditional)
        
    # NOTE: this pinyin will not always be correct
    # as pronunciation changes contextually
    def getPinyin(phrase):
        pinyin = []
        for char in phrase:
            pinyin.append(Hanzi.getPinyin(char))
        separator = ' '
        return separator.join(pinyin)
    
    def translateEnglish(phrase):
        results = googleTranslateClient.translate(
            values=phrase,
            target_language="en",
            source_language="zh-TW"
        )
        return results['translatedText']

