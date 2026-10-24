import React, { useEffect, useRef } from 'react';

interface WhirlpoolBackgroundProps {
  dominantColor: 'orange' | 'blue';
}

interface NumberParticle {
  text: string;
  dist: number;
  angle: number;
  speed: number;
  rotSpeed: number;
  baseSize: number;
  baseAlpha: number;
  color: string;
  repelX: number;
  repelY: number;
  scatterVx: number;
  scatterVy: number;
  effect: 'none' | 'pop' | 'whoosh' | 'disappear';
  effectProgress: number;
  effectDuration: number;
}

export default function WhirlpoolBackground({ dominantColor }: WhirlpoolBackgroundProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<NumberParticle[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -9999, y: -9999, active: false });
  const dominantColorRef = useRef<'orange' | 'blue'>(dominantColor);

  // Three arcade colors (vibrant and clear against the dark background)
  const BLUE_COLOR = '#38bdf8';
  const PURPLE_COLOR = '#c084fc';
  const CYAN_COLOR = '#22d3ee';

  const pickColor = (mode: 'orange' | 'blue'): string => {
    const r = Math.random();
    if (mode === 'blue') {
      if (r < 0.65) return BLUE_COLOR;
      if (r < 0.90) return PURPLE_COLOR;
      return CYAN_COLOR;
    } else {
      if (r < 0.65) return PURPLE_COLOR;
      if (r < 0.90) return BLUE_COLOR;
      return CYAN_COLOR;
    }
  };

  // Trigger color change & scatter impulse whenever dominantColor changes
  useEffect(() => {
    dominantColorRef.current = dominantColor;
    if (particlesRef.current.length > 0) {
      for (const p of particlesRef.current) {
        // Re-pick color based on new mode
        p.color = pickColor(dominantColor);
        // Scatter impulse: push outward/tangential with randomized kick
        const scatterAngle = Math.random() * Math.PI * 2;
        const scatterMagnitude = 6 + Math.random() * 8;
        p.scatterVx = Math.cos(scatterAngle) * scatterMagnitude;
        p.scatterVy = Math.sin(scatterAngle) * scatterMagnitude;
      }
    }
  }, [dominantColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse tracking for interactive repulsion
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Initialize particles once if not already initialized
    const particleCount = 100;
    const maxDist = Math.hypot(width, height) * 0.75;
    const arms = 4;

    if (particlesRef.current.length === 0) {
      const initialParticles: NumberParticle[] = [];
      for (let i = 0; i < particleCount; i++) {
        const armIndex = i % arms;
        const armOffset = (armIndex * 2 * Math.PI) / arms;
        const initialDist = 45 + Math.pow(Math.random(), 0.85) * (maxDist - 45);
        const initialAngle = armOffset + Math.log(initialDist / 25) * 1.6 + (Math.random() - 0.5) * 0.45;

        initialParticles.push({
          text: (Math.floor(Math.random() * 100) + 1).toString(),
          dist: initialDist,
          angle: initialAngle,
          speed: 0.52 + Math.random() * 0.48,
          rotSpeed: 0.0036 + Math.random() * 0.0026,
          baseSize: 22 + Math.floor(Math.random() * 22),
          baseAlpha: 0.85 + Math.random() * 0.15,
          color: pickColor(dominantColorRef.current),
          repelX: 0,
          repelY: 0,
          scatterVx: 0,
          scatterVy: 0,
          effect: 'none',
          effectProgress: 0,
          effectDuration: 28
        });
      }
      particlesRef.current = initialParticles;
    }

    const render = () => {
      const cx = width / 2;
      const cy = height / 2;
      const currentMaxDist = Math.hypot(width, height) * 0.75;
      const currentMode = dominantColorRef.current;

      // Darker, moodier arcade background gradient
      const bgGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, currentMaxDist);
      if (currentMode === 'blue') {
        bgGrad.addColorStop(0, '#0a1a3a');    // Deep dark moody blue
        bgGrad.addColorStop(0.35, '#061026'); // Dark navy
        bgGrad.addColorStop(0.7, '#030818');  // Dark edge
        bgGrad.addColorStop(1, '#01030a');    // Pitch dark edge
      } else {
        bgGrad.addColorStop(0, '#1c0a33');    // Deep dark moody purple
        bgGrad.addColorStop(0.35, '#120522'); // Dark violet
        bgGrad.addColorStop(0.7, '#090214');  // Dark edge
        bgGrad.addColorStop(1, '#020106');    // Pitch dark edge
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Ambient center vortex glow (subtle, moody arcade atmosphere)
      const eyeGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 240);
      if (currentMode === 'blue') {
        eyeGrad.addColorStop(0, 'rgba(37, 99, 235, 0.22)');
        eyeGrad.addColorStop(0.5, 'rgba(8, 145, 178, 0.08)');
        eyeGrad.addColorStop(1, 'transparent');
      } else {
        eyeGrad.addColorStop(0, 'rgba(124, 58, 237, 0.22)');
        eyeGrad.addColorStop(0.5, 'rgba(30, 64, 175, 0.08)');
        eyeGrad.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = eyeGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 240, 0, Math.PI * 2);
      ctx.fill();

      const particles = particlesRef.current;

      // Trigger random effects on idle particles
      if (Math.random() < 0.1) {
        const randIdx = Math.floor(Math.random() * particles.length);
        const target = particles[randIdx];
        if (target && target.effect === 'none' && target.dist > 100 && target.dist < currentMaxDist * 0.8) {
          const effectType = Math.random();
          if (effectType < 0.4) {
            target.effect = 'pop';
            target.effectProgress = 0;
            target.effectDuration = 28;
          } else if (effectType < 0.75) {
            target.effect = 'whoosh';
            target.effectProgress = 0;
            target.effectDuration = 45;
          } else {
            target.effect = 'disappear';
            target.effectProgress = 0;
            target.effectDuration = 35;
          }
        }
      }

      // Mouse repulsion calculations
      const mouse = mouseRef.current;
      const repelRadius = 155;

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        let currentSpeed = p.speed;
        let currentRot = p.rotSpeed * (1 + 90 / (p.dist + 60));
        let scale = 1.0;
        let alphaMultiplier = 1.0;

        // Process active effects
        if (p.effect !== 'none') {
          p.effectProgress += 1 / p.effectDuration;

          if (p.effect === 'pop') {
            const t = p.effectProgress;
            scale = 1 + Math.sin(t * Math.PI) * 0.65;
            alphaMultiplier = 1 + Math.sin(t * Math.PI) * 0.45;
            if (p.effectProgress >= 1) p.effect = 'none';
          } else if (p.effect === 'whoosh') {
            currentSpeed *= 3.8;
            currentRot *= 2.2;
            scale = 1.15;
            if (p.effectProgress >= 1) p.effect = 'none';
          } else if (p.effect === 'disappear') {
            const t = p.effectProgress;
            scale = Math.max(0.01, 1 - t * 0.9);
            alphaMultiplier = Math.max(0, 1 - t);
            if (p.effectProgress >= 1) {
              p.dist = currentMaxDist * (0.75 + Math.random() * 0.25);
              const armIndex = i % arms;
              p.angle = (armIndex * 2 * Math.PI) / arms + Math.log(p.dist / 25) * 1.6 + (Math.random() - 0.5) * 0.45;
              p.text = (Math.floor(Math.random() * 100) + 1).toString();
              p.color = pickColor(currentMode);
              p.effect = 'none';
              p.effectProgress = 0;
              p.repelX = 0;
              p.repelY = 0;
              p.scatterVx = 0;
              p.scatterVy = 0;
            }
          }
        }

        // Whirlpool mechanics
        p.angle += currentRot;
        p.dist -= currentSpeed;

        // Reset if reached inner vortex eye
        if (p.dist < 32) {
          p.dist = currentMaxDist * (0.8 + Math.random() * 0.2);
          const armIndex = i % arms;
          p.angle = (armIndex * 2 * Math.PI) / arms + Math.log(p.dist / 25) * 1.6 + (Math.random() - 0.5) * 0.45;
          p.text = (Math.floor(Math.random() * 100) + 1).toString();
          p.color = pickColor(currentMode);
          p.effect = 'none';
          p.repelX = 0;
          p.repelY = 0;
          p.scatterVx = 0;
          p.scatterVy = 0;
        }

        // Base screen position
        let posX = cx + p.dist * Math.cos(p.angle);
        let posY = cy + p.dist * Math.sin(p.angle);

        // Apply mouse repulsion if active
        if (mouse.active) {
          const dx = (posX + p.repelX) - mouse.x;
          const dy = (posY + p.repelY) - mouse.y;
          const distToMouse = Math.hypot(dx, dy);

          if (distToMouse < repelRadius && distToMouse > 0.1) {
            const force = Math.pow((repelRadius - distToMouse) / repelRadius, 1.4) * 8.5;
            p.repelX += (dx / distToMouse) * force;
            p.repelY += (dy / distToMouse) * force;
          }
        }

        // Decay velocities with friction
        p.repelX *= 0.88;
        p.repelY *= 0.88;
        p.scatterVx *= 0.92;
        p.scatterVy *= 0.92;

        const drawX = posX + p.repelX + p.scatterVx;
        const drawY = posY + p.repelY + p.scatterVy;

        // Opacity without blinking: smooth distance falloff
        let alpha = p.baseAlpha * alphaMultiplier;
        if (p.dist < 90) {
          alpha *= Math.max(0, (p.dist - 32) / 58);
        } else if (p.dist > currentMaxDist * 0.82) {
          alpha *= Math.max(0, 1 - (p.dist - currentMaxDist * 0.82) / (currentMaxDist * 0.18));
        }

        if (alpha <= 0.01) continue;

        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(p.angle + Math.PI / 2);
        ctx.scale(scale, scale);

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.min(0.95, alpha);
        ctx.font = `bold ${p.baseSize}px 'Pixelify Sans', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Sharp drop shadow under each number
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.fillText(p.text, 0, 0);

        if (p.effect === 'pop' || p.effect === 'whoosh') {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.fillText(p.text, 0, 0);
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
    />
  );
}
