'use client';
import { Briefcase, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useAuth } from '@clerk/nextjs';

function Header() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSignedIn } = useAuth();

  const items = [
    { label: 'Job Matches', href: '/matches' },
    { label: 'Applications', href: '/applications' },
    { label: 'My Profile', href: '/profile' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogoClick = () => {
    // If signed in, go to matches; otherwise go to landing page
    router.push(isSignedIn ? '/matches' : '/');
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-black backdrop-blur-sm dark:bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between lg:h-20">
            {/* Logo */}

            <div
              className="group flex items-center gap-1 transition-all duration-300 hover:scale-105 hover:cursor-pointer"
              onClick={handleLogoClick}
            >
              {/* Optional icon */}
              {/* <Briefcase className="h-8 w-8 lg:h-10 lg:w-10 text-blue-600 group-hover:text-blue-700 transition-colors duration-300" /> */}

              <h1 className="font-sans text-2xl font-bold text-black lg:text-3xl">Hir&apos;</h1>

              {/* 'in' part inside a blue box */}
              <h1 className="rounded bg-blue-600 px-1 text-2xl font-bold text-white lg:text-3xl dark:bg-blue-600">
                in
              </h1>
            </div>

            {/* Desktop Navigation */}

            <div className="hidden gap-8 md:flex">
              {items.map((item) => (
                <div
                  key={item.href}
                  className="group relative transition-all duration-300 hover:scale-105 hover:cursor-pointer"
                  onClick={() => router.push(item.href)}
                >
                  <span className="font-poppins text-sm text-white md:text-base dark:text-black">
                    {item.label}
                  </span>
                  <div className="absolute -bottom-1 left-0 h-0.5 w-0 bg-blue-500 transition-all duration-300 group-hover:w-full"></div>
                </div>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Get a Job Button - Desktop */}
              {!isSignedIn && (
                <button
                  className="h rounded-font-medium hidden items-center gap-2 bg-black px-6 py-3 text-sm text-white transition-all duration-300 hover:bg-black/85 md:flex lg:text-base"
                  onClick={() => router.push('/sign-in')}
                >
                  Get a Job
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                className="rounded-lg p-2 transition-colors duration-300 hover:bg-slate-800/50 md:hidden dark:hover:bg-gray-100"
                onClick={toggleMobileMenu}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6 text-gray-200 dark:text-gray-700" />
                ) : (
                  <Menu className="h-6 w-6 text-gray-200 dark:text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-slate-700 bg-slate-900/95 backdrop-blur-sm md:hidden dark:border-gray-200 dark:bg-white/95">
            <div className="space-y-1 px-4 py-3">
              {items.map((item) => (
                <div
                  key={item.href}
                  className="block cursor-pointer rounded-lg px-4 py-3 text-gray-200 transition-all duration-300 hover:bg-slate-800/50 hover:text-white dark:text-gray-700 dark:hover:bg-gray-100 dark:hover:text-gray-900"
                  onClick={() => {
                    router.push(item.href);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {item.label}
                </div>
              ))}

              {/* Mobile Get a Job Button */}
              {!isSignedIn && (
                <button
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 font-medium text-white transition-all duration-300 hover:scale-[1.02] hover:bg-black/85 active:scale-95"
                  onClick={() => {
                    router.push('/sign-in');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Briefcase className="h-4 w-4" />
                  Get a Job
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}

export default Header;
