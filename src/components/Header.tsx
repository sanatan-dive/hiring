"use client";
import { Briefcase, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

function Header() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const items = [
    { label: "Job Matches", href: "/matches" },
    { label: "Applications", href: "/applications" },
    { label: "My Profile", href: "/profile" }
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <header className="dark:bg-white bg-black sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Logo */}
           
<div
  className="flex items-center gap-1 hover:cursor-pointer group hover:scale-105 transition-all duration-300"
  onClick={() => router.push("/")}
>
  {/* Optional icon */}
  {/* <Briefcase className="h-8 w-8 lg:h-10 lg:w-10 text-blue-600 group-hover:text-blue-700 transition-colors duration-300" /> */}

  
  <h1 className="text-2xl lg:text-3xl font-bold text-black font-sans">
    Hir&apos;
  </h1>

  {/* 'in' part inside a blue box */}
  <h1 className="text-2xl lg:text-3xl font-bold text-white bg-blue-600 dark:bg-blue-600 rounded px-1">
    in
  </h1>
</div>

            {/* Desktop Navigation */}
          
      <div className="hidden md:flex gap-8">
        {items.map((item) => (
          <div
            key={item.href}
            className="relative group hover:cursor-pointer hover:scale-105 transition-all duration-300"
            onClick={() => router.push(item.href)}
          >
            <span className="text-white dark:text-black font-poppins text-sm md:text-base">
              {item.label}
            </span>
            <div className="absolute left-0 -bottom-1 h-0.5 bg-blue-500 w-0 group-hover:w-full transition-all duration-300"></div>
          </div>
        ))}
      </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Get a Job Button - Desktop */}
              <button
                className="hidden md:flex items-center h gap-2 bg-black hover:bg-black/85  text-white px-6 py-3 rounded-font-medium text-sm lg:text-base transition-all duration-300 "
                onClick={() => router.push("/Onboard")}
              >
                
                Get a Job
              </button>

            

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-slate-800/50 dark:hover:bg-gray-100 transition-colors duration-300"
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
          <div className="md:hidden border-t border-slate-700 dark:border-gray-200 bg-slate-900/95 dark:bg-white/95 backdrop-blur-sm">
            <div className="px-4 py-3 space-y-1">
              {items.map((item) => (
                <div
                  key={item.href}
                  className="block px-4 py-3 rounded-lg text-gray-200 dark:text-gray-700 hover:bg-slate-800/50 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all duration-300 cursor-pointer"
                  onClick={() => {
                    router.push(item.href);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {item.label}
                </div>
              ))}
              
              {/* Mobile Get a Job Button */}
              <button
                className="w-full mt-3 flex items-center justify-center gap-2 bg-black hover:bg-black/85  text-white px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-[1.02] active:scale-95"
                onClick={() => {
                  router.push("/Onboard");
                  setIsMobileMenuOpen(false);
                }}
              >
                <Briefcase className="h-4 w-4" />
                Get a Job
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

export default Header;