'use client';
import React from 'react';
import {
  Search,
  Target,
  FileText,
  Send,
  TrendingUp,
  Clock,
  Settings,
  Briefcase,
  MapPin,
  DollarSign,
} from 'lucide-react';

type Status = 'interview' | 'progress' | 'submitted' | 'rejected' | string;

const JobSearchDashboard = ({
  isEmbedded = false,
  className = '',
  height = '400px',
  width = '800px',
}) => {
  const stats = [
    {
      label: 'Job Matches',
      value: '24',
      subtext: '80%+ compatibility',
      icon: Target,
      color: 'bg-blue-500',
    },
    {
      label: 'Applications',
      value: '12',
      subtext: '3 in progress',
      icon: Send,
      color: 'bg-green-500',
    },
    {
      label: 'Interviews',
      value: '5',
      subtext: '2 this week',
      icon: Clock,
      color: 'bg-purple-500',
    },
    {
      label: 'Success Rate',
      value: '89%',
      subtext: 'ATS approved',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  const recentMatches = [
    {
      title: 'Senior Frontend Developer',
      company: 'TechCorp',
      match: '95%',
      location: 'Remote',
      salary: '$120k - $150k',
      status: 'new',
    },
    {
      title: 'Full Stack Engineer',
      company: 'StartupX',
      match: '92%',
      location: 'San Francisco',
      salary: '$130k - $160k',
      status: 'new',
    },
    {
      title: 'React Developer',
      company: 'InnovateLab',
      match: '88%',
      location: 'New York',
      salary: '$110k - $140k',
      status: 'viewed',
    },
    {
      title: 'Software Engineer',
      company: 'TechCo',
      match: '85%',
      location: 'Remote',
      salary: '$100k - $130k',
      status: 'interview',
    },
  ];

  const applications = [
    {
      title: 'Senior React Developer',
      company: 'WebFlow Inc',
      status: 'interview',
      date: 'Applied 3 days ago',
      stage: 'Technical Interview',
    },
    {
      title: 'Frontend Lead',
      company: 'CloudTech',
      status: 'progress',
      date: 'Applied 1 week ago',
      stage: 'HR Review',
    },
    {
      title: 'UI Engineer',
      company: 'DesignHub',
      status: 'submitted',
      date: 'Applied 2 days ago',
      stage: 'Initial Review',
    },
    {
      title: 'Full Stack Engineer',
      company: 'TechCo',
      status: 'rejected',
      date: 'Applied 2 days ago',
      stage: 'HR Review',
    },
  ];

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'interview':
        return 'bg-green-100 text-green-800';
      case 'progress':
        return 'bg-blue-100 text-blue-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchColor = (match: string) => {
    const percentage = parseInt(match);
    if (percentage >= 90) return 'text-green-600 bg-green-50';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50';
    return 'text-orange-600 bg-orange-50';
  };

  const items = [
    { label: 'Job Matches', href: '/matches' },
    { label: 'Applications', href: '/applications' },
    { label: 'My Profile', href: '/profile' },
  ];

  return (
    <div
      className={`${isEmbedded ? 'h-full w-full' : 'min-h-screen'} bg-gray-50 ${className}`}
      style={isEmbedded ? { height, width } : {}}
    >
      {/* Header */}
      {isEmbedded && (
        <div>
          <header className="sticky top-0 z-50 bg-black pt-2 pb-2 backdrop-blur-sm dark:bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between lg:h-10">
                {/* Logo */}

                <div className="group flex items-center gap-1 transition-all duration-300 hover:scale-105 hover:cursor-pointer">
                  <h1 className="font-sans text-2xl font-bold text-black">Hir&apos;</h1>

                  {/* 'in' part inside a blue box */}
                  <h1 className="rounded bg-blue-600 px-1 text-2xl font-bold text-white dark:bg-blue-600">
                    in
                  </h1>
                </div>

                {/* Desktop Navigation */}

                <div className="flex gap-8">
                  {items.map((item) => (
                    <div
                      key={item.href}
                      className="group relative transition-all duration-300 hover:scale-105 hover:cursor-pointer"
                    >
                      <span className="font-poppins text-sm text-white dark:text-black">
                        {item.label}
                      </span>
                      <div className="absolute -bottom-1 left-0 h-0.5 w-0 bg-blue-500 transition-all duration-300 group-hover:w-full"></div>
                    </div>
                  ))}
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-3">
                  {/* Get a Job Button - Desktop */}
                  <button className="rounded-font-medium flex items-center gap-2 bg-black px-4 py-2 text-sm text-white transition-all duration-300 hover:bg-black/85">
                    Get a Job
                  </button>
                </div>
              </div>
            </div>
          </header>
        </div>
      )}

      <div
        className={`${isEmbedded ? 'px-4 py-4' : 'mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'} overflow-hidden`}
      >
        {/* Stats Cards */}
        <div
          className={`grid grid-cols-4 gap-${isEmbedded ? '3' : '6'} ${isEmbedded ? 'mb-4' : 'mb-8'}`}
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`rounded-xl bg-white shadow-sm ${isEmbedded ? 'p-3' : 'p-6'} border transition-shadow hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${isEmbedded ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>
                    {stat.label}
                  </p>
                  <p
                    className={`${isEmbedded ? 'text-xl' : 'text-3xl'} mt-1 font-bold text-gray-900`}
                  >
                    {stat.value}
                  </p>
                  <p className={`${isEmbedded ? 'text-xs' : 'text-sm'} mt-1 text-gray-500`}>
                    {stat.subtext}
                  </p>
                </div>
                <div className={`${stat.color} ${isEmbedded ? 'p-2' : 'p-3'} rounded-xl`}>
                  <stat.icon className={`${isEmbedded ? 'h-4 w-4' : 'h-6 w-6'} text-white`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-${isEmbedded ? '4' : '8'} h-full`}>
          {/* Left Column - Job Matches */}
          <div className="lg:col-span-2">
            <div className="flex flex-col rounded-xl border bg-white shadow-sm">
              <div className={`${isEmbedded ? 'p-4' : 'p-6'} flex-shrink-0 border-b`}>
                <div className="flex items-center justify-between">
                  <h2
                    className={`${isEmbedded ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}
                  >
                    Top Job Matches
                  </h2>
                  <button
                    className={`${isEmbedded ? 'text-xs' : 'text-sm'} font-medium text-blue-600 hover:text-blue-700`}
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className={`${isEmbedded ? 'p-4' : 'p-6'} flex-1 overflow-y-auto`}>
                <div className={`space-y-${isEmbedded ? '3' : '4'}`}>
                  {recentMatches.map((job, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border ${isEmbedded ? 'p-5' : 'p-4'} transition-shadow hover:shadow-md`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3
                              className={`${isEmbedded ? 'text-sm' : 'text-lg'} font-medium text-gray-900`}
                            >
                              {job.title}
                            </h3>
                            <span
                              className={`px-2 py-1 ${isEmbedded ? 'text-xs' : 'text-xs'} rounded-full font-medium ${getMatchColor(job.match)}`}
                            >
                              {job.match} match
                            </span>
                          </div>
                          <p className={`${isEmbedded ? 'text-xs' : 'text-sm'} mt-1 text-gray-600`}>
                            {job.company} • {job.location}
                          </p>
                          <p
                            className={`${isEmbedded ? 'text-xs' : 'text-sm'} mt-1 font-medium text-gray-900`}
                          >
                            {job.salary}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className={`px-3 py-1 ${isEmbedded ? 'text-xs' : 'text-sm'} rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50`}
                          >
                            View
                          </button>
                          <button
                            className={`px-3 py-1 ${isEmbedded ? 'text-xs' : 'text-sm'} rounded-lg bg-blue-600 text-white hover:bg-blue-700`}
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Application Status */}
          <div className="flex flex-col space-y-4">
            <div className="flex flex-1 flex-col rounded-xl border bg-white shadow-sm">
              <div className={`${isEmbedded ? 'p-4' : 'p-6'} flex-shrink-0 border-b`}>
                <h2
                  className={`${isEmbedded ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}
                >
                  Application Status
                </h2>
              </div>
              <div className={`${isEmbedded ? 'p-4' : 'p-6'} flex-1 overflow-y-auto`}>
                <div className={`space-y-${isEmbedded ? '3' : '4'}`}>
                  {applications.map((app, index) => (
                    <div key={index} className={`rounded-lg border ${isEmbedded ? 'p-3' : 'p-4'}`}>
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <h3
                            className={`font-medium text-gray-900 ${isEmbedded ? 'text-xs' : 'text-sm'}`}
                          >
                            {app.title}
                          </h3>
                          <p className={`${isEmbedded ? 'text-xs' : 'text-sm'} text-gray-600`}>
                            {app.company}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(app.status)}`}
                        >
                          {app.status === 'interview'
                            ? 'Interview'
                            : app.status === 'progress'
                              ? 'In Progress'
                              : app.status === 'submitted'
                                ? 'Submitted'
                                : 'Rejected'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{app.date}</p>
                      <p className="mt-1 text-xs text-gray-700">{app.stage}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Job Preferences Summary */}
            {!isEmbedded && (
              <div className="rounded-xl border bg-white shadow-sm">
                <div className="border-b p-6">
                  <h2 className="text-lg font-semibold text-gray-900">Job Preferences</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Desired Roles */}
                    <div className="flex items-start space-x-3">
                      <Briefcase className="mt-0.5 h-5 w-5 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">Desired Roles</p>
                        <p className="text-sm text-gray-600">
                          Frontend Developer, Full Stack Developer
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start space-x-3">
                      <MapPin className="mt-0.5 h-5 w-5 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">Location</p>
                        <p className="text-sm text-gray-600">Remote</p>
                      </div>
                    </div>

                    {/* Salary */}
                    <div className="flex items-start space-x-3">
                      <DollarSign className="mt-0.5 h-5 w-5 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">Salary Range</p>
                        <p className="text-sm text-gray-600">$80k - $130k</p>
                      </div>
                    </div>

                    {/* Complete Preferences Button */}
                    <button
                      onClick={() => window.open('/preferences', '_self')}
                      className="mt-4 flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-50 p-3 text-blue-700 transition-colors hover:bg-blue-100"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="text-sm font-medium">Complete Preferences</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {!isEmbedded && (
              <div className="rounded-xl border bg-white shadow-sm">
                <div className="border-b p-6">
                  <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <button className="flex w-full items-center space-x-3 rounded-lg p-3 text-left transition-colors hover:bg-gray-50">
                      <Search className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Search New Jobs</span>
                    </button>
                    <button className="flex w-full items-center space-x-3 rounded-lg p-3 text-left transition-colors hover:bg-gray-50">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Update Resume</span>
                    </button>
                    <button className="flex w-full items-center space-x-3 rounded-lg p-3 text-left transition-colors hover:bg-gray-50">
                      <TrendingUp className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">View Analytics</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSearchDashboard;
