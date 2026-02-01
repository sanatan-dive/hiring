'use client';
import React, { useState, useRef, useEffect } from 'react';
import {
  Cog,
  Users,
  DollarSign,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  MapPin,
  Settings,
  CheckCircle,
} from 'lucide-react';
import { motion, useAnimation, AnimatePresence, useInView, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import FileUpload from '@/components/ui/file-upload';
import PreferenceCard from '@/components/preferences/PreferenceCard';
import MultiSelect from '@/components/preferences/MultiSelect';
import SalaryRangeSlider from '@/components/preferences/SalaryRangeSlider';
import RadioGroup from '@/components/preferences/RadioGroup';
import {
  JobPreferences,
  EXPERIENCE_LEVELS,
  WORK_LOCATIONS,
  JOB_TYPES,
  COMMON_ROLES,
  ExperienceLevel,
  JobType,
  WorkLocation,
} from '@/types';
import { usePreferencesState } from '@/lib/preferences-storage';

const OnboardingPage = () => {
  const [activeSection, setActiveSection] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [parsedResume, setParsedResume] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const controls = useAnimation();
  const { preferences, updatePreferences } = usePreferencesState();
  const router = useRouter();

  const handleCompleteOnboarding = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeFileName: parsedResume?.fileName || 'resume.pdf',
          skills: parsedResume?.skills || [],
          experiences: parsedResume?.experience || [],
          desiredRoles: preferences.desiredRoles,
          experienceLevel: preferences.experienceLevel,
          workLocation: preferences.workLocation,
          locations: preferences.locations,
          salaryRange: preferences.salaryRange,
          jobType: preferences.jobType,
        }),
      });

      if (response.ok) {
        router.push('/profile');
      } else {
        console.error('Failed to save onboarding data');
        // Still navigate even if save fails
        router.push('/profile');
      }
    } catch (error) {
      console.error('Error saving onboarding:', error);
      router.push('/profile');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = <K extends keyof JobPreferences>(key: K, value: JobPreferences[K]) => {
    updatePreferences({ [key]: value });
  };

  useEffect(() => {
    if (isInView) {
      controls.start({ width: '100%' });
    }
  }, [isInView, controls]);

  const sections = [
    {
      id: 'work-process',
      title: 'Lets get to work',
      icon: <ArrowDownRight className="h-16" />,
      content: {
        description:
          'Our flexible work environment is designed to help you thrive while maintaining work-life balance.',
      },
      additionalContent: {
        title: 'Getting Started',
        sections: [
          {
            title: 'Setup Checklist',
            items: [
              'Home office setup guide',
              'VPN and security tools',
              'Communication platforms',
              'Time tracking software',
            ],
          },
          {
            title: 'Support Resources',
            items: [
              '24/7 IT support',
              'Ergonomic equipment stipend',
              'Internet reimbursement',
              'Wellness programs',
            ],
          },
        ],
      },
    },
    {
      id: 'resume-insights',
      title: 'Resume Insights',
      icon: <Cog className="h-8 w-8" />,
      content: {
        description: 'Here are some insights from your resume.',
        items: parsedResume
          ? [
              `Name: ${parsedResume.name}`,
              `Skills: ${parsedResume.skills.slice(0, 3).join(', ')}...`,
              `Experience: ${parsedResume.experience[0]?.company} - ${parsedResume.experience[0]?.role}`,
              `Education: ${parsedResume.education[0]?.degree.slice(0, 10)}... at ${parsedResume.education[0]?.institute.slice(0, 10)}...`,
            ]
          : [],
      },
      additionalContent: {
        title: 'Your Profile',
        sections: [
          {
            title: 'Full Details',
            items: ['View full parsed resume details'],
          },
        ],
      },
    },
    {
      id: 'job-preferences',
      title: 'Job Preferences',
      icon: <Settings className="h-8 w-8" />,
      content: {
        description: 'Let users tell what they want, not just what they are.',
      },
      component: (
        <div className="space-y-4">
          <PreferenceCard
            title="Desired role"
            description="Frontend, Backend, Fullstack, ML, etc."
            icon={<Briefcase className="h-5 w-5 text-blue-600" />}
          >
            <MultiSelect
              options={COMMON_ROLES}
              selected={preferences.desiredRoles}
              onChange={(values) => updatePreference('desiredRoles', values)}
              placeholder="Search for roles..."
              maxItems={5}
              allowCustom={true}
            />
          </PreferenceCard>
        </div>
      ),
    },
    {
      id: 'financial-security',
      title: 'Experience',
      icon: <DollarSign className="h-8 w-8" />,
      content: {
        description:
          'We offer competitive compensation and benefits to ensure your financial well-being.',
      },
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PreferenceCard
              title="Experience level"
              description=""
              icon={<Settings className="h-5 w-5 text-blue-600" />}
            >
              <RadioGroup
                options={EXPERIENCE_LEVELS}
                value={preferences.experienceLevel}
                onChange={(value) => updatePreference('experienceLevel', value as ExperienceLevel)}
                orientation="vertical"
                size="sm"
              />
            </PreferenceCard>
            <PreferenceCard
              title="Job type"
              description="Internship / Full-time / Contract"
              icon={<Briefcase className="h-5 w-5 text-blue-600" />}
            >
              <RadioGroup
                options={JOB_TYPES}
                value={preferences.jobType}
                onChange={(value) => updatePreference('jobType', value as JobType)}
                orientation="vertical"
                size="sm"
              />
            </PreferenceCard>
          </div>
        </div>
      ),
    },
    {
      id: 'dynamic-teamwork',
      title: 'Location & Pay',
      icon: <Users className="h-8 w-8" />,
      content: {
        description:
          'Join a collaborative environment where every voice matters and innovation thrives.',
      },
      component: (
        <div className="space-y-4">
          <PreferenceCard
            title="Location"
            description="Remote / Hybrid / Onsite"
            icon={<MapPin className="h-5 w-5 text-blue-600" />}
          >
            <RadioGroup
              options={WORK_LOCATIONS}
              value={preferences.workLocation}
              onChange={(value) => updatePreference('workLocation', value as WorkLocation)}
              orientation="horizontal"
              size="sm"
            />
          </PreferenceCard>
          <PreferenceCard
            title="Salary range"
            description=""
            icon={<DollarSign className="h-5 w-5 text-blue-600" />}
          >
            <SalaryRangeSlider
              min={30000}
              max={300000}
              value={preferences.salaryRange}
              onChange={(value) => updatePreference('salaryRange', { ...value, currency: 'USD' })}
              currency="$"
              step={5000}
            />
          </PreferenceCard>

          {/* Continue to Profile Button */}
          <motion.button
            onClick={handleCompleteOnboarding}
            disabled={isSaving}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-lg font-medium text-white shadow-lg transition-all duration-300 hover:bg-blue-700 hover:shadow-xl disabled:bg-blue-400"
            whileHover={{ scale: isSaving ? 1 : 1.02 }}
            whileTap={{ scale: isSaving ? 1 : 0.98 }}
          >
            {isSaving ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Continue to Profile
              </>
            )}
          </motion.button>
        </div>
      ),
    },
  ];

  const handleSectionClick = (index: number) => {
    setActiveSection(index);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 10,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 10,
      },
    },
  };

  return (
    <div className="font-poppins min-h-screen bg-white p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          className="text mb-24"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h1 className="mb-4 text-6xl font-medium text-gray-900">Onboard with us</h1>
        </motion.div>

        {/* Horizontal Collapsible Sections */}
        <motion.div
          className="flex h-[650px] gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              className={`cursor-pointer overflow-hidden rounded-2xl bg-white shadow-lg ${
                activeSection === index ? 'flex-1' : 'w-30'
              }`}
              variants={cardVariants}
              onClick={() => handleSectionClick(index)}
              animate={{
                width: activeSection === index ? 'auto' : '120px',
                transition: {
                  type: 'spring',
                  stiffness: 100,
                  damping: 15,
                  duration: 0.6,
                },
              }}
            >
              {/* Collapsed State - Vertical Title */}
              <AnimatePresence mode="wait">
                {activeSection !== index && (
                  <motion.div
                    className="flex h-full flex-col items-center justify-center gap-32 bg-gray-100 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.h2
                      className="mt-88 -rotate-90 transform text-2xl font-[500] whitespace-nowrap text-gray-900"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                    >
                      {section.title}
                    </motion.h2>
                    <motion.div
                      whileHover={{
                        rotate: 45,
                        scale: 1.1,
                        transition: { type: 'spring', stiffness: 300, damping: 20 },
                      }}
                      initial={{ rotate: 0, scale: 1 }}
                      animate={{ rotate: 0, scale: 1 }}
                    >
                      <div className="mt-4 mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-blue-700 text-blue-700 transition-all duration-300">
                        <svg className="h-7 w-7 rotate-45" viewBox="0 0 32 32" fill="currentColor">
                          <path d="M1.116 17.116c-0.617 0-1.116-0.5-1.116-1.116s0.5-1.116 1.116-1.116v2.233zM31.673 15.211c0.436 0.436 0.436 1.143 0 1.579l-7.104 7.104c-0.436 0.436-1.143 0.436-1.579 0s-0.436-1.143 0-1.579l6.315-6.315-6.315-6.315c-0.436-0.436-0.436-1.143 0-1.579s1.143-0.436 1.579 0l7.104 7.104zM1.116 14.884h29.767v2.233h-29.767v-2.233z"></path>
                        </svg>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Expanded State - Full Content */}
              <AnimatePresence mode="wait">
                {activeSection === index && (
                  <motion.div
                    className="flex h-full flex-col shadow-2xl"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                  >
                    {/* Header */}
                    <motion.div
                      className="grid grid-cols-2"
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                    >
                      <div>
                        <motion.div
                          className="mt-6 ml-6 flex h-18 w-18 items-center justify-center rounded-full bg-blue-600 text-white"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: 'spring',
                            stiffness: 200,
                            damping: 15,
                            delay: 0.2,
                          }}
                        >
                          <svg
                            className="h-8 w-8 rotate-45 text-white"
                            viewBox="0 0 32 32"
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M1.116 17.116c-0.617 0-1.116-0.5-1.116-1.116s0.5-1.116 1.116-1.116v2.233zM31.673 15.211c0.436 0.436 0.436 1.143 0 1.579l-7.104 7.104c-0.436 0.436-1.143 0.436-1.579 0s-0.436-1.143 0-1.579l6.315-6.315-6.315-6.315c-0.436-0.436-0.436-1.143 0-1.579s1.143-0.436 1.579 0l7.104 7.104zM1.116 14.884h29.767v2.233h-29.767v-2.233z" />
                          </svg>
                        </motion.div>

                        <motion.div
                          className="flex items-center justify-between border-b border-dashed border-gray-100 p-6"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.4 }}
                        >
                          <div className="flex flex-col items-center space-x-4">
                            <div>
                              <h2 className="text-2xl font-medium text-gray-900">
                                {section.title}
                              </h2>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                      >
                        <Image
                          className="mt-6 ml-6"
                          src="image.svg"
                          alt="image"
                          width={300}
                          height={300}
                        />
                      </motion.div>
                    </motion.div>

                    {/* Content Area */}
                    <motion.div
                      className="flex-1 overflow-y-auto p-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                    >
                      {/* Main Content Grid */}
                      {section.component ? (
                        section.component
                      ) : (
                        <motion.div
                          className="mt-46 grid grid-cols-1 lg:grid-cols-2"
                          initial="hidden"
                          animate="visible"
                          variants={{
                            hidden: {},
                            visible: {
                              transition: {
                                staggerChildren: 0.1,
                                delayChildren: 0.6,
                              },
                            },
                          }}
                        >
                          {section.content.items &&
                            section.content.items.map((item, itemIndex) => {
                              const [title] = item.split(' - ');
                              return (
                                <motion.div
                                  key={itemIndex}
                                  className="mb-6 flex w-fit items-center space-x-2 rounded-full bg-gray-100 p-3 transition-colors hover:bg-blue-100"
                                  variants={itemVariants}
                                  whileHover={{
                                    scale: 1.05,
                                    backgroundColor: '#dbeafe',
                                    transition: {
                                      type: 'spring',
                                      stiffness: 300,
                                      damping: 20,
                                    },
                                  }}
                                >
                                  <motion.div
                                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                      type: 'spring',
                                      stiffness: 300,
                                      damping: 20,
                                      delay: 0.7 + itemIndex * 0.1,
                                    }}
                                  >
                                    <span className="text-xs font-medium text-white">
                                      {String(itemIndex + 1).padStart(2, '0')}
                                    </span>
                                  </motion.div>
                                  <div>
                                    <h3 className="text-md rounded-full font-light text-gray-900">
                                      {title}
                                    </h3>
                                  </div>
                                </motion.div>
                              );
                            })}
                        </motion.div>
                      )}
                      {activeSection === 0 && ( // Render FileUpload only for the 'work-process' section
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8, duration: 0.4 }}
                          className="-mt-24 mb-16"
                        >
                          <h3 className="mb-4 text-xl font-medium text-gray-900">
                            Upload Your Resume
                          </h3>
                          <FileUpload onUpload={setParsedResume} />
                        </motion.div>
                      )}

                      <motion.div
                        className="flex items-center justify-center gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.4 }}
                      >
                        <div className="h-1 w-full rounded-full bg-gray-200">
                          <motion.div
                            className="h-1 rounded-full bg-blue-600"
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{
                              duration: 10,
                              ease: 'easeOut',
                              delay: 1.2,
                            }}
                          />
                        </div>
                        <div className="flex justify-end gap-4">
                          <motion.div
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          >
                            <ArrowLeft
                              className="h-4 w-4 cursor-pointer text-gray-600 transition-colors duration-300 hover:text-blue-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveSection(
                                  activeSection > 0 ? activeSection - 1 : sections.length - 1
                                );
                              }}
                            />
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          >
                            <ArrowRight
                              className="h-4 w-4 cursor-pointer text-gray-600 transition-colors duration-300 hover:text-blue-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveSection(
                                  activeSection < sections.length - 1 ? activeSection + 1 : 0
                                );
                              }}
                            />
                          </motion.div>
                        </div>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingPage;
