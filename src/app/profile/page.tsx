"use client";
import React from 'react';
import { usePreferencesState } from '@/lib/preferences-storage';
import { Briefcase, Code, MapPin, Settings, DollarSign, Users } from 'lucide-react';
import PreferenceCard from '@/components/preferences/PreferenceCard';

const ProfilePage = () => {
  const { preferences } = usePreferencesState();

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-poppins">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-medium text-gray-900 mb-8">Your Profile</h1>
        
        <div className="space-y-6">
          {/* Main Attributes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PreferenceCard
              title="Desired Roles"
              description="Roles you are targeting"
              icon={<Briefcase className="w-5 h-5 text-blue-600" />}
              isExpanded={true}
            >
              <div className="flex flex-wrap gap-2">
                {preferences.desiredRoles.map((role) => (
                  <span key={role} className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium">
                    {role}
                  </span>
                ))}
              </div>
            </PreferenceCard>

            <PreferenceCard
              title="Preferred Tech Stack"
              description="Technologies you work with"
              icon={<Code className="w-5 h-5 text-blue-600" />}
              isExpanded={true}
            >
              <div className="flex flex-wrap gap-2">
                {preferences.preferredTechStack.map((tech) => (
                  <span key={tech} className="bg-gray-100 text-gray-900 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200">
                    {tech}
                  </span>
                ))}
              </div>
            </PreferenceCard>
          </div>

          {/* Job Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PreferenceCard
              title="Experience Level"
              icon={<Settings className="w-5 h-5 text-blue-600" />}
              isExpanded={true}
            >
              <span className="inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium border border-blue-100">
                {preferences.experienceLevel}
              </span>
            </PreferenceCard>

            <PreferenceCard
              title="Job Type"
              icon={<Users className="w-5 h-5 text-blue-600" />}
              isExpanded={true}
            >
              <span className="inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium border border-blue-100">
                {preferences.jobType}
              </span>
            </PreferenceCard>
          </div>

          {/* Location & Pay */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PreferenceCard
              title="Work Location"
              icon={<MapPin className="w-5 h-5 text-blue-600" />}
              isExpanded={true}
            >
              <span className="inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium border border-blue-100">
                {preferences.workLocation}
              </span>
            </PreferenceCard>

            <PreferenceCard
              title="Salary Range"
              icon={<DollarSign className="w-5 h-5 text-blue-600" />}
              isExpanded={true}
            >
              <span className="inline-block bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium border border-green-100">
                {`$${preferences.salaryRange.min/1000}k - $${preferences.salaryRange.max/1000}k`}
              </span>
            </PreferenceCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
