'use client';
import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { motion } from 'framer-motion';
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

const MatchesPage = () => {
  // const { profile } = useProfile(); // Removed as unused
  const [loading, setLoading] = useState(true); // Added
  const [query, setQuery] = useState('');
  // const [location, setLocation] = useState(''); // Removed as unused
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [applications, setApplications] = useState<Record<string, string>>({});

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

  useEffect(() => {
    // Initial fetch from DB (Semantic Match)
    fetchJobs(async () => {
      // Pass query if exists, otherwise backend uses profile
      const params = new URLSearchParams({ limit: '20' });
      if (query) params.append('query', query);

      const res = await fetch(`/api/matches?${params.toString()}`);
      return res.json();
    });

    // Fetch bookmarks and applications
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
        setLoading(false); // Set loading to false after initial data fetch
      }
    };
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchJobs]); // Removed query from dependency to prevent auto-fetch on type

  const handleSearch = () => {
    fetchJobs(async () => {
      const params = new URLSearchParams({ limit: '20' });
      if (query) params.append('query', query);
      const res = await fetch(`/api/matches?${params.toString()}`);
      return res.json();
    });
  };

  // ... (Effect for pref population remains same)

  const handleRefresh = async () => {
    if (!query) return;
    // 1. Scrape/Fetch new jobs from external APIs
    await refreshJobs(async () => {
      const res = await fetch('/api/jobs/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }), // Removed location as it's unused
      });
      return res.json();
    });

    // 2. Re-fetch ranked matches
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
        body: JSON.stringify({ query: query || 'software engineer', source: 'linkedin' }),
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
    e?.stopPropagation(); // Prevent opening modal
    const isSaved = savedJobs.includes(jobId);

    // Optimistic update
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
      // Revert on error
      setSavedJobs((prev) => (isSaved ? [...prev, jobId] : prev.filter((id) => id !== jobId)));
      toast.error('Failed to update bookmark');
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedJob) return;

    // Optimistic update
    const previousStatus = applications[selectedJob.id];
    setApplications((prev) => ({ ...prev, [selectedJob.id]: status }));

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: selectedJob.id, status }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Failed to update status:', errorData);
        toast.error('Failed to update status');
        // Revert on error
        setApplications((prev) => ({ ...prev, [selectedJob.id]: previousStatus }));
      } else {
        toast.success('Application status updated');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Something went wrong');
      // Revert on error
      setApplications((prev) => ({ ...prev, [selectedJob.id]: previousStatus }));
    }
  };

  const openJobModal = (job: Job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  return (
    <div className="font-poppins min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Matches</h1>
            <p className="mt-1 text-gray-500">Jobs that match your preferences</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 shadow-sm">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Job role..."
                className="w-32 text-sm outline-none md:w-48"
              />
            </div>
            <button
              onClick={handleSearch}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Search
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || !query}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Finding...' : 'Find New Jobs'}
            </button>
            <button
              onClick={handleDeepScrape}
              className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-purple-700 hover:bg-purple-100"
            >
              <div className="flex h-2 w-2 animate-pulse rounded-full bg-purple-500" />
              Deep Scrape
            </button>
          </div>
        </div>

        {isLoadingJobs || loading ? ( // Added loading state
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {fetchedJobs?.jobs && fetchedJobs.jobs.length > 0 ? (
              fetchedJobs.jobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => openJobModal(job)}
                  className="group cursor-pointer rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                          {job.title}
                        </h3>
                        <div className="flex gap-2">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 uppercase">
                            {job.source}
                          </span>
                          {/* Application Status Badge */}
                          {applications[job.id] && (
                            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 uppercase">
                              {applications[job.id]}
                            </span>
                          )}
                          {job.similarity !== undefined && (
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold text-white uppercase ${
                                job.similarity > 0.85
                                  ? 'bg-green-600'
                                  : job.similarity > 0.7
                                    ? 'bg-emerald-500'
                                    : 'bg-blue-500'
                              }`}
                            >
                              {Math.round(job.similarity * 100)}% Match
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="mt-1 font-medium text-blue-600">{job.company}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location || 'Remote (Not Specified)'}
                        </span>
                        {job.salary && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {job.salary}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(job.scrapedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="mt-4 line-clamp-2 text-sm text-gray-600">
                        {job.description ? job.description.replace(/<[^>]*>?/gm, '') : ''}
                      </p>
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={(e) => handleSaveToggle(job.id, e)}
                        className={`rounded-lg p-2 transition-colors ${
                          savedJobs.includes(job.id)
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {savedJobs.includes(job.id) ? (
                          <BookmarkCheck className="h-5 w-5" />
                        ) : (
                          <Bookmark className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(job.url, '_blank');
                        }}
                        className="flex justify-center rounded-lg bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="rounded-xl border bg-white py-20 text-center">
                <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
                  <div className="mb-4 rounded-full bg-gray-100 p-4">
                    <Briefcase className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">No matches found yet</h3>
                  <p className="mt-2 max-w-md text-gray-500">
                    We&apos;re analyzing your profile against thousands of jobs. Check back soon for
                    your personalized matches!
                  </p>
                </div>
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
