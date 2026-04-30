import { SignIn } from '@clerk/nextjs';
import Image from 'next/image';

export default function Page() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Main Card Container */}
      <div className="m-auto flex w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Left Side - Sign In Form */}
        <div className="flex w-full flex-col justify-center p-8 md:w-1/2 md:p-12">
          <div className="mb-8 text-center">
            <div className="group mb-4 flex items-center justify-center gap-1 transition-all duration-300 hover:scale-105 hover:cursor-pointer">
              <h1 className="font-sans text-4xl font-bold tracking-tight text-black lg:text-5xl">
                Hirin<span className="text-indigo-600">.</span>
              </h1>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
            <p className="mt-2 text-gray-500">Please enter your details</p>
          </div>

          <div className="flex justify-center">
            <SignIn
              appearance={{
                elements: {
                  rootBox: 'w-full max-w-sm',
                  card: 'shadow-none p-0',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  socialButtonsBlockButton: 'border border-gray-200 hover:bg-gray-50',
                  formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white rounded-full py-3',
                  footerActionLink: 'text-indigo-600 hover:text-indigo-700',
                  formFieldInput:
                    'rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                  dividerLine: 'bg-gray-200',
                  dividerText: 'text-gray-400',
                },
              }}
            />
          </div>
        </div>

        {/* Right Side - Gradient Image */}
        <div className="object-fit relative m-4 hidden w-1/2 overflow-hidden rounded-2xl bg-indigo-600 md:block">
          <Image
            src="/login.jpg"
            alt="Sign In"
            className="relative top-110"
            width={500}
            height={500}
          />
        </div>
      </div>
    </div>
  );
}
