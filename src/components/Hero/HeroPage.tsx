"use client";
import React, { useEffect, useRef } from "react";
import Image from "next/image";

// Dynamically import p5 to avoid SSR issues
const loadP5 = () => import("p5");

interface GridCell {
  x: number;
  y: number;
  size: number;
  hoverIntensity: number;
  targetIntensity: number;
}

function HeroPage() {
  const canvasRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!canvasRef.current) return;

    let p5Instance: any = null;

    const initP5 = async () => {
      const p5Module = await loadP5();
      const p5 = p5Module.default;

      const sketch = (p: any) => {
        let gridSize = 80;
        let cols: number, rows: number;
        let grid: GridCell[][] = [];
        let isDarkMode = false;

        p.setup = () => {
          const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
          canvas.parent(canvasRef.current!);
          canvas.style('position', 'fixed');
          canvas.style('top', '0');
          canvas.style('left', '0');
          canvas.style('z-index', '0');
          canvas.style('pointer-events', 'none');
          
          cols = Math.ceil(p.width / gridSize);
          rows = Math.ceil(p.height / gridSize);
          
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
                targetIntensity: 0
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
            p.line(i * gridSize, 0, i * gridSize, p.height);
          }
          
          for (let j = 0; j <= rows; j++) {
            if (isDarkMode) {
              p.stroke(128, 128, 128, 80); // Gray lines in dark mode
            } else {
              p.stroke(128, 128, 128, 80); // Gray lines in light mode
            }
            p.strokeWeight(1);
            p.line(0, j * gridSize, p.width, j * gridSize);
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
            const x = (p.noise(i * 0.1, time * 0.3) * p.width);
            const y = (p.noise(i * 0.1 + 100, time * 0.2) * p.height);
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
          p.resizeCanvas(p.windowWidth, p.windowHeight);
          cols = Math.ceil(p.width / gridSize);
          rows = Math.ceil(p.height / gridSize);
          
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
                targetIntensity: 0
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

  return (
    <div className="relative w-full min-h-[90vh] overflow-hidden">
      {/* P5.js Canvas Container */}
      <div ref={canvasRef} className="absolute inset-0" />

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col justify-center items-center min-h-screen w-full px-4 py-12">
       <div className="flex-1 flex flex-col  items-center text-center space-y-6 max-w-6xl mx-auto">
        <div className="text-center space-y-6  bg-black/10 dark:bg-white/10  p-8 md:p-12">
          <h1 className="text-3xl md:text-8xl font-medium font-poppins text-white dark:text-black/85">
            Hir&apos;in
          </h1>
          <p className="text-3xl font-poppins font-medium md:text-8xl  text-white dark:text-black/85">
            Apply Smarter,
          </p>
          <p className="text-3xl font-poppins font-medium md:text-8xl  text-white dark:text-black/85">
            Land Better.
          </p>

          <p className=" text-md font-poppins font-light  text-white dark:text-black/85">
           Hir’in helps you apply smarter and faster to jobs where you can thrive. Whether you’re seeking your next opportunity <br/> or looking to land interviews at top companies, Hir’in streamlines the process for you.
          </p>
        </div>

        <div>
          <button className="bg-black hover:bg-black/85 transition-colors duration-300 text-white h-12 w-36 flex items-center justify-center text-lg font-light py-4 px-6 ">
            Get a Job
          </button>
        </div>

        </div>

        {/* Logo Section */}
        <div className="min-w-screen bg-white/95  backdrop-blur-sm py-8 px-4 ">
          <h2 className="text-center text-xl md:text-2xl font-medium mb-6 text-black font-poppins ">
            Trusted by job seekers on major platforms
          </h2>
          <div className="flex flex-wrap justify-between items-center gap-8 md:gap-12 max-w-5xl mb-10 mx-auto">
            {logos.map((logo) => (
              <div key={logo.name} className="flex justify-center  items-center">
                <Image
                  src={logo.src}
                  alt={logo.name}
                  width={150}
                  height={150}
                  className="object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    
  );
}

export default HeroPage;