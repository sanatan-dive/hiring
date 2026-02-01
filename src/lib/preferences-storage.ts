import React from 'react';
import { JobPreferences } from '@/types';

const PREFERENCES_STORAGE_KEY = 'smarthire-job-preferences';

export const savePreferencesToStorage = (preferences: JobPreferences): void => {
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to save preferences to localStorage:', error);
  }
};

export const loadPreferencesFromStorage = (): JobPreferences | null => {
  try {
    const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (stored) {
      const preferences = JSON.parse(stored);
      // Convert date strings back to Date objects if needed
      if (preferences.createdAt) {
        preferences.createdAt = new Date(preferences.createdAt);
      }
      if (preferences.updatedAt) {
        preferences.updatedAt = new Date(preferences.updatedAt);
      }
      return preferences;
    }
  } catch (error) {
    console.error('Failed to load preferences from localStorage:', error);
  }
  return null;
};

export const clearPreferencesFromStorage = (): void => {
  try {
    localStorage.removeItem(PREFERENCES_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear preferences from localStorage:', error);
  }
};

// Hook for managing preferences state
export const usePreferencesState = () => {
  const [preferences, setPreferences] = React.useState<JobPreferences>({
    desiredRoles: [],
    preferredTechStack: [],
    experienceLevel: 'mid',
    workLocation: 'remote',
    locations: [],
    salaryRange: {
      min: 70000,
      max: 120000,
      currency: '$',
    },
    jobType: 'full-time',
    companySize: 'medium',
    industries: [],
    industriesToAvoid: [],
    workSchedule: 'flexible',
    travelWillingness: 'occasional',
    benefitsPriority: ['health', 'retirement'],
  });

  React.useEffect(() => {
    const stored = loadPreferencesFromStorage();
    if (stored) {
      setPreferences(stored);
    }
  }, []);

  const updatePreferences = (updates: Partial<JobPreferences>) => {
    const newPreferences = {
      ...preferences,
      ...updates,
      updatedAt: new Date(),
    };

    setPreferences(newPreferences);
    savePreferencesToStorage(newPreferences);
  };

  const resetPreferences = () => {
    const defaultPreferences: JobPreferences = {
      desiredRoles: [],
      preferredTechStack: [],
      experienceLevel: 'mid',
      workLocation: 'remote',
      locations: [],
      salaryRange: {
        min: 70000,
        max: 120000,
        currency: '$',
      },
      jobType: 'full-time',
      companySize: 'medium',
      industries: [],
      industriesToAvoid: [],
      workSchedule: 'flexible',
      travelWillingness: 'occasional',
      benefitsPriority: ['health', 'retirement'],
      updatedAt: new Date(),
    };

    setPreferences(defaultPreferences);
    savePreferencesToStorage(defaultPreferences);
  };

  return {
    preferences,
    updatePreferences,
    resetPreferences,
  };
};
