'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Timer,
  Eye,
  MoreHorizontal,
  LayoutList,
  KanbanSquare,
  TrendingUp,
  Activity,
  Pencil,
  Archive,
  Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

type ApplicationStatus = 'applied' | 'reviewing' | 'interview' | 'offered' | 'rejected';

const statusConfig: Record<
  ApplicationStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  applied: {
    label: 'Applied',
    color: 'bg-gray-100 text-gray-700',
    icon: <Clock className="h-4 w-4" />,
  },
  reviewing: {
    label: 'Under Review',
    color: 'bg-sky-100 text-sky-700',
    icon: <Eye className="h-4 w-4" />,
  },
  interview: {
    label: 'Interview',
    color: 'bg-purple-100 text-purple-700',
    icon: <Timer className="h-4 w-4" />,
  },
  offered: {
    label: 'Offered',
    color: 'bg-green-100 text-green-700',
    icon: <CheckCircle className="h-4 w-4" />,
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-700',
    icon: <XCircle className="h-4 w-4" />,
  },
};

const KANBAN_ORDER: ApplicationStatus[] = [
  'applied',
  'reviewing',
  'interview',
  'offered',
  'rejected',
];

const ApplicationsPage = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch('/api/applications');
        if (res.ok) {
          const data = await res.json();
          setApplications(data.applications);
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const filteredApplications =
    filter === 'all'
      ? applications
      : applications.filter((app) => (app.status || 'applied') === filter);

  const statusCounts = applications.reduce(
    (acc: Record<string, number>, app) => {
      const status = app.status || 'applied';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Derived stats
  const total = applications.length;
  const activeCount = applications.filter((app) => {
    const s = (app.status || 'applied') as ApplicationStatus;
    return s !== 'rejected' && s !== 'offered';
  }).length;
  const interviewCount = applications.filter(
    (app) => (app.status || 'applied') === 'interview'
  ).length;
  const respondedCount = applications.filter(
    (app) => (app.status || 'applied') !== 'applied'
  ).length;
  const responseRate = total > 0 ? Math.round((respondedCount / total) * 100) : 0;

  // Group by status for kanban
  const grouped: Record<ApplicationStatus, typeof applications> = {
    applied: [],
    reviewing: [],
    interview: [],
    offered: [],
    rejected: [],
  };
  filteredApplications.forEach((app) => {
    const s = (app.status || 'applied') as ApplicationStatus;
    if (grouped[s]) grouped[s].push(app);
  });

  const handleMenuAction = (action: 'edit' | 'archive' | 'delete') => {
    setOpenMenuId(null);
    const labels = {
      edit: 'Edit Notes',
      archive: 'Archive',
      delete: 'Delete',
    };
    toast(`${labels[action]}: Coming soon — feature in development`);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderActionMenu = (app: any) => (
    <div className="relative" ref={openMenuId === app.id ? menuRef : null}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpenMenuId(openMenuId === app.id ? null : app.id);
        }}
        className="rounded-lg bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200"
        aria-label="Application actions"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
      {openMenuId === app.id && (
        <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <button
            onClick={() => handleMenuAction('edit')}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-700"
          >
            <Pencil className="h-4 w-4" />
            Edit Notes
          </button>
          <button
            onClick={() => handleMenuAction('archive')}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-700"
          >
            <Archive className="h-4 w-4" />
            Archive
          </button>
          <button
            onClick={() => handleMenuAction('delete')}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="font-poppins min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">My Applications</h1>
            <p className="mt-1 text-sm text-gray-500 sm:text-base">
              Track your job application progress
            </p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sky-700">
            <Briefcase className="h-5 w-5" />
            <span className="font-medium">{applications.length} total</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Briefcase className="h-4 w-4 text-sky-600" />
              <span className="text-xs font-medium sm:text-sm">Total Applications</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">{total}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Activity className="h-4 w-4 text-sky-600" />
              <span className="text-xs font-medium sm:text-sm">Active</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">{activeCount}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Timer className="h-4 w-4 text-sky-600" />
              <span className="text-xs font-medium sm:text-sm">Interviews</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">{interviewCount}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <TrendingUp className="h-4 w-4 text-sky-600" />
              <span className="text-xs font-medium sm:text-sm">Response Rate</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">{responseRate}%</p>
          </div>
        </div>

        {/* Status Filter Pills + View Toggle */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-sky-600 text-white'
                  : 'border bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              All ({applications.length})
            </button>
            {(Object.keys(statusConfig) as ApplicationStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  filter === status
                    ? statusConfig[status].color.replace('100', '600').replace('700', 'white') +
                      ' text-white'
                    : 'border bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {statusConfig[status].label} ({statusCounts[status] || 0})
              </button>
            ))}
          </div>

          <div className="flex w-fit items-center gap-1 rounded-full border bg-white p-1">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                view === 'list' ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="List view"
            >
              <LayoutList className="h-4 w-4" />
              List
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                view === 'kanban' ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="Kanban view"
            >
              <KanbanSquare className="h-4 w-4" />
              Kanban
            </button>
          </div>
        </div>

        {/* Applications */}
        {view === 'list' ? (
          <div className="space-y-4">
            {filteredApplications.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <h3 className="text-base font-semibold text-gray-900 sm:text-xl">
                        {app.job?.title || 'Unknown Role'}
                      </h3>
                      <span
                        className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
                          statusConfig[app.status as ApplicationStatus]?.color ||
                          statusConfig['applied'].color
                        }`}
                      >
                        {statusConfig[app.status as ApplicationStatus]?.icon ||
                          statusConfig['applied'].icon}
                        {statusConfig[app.status as ApplicationStatus]?.label || 'Applied'}
                      </span>
                    </div>
                    <p className="mt-1 font-medium text-sky-600">
                      {app.job?.company || 'Unknown Company'}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {app.job?.location || 'Remote'}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {app.job?.salary || 'Not specified'}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-400">
                      <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Updated {new Date(app.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {renderActionMenu(app)}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
              {KANBAN_ORDER.map((status) => {
                const items = grouped[status];
                return (
                  <div
                    key={status}
                    className="flex w-72 flex-shrink-0 flex-col rounded-xl bg-gray-100 p-3"
                  >
                    <div className="mb-3 flex items-center justify-between px-1">
                      <span
                        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig[status].color}`}
                      >
                        {statusConfig[status].icon}
                        {statusConfig[status].label}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">{items.length}</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {items.length === 0 && (
                        <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-xs text-gray-400">
                          No applications
                        </div>
                      )}
                      {items.map((app) => (
                        <div
                          key={app.id}
                          className="rounded-lg border bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="truncate text-sm font-semibold text-gray-900">
                                {app.job?.title || 'Unknown Role'}
                              </h4>
                              <p className="mt-0.5 truncate text-xs font-medium text-sky-600">
                                {app.job?.company || 'Unknown Company'}
                              </p>
                              <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{app.job?.location || 'Remote'}</span>
                              </div>
                              <div className="mt-2 text-xs text-gray-400">
                                {new Date(app.appliedAt).toLocaleDateString()}
                              </div>
                            </div>
                            {renderActionMenu(app)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {filteredApplications.length === 0 && view === 'list' && (
          <div className="py-12 text-center">
            <Briefcase className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h3 className="text-xl font-medium text-gray-600">No applications found</h3>
            <p className="mt-1 text-gray-400">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationsPage;
