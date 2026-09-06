const STORAGE_KEY = 'resumematch_whop_key';

const licenseInput = document.getElementById('license-input');
const verifyBtn = document.getElementById('verify-btn');
const licenseStatus = document.getElementById('license-status');
const optimizerForm = document.getElementById('optimizer-form');
const loadSampleBtn = document.getElementById('load-sample-btn');
const loader = document.getElementById('loader');
const errorBox = document.getElementById('error-box');
const resultsPanel = document.getElementById('results-panel');

const targetRoleInput = document.getElementById('target-role');
const resumeTextInput = document.getElementById('resume-text');
const jobDescriptionInput = document.getElementById('job-description');

const scoreVal = document.getElementById('score-val');
const assessmentText = document.getElementById('assessment-text');
const matchedKeywords = document.getElementById('matched-keywords');
const missingKeywords = document.getElementById('missing-keywords');
const bulletsList = document.getElementById('bullets-list');
const coverLetterText = document.getElementById('cover-letter-text');
const copyCoverBtn = document.getElementById('copy-cover-btn');

function initAuth() {
  const savedKey = localStorage.getItem(STORAGE_KEY);
  if (savedKey) {
    licenseInput.value = savedKey;
    verifyKey(savedKey);
  }
}

async function verifyKey(key) {
  if (!key.trim()) return;
  licenseStatus.textContent = 'Checking...';
  licenseStatus.className = 'status-pill unverified';

  try {
    const res = await fetch('/api/verify-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey: key.trim() }),
    });
    const data = await res.json();

    if (res.ok && data.valid) {
      licenseStatus.textContent = 'Active';
      licenseStatus.className = 'status-pill verified';
      localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      licenseStatus.textContent = 'Invalid';
      licenseStatus.className = 'status-pill unverified';
    }
  } catch (err) {
    licenseStatus.textContent = 'Error';
    licenseStatus.className = 'status-pill unverified';
  }
}

verifyBtn.addEventListener('click', () => {
  verifyKey(licenseInput.value);
});

loadSampleBtn.addEventListener('click', () => {
  targetRoleInput.value = 'Backend Engineering Intern';
  resumeTextInput.value = `John Doe
johndoe@email.com | github.com/johndoe

EDUCATION
Bachelor of Science in Computer Science, Expected May 2027

PROJECTS
Task Manager App
- Built a web application using Node.js and MongoDB.
- Created API endpoints for user accounts and tasks.
- Used React for the user interface.

Data Scraper
- Wrote Python scripts to get product prices from e-commerce websites.
- Saved extracted information into a SQL database.

SKILLS
JavaScript, Python, Node.js, Express, MongoDB, Git, HTML, CSS`;

  jobDescriptionInput.value = `Backend Engineering Intern - Summer 2027

Requirements:
- Strong foundations in Node.js, Express, and relational databases (PostgreSQL preferred).
- Hands-on experience designing RESTful APIs and writing unit tests with Jest or Mocha.
- Familiarity with Redis caching and Docker containerization.
- Demonstrated ability to analyze database query performance and optimize slow operations.
- Strong written and verbal communication skills.`;
});

optimizerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.classList.add('hidden');
  errorBox.textContent = '';

  const licenseKey = licenseInput.value.trim();
  if (!licenseKey) {
    errorBox.textContent = 'Enter and verify your Whop license key before running optimization.';
    errorBox.classList.remove('hidden');
    return;
  }

  resultsPanel.classList.add('hidden');
  loader.classList.remove('hidden');

  try {
    const res = await fetch('/api/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        licenseKey,
        targetRole: targetRoleInput.value.trim(),
        resumeText: resumeTextInput.value.trim(),
        jobDescription: jobDescriptionInput.value.trim(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Server error occurred while analyzing data.');
    }

    renderResults(data);
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove('hidden');
  } finally {
    loader.classList.add('hidden');
  }
});

function renderResults(data) {
  scoreVal.textContent = data.score;
  assessmentText.textContent = data.assessment;

  matchedKeywords.innerHTML = '';
  data.matchedKeywords.forEach((kw) => {
    const span = document.createElement('span');
    span.className = 'pill';
    span.textContent = kw;
    matchedKeywords.appendChild(span);
  });

  missingKeywords.innerHTML = '';
  data.missingKeywords.forEach((kw) => {
    const span = document.createElement('span');
    span.className = 'pill';
    span.textContent = kw;
    missingKeywords.appendChild(span);
  });

  bulletsList.innerHTML = '';
  data.bulletImprovements.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'bullet-card';
    card.innerHTML = `
      <span class="bullet-label">Original</span>
      <p class="bullet-original">${escapeHtml(item.original)}</p>
      <span class="bullet-label">Rewritten (XYZ Format)</span>
      <p class="bullet-improved">${escapeHtml(item.improved)}</p>
      <p class="bullet-reason">${escapeHtml(item.reason)}</p>
      <div>
        <button class="btn small copy-bullet-btn">Copy Bullet</button>
      </div>
    `;

    const copyBtn = card.querySelector('.copy-bullet-btn');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(item.improved);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy Bullet'; }, 2000);
    });

    bulletsList.appendChild(card);
  });

  coverLetterText.textContent = data.coverLetter;
  resultsPanel.classList.remove('hidden');
}

copyCoverBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(coverLetterText.textContent);
  copyCoverBtn.textContent = 'Copied!';
  setTimeout(() => { copyCoverBtn.textContent = 'Copy Letter'; }, 2000);
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

initAuth();