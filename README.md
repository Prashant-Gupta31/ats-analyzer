# ATS Resume Analyzer

Check how well your resume works with Applicant Tracking Systems. Upload a PDF or DOCX, optionally paste a job description, and get a score out of 100 with clear, prioritized fixes.

## Features
- Upload a **PDF or DOCX** resume (drag and drop or click)
- **ATS-readiness score (0-100)** with a per-category breakdown
- **Top fixes**, ordered by how many points each category is losing
- **Job description match**: paste a JD to see matched and missing skills
- **History** of past analyses with the score change since your last upload
- **Private by design**: parsing and scoring happen in your browser, and your resume is never uploaded

## How the score works
The score is rule-based and explainable, so the same resume always gets the same score and every lost point has a reason.

| Category | Points | What is checked |
|---|---|---|
| Formatting | 20 | Resume length (250-800 words), bullet points, dates |
| Sections | 20 | Education, Skills, Projects, Experience headings |
| Contact | 10 | Email, phone number, LinkedIn or GitHub link |
| Content | 20 | Action verbs, quantified results, weak phrases like "responsible for" |
| Keywords | 30 | Skills found in the resume, or matched against the pasted job description |

Skill matching understands common variants (for example `nodejs` = `node.js`, `k8s` = `kubernetes`).

## Tech stack
- **HTML, CSS, JavaScript** (no framework, no backend, no database)
- [pdf.js](https://mozilla.github.io/pdf.js/) for reading PDFs
- [mammoth.js](https://github.com/mwilliamson/mammoth.js) for reading DOCX
- `localStorage` for history (scores and skills only, never resume text)

## Project structure
```
index.html    page layout
style.css     styling
app.js        UI, results, history
scorer.js     scoring rules (pure functions)
extract.js    PDF/DOCX to text
```

## Run locally
1. Download or clone the repo
2. Open `index.html` in your browser (internet is needed once to load pdf.js and mammoth from a CDN)

## Deploy
Drag the project folder onto [app.netlify.com/drop](https://app.netlify.com/drop), or connect the GitHub repo to Netlify with an empty build command.

## Limitations
- This is an **ATS-readiness estimate**. Real systems such as Workday, Greenhouse and Lever each parse resumes differently, so no tool can give an exact ATS score.
- Scanned or image-only PDFs have no readable text and are not supported.
- The skills list covers common software skills and is easy to extend in `scorer.js`.
- Scoring is rule-based, with no machine learning.

## Roadmap
- More skills and synonyms
- Section-by-section bullet suggestions
- Downloadable PDF report
- Optional AI-powered bullet rewriting

## Author
Built by Prashant Gupta.
