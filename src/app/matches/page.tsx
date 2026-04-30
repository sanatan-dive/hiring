'use client';
import React, { useEffect, useState, useMemo } from 'react';
import {
  MapPin,
  Clock,
  Search,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  RefreshCw,
  DollarSign,
  SlidersHorizontal,
  X,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAsync } from '@/hooks/useAsync';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  description: string | null;
  url: string;
  source: string;
  scrapedAt: string;
  matches: unknown[];
  similarity?: number;
}

import JobDetailModal from '@/components/ui/JobDetailModal';
import toast from 'react-hot-toast';

const SOURCE_OPTIONS = [
  { value: '', label: 'All Sources' },
  { value: 'adzuna', label: 'Adzuna' },
  { value: 'jsearch', label: 'JSearch' },
  { value: 'remoteok', label: 'RemoteOK' },
  { value: 'weworkremotely', label: 'WeWorkRemotely' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'indeed', label: 'Indeed' },
];

const DATE_OPTIONS = [
  { value: '', label: 'Any Date' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

const MATCH_OPTIONS = [
  { value: 0, label: 'All Matches' },
  { value: 0.9, label: '90%+' },
  { value: 0.8, label: '80%+' },
  { value: 0.7, label: '70%+' },
];

const MatchesPage = () => {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [applications, setApplications] = useState<Record<string, string>>({});

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterSource, setFilterSource] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMinMatch, setFilterMinMatch] = useState(0);
  const [filterLocation, setFilterLocation] = useState('');

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: fetchedJobs,
    isLoading: isLoadingJobs,
    execute: fetchJobs,
  } = useAsync<{ jobs: Job[] }>();

  const { isLoading: isRefreshing, execute: refreshJobs } = useAsync<{
    success: boolean;
    count: number;
  }>();

  // Fetch user preferences to populate default location
  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await fetch('/api/preferences');
        if (res.ok) {
          const data = await res.json();
          if (data.preferences?.locations?.length > 0) {
            setLocation(data.preferences.locations[0]);
          }
        }
      } catch {
        // Ignore
      }
    };
    fetchPrefs();
  }, []);

  useEffect(() => {
    fetchJobs(async () => {
      const params = new URLSearchParams({ limit: '20' });
      if (query) params.append('query', query);
      const res = await fetch(`/api/matches?${params.toString()}`);
      return res.json();
    });

    const fetchUserData = async () => {
      try {
        const [bookmarksRes, appsRes] = await Promise.all([
          fetch('/api/bookmarks'),
          fetch('/api/applications'),
        ]);

        if (bookmarksRes.ok) {
          const data = await bookmarksRes.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setSavedJobs(data.bookmarks.map((b: any) => b.jobId));
        }

        if (appsRes.ok) {
          const data = await appsRes.json();
          const appMap: Record<string, string> = {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.applications.forEach((app: any) => {
            appMap[app.jobId] = app.status;
          });
          setApplications(appMap);
        }
      } catch (error) {
        console.error('Error fetching user data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchJobs]);

  // Client-side filtered jobs
  const filteredJobs = useMemo(() => {
    if (!fetchedJobs?.jobs) return [];
    let jobs = fetchedJobs.jobs;

    if (filterSource) {
      jobs = jobs.filter((j) => j.source === filterSource);
    }

    if (filterLocation) {
      const loc = filterLocation.toLowerCase();
      jobs = jobs.filter((j) => j.location && j.location.toLowerCase().includes(loc));
    }

    if (filterDate) {
      const now = new Date();
      jobs = jobs.filter((j) => {
        const scraped = new Date(j.scrapedAt);
        if (filterDate === 'today') {
          return scraped.toDateString() === now.toDateString();
        } else if (filterDate === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return scraped >= weekAgo;
        } else if (filterDate === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return scraped >= monthAgo;
        }
        return true;
      });
    }

    if (filterMinMatch > 0) {
      jobs = jobs.filter((j) => j.similarity !== undefined && j.similarity >= filterMinMatch);
    }

    return jobs;
  }, [fetchedJobs, filterSource, filterLocation, filterDate, filterMinMatch]);

  const activeFilterCount = [
    filterSource,
    filterLocation,
    filterDate,
    filterMinMatch > 0 ? 'y' : '',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterSource('');
    setFilterLocation('');
    setFilterDate('');
    setFilterMinMatch(0);
  };

  const handleSearch = () => {
    fetchJobs(async () => {
      const params = new URLSearchParams({ limit: '20' });
      if (query) params.append('query', query);
      const res = await fetch(`/api/matches?${params.toString()}`);
      return res.json();
    });
  };

  const handleRefresh = async () => {
    if (!query) return;
    await refreshJobs(async () => {
      const res = await fetch('/api/jobs/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, location: location || undefined }),
      });
      return res.json();
    });

    fetchJobs(async () => {
      const params = new URLSearchParams({ limit: '20', query });
      const res = await fetch(`/api/matches?${params.toString()}`);
      return res.json();
    });
  };

  const handleDeepScrape = async () => {
    try {
      const res = await fetch('/api/jobs/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query || 'software engineer',
          source: 'linkedin',
          location: location || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
      } else {
        if (res.status === 403) toast.error('Upgrade to Pro to use Deep Scraper');
        else toast.error(data.error || 'Failed to start scrape');
      }
    } catch (error) {
      console.error('Deep scrape error', error);
      toast.error('Failed to trigger scrape');
    }
  };

  const handleSaveToggle = async (jobId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const isSaved = savedJobs.includes(jobId);
    setSavedJobs((prev) => (isSaved ? prev.filter((id) => id !== jobId) : [...prev, jobId]));

    try {
      if (isSaved) {
        await fetch(`/api/bookmarks?jobId=${jobId}`, { method: 'DELETE' });
        toast.success('Removed from saved jobs');
      } else {
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId }),
        });
        toast.success('Job saved');
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      setSavedJobs((prev) => (isSaved ? [...prev, jobId] : prev.filter((id) => id !== jobId)));
      toast.error('Failed to update bookmark');
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedJob) return;
    const previousStatus = applications[selectedJob.id];
    setApplications((prev) => ({ ...prev, [selectedJob.id]: status }));

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: selectedJob.id, status }),
      });

      if (!res.ok) {
        toast.error('Failed to update status');
        setApplications((prev) => ({ ...prev, [selectedJob.id]: previousStatus }));
      } else {
        toast.success('Application status updated');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Something went wrong');
      setApplications((prev) => ({ ...prev, [selectedJob.id]: previousStatus }));
    }
  };

  const openJobModal = (job: Job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const getMatchColor = (score: number) => {
    if (score >= 0.9) return 'bg-emerald-500';
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.7) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  return (
    <div className="font-poppins min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* ─── Header ─── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Job Matches</h1>
          <p className="mt-1 text-sm text-gray-500">
            Ranked by relevance to your skills and preferences
          </p>
        </div>

        {/* ─── Search Row ─── */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by job title, skill, keyword..."
                className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>
            <div className="flex w-48 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
              <MapPin className="h-4 w-4 text-gray-400" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Location..."
                className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSearch}
              className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              Search
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || !query}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Finding...' : 'Find New'}
            </button>
            <button
              onClick={handleDeepScrape}
              className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100"
            >
              <div className="h-2 w-2 animate-pulse rounded-full bg-purple-500" />
              Deep Scrape
            </button>
          </div>
        </div>

        {/* ─── Filter Toggle + Active Filter Count ─── */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`}
            />
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          )}

          <span className="ml-auto text-xs text-gray-400">
            {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
            {activeFilterCount > 0 && ` (filtered from ${fetchedJobs?.jobs?.length || 0})`}
          </span>
        </div>

        {/* ─── Filter Bar ─── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-6 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Location
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    <input
                      value={filterLocation}
                      onChange={(e) => setFilterLocation(e.target.value)}
                      placeholder="Remote, US, London..."
                      className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Source
                  </label>
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none"
                  >
                    {SOURCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Posted
                  </label>
                  <select
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none"
                  >
                    {DATE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Match Score
                  </label>
                  <select
                    value={filterMinMatch}
                    onChange={(e) => setFilterMinMatch(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none"
                  >
                    {MATCH_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Job List ─── */}
        {isLoadingJobs || loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-gray-200 border-t-blue-600" />
            <p className="mt-4 text-sm text-gray-400">Finding your best matches...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => openJobModal(job)}
                  className="group cursor-pointer rounded-xl border border-gray-100 bg-white px-6 py-5 shadow-sm transition-all hover:border-gray-200 hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    {/* Match score indicator */}
                    {job.similarity !== undefined && (
                      <div className="flex flex-col items-center pt-1">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full ${getMatchColor(job.similarity)}`}
                        >
                          <span className="text-sm font-bold text-white">
                            {Math.round(job.similarity * 100)}%
                          </span>
                        </div>
                        <span className="mt-1 text-[10px] font-medium text-gray-400">match</span>
                      </div>
                    )}

                    {/* Job details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                            {job.title}
                          </h3>
                          <p className="mt-0.5 text-sm font-medium text-blue-600">{job.company}</p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600 uppercase">
                            {job.source}
                          </span>
                          {applications[job.id] && (
                            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-bold text-purple-700 uppercase">
                              {applications[job.id]}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location || 'Remote'}
                        </span>
                        {job.salary && (
                          <span className="flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5" />
                            {job.salary}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(job.scrapedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {job.description && (
                        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-500">
                          {job.description.replace(/<[^>]*>?/gm, '')}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 pt-1">
                      <button
                        onClick={(e) => handleSaveToggle(job.id, e)}
                        className={`rounded-lg p-2 transition-colors ${
                          savedJobs.includes(job.id)
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                        }`}
                        title={savedJobs.includes(job.id) ? 'Unsave' : 'Save'}
                      >
                        {savedJobs.includes(job.id) ? (
                          <BookmarkCheck className="h-4 w-4" />
                        ) : (
                          <Bookmark className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(job.url, '_blank');
                        }}
                        className="rounded-lg bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700"
                        title="Open listing"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-24">
                <div className="mb-4 rounded-full bg-gray-100 p-4">
                  <Briefcase className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {activeFilterCount > 0 ? 'No jobs match your filters' : 'No matches found yet'}
                </h3>
                <p className="mt-2 max-w-sm text-center text-sm text-gray-500">
                  {activeFilterCount > 0
                    ? 'Try adjusting your filters or search for different keywords.'
                    : 'We\'re analyzing your profile against available jobs. Try searching for a role or click "Find New" to fetch fresh listings.'}
                </p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Job Detail Modal */}
        {selectedJob && (
          <JobDetailModal
            job={selectedJob}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            isSaved={savedJobs.includes(selectedJob.id)}
            onToggleSave={(e) => handleSaveToggle(selectedJob.id, e)}
            applicationStatus={applications[selectedJob.id]}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </div>
    </div>
  );
};

export default MatchesPage;
