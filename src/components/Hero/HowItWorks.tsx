import React from 'react';
import JobSearchDashboard from '../Dashboard';
import { ArrowRight } from 'lucide-react';
import GlowButton from '../ui/glow-button';


const varian = [
  {
    name: 'blue',
    color: '#126fff'
  }
]

function HowItWorks() {
  const selectedVariant = varian[0];
  return (
    <div className="min-h-screen w-full relative bg-white dark:bg-white dark:text-white z-10">
      {/* Cool Blue Glow Left */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(
              circle at center left,
              rgba(21, 93, 252, 0.5),
              transparent 60%
            )
          `,
          filter: "blur(80px)",
          backgroundRepeat: "no-repeat"
        }}
      />

      {/* Heading */}
      <div className="flex ml-4 sm:ml-40 items-center gap-1 mb-4">
        <span className="text-2xl font-bold text-blue-600 z-10 font-poppins">—</span>
        <h1 className="text-2xl sm:text-4xl font-bold text-black z-10 font-poppins">How it Works</h1>
      </div>

      {/* Descriptions */}
      <div className="flex flex-col gap-2 ml-4 sm:ml-44 mb-8">
        <p className="text-sm sm:text-md font-light text-black/60 font-poppins">
          Hir&apos;in finds jobs that fit your skills and tailors your applications automatically.
        </p>
        <p className="text-sm sm:text-md font-light text-black/60 font-poppins">
          It optimizes your résumé, identifies gaps, and applies for you in one click.
        </p>
      </div>

      {/* Dashboard Embed */}
      <div className="relative z-0 mx-auto mb-12 lg:mb-0 lg:absolute lg:left-1/12 sm:top-36 bg-white h-[500px] sm:h-[600px] w-[90%] lg:w-[600px] rounded-2xl shadow-xl">
        <JobSearchDashboard 
          isEmbedded={true} 
          height="100%" 
          width="100%" 
          className="rounded-2xl overflow-hidden"
        />
      </div>

      {/* Side Card */}
      <div className="relative z-0 mx-auto lg:absolute lg:right-1/6 lg:bottom-1/3 h-auto lg:h-[400px] w-[90%] sm:w-[450px] rounded-2xl border-gray-100">
        <section className="p-6 lg:p-6 text-left font-poppins">
          <h2 className="text-2xl sm:text-4xl font-bold text-black z-10 font-poppins mb-4 sm:mb-8">
            All your job search details in one place
          </h2>
          <p className="text-gray-600 text-sm sm:text-md mb-3">
            Hir&apos;in tracks your applications, matches, résumés, and progress — no more messy spreadsheets.
          </p>
          <p className="text-gray-600 text-sm sm:text-md mb-3">
            Get personalized job matches, automatic résumé tailoring, and detailed gap analysis for every role you apply to.
          </p>
          <p className="text-gray-600 text-sm sm:text-md mb-4">
            Apply faster and smarter, with clear visibility into your interview pipeline and application status.
          </p>
          <div className="flex flex-col sm:flex-row justify-between mt-4 sm:mt-8 gap-4">
           <GlowButton variant={selectedVariant.name} className='font-poppins px-4 py-3' > Get Started for Free</GlowButton>
            
            <button className="text-gray-900 font-medium text-sm sm:text-md flex items-center gap-1 hover:underline">
              To Learn More
              <span><ArrowRight size={20} /></span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default HowItWorks;