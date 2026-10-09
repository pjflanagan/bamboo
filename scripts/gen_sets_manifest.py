
import os
import json
import re

FLASHCARDS_CLASS_DIR = 'data/flashcards/class'
OUTPUT_FILES = [
    'data/flashcard-sets.json',
]

def gen_sets_manifest():
    sets = {}
    for class_name in sorted(os.listdir(FLASHCARDS_CLASS_DIR)):
        class_dir = os.path.join(FLASHCARDS_CLASS_DIR, class_name)
        if not os.path.isdir(class_dir):
            continue
        pattern = re.compile(rf'^{re.escape(class_name)}-(\d+)\.csv$')
        indices = []
        for f in os.listdir(class_dir):
            m = pattern.match(f)
            if m:
                indices.append(int(m.group(1)))
        if indices:
            sets[class_name] = max(indices)

    for output_file in OUTPUT_FILES:
        with open(output_file, 'w') as f:
            json.dump(sets, f, indent=2)
        print(f"Wrote {output_file}:")
    for name, count in sets.items():
        print(f"  {name}: {count}")

if __name__ == '__main__':
    gen_sets_manifest()
