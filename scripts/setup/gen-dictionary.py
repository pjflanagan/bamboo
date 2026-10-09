from hanziconv import HanziConv
from util.file import writeCsv
from util.mandarin import Hanzi

# NOTE: this requires both maps to have been created in order to work

if __name__ == '__main__':
    allHanziSet = Hanzi.getAll()

    # our map has all unicode hanzi, traditional, and simplified
    # at least one of traditional or simplified WILL match hanzi
    outputMap = [("hanzi", "trad", "simp", "pinyin", "toneless", "tone", "zhuyin")]

    for char in allHanziSet:
        try:
            outputMap.append((
                char,
                Hanzi.getTraditional(char),
                HanziConv.toSimplified(char),
                Hanzi.getPinyin(char),
                Hanzi.getTonelessPinyin(char),
                Hanzi.getTone(char),
                Hanzi.getZhuyin(char)
            ))
        except:
            print('Error for char:' + char)

    writeCsv('data/dictionary', outputMap)
