
def findInMap(mapping, key):
    for row in mapping:
        if row[0] == key:
            return row[1]
    return None
