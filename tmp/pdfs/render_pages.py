from pathlib import Path
import sys

import pypdfium2 as pdfium


path = Path(sys.argv[1])
output_dir = Path(sys.argv[2])
page_numbers = [int(value) for value in sys.argv[3:]]
output_dir.mkdir(parents=True, exist_ok=True)
pdf = pdfium.PdfDocument(path)

for page_number in page_numbers:
    page = pdf[page_number - 1]
    image = page.render(scale=1.8).to_pil()
    output_path = output_dir / f"{path.stem}-page-{page_number}.png"
    image.save(output_path)
    print(output_path.resolve())
