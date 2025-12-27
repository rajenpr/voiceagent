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

    // Gradient configuration
    const colors = [
      { r: 99, g: 91, b: 255 },   // Stripe purple
      { r: 122, g: 115, b: 255 }, // Light purple
      { r: 0, g: 212, b: 255 },   // Light blue
      { r: 138, g: 132, b: 255 }, // Lighter purple
    ];

    let time = 0;

    const animate = () => {
      time += 0.002;

      // Create multiple radial gradients
      const gradients = colors.map((color, i) => {
        const angle = (time + i * Math.PI / 2);
        const x = canvas.width / 2 + Math.cos(angle) * canvas.width * 0.3;
        const y = canvas.height / 2 + Math.sin(angle) * canvas.height * 0.3;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, canvas.width * 0.6);
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.4)`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        return { gradient, x, y };
      });

      // Clear canvas with dark blue background
      ctx.fillStyle = '#0A2540';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw gradients with blend mode
      ctx.globalCompositeOperation = 'screen';
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
      style={{ filter: 'blur(60px)' }}
    />
  );
}
