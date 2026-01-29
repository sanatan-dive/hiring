import React, { useEffect, useState } from 'react';

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

const FallingProfilesBackground: React.FC = () => {
  const [profiles, setProfiles] = useState<FallingProfile[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Sample profile images (you can replace these with actual images)
  const profileImages = [
    
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
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (dimensions.width === 0) return;

    // Generate X positions only on left and right sides (avoid center)
    const generateXPosition = () => {
      const centerZone = dimensions.width * 0.4; // 40% center area to avoid
      const leftZone = (dimensions.width - centerZone) / 2;
      
      if (Math.random() < 0.5) {
        // Left side
        return Math.random() * leftZone;
      } else {
        // Right side
        return dimensions.width - leftZone + Math.random() * leftZone;
      }
    };

    // Initialize falling profiles with proper delays
    const initialProfiles: FallingProfile[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: generateXPosition(),
      y: -100 - (i * 50), // Stagger vertically too
      speed: 0.5 + Math.random() * 1.0,
      size: 40 + Math.random() * 20,
      delay: Date.now() + (i * 800), // Progressive delays
      trail: [],
      imageIndex: i % profileImages.length,
    }));

    setProfiles(initialProfiles);
  }, [dimensions, profileImages.length]);

  useEffect(() => {
    if (profiles.length === 0) return;

    // Generate X positions only on left and right sides
    const generateXPosition = () => {
      const centerZone = dimensions.width * 0.4; // 40% center area to avoid
      const leftZone = (dimensions.width - centerZone) / 2;
      
      if (Math.random() < 0.5) {
        // Left side
        return Math.random() * leftZone;
      } else {
        // Right side
        return dimensions.width - leftZone + Math.random() * leftZone;
      }
    };

    const animateProfiles = () => {
      setProfiles((prevProfiles) =>
        prevProfiles.map((profile) => {
          // Only start moving after delay
          if (Date.now() < profile.delay) {
            return profile;
          }

          const newY = profile.y + profile.speed;
          
          // Only add to trail if profile is visible and moving
          const newTrail = profile.y > -100 ? [
            { x: profile.x, y: profile.y, opacity: 1 },
            ...profile.trail.map((point) => ({
              ...point,
              opacity: point.opacity - 0.06,
            })),
          ]
          .filter((point) => point.opacity > 0.1)
          .slice(0, 15) : profile.trail;

          // Reset position when profile goes off screen
          if (newY > dimensions.height + 100) {
            return {
              ...profile,
              y: -100 - Math.random() * 40,
              x: generateXPosition(), // Use the same left/right positioning
              trail: [],
              delay: Date.now() + Math.random() * 500, // Random delay before next fall
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

    const interval = setInterval(animateProfiles, 20); // Slightly slower for better visibility
    return () => clearInterval(interval);
  }, [profiles.length, dimensions, profileImages.length]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50">
        {profiles.map((profile) => (
          <div key={profile.id}>
            {/* Trail effect */}
            {profile.trail.map((point, index) => (
              <div
                key={`${profile.id}-trail-${index}`}
                className="absolute rounded-full"
                style={{
                  left: point.x,
                  top: point.y,
                  width: profile.size * (0.2 + point.opacity * 0.8),
                  height: profile.size * (0.2 + point.opacity * 0.8),
                  opacity: point.opacity * 0.4,
                  background: `radial-gradient(circle, rgba(139, 92, 246, ${point.opacity * 0.3}), rgba(59, 130, 246, ${point.opacity * 0.1}))`,
                  transform: 'translate(-50%, -50%)',
                  filter: 'blur(2px)',
                }}
              />
            ))}
            
            {/* Main profile picture */}
            <div
              className="absolute rounded-full shadow-lg border-2 border-white"
              style={{
                left: profile.x,
                top: profile.y,
                width: profile.size,
                height: profile.size,
                transform: 'translate(-50%, -50%)',
                backgroundImage: `url(${profileImages[profile.imageIndex]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: profile.y < -50 ? 0 : 1,
                transition: 'opacity 0.5s ease-in-out',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FallingProfilesBackground;