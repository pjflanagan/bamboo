
import math
from fpdf import FPDF
from util.file import loadCsv
import sys
from util.flashcards import getCsvFileName

# ---------------------------------------------------------
# CONST ---------------------------------------------------
# ---------------------------------------------------------

PAGE_WIDTH = 8.5
PAGE_HEIGHT = 11

CARD_COLUMNS = 3
CARD_ROWS = 5

CARD_WIDTH = PAGE_WIDTH / CARD_COLUMNS
CARD_HEIGHT = PAGE_HEIGHT / CARD_ROWS

# ---------------------------------------------------------
# PAGE MODEL ----------------------------------------------
# ---------------------------------------------------------

def getEmptyPage():
  return [[None for _ in range(CARD_COLUMNS)] for _ in range(CARD_ROWS)]

# Front   Back
# 0 1 2 | 2 1 0
# 3 4 5 | 5 4 3
# orders a set of 15 or less cards into 5 rows of 3
# returns the front page and the back page
def makePagePair(cards):
  front = getEmptyPage()
  back = getEmptyPage()
  for index, card in enumerate(cards):
    row = math.floor(index / CARD_COLUMNS)
    frontCol = index % CARD_COLUMNS
    backCol = CARD_COLUMNS - 1 - frontCol
    front[row][frontCol] = card
    back[row][backCol] = card
  return [front, back]

# ---------------------------------------------------------
# DRAW ----------------------------------------------------
# ---------------------------------------------------------

PADDING = 0.2

# x, y are the top left corner
def drawFrontCard(pdf, card, x, y):
  marginTop = 0.2 if len(card['phrase']) <= 5 else 0.45
  pdf.set_xy(x + PADDING, y + CARD_HEIGHT / 2 - marginTop)
  pdf.set_font('noto', '', 32)
  pdf.set_text_color(r=0, g=0, b=0)
  pdf.multi_cell(CARD_WIDTH - 2 * PADDING, 0.6, card['phrase'], 0, 'C') 
  return

def drawBackCard(pdf, card, x, y):
  # top
  pdf.set_xy(x + PADDING, y + PADDING)
  pdf.set_font('noto', '', 8)
  pdf.set_text_color(r=0, g=0, b=0)
  pdf.multi_cell(CARD_WIDTH - 2 * PADDING, 0.16, card['pinyin'], 0, 'C') 
  # bottom
  pdf.set_xy(x + PADDING, y + CARD_HEIGHT - 0.8)
  pdf.set_font('noto', '', 8)
  pdf.set_text_color(r=0, g=0, b=0)
  pdf.multi_cell(CARD_WIDTH - 2 * PADDING, 0.16, card['english'], 0, 'C') 
  # set and index
  pdf.set_xy(x + PADDING, y + CARD_HEIGHT - 0.18)
  pdf.set_font('noto', '', 6)
  pdf.set_text_color(r=150, g=150, b=150)
  pdf.multi_cell(CARD_WIDTH - 2 * PADDING, 0.16, card['set'], 0, 'C') 
  return

def drawPageBorders(pdf):
  pdf.set_line_width(0.008)
  pdf.set_draw_color(r=200, g=200, b=200)
  # lines up and down
  col = 1
  while col < CARD_COLUMNS:
    pdf.line(x1=col*CARD_WIDTH, y1=0, x2=col*CARD_WIDTH, y2=PAGE_HEIGHT)
    col += 1
  # lines across
  row = 1
  while row < CARD_ROWS:
    pdf.line(x1=0, y1=row*CARD_HEIGHT, x2=PAGE_WIDTH, y2=row*CARD_HEIGHT)
    row += 1

def drawPage(pdf, pageModel, isFront):
  pdf.add_page()
  drawPageBorders(pdf)

  row = 0
  col = 0
  while row < len(pageModel):
    while col < len(pageModel[row]):
      card = pageModel[row][col]
      if (card != None):
        if (isFront):
          drawFrontCard(pdf, card, col * CARD_WIDTH, row * CARD_HEIGHT)
        else:
          drawBackCard(pdf, card, col * CARD_WIDTH, row * CARD_HEIGHT)
      col += 1
    col = 0
    row += 1


# ---------------------------------------------------------
# MANDARIN ------------------------------------------------
# ---------------------------------------------------------

# All this does is take each col of the csv and label them
def makeCard(index, entry, setName):
  return {
    'index': index,
    'phrase': entry[0],
    'english': entry[1],
    'pinyin': entry[2],
    'set': setName
  }
  
# ---------------------------------------------------------
# MAIN ----------------------------------------------------
# ---------------------------------------------------------

if __name__ == "__main__":

  # get the type of print, either set or unit
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
  
  # get the classIndex being refined if this is a class print
  classIndex = 1
  if flashcardType == "class":
    if len(sys.argv) > 3:
      print("Flashcard classIndex:", sys.argv[3])
    else:
      print("Missing required classIndex argument for class print.")
      exit(1)
    classIndex = sys.argv[3]
    
  flashcardFullName = flashcardName if flashcardType == "unit" else f"{flashcardName}-{classIndex}"
    
  pdf = FPDF('P', 'in', 'Letter')
  pdf.add_font('noto', '', 'src/font/NotoSansTC-Regular.ttf') # uni=True
  pdf.set_auto_page_break(False)

  flashcards = loadCsv(getCsvFileName(flashcardType, flashcardName, classIndex))

  pageCardSet = []
  for index, entry in enumerate(flashcards, start=1):
    card = makeCard(index, entry, flashcardFullName)

    if card == None:
      pass
    pageCardSet.append(card)

    if (len(pageCardSet) == CARD_COLUMNS * CARD_ROWS):
      [front, back] = makePagePair(pageCardSet)
      drawPage(pdf, front, True)
      drawPage(pdf, back, False)
      pageCardSet = []
  
  if len(pageCardSet) > 0:
    [front, back] = makePagePair(pageCardSet)
    drawPage(pdf, front, True)
    drawPage(pdf, back, False)
  
  if flashcardType == "unit":
    pdf.output(f"print/unit/{flashcardFullName}.pdf")
  else:
    pdf.output(f"print/class/{flashcardName}/{flashcardFullName}.pdf")
    


