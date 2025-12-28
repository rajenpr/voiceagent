'use client';

import { useEffect, useRef } from 'react';

export default function MeshGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Stripe-style subtle gradient colors
    const colors = [
      { r: 99, g: 91, b: 255, a: 0.08 },    // Stripe purple - very subtle
      { r: 122, g: 115, b: 255, a: 0.06 },  // Light purple
      { r: 0, g: 212, b: 255, a: 0.05 },    // Light blue
    ];

    let time = 0;

    const animate = () => {
      time += 0.0008; // Slower, more subtle animation

      // Clear canvas with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Create subtle radial gradients
      const gradients = colors.map((color, i) => {
        const angle = (time + i * Math.PI / 1.5);
        const x = canvas.width / 2 + Math.cos(angle) * canvas.width * 0.25;
        const y = canvas.height / 3 + Math.sin(angle) * canvas.height * 0.15;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, canvas.width * 0.8);
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`);
        gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a * 0.5})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        return { gradient, x, y };
      });

      // Draw gradients with subtle blend
      ctx.globalCompositeOperation = 'normal';
      gradients.forEach(({ gradient }) => {
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"
      style={{ filter: 'blur(100px)', opacity: 0.6 }}
    />
  );
}
