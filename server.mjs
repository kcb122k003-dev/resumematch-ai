import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json({ limit: '500kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const optimizationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this address. Please wait 15 minutes.' },
});

async function verifyWhopLicense(licenseKey) {
  if (!licenseKey || typeof licenseKey !== 'string') {
    return { valid: false, message: 'License key is missing.' };
  }

  const whopApiKey = process.env.WHOP_API_KEY;
  if (!whopApiKey) {
    console.warn('WHOP_API_KEY not configured. Running in local test mode.');
    return { valid: true };
  }

  try {
    const response = await fetch(
      `https://api.whop.com/api/v2/memberships/${encodeURIComponent(licenseKey.trim())}/validate_license`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${whopApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { valid: true, data };
    }

    return { valid: false, message: 'Invalid or expired Whop license key.' };
  } catch (error) {
    console.error('Whop validation error:', error);
    return { valid: false, message: 'Unable to reach Whop authentication servers.' };
  }
}

app.post('/api/verify-license', async (req, res) => {
  const { licenseKey } = req.body;
  const result = await verifyWhopLicense(licenseKey);
  if (!result.valid) {
    return res.status(401).json({ valid: false, message: result.message });
  }
  return res.json({ valid: true, message: 'License confirmed.' });
});

app.post('/api/optimize', optimizationLimiter, async (req, res) => {
  const { licenseKey, resumeText, jobDescription, targetRole } = req.body;

  if (!resumeText || resumeText.trim().length < 50) {
    return res.status(400).json({ error: 'Resume must contain at least 50 characters.' });
  }
  if (!jobDescription || jobDescription.trim().length < 50) {
    return res.status(400).json({ error: 'Job description must contain at least 50 characters.' });
  }

  const auth = await verifyWhopLicense(licenseKey);
  if (!auth.valid) {
    return res.status(403).json({ error: auth.message || 'Valid Whop license required.' });
  }

  const role = targetRole && targetRole.trim().length > 0 ? targetRole.trim() : 'the target position';

  const systemPrompt = `You are a direct, rigorous technical recruiter and applicant tracking system (ATS) auditor.
Analyze the candidate resume against the job description for ${role}.
Output valid JSON adhering strictly to this schema:
{
  "score": <integer from 0 to 100 reflecting keyword overlap and qualification alignment>,
  "assessment": "<2 to 3 sentences delivering an honest verdict on candidacy and main gaps>",
  "matchedKeywords": ["<matched skill 1>", "<matched skill 2>"],
  "missingKeywords": ["<missing skill 1>", "<missing skill 2>"],
  "bulletImprovements": [
    {
      "original": "<original bullet point from the resume>",
      "improved": "<rewritten bullet point following Google XYZ formula: Accomplished X by doing Y as measured by Z>",
      "reason": "<precise explanation of the metric or skill integrated>"
    }
  ],
  "coverLetter": "<A tight 3-paragraph cover letter tailored to this role without generic clichés.>"
}`;

  const userPrompt = `Target Role: ${role}

--- JOB DESCRIPTION ---
${jobDescription.slice(0, 6000)}

--- RESUME TEXT ---
${resumeText.slice(0, 6000)}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    return res.json(parsed);
  } catch (error) {
    console.error('OpenAI processing error:', error);
    return res.status(500).json({ error: 'Failed to process resume analysis.' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});