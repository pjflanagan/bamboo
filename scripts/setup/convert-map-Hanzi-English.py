
from util.file import loadJson, writeCsv
from util.mandarin import Hanzi

if __name__ == '__main__':
    # CONSIDER: this is not a very comprehensive map, find a new one
    hanziEnglishMap = loadJson('scripts/source/bamboo-Hanzi-English')
    if hanziEnglishMap is None:
        print("Failed to load hanziEnglishMap")
        exit(1)

    outputMap = [("hanzi", "english")]

    for char in hanziEnglishMap.keys():
        # get the english from the map
        english = hanziEnglishMap[char]
        outputMap.append((char, english))
        
        # if this character looks different in traditional
        # then also add traditional to the map
        tradChar = Hanzi.getTraditional(char)
        if char != tradChar:
            outputMap.append((tradChar, english))
            

    writeCsv("data/maps/Hanzi-English", outputMap)