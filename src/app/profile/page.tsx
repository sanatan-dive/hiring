'use client';
import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Users,
  Save,
  Edit2,
  FileText,
  Award,
  Loader2,
  Github,
  Linkedin,
  Globe,
  Plus,
  Trash2,
  FolderGit2,
  ExternalLink,
  Code2,
  Bookmark,
  Clock,
} from 'lucide-react';
import PreferenceCard from '@/components/preferences/PreferenceCard';
import MultiSelect from '@/components/preferences/MultiSelect';
import SalaryRangeSlider from '@/components/preferences/SalaryRangeSlider';
import RadioGroup from '@/components/preferences/RadioGroup';
import { UserButton, useUser } from '@clerk/nextjs';
import {
  EXPERIENCE_LEVELS,
  WORK_LOCATIONS,
  JOB_TYPES,
  COMMON_TECH_STACKS,
  COMMON_ROLES,
} from '@/types';

interface Experience {
  id?: string;
  company: string;
  role: string;
  duration: string;
  description: string;
}

interface Project {
  id?: string;
  name: string;
  description: string;
  url: string;
  techUsed: string[];
}

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  skills: string[];
  resume: {
    id: string;
    fileName: string;
    parsedSkills: string[];
    experiences: Experience[];
  } | null;
  preferences: {
    desiredRoles: string[];
    experienceLevel: string | null;
    workLocation: string | null;
    locations: string[];
    salaryRange: { min: number; max: number; currency: string };
    jobType: string | null;
  } | null;
  socialLinks: { platform: string; url: string }[];
  projects: Project[];
}

