'use client';
import React, { useCallback, useEffect, useState } from 'react';
import JobDetailModal from '@/components/ui/JobDetailModal';
import toast from 'react-hot-toast';
import MatchesHeader from '@/components/matches/MatchesHeader';
import MatchesGrid from '@/components/matches/MatchesGrid';
import MatchSkeleton from '@/components/matches/MatchSkeleton';
import MatchFilters, { type FilterKey } from '@/components/matches/MatchFilters';
import type { Job } from '@/components/matches/types';
import { log } from '@/lib/log';

interface UserContext {
  skills: string[];
  preferredLocations: string[];
  preferRemote: boolean;
  salaryMin?: number | null;
}

interface MatchesResponse {
  jobs: Job[];
  nextCursor: string | null;
  total: number;
}

const PAGE_SIZE = 20;

const MatchesPage = () => {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [applications, setApplications] = useState<Record<string, string>>({});

  const [jobs, setJobs] = useState<Job[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [userContext, setUserContext] = useState<UserContext | undefined>();

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadPage = useCallback(
    async (opts: { reset: boolean; cursor?: string | null }) => {
      const { reset, cursor } = opts;
      const setter = reset ? setIsLoadingJobs : setIsLoadingMore;
      setter(true);
      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          filter,
        });
        if (query) params.append('query', query);
        if (!reset && cursor) params.append('cursor', cursor);

        const res = await fetch(`/api/matches?${params.toString()}`);
        const data: MatchesResponse = await res.json();
        setJobs((prev) => (reset ? (data.jobs ?? []) : [...prev, ...(data.jobs ?? [])]));
        setNextCursor(data.nextCursor ?? null);
        setTotal(data.total ?? 0);
      } catch (err) {
        log.error('matches fetch failed', err);
      } finally {
        setter(false);
      }
    },
    [query, filter]
  );

  // Initial load + when filter/query changes via the buttons (NOT on each keystroke).
  // We re-fetch when `filter` flips because the API filters server-side.
  useEffect(() => {
    loadPage({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Bootstrap: bookmarks, applications, user context for "why this match?"
  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      try {
        const [bookmarksRes, appsRes, userRes] = await Promise.all([
          fetch('/api/bookmarks'),
          fetch('/api/applications'),
          fetch('/api/user'),
        ]);

        if (!cancelled && bookmarksRes.ok) {
          const data: { bookmarks: { jobId: string }[] } = await bookmarksRes.json();
          setSavedJobs(data.bookmarks.map((b) => b.jobId));
        }
        if (!cancelled && appsRes.ok) {
          const data: { applications: { jobId: string; status: string }[] } =
            await appsRes.json();
          const appMap: Record<string, string> = {};
          data.applications.forEach((app) => (appMap[app.jobId] = app.status));
          setApplications(appMap);
        }
        if (!cancelled && userRes.ok) {
          const u = await userRes.json();
          // Build the context the MatchExplanation component expects
          const skills: string[] = [
            ...((u.user?.skills as string[]) ?? []),
            ...(((u.user?.resumes?.[0]?.parsedSkills ?? []) as { skill: string }[]).map(
              (s) => s.skill
            )),
          ]
            .filter(Boolean)
            .map((s) => s.toLowerCase());
          const prefs = u.user?.jobPreferences;
          setUserContext({
            skills: Array.from(new Set(skills)),
            preferredLocations: ((prefs?.locations as string[]) ?? []).map((l) =>
              l.toLowerCase()
            ),
            preferRemote: prefs?.workLocation === 'remote',
            salaryMin: prefs?.salaryMin ?? null,
          });
        }
      } catch (err) {
        log.error('matches bootstrap failed', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = () => loadPage({ reset: true });

  const handleRefresh = async () => {
    if (!query) return;
    setIsRefreshing(true);
    try {
      await fetch('/api/jobs/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      await loadPage({ reset: true });
    } catch (err) {
      log.error('refresh failed', err);
    } finally {
      setIsRefreshing(false);
    }
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
      } else if (res.status === 403) toast.error('Upgrade to Pro to use Deep Scraper');
      else if (res.status === 429) toast.error(data.error || '5 deep scrapes per day max');
      else toast.error(data.error || 'Failed to start scrape');
    } catch (err) {
      log.error('Deep scrape error', err);
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
    } catch (err) {
      log.error('Error toggling save:', err);
      setSavedJobs((prev) => (isSaved ? [...prev, jobId] : prev.filter((id) => id !== jobId)));
      toast.error('Failed to update bookmark');
    }
  };

  const handleHideJob = async (jobId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    try {
      const res = await fetch('/api/matches/hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      if (!res.ok) throw new Error('hide failed');
      toast.success('Hidden');
    } catch (err) {
      log.error('hide job failed', err);
      toast.error("Couldn't hide");
      loadPage({ reset: true });
    }
  };

  const handleHideCompany = async (company: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setJobs((prev) =>
      prev.filter((j) => (j.company ?? '').toLowerCase() !== company.toLowerCase())
    );
    try {
      const res = await fetch('/api/user/hidden-companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company }),
      });
      if (!res.ok) throw new Error('hide company failed');
      toast.success(`Hidden all from ${company}`);
    } catch (err) {
      log.error('hide company failed', err);
      toast.error("Couldn't hide company");
      loadPage({ reset: true });
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
        const errorData = await res.json();
        log.error('Failed to update status:', errorData);
        toast.error('Failed to update status');
        setApplications((prev) => ({ ...prev, [selectedJob.id]: previousStatus }));
      } else {
        toast.success('Application status updated');
      }
    } catch (err) {
      log.error('Error updating status:', err);
      toast.error('Something went wrong');
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
        <MatchesHeader
          query={query}
          isRefreshing={isRefreshing}
          onQueryChange={setQuery}
          onSearch={handleSearch}
          onRefresh={handleRefresh}
          onDeepScrape={handleDeepScrape}
        />

        <MatchFilters active={filter} onChange={setFilter} total={total} />

        {isLoadingJobs || loading ? (
          <MatchSkeleton />
        ) : (
          <>
            <MatchesGrid
              jobs={jobs}
              savedJobs={savedJobs}
              applications={applications}
              userContext={userContext}
              onOpenJob={openJobModal}
              onToggleSave={handleSaveToggle}
              onHideJob={handleHideJob}
              onHideCompany={handleHideCompany}
            />

            {nextCursor && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => loadPage({ reset: false, cursor: nextCursor })}
                  disabled={isLoadingMore}
                  className="rounded-full border border-gray-200 bg-white px-6 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  {isLoadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}

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
