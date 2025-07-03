"use client";
import React, { useState } from 'react';
import { Search, Target, FileText, Send, TrendingUp, Clock,   User, Settings } from 'lucide-react';

type Status = 'interview' | 'progress' | 'submitted' | 'rejected' | string;


const JobSearchDashboard = ({ 
  isEmbedded = false, 
  className = "", 
  height = "400px", 
  width = "800px" 
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const stats = [
    { label: 'Job Matches', value: '24', subtext: '80%+ compatibility', icon: Target, color: 'bg-blue-500' },
    { label: 'Applications', value: '12', subtext: '3 in progress', icon: Send, color: 'bg-green-500' },
    { label: 'Interviews', value: '5', subtext: '2 this week', icon: Clock, color: 'bg-purple-500' },
    { label: 'Success Rate', value: '89%', subtext: 'ATS approved', icon: TrendingUp, color: 'bg-orange-500' }
  ];

  const recentMatches = [
    { title: 'Senior Frontend Developer', company: 'TechCorp', match: '95%', location: 'Remote', salary: '$120k - $150k', status: 'new' },
    { title: 'Full Stack Engineer', company: 'StartupX', match: '92%', location: 'San Francisco', salary: '$130k - $160k', status: 'new' },
    { title: 'React Developer', company: 'InnovateLab', match: '88%', location: 'New York', salary: '$110k - $140k', status: 'viewed' },
    { title: 'Software Engineer', company: 'TechCo', match: '85%', location: 'Remote', salary: '$100k - $130k', status: 'interview' }
  ];

  const applications = [
    { title: 'Senior React Developer', company: 'WebFlow Inc', status: 'interview', date: 'Applied 3 days ago', stage: 'Technical Interview' },
    { title: 'Frontend Lead', company: 'CloudTech', status: 'progress', date: 'Applied 1 week ago', stage: 'HR Review' },
    { title: 'UI Engineer', company: 'DesignHub', status: 'submitted', date: 'Applied 2 days ago', stage: 'Initial Review' },
    { title: 'Full Stack Engineer', company: 'TechCo', status: 'rejected', date: 'Applied 2 days ago', stage: 'HR Review' }
  ];

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'interview': return 'bg-green-100 text-green-800';
      case 'progress': return 'bg-blue-100 text-blue-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchColor = (match: string) => {
    const percentage = parseInt(match);
    if (percentage >= 90) return 'text-green-600 bg-green-50';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50';
    return 'text-orange-600 bg-orange-50';
  };

  return (
    <div className={`${isEmbedded ? 'h-full w-full ' : 'min-h-screen'} bg-gray-50 ${className}`} style={isEmbedded ? { height, width } : {}}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className={`${isEmbedded ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
          <div className={`flex justify-between items-center ${isEmbedded ? 'h-12' : 'h-16'}`}>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`${isEmbedded ? 'w-6 h-6' : 'w-8 h-8'} bg-blue-600 rounded-lg flex items-center justify-center`}>
                  <Target className={`${isEmbedded ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
                </div>
                <span className={`${isEmbedded ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>JobFlow</span>
              </div>
            </div>
            {!isEmbedded && (
              <nav className="flex space-x-8">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`text-sm font-medium ${activeTab === 'dashboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'} pb-4`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => setActiveTab('matches')}
                  className={`text-sm font-medium ${activeTab === 'matches' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'} pb-4`}
                >
                  Job Matches
                </button>
                <button 
                  onClick={() => setActiveTab('applications')}
                  className={`text-sm font-medium ${activeTab === 'applications' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'} pb-4`}
                >
                  Applications
                </button>
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={`text-sm font-medium ${activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'} pb-4`}
                >
                  Profile
                </button>
              </nav>
            )}
            <div className="flex items-center space-x-4">
              <Settings className={`${isEmbedded ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400 cursor-pointer hover:text-gray-600`} />
              <User className={`${isEmbedded ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400 cursor-pointer hover:text-gray-600`} />
            </div>
          </div>
        </div>
      </header>

      <div className={`${isEmbedded ? 'px-4 py-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}  overflow-hidden`}>
        {/* Stats Cards */}
        <div className={`grid grid-cols-4 gap-${isEmbedded ? '3' : '6'} ${isEmbedded ? 'mb-4' : 'mb-8'}`}>
          {stats.map((stat, index) => (
            <div key={index} className={`bg-white rounded-xl shadow-sm ${isEmbedded ? 'p-3' : 'p-6'} border hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${isEmbedded ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>{stat.label}</p>
                  <p className={`${isEmbedded ? 'text-xl' : 'text-3xl'} font-bold text-gray-900 mt-1`}>{stat.value}</p>
                  <p className={`${isEmbedded ? 'text-xs' : 'text-sm'} text-gray-500 mt-1`}>{stat.subtext}</p>
                </div>
                <div className={`${stat.color} ${isEmbedded ? 'p-2' : 'p-3'} rounded-xl`}>
                  <stat.icon className={`${isEmbedded ? 'w-4 h-4' : 'w-6 h-6'} text-white`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-${isEmbedded ? '4' : '8'} h-full`}>
          {/* Left Column - Job Matches */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border  flex flex-col">
              <div className={`${isEmbedded ? 'p-4' : 'p-6'} border-b flex-shrink-0`}>
                <div className="flex items-center justify-between">
                  <h2 className={`${isEmbedded ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>Top Job Matches</h2>
                  <button className={`${isEmbedded ? 'text-xs' : 'text-sm'} text-blue-600 hover:text-blue-700 font-medium`}>View All</button>
                </div>
              </div>
              <div className={`${isEmbedded ? 'p-4' : 'p-6'} flex-1 overflow-y-auto`}>
                <div className={`space-y-${isEmbedded ? '3' : '4'}`}>
                  {recentMatches.map((job, index) => (
                    <div key={index} className={`border rounded-lg ${isEmbedded ? 'p-5' : 'p-4'} hover:shadow-md transition-shadow`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className={`${isEmbedded ? 'text-sm' : 'text-lg'} font-medium text-gray-900`}>{job.title}</h3>
                            <span className={`px-2 py-1 ${isEmbedded ? 'text-xs' : 'text-xs'} font-medium rounded-full ${getMatchColor(job.match)}`}>
                              {job.match} match
                            </span>
                          </div>
                          <p className={`${isEmbedded ? 'text-xs' : 'text-sm'} text-gray-600 mt-1`}>{job.company} • {job.location}</p>
                          <p className={`${isEmbedded ? 'text-xs' : 'text-sm'} font-medium text-gray-900 mt-1`}>{job.salary}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button className={`px-3 py-1 ${isEmbedded ? 'text-xs' : 'text-sm'} text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50`}>
                            View
                          </button>
                          <button className={`px-3 py-1 ${isEmbedded ? 'text-xs' : 'text-sm'} text-white bg-blue-600 rounded-lg hover:bg-blue-700`}>
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
          <div className="flex flex-col space-y-4 ">
            <div className="bg-white rounded-xl shadow-sm border flex-1 flex flex-col">
              <div className={`${isEmbedded ? 'p-4' : 'p-6'} border-b flex-shrink-0`}>
                <h2 className={`${isEmbedded ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>Application Status</h2>
              </div>
              <div className={`${isEmbedded ? 'p-4' : 'p-6'} flex-1 overflow-y-auto`}>
                <div className={`space-y-${isEmbedded ? '3' : '4'}`}>
                  {applications.map((app, index) => (
                    <div key={index} className={`border rounded-lg ${isEmbedded ? 'p-3' : 'p-4'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className={`font-medium text-gray-900 ${isEmbedded ? 'text-xs' : 'text-sm'}`}>{app.title}</h3>
                          <p className={`${isEmbedded ? 'text-xs' : 'text-sm'} text-gray-600`}>{app.company}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(app.status)}`}>
                          {app.status === 'interview' ? 'Interview' : 
                           app.status === 'progress' ? 'In Progress' : 
                           app.status === 'submitted' ? 'Submitted' : 'Rejected'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{app.date}</p>
                      <p className="text-xs text-gray-700 mt-1">{app.stage}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {!isEmbedded && (
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <button className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
                      <Search className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Search New Jobs</span>
                    </button>
                    <button className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Update Resume</span>
                    </button>
                    <button className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
                      <TrendingUp className="w-5 h-5 text-gray-400" />
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