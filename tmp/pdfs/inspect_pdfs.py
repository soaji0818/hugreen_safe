from pathlib import Path
import sys

from pypdf import PdfReader


KEYWORDS = (
    "EquipmentM",
    "EQUIPMENTM",
    "설비",
    "AI CCTV",
    "카메라",
    "CCTV 기준정보",
)


for input_path in sys.argv[1:]:
    path = Path(input_path)
    reader = PdfReader(path)
    print(f"FILE={path}")
    print(f"PAGES={len(reader.pages)}")
    for page_number, page in enumerate(reader.pages, 1):
        text = page.extract_text() or ""
        hits = [keyword for keyword in KEYWORDS if keyword.casefold() in text.casefold()]
        if hits:
            print(f"PAGE {page_number}: {','.join(hits)}")
