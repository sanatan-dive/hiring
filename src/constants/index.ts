// Job role options
export const COMMON_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Software Engineer',
  'DevOps Engineer',
  'Data Scientist',
  'Machine Learning Engineer',
  'Product Manager',
  'UI/UX Designer',
  'Mobile Developer',
  'Cloud Architect',
  'Security Engineer',
  'QA Engineer',
  'Tech Lead',
  'Engineering Manager',
] as const;

// Technology stacks
export const COMMON_TECH_STACKS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Node.js',
  'Python',
  'Java',
  'Go',
  'Rust',
  'AWS',
  'Docker',
  'Kubernetes',
  'PostgreSQL',
  'MongoDB',
  'Redis',
  'GraphQL',
  'REST API',
  'TailwindCSS',
  'Vue.js',
  'Angular',
] as const;

// Experience levels
export const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'mid', label: 'Mid Level (2-5 years)' },
  { value: 'senior', label: 'Senior (5-8 years)' },
  { value: 'lead', label: 'Lead/Staff (8+ years)' },
  { value: 'executive', label: 'Executive/VP' },
] as const;

// Work location preferences
export const WORK_LOCATIONS = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
] as const;

// Job types
export const JOB_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
] as const;

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    features: {
      jobDigest: 'weekly',
      lightScraperPerWeek: 3,
      deepScraperPerMonth: 0,
      maxResumes: 1,
      aiCoverLetter: false,
      aiInterviewPrep: false,
      applicationTracker: 5,
      matchHistoryDays: 7,
    },
  },
  PRO: {
    name: 'Pro',
    price: 800, // in cents, $8 intro, $10 after
    priceAfterIntro: 1000,
    introMonths: 2,
    features: {
      jobDigest: 'daily',
      lightScraperPerWeek: -1, // unlimited
      deepScraperPerMonth: 2,
      maxResumes: 3,
      aiCoverLetter: true,
      aiInterviewPrep: true,
      applicationTracker: -1, // unlimited
      matchHistoryDays: -1, // forever
    },
  },
} as const;

// Social platforms
export const SOCIAL_PLATFORMS = [
  { id: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
  { id: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
  { id: 'leetcode', label: 'LeetCode', placeholder: 'https://leetcode.com/username' },
  { id: 'portfolio', label: 'Portfolio', placeholder: 'https://yourportfolio.com' },
] as const;
