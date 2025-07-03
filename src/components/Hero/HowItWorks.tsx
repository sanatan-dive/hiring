
import React from 'react'
import JobSearchDashboard from '../Dashboard'

function HowItWorks() {
  return (
    <div className='min-h-screen dark:bg-white dark:text-black relative '>
        <div className="min-h-screen w-full relative bg-white">
            {/* Cool Blue Glow Left */}
            <div
                className="absolute inset-0 z-0"
                style={{
                background: "#ffffff",
                backgroundImage: `
                    radial-gradient(
                    circle at bottom left,
                    rgba(21, 93, 252, 0.7),
                    transparent 70%
                    )
                `,
                filter: "blur(80px)",
                backgroundRepeat: "no-repeat",
                }}
            />
                <div className='flex ml-38 items-center gap-1 mb-4'>
                    <span className='text-2xl lg:text-2xl  font-bold text-blue-600 z-10 font-poppins'>
                        —
                    </span>
                    <h1 className='text-4xl lg:text-4xl font-bold text-black z-10 font-poppins'>
                        How it Works
                    </h1>
                    
                </div>
                <div className=' flex flex-col gap-2'>
                <div className='text-md font-light text-black/60 relative font-poppins ml-45 '>
                        Hir’in finds jobs that truly fit your skills and tailoring your applications.
                        
                </div>
                <div className='text-sm font-light text-black/60 relative font-poppins ml-45 '>
                     It automates résumé optimization.
                </div>
                </div>
                
                <div className="absolute inset-0 z-0 left-1/12 top-36 bg-white h-[400px]  w-[800px] rounded-2xl shadow-2xl">
                    <JobSearchDashboard 
                        isEmbedded={true} 
                        height="750px" 
                        width="800px" 
                        className="rounded-2xl overflow-hidden"
                    />
                </div>
                <div className='bg-red-500 absolute  z-0 right-1/16 bottom-1/3  h-[400px]  w-[800px] rounded-2xl shadow-2xl  '>
                    dfasdasf
                </div>
            </div>
        
    </div>
  )
}

export default HowItWorks