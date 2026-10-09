
def getCsvFileName(flashcardType: str, flashcardName: str, classIndex: int) -> str:
    if flashcardType == "class":
        return f"data/flashcards/class/{flashcardName}/{flashcardName}-{classIndex}"
    return f"data/flashcards/unit/{flashcardName}"
