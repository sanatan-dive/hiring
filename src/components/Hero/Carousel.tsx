'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import Image from 'next/image';
import StatCounter from '../ui/StatCounter';

interface CarouselItem {
  id: number;
  name: string;
  company: string;
  package: string;
  image: string;
  logo: string;
  location: string;
  year: string;
  rating: number;
  role: string;
}

interface CarouselProps {
  items: CarouselItem[];
  autoPlay?: boolean;
  autoPlayDelay?: number;
}

const Carousel: React.FC<CarouselProps> = ({
  items: propItems,
  autoPlay = true,
  autoPlayDelay = 6000,
}) => {
  const items = propItems;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (autoPlay && items.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex === items.length - 1 ? 0 : prevIndex + 1));
      }, autoPlayDelay);

      return () => clearInterval(interval);
    }
  }, [autoPlay, autoPlayDelay, items.length]);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? items.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === items.length - 1 ? 0 : currentIndex + 1);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const getSlidePosition = (index: number) => {
    const diff = index - currentIndex;
    if (diff === 0) return 'translate-x-0 translate-y-0 scale-75 z-30';
    if (diff === 1 || (diff === -(items.length - 1) && items.length > 2))
      return 'translate-x-56 translate-y-22 scale-55 z-10 opacity-85';
    if (diff === -1 || (diff === items.length - 1 && items.length > 2))
      return '-translate-x-56 translate-y-22 scale-55 z-10 opacity-90';
    return 'translate-x-64 translate-y-32 scale-50 z-0 opacity-0';
  };

  const getSlideBlur = (index: number) => {
    const diff = Math.abs(index - currentIndex);
    if (diff === 0) return '';
    if (diff === 1 || (diff === items.length - 1 && items.length > 2)) return 'blur-[0px]';
    return '';
  };

  const CompanyLogo = ({ company }: { company: string }) => {
    const logoMap: { [key: string]: string } = {
      Google: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg',
      Microsoft: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
      Amazon: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
      Apple: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
      Meta: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg',
      Netflix: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
    };

    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
        <Image
          src={logoMap[company] || ''}
          alt={`${company} logo`}
          width={24}
          height={24}
          className="object-contain"
        />
      </div>
    );
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-white font-sans">
      <div
        className="absolute inset-0 z-10"
        style={{
          backgroundImage: `
            radial-gradient(
              circle at center,
              rgba(21, 93, 252, 0.5),
              transparent 50%
            )    
          `,
          filter: 'blur(80px)',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div className="relative z-20">
        <div className="mb-4 ml-4 flex items-center gap-1 pt-20 sm:ml-40">
          <span className="z-10 text-2xl font-bold text-blue-600">—</span>
          <h1 className="z-10 text-2xl font-bold text-black sm:text-4xl">Success Stories</h1>
        </div>

        <div className="mt-6 ml-4 flex flex-col gap-2 sm:ml-44">
          <p className="sm:text-md text-sm font-light text-black/60">
            Hir&apos;in finds jobs that fit your skills and tailors your applications automatically.
          </p>
        </div>
      </div>

      <div className="relative flex h-[560px] items-center justify-center">
        {/* Carousel slides */}
        <div className="relative flex items-center justify-center">
          <div
            className="group absolute -left-175 z-40 flex flex-col items-end pt-32"
            onClick={goToPrevious}
          >
            <div className="-z-10 mb-8 h-[3px] w-[100px] rounded-full bg-gradient-to-l from-blue-600 to-blue-400 transition-colors duration-200"></div>
            <div className="-z-10 mb-6 h-[3px] w-[200px] rounded-full bg-gradient-to-l from-blue-600 to-blue-400 transition-colors duration-200"></div>
            <div className="ml-4 flex cursor-pointer items-center text-blue-600 transition-all duration-200 group-hover:text-blue-800">
              <ChevronLeft size={32} className="font-bold" />
              <div className="h-[3px] w-72 rounded-full bg-gradient-to-l from-blue-600 to-blue-400 transition-colors duration-200 hover:bg-gradient-to-l hover:from-blue-800 hover:to-blue-600"></div>
            </div>
            <div className="-z-10 mt-6 h-[3px] w-[200px] rounded-full bg-gradient-to-l from-blue-600 to-blue-400 transition-colors duration-200"></div>
            <div className="-z-10 mt-8 h-[3px] w-[100px] rounded-full bg-gradient-to-l from-blue-600 to-blue-400 transition-colors duration-200"></div>
          </div>

          <div
            className="group absolute -right-175 z-40 flex flex-col items-start pt-32"
            onClick={goToNext}
          >
            <div className="-z-10 mb-8 h-[3px] w-[100px] rounded-full bg-gradient-to-r from-blue-600 to-blue-400"></div>
            <div className="-z-10 mb-6 h-[3px] w-[200px] rounded-full bg-gradient-to-r from-blue-600 to-blue-400"></div>
            <div className="mr-4 flex cursor-pointer items-center text-blue-600 transition-all duration-200 group-hover:text-blue-800">
              <div className="h-[3px] w-72 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-colors duration-200 hover:bg-gradient-to-r hover:from-blue-800 hover:to-blue-600"></div>
              <ChevronRight size={32} />
            </div>
            <div className="-z-10 mt-6 h-[3px] w-[200px] rounded-full bg-gradient-to-r from-blue-600 to-blue-400"></div>
            <div className="-z-10 mt-8 h-[3px] w-[100px] rounded-full bg-gradient-to-r from-blue-600 to-blue-400"></div>
          </div>
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`hover:shadow-3xl absolute h-[580px] w-[420px] cursor-pointer overflow-hidden rounded-2xl shadow-2xl transition-all duration-700 ease-out ${getSlidePosition(index)} ${getSlideBlur(index)}`}
              onClick={() => goToSlide(index)}
            >
              {/* Background Image */}
              <div className="absolute inset-0 h-full w-full">
                <Image
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover"
                  width={420}
                  height={580}
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/50"></div>
              </div>

              {/* Content Overlay */}
              <div className="absolute inset-0 z-10 flex flex-col justify-between p-6">
                {/* Header with Company Logo and Package */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CompanyLogo company={item.company} />
                    <div>
                      <h3 className="text-xl font-bold text-white">{item.company}</h3>
                      <p className="text-sm text-gray-200">{item.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-200">{item.package}</div>
                    <div className="text-xs text-gray-200">Annual Package</div>
                  </div>
                </div>

                {/* Student Details */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-400 text-lg font-bold text-white">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{item.name}</h4>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={
                              i < item.rating ? 'fill-current text-yellow-400' : 'text-gray-400'
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-20 px-4 py-8 pt-24 sm:px-40">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="text-center">
            <StatCounter value={500} suffix="+" />
            <div className="text-sm text-gray-600">Students Placed</div>
          </div>
          <div className="text-center">
            <StatCounter value={15} suffix="+" />
            <div className="text-sm text-gray-600">Average Package</div>
          </div>
          <div className="text-center">
            <StatCounter value={10} suffix="+" />
            <div className="text-sm text-gray-600">Partner Companies</div>
          </div>
          <div className="text-center">
            <StatCounter value={90} suffix="%" />
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Carousel;
