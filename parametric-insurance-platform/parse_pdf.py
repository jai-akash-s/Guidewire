from pathlib import Path
path = Path(r'c:\Users\Admin\OneDrive\Desktop\Tech Titans.doc.pdf')
print('exists', path.exists())
try:
    import fitz
    doc = fitz.open(path)
    for i, p in enumerate(doc, 1):
        text = p.get_text()
        print('--- PAGE', i, '---')
        print(text[:2000])
except Exception as e:
    print('fitz error', e)
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(str(path))
        for i, p in enumerate(reader.pages, 1):
            text = p.extract_text() or ''
            print('--- PAGE', i, '---')
            print(text[:2000])
    except Exception as e2:
        print('PyPDF2 error', e2)
