'use client';
import React, { useEffect, useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import JobDetailModal from '@/components/ui/JobDetailModal';
import toast from 'react-hot-toast';
import MatchesHeader from '@/components/matches/MatchesHeader';
import MatchesGrid from '@/components/matches/MatchesGrid';
import MatchSkeleton from '@/components/matches/MatchSkeleton';
import type { Job } from '@/components/matches/types';

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
        <MatchesHeader
          query={query}
          isRefreshing={isRefreshing}
          onQueryChange={setQuery}
          onSearch={handleSearch}
          onRefresh={handleRefresh}
          onDeepScrape={handleDeepScrape}
        />

        {isLoadingJobs || loading ? ( // Added loading state
          <MatchSkeleton />
        ) : (
          <MatchesGrid
            jobs={fetchedJobs?.jobs ?? []}
            savedJobs={savedJobs}
            applications={applications}
            onOpenJob={openJobModal}
            onToggleSave={handleSaveToggle}
          />
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
