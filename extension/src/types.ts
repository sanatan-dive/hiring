/**
 * Shared types between extension and Hirin API.
 */

export interface HirinProfile {
  fullName: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  skills: string[];
  yearsOfExperience?: number;
  desiredSalary?: string;
  workLocation?: string;
  authorizedToWork?: 'yes' | 'no' | 'sponsor';
  raceEthnicity?: string; // user controls; default empty
  gender?: string;
  veteran?: boolean;
}

export interface DetectedField {
  selector: string;
  fieldType: keyof HirinProfile | 'unknown';
  confidence: number;
}

export interface AutofillResult {
  detected: number;
  filled: number;
  fields: Array<{ name: string; value: string; ok: boolean }>;
}
