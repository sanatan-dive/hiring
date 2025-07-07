'use client';
import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import GlowButton from '../ui/glow-button';
import { motion } from 'framer-motion';

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

const variant = [
  { name: 'blue', color: '#126fff' }
];

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const selectedVariant = variant[0];

  const toggle = (index: number) => {
    setActiveIndex(prev => (prev === index ? null : index));
  };

  const firstSection = faqData.slice(0, 2);
  const secondSection = faqData.slice(2, 4);

  const renderFAQSection = (items: FAQItem[], startIndex: number) => (
    <div className="space-y-4 sm:space-y-6">
      {items.map((item, index) => {
        const actualIndex = startIndex + index;
        return (
          <motion.div
            key={actualIndex}
            className={`relative border-b-2 ${
              activeIndex === actualIndex ? 'border-blue-500' : 'border-blue-100'
            } transition-all duration-300 group`}
            initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            viewport={{ once: true }}
          >
            <button
              onClick={() => toggle(actualIndex)}
              className="w-full flex items-center justify-between py-4 sm:py-5 group"
            >
              <span className="text-lg sm:text-xl lg:text-2xl font-medium text-black text-left pr-4">
                {item.question}
              </span>
              <ChevronRight
                className={`w-6 h-6 sm:w-7 sm:h-7 text-blue-400 group-hover:text-blue-600 transform transition-transform duration-300 flex-shrink-0 ${
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
                activeIndex === actualIndex ? 'max-h-96 sm:max-h-48' : 'max-h-0'
              }`}
            >
              <p className="text-gray-600 text-base sm:text-lg p-4 leading-relaxed">
                {item.answer}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-white min-h-screen flex flex-col justify-center items-center font-sans relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-16 sm:top-32 right-8 sm:right-32 w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] lg:w-[500px] lg:h-[500px] rounded-full bg-gradient-to-br from-blue-600 to-blue-800 opacity-10 blur-3xl"></div>
      <div className="absolute bottom-16 sm:bottom-32 left-8 sm:left-32 w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] lg:w-[500px] lg:h-[500px] rounded-full bg-gradient-to-br from-blue-600 to-blue-800 opacity-10 blur-3xl"></div>
      
      <div className="w-full max-w-7xl mx-auto pt-8 px-4 sm:px-6 lg:px-8">
        {/* Main FAQ Content */}
        <motion.div
          className="flex flex-col lg:flex-row gap-8 lg:gap-12 max-w-7xl"
          initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          viewport={{ once: true }}
        >
          <div className="lg:flex-shrink-0">
            <h2 className="text-4xl sm:text-6xl lg:text-8xl xl:text-9xl font-bold text-black mb-8 lg:mb-12 text-center lg:text-left">
              FAQ
            </h2>
          </div>
          <div className="flex-1">
            {renderFAQSection(firstSection, 0)}
          </div>
        </motion.div>

        <motion.div
          className="mt-8 lg:mt-12"
          initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
          viewport={{ once: true }}
        >
          {renderFAQSection(secondSection, 2)}
        </motion.div>
      </div>

      {/* Call to Action Section */}
      <motion.div
        className="relative z-20 text-center px-4 sm:px-8 lg:px-40 pt-20 sm:pt-32 lg:pt-40 w-full max-w-6xl"
        initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.4 }}
        viewport={{ once: true }}
      >
        <div className="rounded-2xl p-6 sm:p-8 text-black">
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4">
            Ready to Start Your Success Story?
          </h3>
          <p className="text-base sm:text-lg mb-6 opacity-90 max-w-2xl mx-auto">
            Join thousands of students who have transformed their careers with Hir&apos;in
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="w-full sm:w-auto bg-white text-blue-600 px-6 sm:px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors border border-blue-200">
              Get Started Today
            </button>
            <GlowButton variant={selectedVariant.name} className="w-full sm:w-auto font-sans py-3 font-poppins rounded-full">
              View All Stories
            </GlowButton>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FAQ;
