export interface ResumeData {
  name: string | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  education: { degree?: string; institute?: string; year?: string }[];
  experience: { company?: string; role?: string; duration?: string; description?: string }[];
  projects: { name?: string; description?: string; tech?: string[] }[];
  achievements: string[];
  certifications: { name?: string; issuer?: string; year?: string }[];
}

export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
export type WorkLocation = 'remote' | 'hybrid' | 'onsite';
export type JobType = 'internship' | 'full-time' | 'part-time' | 'contract' | 'freelance';
export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
export type BenefitsPriority =
  | 'health'
  | 'retirement'
  | 'bonus'
  | 'stock'
  | 'education'
  | 'remote-work'
  | 'flex-hours';

export interface JobPreferences {
  // Job Preferences
  desiredRoles: string[];
  preferredTechStack: string[];
  experienceLevel: ExperienceLevel;
  workLocation: WorkLocation;
  locations: string[];
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  jobType: JobType;

  // Company Preferences
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  industries: string[];
  industriesToAvoid: string[];

  // Work Preferences
  workSchedule: 'flexible' | 'strict' | 'shift';
  travelWillingness: 'none' | 'occasional' | 'frequent';

  // Benefits Priority
  benefitsPriority: (
    | 'health'
    | 'retirement'
    | 'bonus'
    | 'stock'
    | 'education'
    | 'remote-work'
    | 'flex-hours'
  )[];

  // Metadata
  id?: string;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserProfile {
  id?: string;
  resumeData?: ResumeData;
  jobPreferences?: JobPreferences;
  createdAt?: Date;
  updatedAt?: Date;
}

// Options for form inputs
export const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'mid', label: 'Mid Level (2-5 years)' },
  { value: 'senior', label: 'Senior Level (5-10 years)' },
  { value: 'lead', label: 'Lead Level (10-15 years)' },
  { value: 'executive', label: 'Executive (15+ years)' },
];

export const WORK_LOCATIONS = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
];

export const JOB_TYPES = [
  { value: 'internship', label: 'Internship' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
];

export const COMPANY_SIZES = [
  { value: 'startup', label: 'Startup (1-50 employees)' },
  { value: 'small', label: 'Small (51-200 employees)' },
  { value: 'medium', label: 'Medium (201-1000 employees)' },
  { value: 'large', label: 'Large (1001-5000 employees)' },
  { value: 'enterprise', label: 'Enterprise (5000+ employees)' },
];

export const COMMON_TECH_STACKS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Node.js',
  'Python',
  'Java',
  'C#',
  'Go',
  'Rust',
  'AWS',
  'Azure',
  'Google Cloud',
  'Docker',
  'Kubernetes',
  'PostgreSQL',
  'MongoDB',
  'Redis',
  'GraphQL',
  'REST APIs',
  'Solana',
  'Ethereum',
  'Web3',
  'Blockchain',
  'Machine Learning',
  'AI',
  'Data Science',
  'DevOps',
  'Mobile Development',
  'iOS',
  'Android',
];

export const COMMON_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Mobile Developer',
  'DevOps Engineer',
  'Site Reliability Engineer',
  'Machine Learning Engineer',
  'Data Scientist',
  'Data Engineer',
  'Product Manager',
  'Technical Lead',
  'Engineering Manager',
  'Software Architect',
  'QA Engineer',
  'UI/UX Designer',
  'Blockchain Developer',
  'Security Engineer',
  'Cloud Engineer',
];

export const BENEFITS_OPTIONS = [
  { value: 'health', label: 'Health Insurance' },
  { value: 'retirement', label: 'Retirement Plan/401k' },
  { value: 'bonus', label: 'Performance Bonus' },
  { value: 'stock', label: 'Stock Options/Equity' },
  { value: 'education', label: 'Education Budget' },
  { value: 'remote-work', label: 'Remote Work Stipend' },
  { value: 'flex-hours', label: 'Flexible Hours' },
];
