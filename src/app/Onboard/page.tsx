"use client";
import React, { useState } from 'react';
import { Settings, Cog, Users, Clock, DollarSign, ChevronRight, ArrowDownRight, ChevronLeft } from 'lucide-react';
import Image from 'next/image';

const OnboardingPage = () => {
  const [activeSection, setActiveSection] = useState(0);

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

  const handleSectionClick = (index) => {
    setActiveSection(activeSection === index ? -1 : index);
  };

  const getAdditionalDescription = (sectionId) => {
    switch(sectionId) {
      case 'work-process':
        return "Ready to start your flexible work journey? Here's what you need to know to get up and running.";
      case 'cutting-edge':
        return "Access to premium tools and technologies to enhance your development workflow.";
      case 'financial-security':
        return "Comprehensive financial package designed to support your career growth and financial goals.";
      case 'paid-leave':
        return "Flexible time-off policies that prioritize your well-being and work-life balance.";
      case 'dynamic-teamwork':
        return "Join a collaborative culture where innovation thrives and every team member contributes to success.";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8 font-poppins">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Your Journey</h1>
          <p className="text-lg text-gray-600">Discover what makes our workplace special</p>
        </div>

        {/* Horizontal Collapsible Sections */}
        <div className="flex  gap-4 h-[600px]">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-500 ease-in-out cursor-pointer ${
                activeSection === index 
                  ? 'flex-1' 
                  : 'w-20 hover:w-24'
              }`}
              onClick={() => handleSectionClick(index)}
            >
              {/* Collapsed State - Vertical Title */}
              {activeSection !== index && (
                <div className="h-full flex flex-col p-4  bg-gray-200">
                  
                  <h2 className="text-lg font-medium text-gray-900 transform -rotate-90 mt-90 whitespace-nowrap">
                    {section.title}
                  </h2>
                 <div>
                   <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white mb-4">
                    {React.cloneElement(<ChevronRight/>, { className: "w-6 h-6 hover:transform-rotate-90" })}
                  </div>

                 </div>
                </div>
              )}

              {/* Expanded State - Full Content */}
              {activeSection === index && (
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="p-6 border-b border-dashed border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white">
                        {section.icon}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                       
                      </div>
                      
                    </div>
                   <Image
                   src='image.svg'
                   alt='image'
                   width={300}
                   height={300}
                   />
                  </div>

                  {/* Content Area - Scrollable */}
                  <div className="flex-1 overflow-y-hidden p-6">
                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2  mt-60">
                      {section.content.items.map((item, itemIndex) => {
                        const [title] = item.split(' - ');
                        return (
                          <div key={itemIndex} className="flex items-center space-x-2 p-3 bg-gray-100 rounded-full hover:bg-blue-100 transition-colors mb-6  w-fit">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-medium">{String(itemIndex + 1).padStart(2, '0')}</span>
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 rounded-full text-md ">{title}</h3>
                             
                            </div>
                          </div>
                        );
                      })}
                      <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        let i = 0
                        setActiveSection(i--)
                  
                      }}
                      className="w-8 h-8 border-2 border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                       <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        let i = 0
                        setActiveSection(i++)
                  
                      }}
                      className="w-8 h-8 border-2 border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                    </div>

                    
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

       

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Ready to Get Started?</h3>
            <p className="text-gray-600 mb-4 text-sm">
              You've explored all the amazing benefits and opportunities we offer. 
              We're excited to have you join our team and look forward to your contributions.
            </p>
            <div className="flex justify-center space-x-4">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm">
                Continue Onboarding
              </button>
              <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm">
                Save for Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;