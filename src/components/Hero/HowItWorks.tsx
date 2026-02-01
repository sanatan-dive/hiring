import React from 'react';
import JobSearchDashboard from '../Dashboard';
import { ArrowRight } from 'lucide-react';
import GlowButton from '../ui/glow-button';

const varian = [
  {
    name: 'blue',
    color: '#126fff',
  },
];

function HowItWorks() {
  const selectedVariant = varian[0];
  return (
    <div className="relative z-10 min-h-screen w-full bg-white dark:bg-white dark:text-white">
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
          filter: 'blur(80px)',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Heading */}
      <div className="mb-4 ml-4 flex items-center gap-1 sm:ml-40">
        <span className="font-poppins z-10 text-2xl font-bold text-blue-600">—</span>
        <h1 className="font-poppins z-10 text-2xl font-bold text-black sm:text-4xl">
          How it Works
        </h1>
      </div>

      {/* Descriptions */}
      <div className="mb-8 ml-4 flex flex-col gap-2 sm:ml-44">
        <p className="sm:text-md font-poppins text-sm font-light text-black/60">
          Hir&apos;in finds jobs that fit your skills and tailors your applications automatically.
        </p>
        <p className="sm:text-md font-poppins text-sm font-light text-black/60">
          It optimizes your résumé, identifies gaps, and applies for you in one click.
        </p>
      </div>

      {/* Dashboard Embed */}
      <div className="relative z-0 mx-auto mb-12 h-[500px] w-[90%] rounded-2xl bg-white shadow-xl sm:top-36 sm:h-[600px] lg:absolute lg:left-1/12 lg:mb-0 lg:w-[600px]">
        <JobSearchDashboard
          isEmbedded={true}
          height="100%"
          width="100%"
          className="overflow-hidden rounded-2xl"
        />
      </div>

      {/* Side Card */}
      <div className="relative z-0 mx-auto h-auto w-[90%] rounded-2xl border-gray-100 sm:w-[450px] lg:absolute lg:right-1/6 lg:bottom-1/3 lg:h-[400px]">
        <section className="font-poppins p-6 text-left lg:p-6">
          <h2 className="font-poppins z-10 mb-4 text-2xl font-bold text-black sm:mb-8 sm:text-4xl">
            All your job search details in one place
          </h2>
          <p className="sm:text-md mb-3 text-sm text-gray-600">
            Hir&apos;in tracks your applications, matches, résumés, and progress — no more messy
            spreadsheets.
          </p>
          <p className="sm:text-md mb-3 text-sm text-gray-600">
            Get personalized job matches, automatic résumé tailoring, and detailed gap analysis for
            every role you apply to.
          </p>
          <p className="sm:text-md mb-4 text-sm text-gray-600">
            Apply faster and smarter, with clear visibility into your interview pipeline and
            application status.
          </p>
          <div className="mt-4 flex flex-col justify-between gap-4 sm:mt-8 sm:flex-row">
            <GlowButton variant={selectedVariant.name} className="font-poppins px-4 py-3">
              {' '}
              Get Started for Free
            </GlowButton>

            <button className="sm:text-md flex items-center gap-1 text-sm font-medium text-gray-900 hover:underline">
              To Learn More
              <span>
                <ArrowRight size={20} />
              </span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default HowItWorks;
