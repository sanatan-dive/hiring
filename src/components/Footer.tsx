'use client';
import { useRouter } from 'next/navigation';
import React from 'react';
import { Mail, Phone, Linkedin, Twitter, Github } from 'lucide-react';

function Footer() {
  const router = useRouter();

  const navigationLinks = [
    { name: 'About', href: '/about' },
    { name: 'Services', href: '/services' },
    { name: 'Careers', href: '/careers' },
    { name: 'Contact', href: '/contact' },
  ];

  const legalLinks = [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
  ];

  const socialLinks = [
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Github, href: '#', label: 'GitHub' },
  ];

  return (
    <footer className="font-poppins border-t border-gray-200 bg-white text-black">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="grid grid-cols-1 gap-6 py-6 md:grid-cols-3 lg:grid-cols-4">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div
              className="group mb-3 flex items-center gap-1 transition-all duration-300 hover:scale-105 hover:cursor-pointer"
              onClick={() => router.push('/')}
            >
              <h1 className="font-sans text-xl font-bold text-black lg:text-2xl">Hir&apos;</h1>
              <h1 className="rounded bg-blue-600 px-1 text-xl font-bold text-white lg:text-2xl">
                in
              </h1>
            </div>
            <p className="mb-3 max-w-sm text-sm text-gray-600">
              Find jobs that fit your skills and get your applications tailored automatically.
            </p>
            <div className="flex flex-col space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                <span>contact@hirin.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                <span>+91 12345 67890</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">Company</h3>
            <ul className="space-y-1">
              {navigationLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-xs text-gray-600 transition-colors duration-200 hover:text-blue-600"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">Legal</h3>
            <ul className="space-y-1">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-xs text-gray-600 transition-colors duration-200 hover:text-blue-600"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom footer */}
        <div className="flex flex-col items-center justify-between border-t border-gray-200 py-3 md:flex-row">
          <div className="mb-2 text-xs text-gray-600 md:mb-0">
            © 2024 Hir&apos;in. All rights reserved.
          </div>

          {/* Social Links */}
          <div className="flex space-x-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="text-gray-400 transition-colors duration-200 hover:text-blue-600"
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
