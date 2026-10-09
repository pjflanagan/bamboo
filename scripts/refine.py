
import sys
from util.file import writeCsv, loadCsv
from util.mandarin import Phrase, Hanzi
from util.flashcards import getCsvFileName
from util.color import isValidColor, getRandomColor

SET_SIZE = 30

BASE_OUTPUT_HEADER = [("phrase", "english", "pinyin", "color", "comments")]

COL_INDEX_PHRASE = 0
COL_INDEX_ENGLISH = 1
COL_INDEX_PINYIN = 2
COL_INDEX_COLOR = 3
COL_INDEX_COMMENTS = 4

def loadAllFlashcards(flashcardType: str, flashcardName: str) -> list:
    classIndex = 1
    allFlashcards = []
    loadNextSet = True
    while loadNextSet:
        fileName = getCsvFileName(flashcardType, flashcardName, classIndex)
        print("Loading file:", fileName)
        try:
            flashcards = loadCsv(fileName)
            print("File contains", len(flashcards), "flashcards")
            allFlashcards.extend(flashcards)
            classIndex += 1
        except:
            print("No file:", fileName)
            loadNextSet = False
        if flashcardType == "unit":
            loadNextSet = False
    return allFlashcards


def refineEntry(entry):
    # english
    english = ''
    if len(entry) > COL_INDEX_ENGLISH and entry[COL_INDEX_ENGLISH] != '':
        english = entry[COL_INDEX_ENGLISH]
        print("English provided:", english, end=" - ")
    elif len(phrase) == 1:
        english = Hanzi.getEnglish(phrase)
        print("English refined for one word:", english, end=" - ")
    else:
        english = Phrase.translateEnglish(phrase)
        print("English refined using Google translate:", english, end=" - ")
    
    # pinyin
    pinyin = ''
    if len(entry) > COL_INDEX_PINYIN and entry[COL_INDEX_PINYIN] != '':
        pinyin = entry[COL_INDEX_PINYIN]
        print("Pinyin provided:", pinyin)
    else:
        pinyin = Phrase.getPinyin(phrase)
        print("Pinyin refined:", pinyin)
    
    # color
    color = getRandomColor()
    if len(entry) > COL_INDEX_COLOR and entry[COL_INDEX_COLOR] != '' and isValidColor(entry[COL_INDEX_COLOR]):
        color = entry[COL_INDEX_COLOR]
        
    # comment
    comment = ''
    if len(entry) > COL_INDEX_COMMENTS and entry[COL_INDEX_COMMENTS] != '':
        comment = entry[COL_INDEX_COMMENTS]
        
    return (
        phrase,
        english,
        pinyin,
        color,
        comment
    )
    
if __name__ == '__main__':
    
    # get the type of refinement, either set or unit
    if len(sys.argv) > 1:
      print("Flashcard type:", sys.argv[1])
    else:
      print("Missing required flashcardType argument, must be one of `class` or `unit`.")
      exit(1)
    flashcardType = sys.argv[1]
    
    # get the name of the flashcard being refined
    if len(sys.argv) > 2:
      print("Flashcard set:", sys.argv[2])
    else:
      print("Missing required flashcardName argument.")
      exit(1)
    flashcardName = sys.argv[2]

    flashcards = loadAllFlashcards(flashcardType, flashcardName)
    print("Total flashcard count:", len(flashcards))

    outputMap = BASE_OUTPUT_HEADER.copy()
    phraseSet = []
    classIndex = 1
    for entry in flashcards:
        try:
            phrase = Phrase.getTraditional(entry[COL_INDEX_PHRASE])
            print("Refining phrase:", phrase, end=" - ")
            
            # if there's a duplicate skip it
            if phrase in phraseSet:
                print("Duplicate skipped")
                continue
            else:
                phraseSet.append(phrase)

            refinedEntry = refineEntry(entry)
            outputMap.append(refinedEntry)
        except:
            print('ERROR processing phrase')

        if flashcardType == "class" and len(outputMap) == SET_SIZE + 1:
            writeCsv(getCsvFileName(flashcardType, flashcardName, classIndex), outputMap)
            classIndex += 1
            outputMap = BASE_OUTPUT_HEADER.copy()

    # end while
    writeCsv(getCsvFileName(flashcardType, flashcardName, classIndex), outputMap)
