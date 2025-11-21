import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

export const StarBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create stars (particles) - consistent count
    const targetStarCount = 100;
    
    const createStar = (fromEdge = false) => {
      let x, y;
      if (fromEdge) {
        // Spawn from random edge
        const edge = Math.floor(Math.random() * 4);
        switch (edge) {
          case 0: // top
            x = Math.random() * canvas.width;
            y = -5;
            break;
          case 1: // right
            x = canvas.width + 5;
            y = Math.random() * canvas.height;
            break;
          case 2: // bottom
            x = Math.random() * canvas.width;
            y = canvas.height + 5;
            break;
          default: // left
            x = -5;
            y = Math.random() * canvas.height;
        }
      } else {
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;
      }
      
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 1.0,
        vy: (Math.random() - 0.5) * 1.0,
        radius: Math.random() * 3.7 + 0.3,
        opacity: Math.random() * 0.2 + 0.8
      };
    };
    
    starsRef.current = Array.from({ length: targetStarCount }, () => createStar(false));

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw lines between nearby particles
      starsRef.current.forEach((star, i) => {
        for (let j = i + 1; j < starsRef.current.length; j++) {
          const star2 = starsRef.current[j];
          const dx = star.x - star2.x;
          const dy = star.y - star2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 40) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 * (1 - distance / 40)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(star2.x, star2.y);
            ctx.stroke();
          }
        }
      });

      // Draw and move particles
      starsRef.current = starsRef.current.filter(star => {
        // Move particle
        star.x += star.vx;
        star.y += star.vy;

        // Remove particles that go off screen (out_mode: 'out')
        if (star.x < -10 || star.x > canvas.width + 10 || 
            star.y < -10 || star.y > canvas.height + 10) {
          return false;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();
        
        return true;
      });
      
      // Maintain consistent particle count by spawning from edges
      const deficit = targetStarCount - starsRef.current.length;
      if (deficit > 0) {
        // Spawn particles to maintain target count
        const spawnProbability = Math.min(deficit * 0.02, 0.3); // Dynamic spawn rate
        if (Math.random() < spawnProbability) {
          starsRef.current.push(createStar(true));
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
};
