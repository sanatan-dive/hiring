"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Cog, Users, Clock, DollarSign, ArrowDownRight, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { useInView,Variants } from "framer-motion";
import Image from 'next/image';

const OnboardingPage = () => {
  const [activeSection, setActiveSection] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start({ width: "100%" });
    }
  }, [isInView, controls]);

  const sections = [
    {
      id: 'work-process',
      title: 'Work process',
      icon: <ArrowDownRight className='h-16 '/>,
      content: {
        description: "Our flexible work environment is designed to help you thrive while maintaining work-life balance.",
        items: [
          'Flexible remote work - Work from anywhere in the world with stable internet',
          'Flexible 40-hour working week - Choose your own schedule within core hours',
          'Open-minded team - Collaborate with diverse professionals from different backgrounds',
          'Accountant support and tax coverage - Full financial assistance for contractors'
        ]
      },
      additionalContent: {
        title: 'Getting Started',
        sections: [
          {
            title: 'Setup Checklist',
            items: ['Home office setup guide', 'VPN and security tools', 'Communication platforms', 'Time tracking software']
          },
          {
            title: 'Support Resources',
            items: ['24/7 IT support', 'Ergonomic equipment stipend', 'Internet reimbursement', 'Wellness programs']
          }
        ]
      }
    },
    {
      id: 'cutting-edge',
      title: 'Cutting-edge tools',
      icon: <Cog className="w-8 h-8" />,
      content: {
        description: "Stay ahead with the latest technology and tools that enhance your productivity.",
        items: [
          'Latest development frameworks - React, Vue, Angular, Node.js and modern tech stack',
          'AI-powered development tools - GitHub Copilot, ChatGPT Plus, and AI coding assistants',
          'Cloud infrastructure access - AWS, Google Cloud, Azure credits and premium accounts',
          'Premium software licenses - JetBrains, Adobe Creative Suite, and professional tools'
        ]
      },
      additionalContent: {
        title: 'Tools & Resources',
        sections: [
          {
            title: 'Development Tools',
            items: ['VS Code / JetBrains IDEs', 'Docker & Kubernetes', 'Git & GitHub Enterprise', 'CI/CD Pipeline Tools']
          },
          {
            title: 'Learning Resources',
            items: ['Pluralsight subscription', 'Conference attendance', 'Online course credits', 'Technical book allowance']
          }
        ]
      }
    },
    {
      id: 'financial-security',
      title: 'Financial security',
      icon: <DollarSign className="w-8 h-8" />,
      content: {
        description: "Comprehensive financial benefits to secure your future and peace of mind.",
        items: [
          'Competitive salary packages - Above market rates with annual reviews',
          'Performance-based bonuses - Quarterly bonuses based on project success',
          'Stock options available - Equity participation in company growth',
          'Retirement planning support - 401k matching and financial planning assistance'
        ]
      },
      additionalContent: {
        title: 'Financial Benefits',
        sections: [
          {
            title: 'Salary & Benefits',
            items: ['Competitive base salary', 'Annual salary reviews', 'Health insurance coverage', 'Dental & vision plans']
          },
          {
            title: 'Growth Incentives',
            items: ['Performance bonuses', 'Stock option plans', 'Profit sharing', 'Referral bonuses']
          }
        ]
      }
    },
    {
      id: 'paid-leave',
      title: 'Paid leave options',
      icon: <Clock className="w-8 h-8" />,
      content: {
        description: "Take time off when you need it most with our generous leave policies.",
        items: [
          'Unlimited PTO policy - Take time off when you need it, no questions asked',
          'Paid sick leave - Full pay during illness with no deductions',
          'Parental leave benefits - 12 weeks paid leave for new parents',
          'Mental health days - Dedicated days off for mental wellness and self-care'
        ]
      },
      additionalContent: {
        title: 'Time Off Policies',
        sections: [
          {
            title: 'Time Off Types',
            items: ['Vacation days', 'Personal days', 'Sick leave', 'Bereavement leave']
          },
          {
            title: 'Special Leave',
            items: ['Maternity/Paternity leave', 'Medical leave', 'Sabbatical options', 'Volunteer time off']
          }
        ]
      }
    },
    {
      id: 'dynamic-teamwork',
      title: 'Dynamic teamwork',
      icon: <Users className="w-8 h-8" />,
      content: {
        description: "Join a collaborative environment where every voice matters and innovation thrives.",
        items: [
          'Cross-functional collaboration - Work with design, product, and engineering teams',
          'Regular team building events - Monthly virtual and in-person team activities',
          'Mentorship programs - Paired with senior developers for career growth',
          'Open communication culture - Transparent feedback and regular one-on-ones'
        ]
      },
      additionalContent: {
        title: 'Team Collaboration',
        sections: [
          {
            title: 'Collaboration Tools',
            items: ['Slack/Teams communication', 'Agile project management', 'Video conferencing', 'Shared documentation']
          },
          {
            title: 'Team Activities',
            items: ['Weekly team meetings', 'Monthly social events', 'Quarterly offsites', 'Annual company retreat']
          }
        ]
      }
    }
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
        delayChildren: 0.3
      }
    }
  };

  const cardVariants: Variants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  return (
    <div className="min-h-screen bg-white p-8 font-poppins">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text mb-24"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-6xl font-medium text-gray-900 mb-4">Onboard with us</h1>
        </motion.div>

        {/* Horizontal Collapsible Sections */}
        <motion.div 
          className="flex gap-6 h-[650px]"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer ${
                activeSection === index 
                  ? 'flex-1' 
                  : 'w-30'
              }`}
              variants={cardVariants}
              onClick={() => handleSectionClick(index)}
              
              animate={{
                width: activeSection === index ? "auto" : "120px",
                transition: { 
                  type: "spring", 
                  stiffness: 100, 
                  damping: 15,
                  duration: 0.6
                }
              }} 
            >
              {/* Collapsed State - Vertical Title */}
              <AnimatePresence mode="wait">
                {activeSection !== index && (
                  <motion.div 
                    className="h-full flex flex-col gap-32 justify-center items-center p-4 bg-gray-100"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >    
                    <motion.h2 
                      className="text-2xl font-[500] text-gray-900 transform -rotate-90 mt-88 whitespace-nowrap"
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
                        transition: { type: "spring", stiffness: 300, damping: 20 }
                      }}
                      initial={{ rotate: 0, scale: 1 }}
                      animate={{ rotate: 0, scale: 1 }}
                    >
                      <div className="w-16 h-16 border border-blue-700 rounded-full flex items-center mt-4 justify-center text-blue-700 mb-4 transition-all duration-300">
                        <svg className="rotate-45 w-7 h-7" viewBox="0 0 32 32" fill='currentColor'>
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
                    className="h-full flex flex-col shadow-2xl"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    {/* Header */}
                    <motion.div 
                      className='grid grid-cols-2'
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                    >
                      <div>
                        <motion.div 
                          className="w-18 h-18 bg-blue-600 rounded-full ml-6 mt-6 flex items-center justify-center text-white"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ 
                            type: "spring", 
                            stiffness: 200, 
                            damping: 15,
                            delay: 0.2
                          }}
                        >
                          <svg 
                            className="w-8 h-8 rotate-45 text-white" 
                            viewBox="0 0 32 32" 
                            fill="currentColor" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M1.116 17.116c-0.617 0-1.116-0.5-1.116-1.116s0.5-1.116 1.116-1.116v2.233zM31.673 15.211c0.436 0.436 0.436 1.143 0 1.579l-7.104 7.104c-0.436 0.436-1.143 0.436-1.579 0s-0.436-1.143 0-1.579l6.315-6.315-6.315-6.315c-0.436-0.436-0.436-1.143 0-1.579s1.143-0.436 1.579 0l7.104 7.104zM1.116 14.884h29.767v2.233h-29.767v-2.233z"/>
                          </svg>
                        </motion.div>

                        <motion.div 
                          className="p-6 border-b border-dashed border-gray-100 flex items-center justify-between"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.4 }}
                        >
                          <div className="flex flex-col items-center space-x-4">
                            <div>
                              <h2 className="text-2xl font-medium text-gray-900">{section.title}</h2>                       
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
                          className='ml-6 mt-6'
                          src='image.svg'
                          alt='image'
                          width={300}
                          height={300}
                        />
                      </motion.div>
                    </motion.div>

                    {/* Content Area */}
                    <motion.div 
                      className="flex-1 overflow-y-hidden p-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                    >
                      {/* Main Content Grid */}
                      <motion.div 
                        className="grid grid-cols-1 lg:grid-cols-2 mt-46"
                        initial="hidden"
                        animate="visible"
                        variants={{
                          hidden: {},
                          visible: {
                            transition: {
                              staggerChildren: 0.1,
                              delayChildren: 0.6
                            }
                          }
                        }}
                      >
                        {section.content.items.map((item, itemIndex) => {
                          const [title] = item.split(' - ');
                          return (
                            <motion.div 
                              key={itemIndex} 
                              className="flex items-center space-x-2 p-3 bg-gray-100 rounded-full hover:bg-blue-100 transition-colors mb-6 w-fit"
                              variants={itemVariants}
                              whileHover={{ 
                                scale: 1.05,
                                backgroundColor: "#dbeafe",
                                transition: { type: "spring", stiffness: 300, damping: 20 }
                              }}
                            >
                              <motion.div 
                                className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ 
                                  type: "spring", 
                                  stiffness: 300, 
                                  damping: 20,
                                  delay: 0.7 + itemIndex * 0.1
                                }}
                              >
                                <span className="text-white text-xs font-medium">{String(itemIndex + 1).padStart(2, '0')}</span>
                              </motion.div>
                              <div>
                                <h3 className="font-light text-gray-900 rounded-full text-md">{title}</h3>
                              </div>
                            </motion.div>
                          );
                        })}
                      </motion.div>

                      <motion.div 
                        className='flex items-center justify-center gap-4'
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.4 }}
                      >
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <motion.div 
                            className="h-1 rounded-full bg-blue-600"
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ 
                              duration: 10,
                              ease: "easeOut",
                              delay: 1.2
                            }}
                          />
                        </div>
                        <div className='flex justify-end gap-4'>
                          <motion.div
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          >
                            <ArrowLeft 
                              className="w-4 h-4 text-gray-600 cursor-pointer hover:text-blue-600 transition-colors duration-300" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveSection(activeSection > 0 ? activeSection - 1 : sections.length - 1);
                              }}
                            />
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          >
                            <ArrowRight 
                              className="w-4 h-4 text-gray-600 cursor-pointer hover:text-blue-600 transition-colors duration-300" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveSection(activeSection < sections.length - 1 ? activeSection + 1 : 0);
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