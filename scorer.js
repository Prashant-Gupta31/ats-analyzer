// Rule-based, explainable ATS-readiness scoring. Pure functions, no network.
(function (root) {
  const SKILLS = {
    "java": ["java"], "python": ["python"], "javascript": ["javascript", "js", "es6"], "typescript": ["typescript"],
    "c++": ["c++", "cpp"], "react": ["react", "reactjs", "react.js"], "node.js": ["node.js", "nodejs", "node"],
    "express": ["express", "expressjs", "express.js"], "mongodb": ["mongodb", "mongo"], "sql": ["sql"], "mysql": ["mysql"],
    "postgresql": ["postgresql", "postgres"], "html": ["html", "html5"], "css": ["css", "css3"],
    "tailwind": ["tailwind", "tailwindcss"], "git": ["git"], "github": ["github"], "docker": ["docker"],
    "kubernetes": ["kubernetes", "k8s"], "aws": ["aws", "amazon web services"], "rest api": ["rest api", "rest apis", "restful"],
    "spring boot": ["spring boot", "springboot"], "redis": ["redis"], "machine learning": ["machine learning"],
    "deep learning": ["deep learning"], "nlp": ["nlp", "natural language processing"], "pandas": ["pandas"],
    "numpy": ["numpy"], "scikit-learn": ["scikit-learn", "sklearn"], "tensorflow": ["tensorflow"], "pytorch": ["pytorch"],
    "data structures": ["data structures", "dsa", "algorithms"], "oop": ["oop", "object oriented", "object-oriented"],
    "dbms": ["dbms"], "operating systems": ["operating systems"], "linux": ["linux"],
    "ci/cd": ["ci/cd", "cicd", "github actions", "jenkins"], "jwt": ["jwt"],
    "websocket": ["websocket", "websockets", "socket.io"], "graphql": ["graphql"], "system design": ["system design"],
    "flask": ["flask"], "django": ["django"], "fastapi": ["fastapi"]
  };
  const VERBS = new Set(('built developed designed implemented created led optimized reduced improved automated deployed ' +
    'integrated engineered launched analyzed architected migrated managed delivered achieved increased streamlined ' +
    'refactored tested trained collaborated maintained').split(' '));
  const BULLET = /^[•▪●◦·\uF0B7*\-–]\s*/;

  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
  const has = (text, term) => new RegExp(`(?<![a-z0-9+#.])${esc(term)}(?![a-z0-9+#])`, 'i').test(text);
  const findSkills = (text) => Object.keys(SKILLS).filter((k) => [k, ...SKILLS[k]].some((s) => has(text, s)));

  function analyze(raw, jd = '') {
    const t = raw.toLowerCase();
    const words = raw.split(/\s+/).filter(Boolean).length;
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    const bullets = lines.map((l) => l.replace(BULLET, '')).filter((l) => l.length > 30);
    const breakdown = {};
    const put = (key, max, score, notes) => (breakdown[key] = { score: Math.round(score), max, notes });

    // Formatting (20)
    let f = 0; const fn = [];
    if (words >= 250 && words <= 800) f += 8; else { f += 4; fn.push(`Resume has ${words} words. Aim for 250-800 (one page for freshers).`); }
    if (lines.filter((l) => BULLET.test(l)).length >= 5) f += 6; else fn.push('Use bullet points (5 or more) for projects and experience.');
    if (/(19|20)\d{2}/.test(raw)) f += 6; else fn.push('Add dates (for example 2024 - 2028) to education and experience.');
    put('Formatting', 20, f, fn);

    // Sections (20)
    const SECTIONS = { education: /\beducation\b/, skills: /\bskills\b/, projects: /\bprojects?\b/, experience: /\b(experience|internship|work history)\b/ };
    let s = 0; const sn = [];
    for (const k in SECTIONS) SECTIONS[k].test(t) ? (s += 5) : sn.push(`Add a "${k}" section heading.`);
    put('Sections', 20, s, sn);

    // Contact (10)
    let c = 0; const cn = [];
    if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(raw)) c += 4; else cn.push('Add a professional email address.');
    if (/\+?\d[\d\s-]{9,13}\d/.test(raw)) c += 3; else cn.push('Add a phone number.');
    if (/linkedin\.com|github\.com/.test(t)) c += 3; else cn.push('Add your LinkedIn or GitHub link.');
    put('Contact', 10, c, cn);

    // Content (20)
    const n = bullets.length || 1;
    const verbRate = bullets.filter((b) => VERBS.has(b.split(' ')[0].toLowerCase())).length / n;
    const numRate = bullets.filter((b) => /\d|%/.test(b)).length / n;
    const weak = (t.match(/responsible for|worked on|helped with|duties included/g) || []).length;
    const cnotes = [];
    if (verbRate < 0.6) cnotes.push('Start more bullets with strong action verbs (Built, Reduced, Implemented).');
    if (numRate < 0.4) cnotes.push('Quantify results in bullets (for example "cut load time by 30%").');
    if (weak) cnotes.push(`Replace weak phrases like "responsible for" (found ${weak}).`);
    put('Content', 20, Math.min(1, verbRate / 0.6) * 8 + Math.min(1, numRate / 0.4) * 8 + (4 - Math.min(4, weak)), cnotes);

    // Keywords (30)
    const found = findSkills(t);
    let matched, missing = [], k; const kn = [];
    if (jd.trim()) {
      const need = findSkills(jd.toLowerCase());
      matched = need.filter((x) => found.includes(x));
      missing = need.filter((x) => !found.includes(x));
      k = need.length ? (30 * matched.length) / need.length : 15;
      if (missing.length) kn.push(`Missing JD skills: ${missing.join(', ')}. Add only the ones you genuinely have.`);
    } else {
      matched = found;
      k = Math.min(1, found.length / 12) * 30;
      kn.push('Paste a job description to get a tailored keyword match.');
    }
    put('Keywords', 30, k, kn);

    const total = Object.values(breakdown).reduce((a, b) => a + b.score, 0);
    return { total, breakdown, matched, missing, words };
  }

  const api = { analyze };
  if (typeof module !== 'undefined') module.exports = api; else root.ATS = api;
})(typeof window !== 'undefined' ? window : globalThis);
