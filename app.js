const $ = (id) => document.getElementById(id);
const el = (t, c, x) => { const n = document.createElement(t); if (c) n.className = c; if (x !== undefined) n.textContent = x; return n; };
if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let file = null;
const KEY = 'ats_history_v1';
const loadH = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
const saveH = (h) => { try { localStorage.setItem(KEY, JSON.stringify(h.slice(0, 30))); } catch (e) {} };

/* tabs */
function tab(t) { $('paneA').hidden = t !== 'A'; $('paneH').hidden = t !== 'H'; $('nA').classList.toggle('on', t === 'A'); $('nH').classList.toggle('on', t === 'H'); }
$('nA').onclick = () => tab('A'); $('nH').onclick = () => { tab('H'); renderHistory(); };

/* file picking */
function pick(f) {
  $('err').textContent = '';
  if (!f) return;
  if (!/\.(pdf|docx)$/i.test(f.name)) return ($('err').textContent = 'Only PDF or DOCX files are supported.');
  if (f.size > 5 * 1024 * 1024) return ($('err').textContent = 'File is larger than 5 MB.');
  file = f; $('dropT').textContent = f.name; $('dropS').textContent = (f.size / 1024).toFixed(0) + ' KB. Click to change.'; $('go').disabled = false;
}
$('drop').onclick = () => $('file').click();
$('drop').onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('file').click(); } };
$('file').onchange = (e) => pick(e.target.files[0]);
['dragover', 'dragenter'].forEach((n) => $('drop').addEventListener(n, (e) => { e.preventDefault(); $('drop').classList.add('over'); }));
['dragleave', 'drop'].forEach((n) => $('drop').addEventListener(n, (e) => { e.preventDefault(); $('drop').classList.remove('over'); }));
$('drop').addEventListener('drop', (e) => pick(e.dataTransfer.files[0]));

/* analyze */
$('go').onclick = async () => {
  $('go').disabled = true; $('go').textContent = 'Analyzing...'; $('err').textContent = '';
  try {
    const text = await Extract.extractText(file);
    if (text.trim().length < 100) throw new Error('No readable text found. Scanned or image-only resumes are not supported.');
    const result = ATS.analyze(text, $('jd').value);
    const h = loadH(); h.unshift({ id: Date.now(), filename: file.name, date: new Date().toISOString(), result }); saveH(h);
    show(result, file.name);
  } catch (x) { $('err').textContent = x.message || 'Could not read this file.'; }
  $('go').textContent = 'Analyze resume'; $('go').disabled = !file;
};

/* results */
const colour = (p) => (p >= 75 ? 'var(--ok)' : p >= 50 ? 'var(--amb)' : 'var(--bad)');
function show(d, name) {
  const C = 2 * Math.PI * 52, off = C * (1 - d.total / 100), col = colour(d.total);
  $('gauge').innerHTML = `<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="#e6ebee" stroke-width="10"/>
    <circle cx="60" cy="60" r="52" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${off}" transform="rotate(-90 60 60)"/>
    <text x="60" y="66" text-anchor="middle" font-size="30" font-weight="700" fill="currentColor">${Number(d.total)}</text></svg>`;
  $('verdict').textContent = d.total >= 80 ? 'Strong' : d.total >= 60 ? 'Good, needs a few fixes' : 'Needs improvement';
  $('fname').textContent = name || '';
  const cats = $('cats'), fixes = $('fixes'); cats.replaceChildren(); fixes.replaceChildren();
  const entries = Object.entries(d.breakdown);
  entries.forEach(([n, v]) => {
    const c = el('div', 'cat'), t = el('div', 't'); t.append(el('span', '', n), el('span', 'mute', `${v.score}/${v.max}`));
    const b = el('div', 'bar'), i = el('i'); i.style.width = (100 * v.score / v.max) + '%'; i.style.background = colour(100 * v.score / v.max);
    b.append(i); c.append(t, b); cats.append(c);
  });
  let n = 0;
  entries.map(([name, v]) => ({ name, lost: v.max - v.score, notes: v.notes })).sort((a, b) => b.lost - a.lost).forEach((c) =>
    c.notes.forEach((note) => { if (n++ >= 8) return; const f = el('div', 'fix', note);
      f.append(el('small', '', c.lost ? `${c.name}: up to +${c.lost} points` : c.name)); fixes.append(f); }));
  if (!n) fixes.append(el('p', 'mute', 'No major issues found. Nice work.'));
  const sk = $('skills'); sk.replaceChildren();
  [['Matched', d.matched, 'chip'], ['Missing from your resume', d.missing, 'chip m']].forEach(([title, list, cls]) => {
    if (!list.length) return; sk.append(el('b', '', title)); const w = el('div', 'chips'); list.forEach((s) => w.append(el('span', cls, s))); sk.append(w);
  });
  $('result').hidden = false; tab('A'); $('result').scrollIntoView({ behavior: 'smooth' });
}

/* history */
function renderHistory() {
  const box = $('hlist'), list = loadH(); box.replaceChildren();
  if (!list.length) return box.append(el('p', 'mute', 'No analyses yet. Upload a resume to get started.'));
  list.forEach((h, i) => {
    const row = el('div', 'hrow'), prev = list[i + 1], d = prev ? h.result.total - prev.result.total : null;
    const open = el('button', 'link', h.filename); open.onclick = () => show(h.result, h.filename);
    const del = el('button', 'link', 'Delete'); del.onclick = () => { saveH(loadH().filter((x) => x.id !== h.id)); renderHistory(); };
    row.append(open, el('span', 'sc', h.result.total + '/100' + (d === null ? '' : ` (${d >= 0 ? '+' : ''}${d})`)),
      el('span', 'dt', new Date(h.date).toLocaleString()), del);
    box.append(row);
  });
}
$('clear').onclick = () => { if (confirm('Delete all saved analyses from this browser?')) { saveH([]); renderHistory(); } };
