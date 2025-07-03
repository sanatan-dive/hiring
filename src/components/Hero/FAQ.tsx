'use client';
import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: 'What is Hirin?',
    answer: 'Hirin is an AI-powered job search platform that helps you discover, match, and apply for jobs automatically. It analyzes your profile, skills, and preferences to connect you with roles that best fit your background, while streamlining the application process to save you time.'
  },
  {
    question: 'How does Hirin optimize my résumé for job applications?',
    answer: 'Hirin scans your résumé and compares it against job descriptions to identify skill gaps, keyword mismatches, and formatting issues. It suggests enhancements to improve your chances with applicant tracking systems (ATS) and provides one-click updates to align your résumé with each application.'
  },
  {
    question: 'Can I track my job applications and interviews on Hirin?',
    answer: 'Absolutely! Hirin includes a built-in dashboard that helps you monitor your applications, interview schedules, status updates, and feedback — all in one place. No more juggling spreadsheets or losing track of where youve applied.'
  },
  {
    question: 'Is Hirin suitable for freshers and experienced professionals?',
    answer: 'Yes! Whether youre a fresher starting your career or an experienced professional seeking your next challenge, Hirin customizes job matches and application strategies based on your level, skills, and goals. It ensures your applications stand out, no matter where you are in your career.'
  }
];

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setActiveIndex(prev => (prev === index ? null : index));
  };

  const firstSection = faqData.slice(0, 2);
  const secondSection = faqData.slice(2, 4);

  const renderFAQSection = (items: FAQItem[], startIndex: number) => (
    <div className="space-y-6">
      {items.map((item, index) => {
        const actualIndex = startIndex + index;
        return (
          <div
            key={actualIndex}
            className={`relative border-b-2 ${
              activeIndex === actualIndex ? 'border-blue-500' : 'border-blue-100'
            } transition-all duration-300 group`}
          >
            <button
              onClick={() => toggle(actualIndex)}
              className="w-full flex items-center justify-between py-5 group"
            >
              <span className="text-2xl font-medium text-black text-left">
                {item.question}
              </span>
              <ChevronRight
                className={`w-7 h-7 text-blue-400 group-hover:text-blue-600 transform transition-transform duration-300 ${
                  activeIndex === actualIndex ? 'rotate-90' : ''
                } group-hover:translate-x-1`}
              />
            </button>
            <div
              className={`absolute bottom-0 left-0 h-0.5 bg-blue-500 transition-all duration-500 transform scale-x-0 origin-left group-hover:scale-x-100 ${
                activeIndex === actualIndex ? 'scale-x-100' : ''
              }`}
              style={{ width: '100%' }}
            />
            <div
              className={`overflow-hidden transition-all duration-500 ${
                activeIndex === actualIndex ? 'max-h-48' : 'max-h-0'
              }`}
            >
              <p className="text-gray-600 text-lg p-4">
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-white min-h-screen  flex flex-col justify-center p-12 font-poppins  relative ">
       <div className="absolute top-32 right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-600 to-blue-800 opacity-10 blur-3xl"></div>
        <div className="absolute bottom-32 left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-600 to-blue-800 opacity-10 blur-3xl"></div>
      <div className='container max-w-7xl mx-auto z-50'>
        <div className='flex gap-12 max-w-7xl '>
        <h2 className="text-9xl font-bold text-black mb-12 text-left">FAQ</h2>
        
         
            {renderFAQSection(firstSection, 0)}
          
    
        </div>
        <div className="space-y-8">
            {renderFAQSection(secondSection, 2)}
          </div>
      </div>
      
    </div>
  );
};

export default FAQ;