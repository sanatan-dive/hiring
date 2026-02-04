'use client';
import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { motion } from 'framer-motion';

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
    color: 'bg-blue-100 text-blue-700',
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

const ApplicationsPage = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all');

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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="font-poppins min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
            <p className="mt-1 text-gray-500">Track your job application progress</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-blue-700">
            <Briefcase className="h-5 w-5" />
            <span className="font-medium">{applications.length} total</span>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
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

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-gray-900">
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
                  <p className="mt-1 font-medium text-blue-600">
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

                <button className="rounded-lg bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredApplications.length === 0 && (
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
