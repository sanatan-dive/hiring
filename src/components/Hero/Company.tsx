import React from 'react';
import Image from 'next/image';

function Company() {
  const logos = [
    {
      name: 'LinkedIn',
      src: 'https://blog.waalaxy.com/wp-content/uploads/2021/01/2-2.png.webp'
    },
    {
      name: 'Indeed',
      src: 'https://i0.wp.com/verotouch.com/wp-content/uploads/2024/02/Indeed-Logo-Black.png?ssl=1'
    },
   
     {
      name: 'Naukri',
      src: 'https://fontslogo.com/wp-content/uploads/2013/04/M-2p-black_Naukri-Logo-Font.jpg'
    },
   
  ];

  return (
    <div className="absolute ">
      <h2 className="text-center text-2xl font-semibold mb-6 text-black dark:text-white">
        Trusted by job seekers on major platforms
      </h2>
      <div className="flex flex-wrap justify-between items-center gap-6 max-w-5xl mx-auto px-4">
        {logos.map((logo) => (
          <div key={logo.name} className=" flex justify-center items-center">
            <Image
              src={logo.src}
              alt={logo.name}
              width={180}
              height={180}
              className="object-contain filter "
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Company;