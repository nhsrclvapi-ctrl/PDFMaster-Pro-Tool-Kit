# PDFMaster Pro Toolkit — runnable edition

This project preserves the Gemini-generated PDFMaster Pro Toolkit UI and replaces its mock API with real browser-side PDF processing.

## Run on Windows

1. Install Node.js LTS.
2. Open this folder in VS Code.
3. In the terminal run:

```bash
npm install
npm run dev
```

4. Open the local URL printed by Vite (normally `http://localhost:5173`).

## Real tools included

- **Merge PDF** — merges the selected PDFs in the order selected.
- **Split PDF** — accepts page numbers/ranges such as `1-3,5,8-10`; multiple comma-separated groups are returned as a ZIP.
- **Compress PDF** — performs lossless browser-side PDF optimization/rebuild. Size reduction depends on the source PDF; it does not artificially claim a reduction.
- **PDF to Word** — extracts selectable PDF text into a DOCX document. Scanned/image-only PDFs need OCR for text extraction.
- **PDF to Excel** — exports extracted page text into an XLSX workbook. It is not a table-OCR engine.
- **PDF to PowerPoint** — creates one PPTX slide per PDF page using a rendered page image, preserving visual appearance.
- **Edit PDF** — adds text to a selected page while preserving existing content.
- **Resize PDF** — changes page dimensions to A3/A4/A5/Letter/Legal and portrait/landscape.

All processing happens locally in the browser. No upload server is required.

## Important

The original Gemini file had simulated API methods and created empty placeholder Files during processing. Those mocks have been removed; the selected File objects are now passed into the real processing functions in `src/pdfTools.ts`.
