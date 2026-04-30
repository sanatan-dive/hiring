/**
 * ATS-style resume-vs-JD scoring.
 *
 * Most ATS systems are dumb keyword matchers. We score by:
 *   - keyword overlap (extracted from JD's noun-like terms)
 *   - exact-phrase coverage of common technical phrases
 *   - section presence (does the resume have experience, skills?)
 *   - gotchas (resume too long/short, lots of acronyms not expanded)
 *
 * The score is 0-100. NOT a real ATS — but a useful proxy that surfaces
 * the same gaps a recruiter scan would.
 */

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'can', 'shall', 'this', 'that',
  'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what',
  'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
  'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'with', 'in',
  'on', 'at', 'to', 'from', 'for', 'of', 'as', 'by', 'about', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'under', 'over',
  'role', 'team', 'work', 'working', 'job', 'company', 'including', 'using',
  'use', 'used', 'experience', 'experienced', 'years', 'year', 'plus',
  'required', 'preferred', 'must', 'strong', 'excellent', 'good', 'great',
  'ability', 'abilities', 'skills', 'skill', 'knowledge', 'understanding',
]);

const TECHNICAL_PHRASES = [
  'react', 'next.js', 'nextjs', 'typescript', 'javascript', 'node.js', 'nodejs',
  'python', 'java', 'go', 'golang', 'rust', 'ruby', 'rails', 'django', 'flask',
  'fastapi', 'graphql', 'rest', 'restful', 'api', 'microservices', 'kubernetes',
  'docker', 'aws', 'gcp', 'azure', 'terraform', 'ci/cd', 'devops', 'sre',
  'postgres', 'postgresql', 'mysql', 'mongodb', 'redis', 'kafka', 'rabbitmq',
  'elasticsearch', 'pgvector', 'tensorflow', 'pytorch', 'scikit-learn',
  'machine learning', 'deep learning', 'nlp', 'llm', 'transformer',
  'tailwind', 'css', 'html', 'figma', 'design system',
  'agile', 'scrum', 'tdd', 'bdd', 'pair programming',
  'aws lambda', 'serverless', 'edge functions',
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s.+#/-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

function extractKeywords(text: string, max = 30): string[] {
  const counts = new Map<string, number>();
  for (const t of tokenize(text)) {
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, max)
    .map(([t]) => t);
}

function findPhrases(text: string, phrases: string[]): string[] {
  const lower = text.toLowerCase();
  return phrases.filter((p) => lower.includes(p));
}

export interface AtsScoreResult {
  score: number;          // 0-100
  band: 'excellent' | 'good' | 'fair' | 'weak';
  matchedKeywords: string[];
  missingKeywords: string[];
  matchedPhrases: string[];
  missingPhrases: string[];
  warnings: string[];
  suggestions: string[];
}

export function computeAtsScore(args: {
  resumeText: string;
  jobDescription: string;
}): AtsScoreResult {
  const { resumeText, jobDescription } = args;
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Resume length checks
  const wordCount = resumeText.trim().split(/\s+/).length;
  if (wordCount < 200) warnings.push(`Resume is only ${wordCount} words — most are 400-800.`);
  if (wordCount > 1500) warnings.push(`Resume is ${wordCount} words — consider trimming to 1 page.`);

  // Section presence
  const lowerResume = resumeText.toLowerCase();
  const hasExperience = /experience|employ|work history|professional/i.test(lowerResume);
  const hasSkills = /skills|technologies|stack|tools/i.test(lowerResume);
  const hasEducation = /education|university|college|degree|b\.?s\.?|m\.?s\.?/i.test(lowerResume);

  if (!hasExperience) warnings.push('No "Experience" section detected.');
  if (!hasSkills) warnings.push('No "Skills" or "Technologies" section detected.');
  if (!hasEducation) suggestions.push('Adding an "Education" section can pass simpler ATS filters.');

  // Keyword overlap
  const jdKeywords = extractKeywords(jobDescription, 25);
  const resumeKeywords = new Set(tokenize(resumeText));
  const matchedKeywords = jdKeywords.filter((k) => resumeKeywords.has(k));
  const missingKeywords = jdKeywords.filter((k) => !resumeKeywords.has(k));
  const keywordCoverage = jdKeywords.length === 0 ? 0 : matchedKeywords.length / jdKeywords.length;

  // Technical phrases
  const jdPhrases = findPhrases(jobDescription, TECHNICAL_PHRASES);
  const resumePhrases = findPhrases(resumeText, TECHNICAL_PHRASES);
  const matchedPhrases = jdPhrases.filter((p) => resumePhrases.includes(p));
  const missingPhrases = jdPhrases.filter((p) => !resumePhrases.includes(p));
  const phraseCoverage = jdPhrases.length === 0 ? 1 : matchedPhrases.length / jdPhrases.length;

  // Suggestions for top missing items
  if (missingPhrases.length > 0) {
    suggestions.push(
      `Consider adding (if true): ${missingPhrases.slice(0, 5).join(', ')}.`
    );
  }
  if (missingKeywords.length > 5) {
    suggestions.push(
      `JD emphasizes ${missingKeywords.slice(0, 5).join(', ')} — your resume doesn't mention them.`
    );
  }

  // Compose final score
  const sectionScore = (Number(hasExperience) + Number(hasSkills) + Number(hasEducation)) / 3;
  const lengthScore = wordCount >= 200 && wordCount <= 1500 ? 1 : 0.7;

  // Weighted: keywords 40%, phrases 30%, sections 20%, length 10%
  const score = Math.round(
    (keywordCoverage * 0.4 + phraseCoverage * 0.3 + sectionScore * 0.2 + lengthScore * 0.1) * 100
  );

  const band: AtsScoreResult['band'] =
    score >= 80 ? 'excellent' : score >= 65 ? 'good' : score >= 50 ? 'fair' : 'weak';

  return {
    score,
    band,
    matchedKeywords,
    missingKeywords: missingKeywords.slice(0, 10),
    matchedPhrases,
    missingPhrases,
    warnings,
    suggestions,
  };
}
