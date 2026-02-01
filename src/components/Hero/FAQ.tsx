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
    answer:
      'Hirin is an AI-powered job search platform that helps you discover, match, and apply for jobs automatically. It analyzes your profile, skills, and preferences to connect you with roles that best fit your background, while streamlining the application process to save you time.',
  },
  {
    question: 'How does Hirin optimize my résumé for job applications?',
    answer:
      'Hirin scans your résumé and compares it against job descriptions to identify skill gaps, keyword mismatches, and formatting issues. It suggests enhancements to improve your chances with applicant tracking systems (ATS) and provides one-click updates to align your résumé with each application.',
  },
  {
    question: 'Can I track my job applications and interviews on Hirin?',
    answer:
      'Absolutely! Hirin includes a built-in dashboard that helps you monitor your applications, interview schedules, status updates, and feedback — all in one place. No more juggling spreadsheets or losing track of where youve applied.',
  },
  {
    question: 'Is Hirin suitable for freshers and experienced professionals?',
    answer:
      'Yes! Whether youre a fresher starting your career or an experienced professional seeking your next challenge, Hirin customizes job matches and application strategies based on your level, skills, and goals. It ensures your applications stand out, no matter where you are in your career.',
  },
];

const variant = [{ name: 'blue', color: '#126fff' }];

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const selectedVariant = variant[0];

  const toggle = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index));
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
            } group transition-all duration-300`}
            initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            viewport={{ once: true }}
          >
            <button
              onClick={() => toggle(actualIndex)}
              className="group flex w-full items-center justify-between py-4 sm:py-5"
            >
              <span className="pr-4 text-left text-lg font-medium text-black sm:text-xl lg:text-2xl">
                {item.question}
              </span>
              <ChevronRight
                className={`h-6 w-6 flex-shrink-0 transform text-blue-400 transition-transform duration-300 group-hover:text-blue-600 sm:h-7 sm:w-7 ${
                  activeIndex === actualIndex ? 'rotate-90' : ''
                } group-hover:translate-x-1`}
              />
            </button>
            <div
              className={`absolute bottom-0 left-0 h-0.5 origin-left scale-x-0 transform bg-blue-500 transition-all duration-500 group-hover:scale-x-100 ${
                activeIndex === actualIndex ? 'scale-x-100' : ''
              }`}
              style={{ width: '100%' }}
            />
            <div
              className={`overflow-hidden transition-all duration-500 ${
                activeIndex === actualIndex ? 'max-h-96 sm:max-h-48' : 'max-h-0'
              }`}
            >
              <p className="p-4 text-base leading-relaxed text-gray-600 sm:text-lg">
                {item.answer}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white font-sans">
      {/* Background decorative elements */}
      <div className="absolute top-16 right-8 h-[200px] w-[200px] rounded-full bg-gradient-to-br from-blue-600 to-blue-800 opacity-10 blur-3xl sm:top-32 sm:right-32 sm:h-[300px] sm:w-[300px] lg:h-[500px] lg:w-[500px]"></div>
      <div className="absolute bottom-16 left-8 h-[200px] w-[200px] rounded-full bg-gradient-to-br from-blue-600 to-blue-800 opacity-10 blur-3xl sm:bottom-32 sm:left-32 sm:h-[300px] sm:w-[300px] lg:h-[500px] lg:w-[500px]"></div>

      <div className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* Main FAQ Content */}
        <motion.div
          className="flex max-w-7xl flex-col gap-8 lg:flex-row lg:gap-12"
          initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          viewport={{ once: true }}
        >
          <div className="lg:flex-shrink-0">
            <h2 className="mb-8 text-center text-4xl font-bold text-black sm:text-6xl lg:mb-12 lg:text-left lg:text-8xl xl:text-9xl">
              FAQ
            </h2>
          </div>
          <div className="flex-1">{renderFAQSection(firstSection, 0)}</div>
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
        className="relative z-20 w-full max-w-6xl px-4 pt-20 text-center sm:px-8 sm:pt-32 lg:px-40 lg:pt-40"
        initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.4 }}
        viewport={{ once: true }}
      >
        <div className="rounded-2xl p-6 text-black sm:p-8">
          <h3 className="mb-4 text-xl font-bold sm:text-2xl lg:text-3xl">
            Ready to Start Your Success Story?
          </h3>
          <p className="mx-auto mb-6 max-w-2xl text-base opacity-90 sm:text-lg">
            Join thousands of students who have transformed their careers with Hir&apos;in
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button className="w-full rounded-full border border-blue-200 bg-white px-6 py-3 font-semibold text-blue-600 transition-colors hover:bg-gray-100 sm:w-auto sm:px-8">
              Get Started Today
            </button>
            <GlowButton
              variant={selectedVariant.name}
              className="font-poppins w-full rounded-full py-3 font-sans sm:w-auto"
            >
              View All Stories
            </GlowButton>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FAQ;
