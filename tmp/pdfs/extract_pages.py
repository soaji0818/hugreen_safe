from pathlib import Path
import sys

from pypdf import PdfReader


path = Path(sys.argv[1])
page_numbers = [int(value) for value in sys.argv[2:]]
reader = PdfReader(path)

for page_number in page_numbers:
    print(f"\n===== PAGE {page_number} =====")
    print(reader.pages[page_number - 1].extract_text() or "")
