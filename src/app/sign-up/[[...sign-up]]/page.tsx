import { SignUp } from '@clerk/nextjs';
import Image from 'next/image';

export default function Page() {
  return (
    <div className="flex min-h-screen bg-gray-50 p-3 sm:p-6">
      {/* Main Card Container */}
      <div className="m-auto flex w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl">
        {/* Left Side - Sign Up Form */}
        <div className="flex w-full flex-col justify-center p-6 sm:p-8 md:w-1/2 md:p-12">
          <div className="mb-6 text-center sm:mb-8">
            <div className="group mb-4 flex items-center justify-center gap-1 transition-all duration-300 hover:scale-105 hover:cursor-pointer">
              <h1 className="font-sans text-3xl font-bold tracking-tight text-black sm:text-4xl lg:text-5xl">
                Hirin<span className="text-sky-600">.</span>
              </h1>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Get Started</h1>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              Create your account to find your dream job
            </p>
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
                  formButtonPrimary: 'bg-sky-600 hover:bg-sky-700 text-white rounded-full py-3',
                  footerActionLink: 'text-sky-600 hover:text-sky-700',
                  formFieldInput:
                    'rounded-lg border-gray-300 focus:border-sky-500 focus:ring-sky-500',
                  dividerLine: 'bg-gray-200',
                  dividerText: 'text-gray-400',
                },
              }}
            />
          </div>
        </div>

        {/* Right Side - Gradient Image */}
        <div className="relative m-4 hidden w-1/2 overflow-hidden rounded-2xl bg-sky-600 md:block">
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
