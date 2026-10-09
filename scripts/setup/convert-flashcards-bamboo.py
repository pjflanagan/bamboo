
from util.file import loadJson, writeCsv
from util.mandarin import Phrase, Hanzi

if __name__ == '__main__':
    chromeExtensionPhrases = loadJson('scripts/source/chrome-extension-phrases')

    outputMap = [("phrase", "english", "pinyin")]

    for phrase in chromeExtensionPhrases:
        try:
            trad = Phrase.getTraditional(phrase['simplified'])

            # only keep the english if it is a single character
            english = phrase['english'] if len(trad) == 1 else ''
            
            # the pinyin for multiple characters is wrong
            pinyin  = ''
            if len(trad) == 1:
                pinyin = Hanzi.getPinyin(trad)

            outputMap.append((
                trad,
                english,
                pinyin
            ))
        except:
            print('Error for char:' + phrase['simplified'])

    writeCsv('data/flashcards/basic', outputMap)
