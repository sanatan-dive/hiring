/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Variants } from 'framer-motion';
// Dynamically import p5 to avoid SSR issues
const loadP5 = () => import('p5');

interface GridCell {
  x: number;
  y: number;
  size: number;
  hoverIntensity: number;
  targetIntensity: number;
}

interface FallingProfile {
  id: number;
  x: number;
  y: number;
  speed: number;
  size: number;
  delay: number;
  trail: { x: number; y: number; opacity: number }[];
  imageIndex: number;
}

// Falling Profiles Background Component
const FallingProfilesBackground: React.FC = () => {
  const [profiles, setProfiles] = useState<FallingProfile[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Sample profile images (you can replace these with actual images)
  const profileImages = [
    'https://images.unsplash.com/photo-1494790108755-2616b612b780?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
  ];

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: 700, // Fixed height to match the canvas
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (dimensions.width === 0) return;

    // Initialize falling profiles
    const initialProfiles: FallingProfile[] = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * dimensions.width,
      y: Math.random() * -dimensions.height - 200,
      speed: 0.3 + Math.random() * 0.8,
      size: 35 + Math.random() * 15,
      delay: Math.random() * 5000,
      trail: [],
      imageIndex: i % profileImages.length,
    }));

    setProfiles(initialProfiles);
  }, [dimensions, profileImages.length]);

  useEffect(() => {
    if (profiles.length === 0) return;

    const animateProfiles = () => {
      setProfiles((prevProfiles) =>
        prevProfiles.map((profile) => {
          const newY = profile.y + profile.speed;
          const newTrail = [
            { x: profile.x, y: profile.y, opacity: 1 },
            ...profile.trail.map((point) => ({
              ...point,
              opacity: point.opacity - 0.04,
            })),
          ]
            .filter((point) => point.opacity > 0)
            .slice(0, 12);

          // Reset position when profile goes off screen
          if (newY > dimensions.height + 100) {
            return {
              ...profile,
              y: -100 - Math.random() * 200,
              x: Math.random() * dimensions.width,
              trail: [],
              imageIndex: Math.floor(Math.random() * profileImages.length),
            };
          }

          return {
            ...profile,
            y: newY,
            trail: newTrail,
          };
        })
      );
    };

    const interval = setInterval(animateProfiles, 20);
    return () => clearInterval(interval);
  }, [profiles.length, dimensions, profileImages.length]);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      style={{ height: '700px' }}
    >
      <AnimatePresence>
        {profiles.map((profile) => (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            {/* Trail effect */}
            {profile.trail.map((point, index) => (
              <motion.div
                key={`${profile.id}-trail-${index}`}
                className="absolute rounded-full"
                style={{
                  left: point.x,
                  top: point.y,
                  width: profile.size * (0.4 + point.opacity * 0.6),
                  height: profile.size * (0.4 + point.opacity * 0.6),
                  opacity: point.opacity * 0.15,
                  background: `radial-gradient(circle, rgba(255, 255, 255, ${point.opacity * 0.3}), transparent 70%)`,
                  transform: 'translate(-50%, -50%)',
                  filter: 'blur(1px)',
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              />
            ))}

            {/* Main profile picture */}
            <motion.div
              className="absolute rounded-full border border-white/20 shadow-md"
              style={{
                left: profile.x,
                top: profile.y,
                width: profile.size,
                height: profile.size,
                transform: 'translate(-50%, -50%)',
                backgroundImage: `url(${profileImages[profile.imageIndex]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: profile.y < -50 ? 0 : 0.6,
                transition: 'opacity 0.5s ease-in-out',
              }}
              whileHover={{ scale: 1.1, opacity: 0.8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

function HeroPage() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const logos = [
    {
      name: 'LinkedIn',
      src: 'https://blog.waalaxy.com/wp-content/uploads/2021/01/2-2.png.webp',
    },
    {
      name: 'Indeed',
      src: 'https://i0.wp.com/verotouch.com/wp-content/uploads/2024/02/Indeed-Logo-Black.png?ssl=1',
    },
    {
      name: 'Naukri',
      src: 'https://fontslogo.com/wp-content/uploads/2013/04/M-2p-black_Naukri-Logo-Font.jpg',
    },
  ];

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    let p5Instance: any = null;

    const initP5 = async () => {
      const p5Module = await loadP5();
      const p5 = p5Module.default;

      const sketch = (p: any) => {
        const gridSize = 80;
        const canvasWidth = window.innerWidth;
        const canvasHeight = 700; // Fixed height
        let cols: number, rows: number;
        let grid: GridCell[][] = [];
        let isDarkMode = false;

        p.setup = () => {
          const canvas = p.createCanvas(canvasWidth, canvasHeight);
          canvas.parent(canvasRef.current!);
          canvas.style('position', 'absolute');
          canvas.style('top', '0');
          canvas.style('left', '0');
          canvas.style('z-index', '0');
          canvas.style('pointer-events', 'none');

          cols = Math.ceil(canvasWidth / gridSize);
          rows = Math.ceil(canvasHeight / gridSize);

          // Initialize grid
          grid = [];
          for (let i = 0; i < cols; i++) {
            grid[i] = [];
            for (let j = 0; j < rows; j++) {
              grid[i][j] = {
                x: i * gridSize,
                y: j * gridSize,
                size: gridSize,
                hoverIntensity: 0,
                targetIntensity: 0,
              };
            }
          }

          // Check for dark mode
          checkDarkMode();
        };

        const checkDarkMode = () => {
          isDarkMode = document.documentElement.classList.contains('dark');
        };

        p.draw = () => {
          checkDarkMode();

          // Clear background completely
          if (isDarkMode) {
            p.background(0, 0, 0); // Pure black background
          } else {
            p.background(255, 255, 255); // Pure white background
          }

          // Calculate mouse grid position
          const mouseCol = Math.floor(p.mouseX / gridSize);
          const mouseRow = Math.floor(p.mouseY / gridSize);

          // Update grid hover effects with improved fade-out
          for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
              const cell = grid[i][j];

              // Calculate distance from mouse
              const distance = Math.sqrt(Math.pow(i - mouseCol, 2) + Math.pow(j - mouseRow, 2));

              if (distance <= 3) {
                if (distance === 0) {
                  // Direct hover - full blue
                  cell.targetIntensity = 1.0;
                } else if (distance <= 1) {
                  // Adjacent cells - strong blue
                  cell.targetIntensity = 0.8;
                } else if (distance <= 2) {
                  // Second ring - medium blue
                  cell.targetIntensity = 0.5;
                } else {
                  // Outer ring - light blue
                  cell.targetIntensity = 0.2;
                }
              } else {
                cell.targetIntensity = 0;
              }

              // Smooth animation with faster response
              cell.hoverIntensity = p.lerp(cell.hoverIntensity, cell.targetIntensity, 0.15);
            }
          }

          // Draw grid lines
          p.noFill();

          // Draw all grid lines first (gray)
          for (let i = 0; i <= cols; i++) {
            if (isDarkMode) {
              p.stroke(128, 128, 128, 80); // Gray lines in dark mode
            } else {
              p.stroke(128, 128, 128, 80); // Gray lines in light mode
            }
            p.strokeWeight(1);
            p.line(i * gridSize, 0, i * gridSize, canvasHeight);
          }

          for (let j = 0; j <= rows; j++) {
            if (isDarkMode) {
              p.stroke(128, 128, 128, 80); // Gray lines in dark mode
            } else {
              p.stroke(128, 128, 128, 80); // Gray lines in light mode
            }
            p.strokeWeight(1);
            p.line(0, j * gridSize, canvasWidth, j * gridSize);
          }

          // Draw hover effects on top
          for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
              const cell = grid[i][j];

              if (cell.hoverIntensity > 0.01) {
                const alpha = cell.hoverIntensity * 200;
                const strokeWeight = 1 + cell.hoverIntensity * 2;

                // Blue hover effect
                if (isDarkMode) {
                  p.stroke(0, 100, 255, alpha); // Blue in dark mode
                } else {
                  p.stroke(100, 150, 255, alpha); // Light blue in light mode
                }

                p.strokeWeight(strokeWeight);

                // Draw the cell border
                p.rect(cell.x, cell.y, cell.size, cell.size);

                // Add subtle fill for stronger hover effect
                if (cell.hoverIntensity > 0.3) {
                  if (isDarkMode) {
                    p.fill(0, 100, 255, alpha * 0.1);
                  } else {
                    p.fill(100, 150, 255, alpha * 0.1);
                  }
                  p.rect(cell.x, cell.y, cell.size, cell.size);
                  p.noFill();
                }
              }
            }
          }

          // Add floating particles effect
          drawFloatingParticles();
        };

        const drawFloatingParticles = () => {
          const time = p.millis() * 0.001;

          for (let i = 0; i < 15; i++) {
            const x = p.noise(i * 0.1, time * 0.3) * canvasWidth;
            const y = p.noise(i * 0.1 + 100, time * 0.2) * canvasHeight;
            const size = p.noise(i * 0.1 + 200, time * 0.15) * 2 + 1;
            const alpha = p.noise(i * 0.1 + 300, time * 0.25) * 60 + 30;

            if (isDarkMode) {
              p.fill(150, 180, 255, alpha);
            } else {
              p.fill(100, 150, 255, alpha);
            }
            p.noStroke();
            p.circle(x, y, size);
          }
        };

        p.windowResized = () => {
          const newWidth = window.innerWidth;
          p.resizeCanvas(newWidth, canvasHeight);
          cols = Math.ceil(newWidth / gridSize);
          rows = Math.ceil(canvasHeight / gridSize);

          // Reinitialize grid
          grid = [];
          for (let i = 0; i < cols; i++) {
            grid[i] = [];
            for (let j = 0; j < rows; j++) {
              grid[i][j] = {
                x: i * gridSize,
                y: j * gridSize,
                size: gridSize,
                hoverIntensity: 0,
                targetIntensity: 0,
              };
            }
          }
        };
      };

      // Create p5 instance
      p5Instance = new p5(sketch);
    };

    // Initialize p5 only on client side
    initP5();

    // Cleanup function
    return () => {
      if (p5Instance) {
        p5Instance.remove();
        p5Instance = null;
      }
    };
  }, []);

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12,
      },
    },
  };

  const titleVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 150,
        damping: 12,
        delay: 0.5,
      },
    },
  };

  const buttonVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 15,
        delay: 1.2,
      },
    },
    hover: {
      scale: 1.05,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10,
      },
    },
    tap: {
      scale: 0.95,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10,
      },
    },
  };

  const logoVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <>
      {/* Hero Section with Fixed Height */}
      <motion.div
        className="relative h-[700px] w-full overflow-hidden"
        initial="hidden"
        animate={isLoaded ? 'visible' : 'hidden'}
        variants={containerVariants}
      >
        {/* P5.js Canvas Container */}
        <div ref={canvasRef} className="absolute inset-0" />

        {/* Falling Profiles Background */}
        <FallingProfilesBackground />

        {/* Hero Content */}
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-4">
          <motion.div
            className="mx-auto flex max-w-6xl flex-1 flex-col items-center justify-center space-y-6 text-center"
            variants={containerVariants}
          >
            <motion.div
              className="space-y-6 rounded-lg bg-black/10 p-8 text-center md:p-12 dark:bg-white/10"
              variants={itemVariants}
            >
              <motion.div className="flex items-center justify-center" variants={titleVariants}>
                <motion.h1
                  className="font-poppins text-3xl font-medium text-white md:text-8xl dark:text-black/85"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  Hir&apos;
                </motion.h1>
                <motion.h1
                  className="ml-2 rounded bg-blue-600 px-1 text-3xl font-bold text-white lg:text-7xl dark:bg-blue-600"
                  whileHover={{
                    scale: 1.1,
                    rotateZ: [0, -5, 5, 0],
                    transition: { duration: 0.3 },
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  in
                </motion.h1>
              </motion.div>

              <motion.p
                className="font-poppins text-3xl font-medium text-white md:text-8xl dark:text-black/85"
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                Apply Smarter,
              </motion.p>

              <motion.p
                className="font-poppins text-3xl font-medium text-white md:text-8xl dark:text-black/85"
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                Land Better.
              </motion.p>

              <motion.p
                className="text-md font-poppins font-light text-white dark:text-black/85"
                variants={itemVariants}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
              >
                Hir&apos;in helps you apply smarter and faster to jobs where you can thrive. Whether
                you&apos;re seeking your next opportunity <br /> or looking to land interviews at
                top companies, Hir&apos;in streamlines the process for you.
              </motion.p>
            </motion.div>

            <motion.div variants={buttonVariants}>
              <button className="flex h-12 w-36 items-center justify-center bg-black px-6 py-4 text-lg font-light text-white transition-colors duration-300 hover:bg-black/85">
                Get a Job
              </button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="w-full bg-white px-4 py-8 backdrop-blur-sm"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        <motion.h2
          className="font-poppins mb-6 text-center text-xl font-medium text-black md:text-2xl"
          variants={logoVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 1.7 }}
        >
          Trusted by job seekers
        </motion.h2>

        <motion.div
          className="mx-auto mb-10 flex max-w-5xl flex-wrap items-center justify-between gap-8 md:gap-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {logos.map((logo, index) => (
            <motion.div
              key={logo.name}
              className="flex items-center justify-center"
              variants={logoVariants}
              whileHover={{
                scale: 1.1,
                y: -5,
                transition: { type: 'spring', stiffness: 300, damping: 20 },
              }}
              custom={index}
            >
              <motion.div whileHover={{ filter: 'grayscale(0%)' }} transition={{ duration: 0.3 }}>
                <Image
                  src={logo.src}
                  alt={logo.name}
                  width={150}
                  height={150}
                  className="h-20 w-20 object-contain grayscale filter transition-all duration-300 hover:grayscale-0 sm:h-40 sm:w-40"
                />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </>
  );
}

export default HeroPage;
