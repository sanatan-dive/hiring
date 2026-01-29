"use client";
import React from 'react';
import { usePreferencesState } from '@/lib/preferences-storage';
import { Briefcase, Code, MapPin, Settings, DollarSign, Users } from 'lucide-react';

const ProfilePage = () => {
  const { preferences } = usePreferencesState();

  return (
    <div className="min-h-screen bg-white p-8 font-poppins">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-medium text-gray-900 mb-8">Your Profile</h1>
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Briefcase className="w-6 h-6 mr-3 text-blue-600" />
              Desired Roles
            </h2>
            <div className="flex flex-wrap gap-2">
              {preferences.desiredRoles.map((role) => (
                <span key={role} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Code className="w-6 h-6 mr-3 text-green-600" />
              Preferred Tech Stack
            </h2>
            <div className="flex flex-wrap gap-2">
              {preferences.preferredTechStack.map((tech) => (
                <span key={tech} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Settings className="w-6 h-6 mr-3 text-purple-600" />
                Experience Level
              </h2>
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                {preferences.experienceLevel}
              </span>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Users className="w-6 h-6 mr-3 text-yellow-600" />
                Job Type
              </h2>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                {preferences.jobType}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <MapPin className="w-6 h-6 mr-3 text-red-600" />
              Work Location
            </h2>
            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
              {preferences.workLocation}
            </span>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <DollarSign className="w-6 h-6 mr-3 text-indigo-600" />
              Salary Range
            </h2>
            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
              {`$${preferences.salaryRange.min/1000}k - $${preferences.salaryRange.max/1000}k`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
