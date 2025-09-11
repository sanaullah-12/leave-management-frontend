import React, { useEffect, useState, useRef } from "react";
import xlogoImage from "../assets/xlogoanimate.png";

interface Particle {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  size: number;
  speed: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  age: number;
  maxAge: number;
  moveX: number;
  moveY: number;
}

interface ParticleBackgroundProps {
  className?: string;
}

const ParticleBackground: React.FC<ParticleBackgroundProps> = ({ className = "" }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const particleIdRef = useRef(0);

  useEffect(() => {
    const MAX_PARTICLES = 18; // Limit to 18 particles max on screen
    
    const createParticle = (): Particle => {
      // Start from completely random positions across entire dashboard
      const startX = Math.random() * 80 + 10; // 10-90% for maximum coverage
      const startY = Math.random() * 70 + 15; // 15-85% covering center, left, right, bottom areas
      
      // Movement direction: fast upward movement to prevent piling up
      const moveX = (Math.random() - 0.5) * 40; // -20 to +20% dynamic horizontal movement
      const moveY = -(Math.random() * 35 + 30); // -30 to -65% fast upward movement
      
      return {
        id: particleIdRef.current++,
        x: startX,
        y: startY,
        startX,
        startY,
        size: Math.random() * 10 + 30, // 30-40px
        speed: Math.random() * 1.5 + 1.5, // 1.5-3.0 for fast movement
        opacity: 0,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 6 + 4, // Fast rotation: 4-10
        scale: 0.5, // Start at 50% scale
        age: 0,
        maxAge: Math.random() * 40 + 80, // 80-120 frames (~1-2 seconds total lifecycle)
        moveX,
        moveY,
      };
    };

    // Create initial particles with staggered timing
    const createInitialParticles = () => {
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          setParticles(prev => {
            if (prev.length < MAX_PARTICLES) {
              return [...prev, createParticle()];
            }
            return prev;
          });
        }, i * 200); // 200ms stagger for smooth introduction
      }
    };

    createInitialParticles();

    const interval = setInterval(() => {
      setParticles((prevParticles) => {
        let updatedParticles = prevParticles.map((particle) => {
          const newAge = particle.age + 1;
          const progress = newAge / particle.maxAge;
          
          // Smooth easing function (ease-out cubic)
          const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
          
          // Create popup effect with smooth easing
          let scale: number;
          let opacity: number;
          let currentX: number;
          let currentY: number;
          
          if (progress < 0.1) {
            // Quick popup phase: scale from 0.5 to 1.0 (10% of lifecycle)
            const scaleProgress = easeOut(progress / 0.1);
            scale = 0.5 + scaleProgress * 0.5; // 0.5 to 1.0
            opacity = scaleProgress * 0.4; // Fade in to 0.4
            
            currentX = particle.startX;
            currentY = particle.startY;
          } else if (progress < 0.6) {
            // Main phase: stable size with fast movement (50% of lifecycle)
            scale = 1.0;
            opacity = Math.random() * 0.1 + 0.35; // 0.35-0.45 range with subtle flicker
            
            // Apply fast movement
            const moveProgress = easeOut((progress - 0.1) / 0.5);
            currentX = particle.startX + particle.moveX * moveProgress;
            currentY = particle.startY + particle.moveY * moveProgress;
          } else {
            // Quick fade out phase (40% of lifecycle)
            const fadeProgress = (progress - 0.6) / 0.4;
            const fadingEase = easeOut(fadeProgress);
            
            scale = 1.0 - fadingEase * 0.5;
            opacity = (1 - fadingEase) * 0.4;
            
            const moveProgress = easeOut((progress - 0.1) / 0.5);
            currentX = particle.startX + particle.moveX * moveProgress;
            currentY = particle.startY + particle.moveY * moveProgress;
          }

          // Constrain particles within dashboard boundaries
          currentX = Math.max(10, Math.min(90, currentX));
          currentY = Math.max(5, Math.min(95, currentY));

          return {
            ...particle,
            x: currentX,
            y: currentY,
            rotation: particle.rotation + particle.rotationSpeed / 60,
            scale,
            opacity,
            age: newAge,
          };
        });

        // Remove expired particles and add new ones to maintain count
        const activeParticles = updatedParticles.filter(p => p.age < p.maxAge);
        
        // Add new particles if we're below the limit and some have expired
        while (activeParticles.length < MAX_PARTICLES && activeParticles.length < 18) {
          // Add with slight delay to prevent sudden appearance
          if (Math.random() < 0.3) { // 30% chance each frame to add new particle
            activeParticles.push(createParticle());
          } else {
            break; // Don't add more this frame
          }
        }

        return activeParticles;
      });
    }, 16); // 60fps for smooth animation

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} 
      style={{ zIndex: 1 }}
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute transition-all duration-150 ease-out"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            transform: `translate(-50%, -50%) rotate(${particle.rotation}deg) scale(${particle.scale})`,
            transformOrigin: 'center',
            userSelect: 'none',
            pointerEvents: 'none',
            willChange: 'transform, opacity',
          }}
        >
          <img
            src={xlogoImage}
            alt=""
            className="w-full h-full object-contain"
            style={{
              filter: `drop-shadow(0 2px 8px rgba(255,255,255,0.15)) brightness(1.1)`,
              imageRendering: 'crisp-edges',
            }}
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
};

export default ParticleBackground;