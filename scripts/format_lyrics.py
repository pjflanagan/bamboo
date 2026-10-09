import os
import sys
import csv
import re

def is_hanzi(text):
    # Basic check for Chinese characters
    return any('\u4e00' <= char <= '\u9fff' for char in text)

def format_lyrics(input_path):
    if not os.path.exists(input_path):
        print(f"Error: File {input_path} not found.")
        return

    with open(input_path, 'r', encoding='utf-8') as f:
        lines = [line.strip() for line in f.readlines()]

    output_path = input_path.rsplit('.', 1)[0] + '.csv'
    
    header_keywords = ['Verse', 'Chorus', 'Refrain', 'Bridge', 'Repeat', 'Intro', 'Outro']
    
    formatted_data = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line:
            i += 1
            continue
        
        # Check if it's a header
        is_header = any(line.lower().startswith(kw.lower()) for kw in header_keywords)
        
        # If it's short and no hanzi and not part of a triplet, it might be a header too
        # But let's stick to keywords for now or lines that look like headers
        
        if is_header:
            # Match the observed pattern of 3 trailing commas for headers (4 columns)
            formatted_data.append([f"# {line}", "", "", ""])
            i += 1
        elif i + 2 < len(lines) and is_hanzi(lines[i+1]):
            # Likely a triplet: English, Hanzi, Pinyin
            english = lines[i]
            hanzi = lines[i+1]
            pinyin = lines[i+2]
            # Strip trailing punctuation/spaces from hanzi if it helps matching
            # but usually it's better to keep it as is.
            formatted_data.append([hanzi, english, pinyin])
            i += 3
        else:
            # Fallback for unexpected lines - treat as comment or header
            if is_hanzi(line):
                formatted_data.append([line, "", ""])
            else:
                formatted_data.append([f"# {line}", "", "", ""])
            i += 1

    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['phrase', 'english', 'pinyin'])
        writer.writerows(formatted_data)

    print(f"Successfully formatted lyrics to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/format_lyrics.py <input_txt_file>")
        print("Example: python3 scripts/format_lyrics.py data/songs/lo_tayu_childhood.txt")
        sys.exit(1)
    
    format_lyrics(sys.argv[1])
