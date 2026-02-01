'use client';
import React, { useState } from 'react';
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

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  appliedDate: string;
  status: ApplicationStatus;
  lastUpdate: string;
}

// Mock application data
const MOCK_APPLICATIONS: Application[] = [
  {
    id: '1',
    jobTitle: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    salary: '$150k - $180k',
    appliedDate: 'Jan 25, 2026',
    status: 'interview',
    lastUpdate: '2 days ago',
  },
  {
    id: '2',
    jobTitle: 'Full Stack Engineer',
    company: 'StartupXYZ',
    location: 'New York, NY',
    salary: '$130k - $160k',
    appliedDate: 'Jan 20, 2026',
    status: 'reviewing',
    lastUpdate: '1 week ago',
  },
  {
    id: '3',
    jobTitle: 'React Developer',
    company: 'DigitalAgency',
    location: 'Austin, TX',
    salary: '$120k - $145k',
    appliedDate: 'Jan 15, 2026',
    status: 'offered',
    lastUpdate: '3 days ago',
  },
  {
    id: '4',
    jobTitle: 'Frontend Architect',
    company: 'Enterprise Solutions',
    location: 'Seattle, WA',
    salary: '$170k - $200k',
    appliedDate: 'Jan 10, 2026',
    status: 'rejected',
    lastUpdate: '5 days ago',
  },
  {
    id: '5',
    jobTitle: 'UI Engineer',
    company: 'DesignStudio',
    location: 'Remote',
    salary: '$110k - $130k',
    appliedDate: 'Jan 28, 2026',
    status: 'applied',
    lastUpdate: '1 day ago',
  },
];

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
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all');

  const filteredApplications =
    filter === 'all' ? MOCK_APPLICATIONS : MOCK_APPLICATIONS.filter((app) => app.status === filter);

  const statusCounts = MOCK_APPLICATIONS.reduce(
    (acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    },
    {} as Record<ApplicationStatus, number>
  );

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
            <span className="font-medium">{MOCK_APPLICATIONS.length} total</span>
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
            All ({MOCK_APPLICATIONS.length})
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
                    <h3 className="text-xl font-semibold text-gray-900">{app.jobTitle}</h3>
                    <span
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${statusConfig[app.status].color}`}
                    >
                      {statusConfig[app.status].icon}
                      {statusConfig[app.status].label}
                    </span>
                  </div>
                  <p className="mt-1 font-medium text-blue-600">{app.company}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {app.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {app.salary}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-400">
                    <span>Applied: {app.appliedDate}</span>
                    <span>•</span>
                    <span>Updated {app.lastUpdate}</span>
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
