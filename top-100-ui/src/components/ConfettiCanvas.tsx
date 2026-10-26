import React, { useEffect, useRef } from 'react';

interface ConfettiCanvasProps {
  active: boolean;
  durationMs?: number;
}

interface Particle {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  vx: number;
  vy: number;
  tilt: number;
  tiltAngle: number;
  tiltAngleIncremental: number;
  shape: 'rect' | 'circle' | 'ribbon';
  alpha: number;
}

const CELEBRATION_COLORS = [
  '#62f6bd', // Mint neon
  '#00b6de', // Sky cyan
  '#107dee', // Electric azure
  '#9cf6ff', // Ice cyan
  '#4a34de', // Royal violet
  '#6ad6cd', // Soft mint
  '#10aa83'  // Emerald teal
];

export default function ConfettiCanvas({ active, durationMs = 5000 }: ConfettiCanvasProps): React.JSX.Element | null {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initialize 220 celebratory particles
    const particleCount = 220;
    const particles: Particle[] = [];

    // Blast sources: bottom left, bottom right, and center top
    for (let i = 0; i < particleCount; i++) {
      const source = i % 3;
      let startX = width * 0.5;
      let startY = height * 0.4;
      let vx = (Math.random() - 0.5) * 16;
      let vy = (Math.random() - 0.7) * 20;

      if (source === 0) {
        // Bottom-left cannon
        startX = width * 0.1;
        startY = height * 0.95;
        vx = Math.random() * 14 + 4;
        vy = -(Math.random() * 18 + 10);
      } else if (source === 1) {
        // Bottom-right cannon
        startX = width * 0.9;
        startY = height * 0.95;
        vx = -(Math.random() * 14 + 4);
        vy = -(Math.random() * 18 + 10);
      }

      particles.push({
        x: startX,
        y: startY,
        w: Math.random() * 12 + 6,
        h: Math.random() * 8 + 4,
        color: CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)],
        vx,
        vy,
        tilt: Math.random() * 10 - 10,
        tiltAngle: 0,
        tiltAngleIncremental: (Math.random() * 0.08) + 0.04,
        shape: i % 5 === 0 ? 'circle' : i % 7 === 0 ? 'ribbon' : 'rect',
        alpha: 1
      });
    }

    const startTime = performance.now();
    let animationFrameId: number;

    const render = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, width, height);

      let allDead = true;

      for (const p of particles) {
        // Physics update
        p.vy += 0.38; // Gravity
        p.vx *= 0.985; // Air drag
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;

        p.tiltAngle += p.tiltAngleIncremental;
        p.tilt = Math.sin(p.tiltAngle) * 14;

        // Fade out toward end of duration
        if (elapsed > durationMs - 1500) {
          const fadeProgress = (elapsed - (durationMs - 1500)) / 1500;
          p.alpha = Math.max(0, 1 - fadeProgress);
        }

        if (p.alpha > 0.01 && p.y < height + 40) {
          allDead = false;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;

          ctx.translate(p.x, p.y);
          ctx.rotate((p.tiltAngle * Math.PI) / 180);

          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.w * 0.4, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.shape === 'ribbon') {
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w * 1.6, p.h * 0.6);
          } else {
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          }

          ctx.restore();
        }
      }

      if (!allDead && elapsed < durationMs) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [active, durationMs]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100]"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
