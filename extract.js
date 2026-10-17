// Turns a PDF/DOCX file into plain text, entirely in the browser.
(function (root) {
  async function pdfToText(lib, data) {
    const pdf = await lib.getDocument({ data }).promise;
    let out = '';
    for (let p = 1; p <= pdf.numPages; p++) {
      const items = (await (await pdf.getPage(p)).getTextContent()).items;
      let line = '', lastY = null, lastEnd = null;
      for (const it of items) {
        const [x, y] = [it.transform[4], it.transform[5]];
        if (lastY !== null && Math.abs(y - lastY) > 3) { out += line.trim() + '\n'; line = ''; lastEnd = null; }
        if (lastEnd !== null && x - lastEnd > 1 && !line.endsWith(' ') && !it.str.startsWith(' ')) line += ' ';
        line += it.str; lastY = y; lastEnd = x + it.width;
      }
      out += line.trim() + '\n';
    }
    return out;
  }

  async function docxToText(mammoth, buffer) {
    const html = (await mammoth.convertToHtml({ arrayBuffer: buffer })).value;   // keeps list items
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return [...doc.body.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6')]
      .map((n) => (n.tagName === 'LI' ? '• ' : '') + n.textContent.trim()).filter(Boolean).join('\n');
  }

  async function extractText(file) {
    const name = file.name.toLowerCase(), buf = await file.arrayBuffer();
    if (name.endsWith('.pdf')) return pdfToText(root.pdfjsLib, buf);
    if (name.endsWith('.docx')) return docxToText(root.mammoth, buf);
    throw new Error('Only PDF or DOCX files are supported.');
  }

  const api = { extractText, pdfToText };
  if (typeof module !== 'undefined') module.exports = api; else root.Extract = api;
})(typeof window !== 'undefined' ? window : globalThis);
