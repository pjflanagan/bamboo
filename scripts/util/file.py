
import csv
import json

def loadJson(fileName):
    with open(fileName + '.json') as f:
        d = json.load(f)
        return d
    return None

def loadCsv(fileName):
    with open(fileName + ".csv") as fp:
        reader = csv.reader(fp, delimiter=",", quotechar='"')
        next(reader, None)  # skip the headers
        return [row for row in reader]

def writeCsv(name, content):
    with open(name + ".csv", "wt") as fp:
        writer = csv.writer(fp, delimiter=",")
        writer.writerows(content)