const SOCIAL_PLATFORMS = [
  { id: 'github', label: 'GitHub', icon: Github, placeholder: 'https://github.com/username' },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: Linkedin,
    placeholder: 'https://linkedin.com/in/username',
  },
  { id: 'leetcode', label: 'LeetCode', icon: Code2, placeholder: 'https://leetcode.com/username' },
  { id: 'portfolio', label: 'Portfolio', icon: Globe, placeholder: 'https://yourportfolio.com' },
];

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-gray-200 ${className}`} />
);

const ProfilePage = () => {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit states
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [editExperiences, setEditExperiences] = useState<Experience[]>([]);
  const [editPreferences, setEditPreferences] = useState({
    desiredRoles: [] as string[],
    experienceLevel: 'mid' as string,
    workLocation: 'remote' as string,
    salaryRange: { min: 70000, max: 120000, currency: 'USD' },
    jobType: 'full-time' as string,
  });
  const [editSocialLinks, setEditSocialLinks] = useState<{ platform: string; url: string }[]>([]);
  const [editProjects, setEditProjects] = useState<Project[]>([]);

  // New State for Saved Jobs
  const [savedJobs, setSavedJobs] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Fetch profile from database
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [userRes, bookmarksRes] = await Promise.all([
          fetch('/api/user'),
          fetch('/api/bookmarks'),
        ]);

        if (userRes.ok) {
          const data = await userRes.json();
          if (data.user) {
            setProfile(data.user);
            setEditSkills(data.user.skills || []);
            setEditExperiences(
              data.user.resume?.experiences?.map((e: Experience) => ({
                company: e.company || '',
                role: e.role || '',
                duration: e.duration || '',
                description: e.description || '',
              })) || []
            );
            setEditSocialLinks(data.user.socialLinks || []);
            setEditProjects(
              data.user.projects?.map((p: Project) => ({
                name: p.name,
                description: p.description || '',
                url: p.url || '',
                techUsed: p.techUsed || [],
              })) || []
            );
            if (data.user.preferences) {
              setEditPreferences({
                desiredRoles: data.user.preferences.desiredRoles || [],
                experienceLevel: data.user.preferences.experienceLevel || 'mid',
                workLocation: data.user.preferences.workLocation || 'remote',
                salaryRange: data.user.preferences.salaryRange || {
                  min: 70000,
                  max: 120000,
                  currency: 'USD',
                },
                jobType: data.user.preferences.jobType || 'full-time',
              });
            }
          }
        }

        if (bookmarksRes.ok) {
          const data = await bookmarksRes.json();
          setSavedJobs(data.bookmarks || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (clerkLoaded) {
      fetchProfile();
    }
  }, [clerkLoaded]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save skills
      await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: editSkills }),
      });

      // Save experiences
      await fetch('/api/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experiences: editExperiences.filter((e) => e.role || e.company) }),
      });

      // Save preferences
      await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPreferences),
      });

      // Save social links
      await fetch('/api/social-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socialLinks: editSocialLinks.filter((l) => l.url) }),
      });

      // Save projects
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: editProjects.filter((p) => p.name) }),
      });

      // Refresh profile
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        if (data.user) setProfile(data.user);
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Experience functions
  const addExperience = () => {
    setEditExperiences([
      ...editExperiences,
      { company: '', role: '', duration: '', description: '' },
    ]);
  };

  const removeExperience = (index: number) => {
    setEditExperiences(editExperiences.filter((_, i) => i !== index));
  };

  const updateExperience = (index: number, field: keyof Experience, value: string) => {
    const updated = [...editExperiences];
    updated[index] = { ...updated[index], [field]: value };
    setEditExperiences(updated);
  };

  // Project functions
  const addProject = () => {
    setEditProjects([...editProjects, { name: '', description: '', url: '', techUsed: [] }]);
  };

  const removeProject = (index: number) => {
    setEditProjects(editProjects.filter((_, i) => i !== index));
  };

  const updateProject = (index: number, field: string, value: string | string[]) => {
    const updated = [...editProjects];
    updated[index] = { ...updated[index], [field]: value };
    setEditProjects(updated);
  };

  const updateSocialLink = (platform: string, url: string) => {
    const existing = editSocialLinks.find((l) => l.platform === platform);
    if (existing) {
      setEditSocialLinks(editSocialLinks.map((l) => (l.platform === platform ? { ...l, url } : l)));
    } else {
      setEditSocialLinks([...editSocialLinks, { platform, url }]);
    }
  };

  // Loading skeleton
  if (!clerkLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 rounded-2xl border bg-white p-8">
            <div className="flex items-center gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border bg-white p-6">
                <Skeleton className="mb-4 h-6 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        {/* Profile Header */}
        <div className="mb-8 rounded-2xl border bg-white p-8 shadow-sm">
          <div className="flex items-center gap-6">
            <UserButton appearance={{ elements: { avatarBox: 'w-24 h-24' } }} />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {clerkUser?.fullName || profile?.name || 'Your Profile'}
              </h1>
              <p className="mt-1 text-gray-500">
                {clerkUser?.primaryEmailAddress?.emailAddress || profile?.email}
              </p>
            </div>
            <button
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              disabled={isSaving}
              className={`flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition-all disabled:opacity-50 ${
                isEditing
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                <>
                  <Save className="h-5 w-5" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit2 className="h-5 w-5" />
                  Edit Profile
                </>
              )}
            </button>
          </div>
        </div>

        {/* Social Links */}
        <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-black">
            <Globe className="h-5 w-5 text-blue-600" />
            Social Links
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {SOCIAL_PLATFORMS.map((platform) => {
              const link = (isEditing ? editSocialLinks : profile?.socialLinks || []).find(
                (l) => l.platform === platform.id
              );
              const Icon = platform.icon;
              return (
                <div
                  key={platform.id}
                  className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"
                >
                  <Icon className="h-5 w-5 text-gray-600" />
                  {isEditing ? (
                    <input
                      type="url"
                      value={link?.url || ''}
                      onChange={(e) => updateSocialLink(platform.id, e.target.value)}
                      placeholder={platform.placeholder}
                      className="flex-1 rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  ) : link?.url ? (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      {platform.label} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">Not set</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Skills */}
        <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
          <PreferenceCard
            title="Skills & Tech Stack"
            icon={<Award className="h-5 w-5 text-blue-600" />}
          >
            {isEditing ? (
              <MultiSelect
                options={COMMON_TECH_STACKS}
                selected={editSkills}
                onChange={setEditSkills}
                placeholder="Add skills..."
                maxItems={20}
                allowCustom={true}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {(profile?.skills || []).map((skill, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-800"
                  >
                    {skill}
                  </span>
                ))}
                {!profile?.skills?.length && (
                  <span className="text-sm text-gray-400">No skills added</span>
                )}
              </div>
            )}
          </PreferenceCard>
        </div>

        {/* Experience */}
        <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-black">
              <FileText className="h-5 w-5 text-blue-600" />
              Experience
            </h2>
            {isEditing && (
              <button
                onClick={addExperience}
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" /> Add Experience
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              {editExperiences.map((exp, idx) => (
                <div key={idx} className="rounded-xl border bg-gray-50 p-4">
                  <div className="mb-3 flex justify-between">
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) => updateExperience(idx, 'role', e.target.value)}
                      placeholder="Job title"
                      className="mr-2 flex-1 rounded-lg border bg-white px-3 py-2 font-semibold text-gray-900 placeholder:text-gray-500"
                    />
                    <button
                      onClick={() => removeExperience(idx)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                    placeholder="Company name"
                    className="mb-2 w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500"
                  />
                  <input
                    type="text"
                    value={exp.duration}
                    onChange={(e) => updateExperience(idx, 'duration', e.target.value)}
                    placeholder="Duration (e.g., Jan 2022 - Present)"
                    className="mb-2 w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500"
                  />
                  <textarea
                    value={exp.description}
                    onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                    placeholder="Brief description of your role"
                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500"
                    rows={2}
                  />
                </div>
              ))}
              {editExperiences.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-400">
                  No experience yet. Click &quot;Add Experience&quot; to get started.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {(profile?.resume?.experiences || []).map((exp, idx) => (
                <div key={idx} className="rounded-xl border-l-4 border-blue-500 bg-gray-50 p-4">
                  <p className="font-semibold text-gray-900">{exp.role}</p>
                  <p className="text-sm text-blue-600">{exp.company}</p>
                  {exp.duration && <p className="text-xs text-gray-500">{exp.duration}</p>}
                  {exp.description && (
                    <p className="mt-2 text-sm text-gray-600">{exp.description}</p>
                  )}
                </div>
              ))}
              {!profile?.resume?.experiences?.length && (
                <p className="text-sm text-gray-400">No experience added</p>
              )}
            </div>
          )}
        </div>

        {/* Projects */}
        <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-black">
              <FolderGit2 className="h-5 w-5 text-blue-600" />
              Projects
            </h2>
            {isEditing && (
              <button
                onClick={addProject}
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" /> Add Project
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              {editProjects.map((project, idx) => (
                <div key={idx} className="rounded-xl border bg-gray-50 p-4">
                  <div className="mb-3 flex justify-between">
                    <input
                      type="text"
                      value={project.name}
                      onChange={(e) => updateProject(idx, 'name', e.target.value)}
                      placeholder="Project name"
                      className="mr-2 flex-1 rounded-lg border bg-white px-3 py-2 font-semibold text-gray-900 placeholder:text-gray-500"
                    />
                    <button
                      onClick={() => removeProject(idx)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    value={project.description}
                    onChange={(e) => updateProject(idx, 'description', e.target.value)}
                    placeholder="Brief description"
                    className="mb-2 w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500"
                    rows={2}
                  />
                  <input
                    type="url"
                    value={project.url}
                    onChange={(e) => updateProject(idx, 'url', e.target.value)}
                    placeholder="Project URL (GitHub, live demo, etc.)"
                    className="mb-2 w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500"
                  />
                  <MultiSelect
                    options={COMMON_TECH_STACKS}
                    selected={project.techUsed}
                    onChange={(values) => updateProject(idx, 'techUsed', values)}
                    placeholder="Technologies used..."
                    maxItems={10}
                    allowCustom={true}
                  />
                </div>
              ))}
              {editProjects.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-400">
                  No projects yet. Click &quot;Add Project&quot; to get started.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {(profile?.projects || []).map((project, idx) => (
                <div key={idx} className="rounded-xl border-l-4 border-blue-500 bg-gray-50 p-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    {project.url && (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  {project.description && (
                    <p className="mt-1 text-sm text-gray-600">{project.description}</p>
                  )}
                  {project.techUsed?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {project.techUsed.map((tech, i) => (
                        <span
                          key={i}
                          className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {!profile?.projects?.length && (
                <p className="text-sm text-gray-400">No projects added</p>
              )}
            </div>
          )}
        </div>

        {/* Job Preferences */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Job Preferences</h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <PreferenceCard
              title="Desired Roles"
              icon={<Briefcase className="h-5 w-5 text-blue-600" />}
            >
              {isEditing ? (
                <MultiSelect
                  options={COMMON_ROLES}
                  selected={editPreferences.desiredRoles}
                  onChange={(values) => setEditPreferences((p) => ({ ...p, desiredRoles: values }))}
                  placeholder="Search roles..."
                  maxItems={5}
                  allowCustom={true}
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(profile?.preferences?.desiredRoles || []).map((role) => (
                    <span
                      key={role}
                      className="rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-800"
                    >
                      {role}
                    </span>
                  ))}
                  {!profile?.preferences?.desiredRoles?.length && (
                    <span className="text-sm text-gray-400">No roles selected</span>
                  )}
                </div>
              )}
            </PreferenceCard>

            <PreferenceCard
              title="Experience Level"
              icon={<Users className="h-5 w-5 text-blue-600" />}
            >
              {isEditing ? (
                <RadioGroup
                  options={EXPERIENCE_LEVELS}
                  value={editPreferences.experienceLevel}
                  onChange={(value) =>
                    setEditPreferences((p) => ({ ...p, experienceLevel: value }))
                  }
                  orientation="vertical"
                  size="sm"
                />
              ) : (
                <span className="inline-block rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                  {profile?.preferences?.experienceLevel || 'Not set'}
                </span>
              )}
            </PreferenceCard>

            <PreferenceCard title="Job Type" icon={<Briefcase className="h-5 w-5 text-blue-600" />}>
              {isEditing ? (
                <RadioGroup
                  options={JOB_TYPES}
                  value={editPreferences.jobType}
                  onChange={(value) => setEditPreferences((p) => ({ ...p, jobType: value }))}
                  orientation="vertical"
                  size="sm"
                />
              ) : (
                <span className="inline-block rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                  {profile?.preferences?.jobType || 'Not set'}
                </span>
              )}
            </PreferenceCard>

            <PreferenceCard
              title="Work Location"
              icon={<MapPin className="h-5 w-5 text-blue-600" />}
            >
              {isEditing ? (
                <RadioGroup
                  options={WORK_LOCATIONS}
                  value={editPreferences.workLocation}
                  onChange={(value) => setEditPreferences((p) => ({ ...p, workLocation: value }))}
                  orientation="horizontal"
                  size="sm"
                />
              ) : (
                <span className="inline-block rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                  {profile?.preferences?.workLocation || 'Not set'}
                </span>
              )}
            </PreferenceCard>

            <PreferenceCard
              title="Salary Range"
              icon={<DollarSign className="h-5 w-5 text-blue-600" />}
            >
              {isEditing ? (
                <SalaryRangeSlider
                  min={30000}
                  max={300000}
                  value={editPreferences.salaryRange}
                  onChange={(value) =>
                    setEditPreferences((p) => ({
                      ...p,
                      salaryRange: { ...value, currency: 'USD' },
                    }))
                  }
                  currency="$"
                  step={5000}
                />
              ) : (
                <span className="inline-block rounded-lg border border-green-100 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
                  {profile?.preferences?.salaryRange
                    ? `$${(profile.preferences.salaryRange.min / 1000).toFixed(0)}k - $${(profile.preferences.salaryRange.max / 1000).toFixed(0)}k`
                    : 'Not set'}
                </span>
              )}
            </PreferenceCard>
          </div>
        </div>

        {/* Saved Jobs */}
        <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-black">
            <Bookmark className="h-5 w-5 text-blue-600" />
            Saved Jobs
          </h2>

          {savedJobs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {savedJobs.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="rounded-xl border bg-gray-50 p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{bookmark.job.title}</h3>
                      <p className="text-sm text-blue-600">{bookmark.job.company}</p>
                    </div>
                    <a
                      href={bookmark.job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <div className="mt-3 flex gap-4 text-xs text-gray-500">
                    {bookmark.job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {bookmark.job.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />{' '}
                      {new Date(bookmark.job.scrapedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No saved jobs yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
