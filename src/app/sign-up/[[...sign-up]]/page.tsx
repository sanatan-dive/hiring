import { SignUp } from '@clerk/nextjs';
import Image from 'next/image';

export default function Page() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Main Card Container */}
      <div className="m-auto flex w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Left Side - Sign Up Form */}
        <div className="flex w-full flex-col justify-center p-8 md:w-1/2 md:p-12">
          <div className="mb-8 text-center">
            <div className="group mb-4 flex items-center justify-center gap-1 transition-all duration-300 hover:scale-105 hover:cursor-pointer">
              {/* Optional icon */}
              {/* <Briefcase className="h-8 w-8 lg:h-10 lg:w-10 text-blue-600 group-hover:text-blue-700 transition-colors duration-300" /> */}

              <h1 className="font-sans text-4xl font-bold text-black lg:text-5xl">Hir&apos;</h1>

              {/* 'in' part inside a blue box */}
              <h1 className="rounded bg-blue-600 px-1 text-4xl font-bold text-white lg:text-5xl dark:bg-blue-600">
                in
              </h1>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Get Started</h1>
            <p className="mt-2 text-gray-500">Create your account to find your dream job</p>
          </div>

          <div className="flex justify-center">
            <SignUp
              appearance={{
                elements: {
                  rootBox: 'w-full max-w-sm',
                  card: 'shadow-none p-0',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  socialButtonsBlockButton: 'border border-gray-200 hover:bg-gray-50',
                  formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white rounded-full py-3',
                  footerActionLink: 'text-blue-600 hover:text-blue-700',
                  formFieldInput:
                    'rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                  dividerLine: 'bg-gray-200',
                  dividerText: 'text-gray-400',
                },
              }}
            />
          </div>
        </div>

        {/* Right Side - Gradient Image */}
        <div className="relative m-4 hidden w-1/2 overflow-hidden rounded-2xl bg-[#024BA9] md:block">
          <Image
            src="/login.jpg"
            alt="Sign In"
            className="relative top-145 rotate-y-180"
            width={500}
            height={500}
          />
        </div>
      </div>
    </div>
  );
}
