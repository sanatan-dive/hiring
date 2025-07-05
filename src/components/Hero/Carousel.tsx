"use client"
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star,  } from 'lucide-react';
import Image from 'next/image';

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
  items, 
  autoPlay = false, 
  autoPlayDelay = 3000 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (autoPlay && items.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === items.length - 1 ? 0 : prevIndex + 1
        );
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
    if (diff === 0) return 'translate-x-0 translate-y-0 scale-90 z-30';
    if (diff === 1 || (diff === -(items.length - 1) && items.length > 2)) 
      return 'translate-x-74 translate-y-26 scale-70 z-10 opacity-90';
    if (diff === -1 || (diff === items.length - 1 && items.length > 2)) 
      return '-translate-x-74 translate-y-26 scale-70 z-10 opacity-90';
    return 'translate-x-64 translate-y-32 scale-50 z-0 opacity-0';
  };

  const getSlideBlur = (index: number) => {
    const diff = Math.abs(index - currentIndex);
    if (diff === 0) return '';
    if (diff === 1 || (diff === items.length - 1 && items.length > 2)) 
      return 'blur-[1px]';
    return '';
  };
  
  const CompanyLogo = ({ company }: { company: string }) => {
    const logoMap: { [key: string]: string } = {
      'Google': 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg',
      'Microsoft': 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
      'Amazon': 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
      'Apple': 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
      'Meta': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg',
      'Netflix': 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg'
    };

    return (
      <div className="w-16 h-16 bg-white/90  rounded-full flex items-center justify-center shadow-lg border-2 border-white/30">
        <Image 
          src={logoMap[company] || `https://ui-avatars.com/api/?name=${company}&background=3b82f6&color=fff&size=48`}
          alt={`${company} logo`}
          className="w-10 h-10 object-contain"
          width={48}
          height={48}
        />
      </div>
    );
  };

  return (
    <div className="w-full h-screen bg-black dark:bg-white flex  items-center justify-center relative ">
        
      {/* Left navigation */}
      <div className="absolute left-8 z-40 flex items-end flex-col group " onClick={goToPrevious}>
        <div className="w-[300px] h-[3px] bg-gradient-to-l from-blue-600 to-blue-400 transition-colors duration-200 mb-10 rounded-full "></div>
        <div className="ml-4 text-blue-600 group-hover:text-blue-800  transition-all duration-200 flex items-center cursor-pointer">
          <ChevronLeft size={32} className='font-bold'  />
          <div className="w-sm h-[3px] bg-gradient-to-l from-blue-600 to-blue-400 hover:bg-gradient-to-l hover:from-blue-800 hover:to-blue-600 transition-colors duration-200 rounded-full"></div>
        </div>
        <div className="w-[300px] h-[3px] bg-gradient-to-l from-blue-600 to-blue-400 transition-colors duration-200 mt-10 rounded-full"></div>
      </div>

      {/* Right navigation */}
      <div className="absolute right-8 z-40 flex items-start flex-col group " onClick={goToNext}>
         <div className="w-[300px] h-[3px] bg-gradient-to-r from-blue-600 to-blue-400 mb-10 rounded-full "></div>
        <div className="mr-4 text-blue-600 group-hover:text-blue-800  transition-all duration-200 flex items-center cursor-pointer">
            <div className="w-sm h-[3px] bg-gradient-to-r from-blue-600 to-blue-400 hover:bg-gradient-to-r hover:from-blue-800 hover:to-blue-600 transition-colors duration-200  rounded-full"></div>
          <ChevronRight size={32} />
        </div>
         <div className="w-[300px] h-[3px] bg-gradient-to-r from-blue-600 to-blue-400  mt-10 rounded-full "></div>
      </div>

      {/* Carousel slides */}
      <div className="relative flex justify-center mt-72  h-full">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`absolute w-[420px] h-[580px] rounded-2xl shadow-2xl transition-all duration-700 ease-out cursor-pointer hover:shadow-3xl overflow-hidden font-poppins ${getSlidePosition(index)} ${getSlideBlur(index)}`}
            onClick={() => goToSlide(index)} 
          >
            {/* Background Image */}
            <div className="absolute inset-0 w-full h-full">
              <Image
                src={item.image} 
                alt={item.name}
                className="w-full h-full object-cover"
                width={420}
                height={580}
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/10 to-black/80"></div>
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
              {/* Header with Company Logo and Package */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <CompanyLogo company={item.company} />
                  <div>
                    <h3 className="text-xl font-bold text-white">{item.company}</h3>
                    <p className="text-sm text-gray-200">{item.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-300">{item.package}</div>
                  <div className="text-xs text-gray-200">Annual Package</div>
                </div>
              </div>

              {/* Student Details */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{item.name}</h4>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={12} 
                          className={i < item.rating ? "text-yellow-400 fill-current" : "text-gray-400"} 
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
  );
};

// Demo component with sample data
const CarouselDemo: React.FC = () => {
  const studentSuccessStories: CarouselItem[] = [
    {
      id: 1,
      name: "Rahul Sharma",
      company: "Google",
      package: "₹45 LPA",
      image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop",
      logo: "google",
      location: "Bangalore",
      year: "2024",
      rating: 5,
      role: "Software Engineer"
    },
    {
      id: 2,
      name: "Priya Patel",
      company: "Microsoft",
      package: "₹42 LPA",
      image: "https://images.unsplash.com/photo-1494790108755-2616b332e234?w=800&h=600&fit=crop",
      logo: "microsoft",
      location: "Hyderabad",
      year: "2024",
      rating: 5,
      role: "Product Manager"
    },
    {
      id: 3,
      name: "Arjun Kumar",
      company: "Amazon",
      package: "₹38 LPA",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop",
      logo: "amazon",
      location: "Mumbai",
      year: "2024",
      rating: 4,
      role: "Data Scientist"
    },
    {
      id: 4,
      name: "Sneha Reddy",
      company: "Apple",
      package: "₹50 LPA",
      image: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&h=600&fit=crop",
      logo: "apple",
      location: "Delhi",
      year: "2024",
      rating: 5,
      role: "iOS Developer"
    },
    {
      id: 5,
      name: "Vikram Singh",
      company: "Meta",
      package: "₹48 LPA",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop",
      logo: "meta",
      location: "Gurgaon",
      year: "2024",
      rating: 5,
      role: "Frontend Engineer"
    },
    {
      id: 6,
      name: "Ananya Joshi",
      company: "Netflix",
      package: "₹44 LPA",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&h=600&fit=crop",
      logo: "netflix",
      location: "Pune",
      year: "2024",
      rating: 4,
      role: "UX Designer"
    }
  ];

  return (
    <div className='relative bg-white font-poppins'>
      <div
        className="absolute inset-0 z-10"
        style={{
          backgroundImage: `
            radial-gradient(
              circle at center,
              rgba(21, 93, 252, 0.5),
              transparent 40%
            )
          `,
          filter: "blur(80px)",
          backgroundRepeat: "no-repeat"
        }}
      />
      <div>
        <div className="flex ml-4 sm:ml-40 items-center gap-1 mb-4">
          <span className="text-2xl font-bold text-blue-600 z-10 font-poppins">—</span>
          <h1 className="text-2xl sm:text-4xl font-bold text-black z-10 font-poppins">Success Stories</h1>
        </div>
        <div className="flex flex-col gap-2 ml-4 sm:ml-44 mt-8">
          <p className="text-sm sm:text-md font-light text-black/60 font-poppins">
            Hir&apos;in finds jobs that fit your skills and tailors your applications automatically.
          </p>
        </div>
      </div>
      <Carousel 
        items={studentSuccessStories} 
        autoPlay={true} 
        autoPlayDelay={4000}
      />
        
   
    </div>
  );
};

export default CarouselDemo;