import { useMemo } from 'react';

interface SnowfallProps {
  count?: number;
  /** "r,g,b" formatida */
  color?: string;
  opacity?: number;
  className?: string;
}

export default function Snowfall({
  count = 40,
  color = '255,255,255',
  opacity = 0.85,
  className = 'absolute inset-0 w-full h-full pointer-events-none',
}: SnowfallProps) {
  // ⚡ CSS animatsiya uchun qor parchalari (random)
  const flakes = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,           // 0-100%
      size: Math.random() * 2.5 + 1,       // 1-3.5px
      delay: Math.random() * 8,            // 0-8s
      duration: Math.random() * 6 + 6,     // 6-12s
      opacity: Math.random() * 0.5 + 0.5,  // 0.5-1
      drift: Math.random() * 40 - 20,      // -20 to +20px
    }));
  }, [count]);

  return (
    <div className={className} aria-hidden="true">
      {flakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute rounded-full"
          style={{
            left: `${flake.left}%`,
            top: '-10px',
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            backgroundColor: `rgba(${color}, ${flake.opacity * opacity})`,
            animation: `snowfall-${flake.id} ${flake.duration}s linear ${flake.delay}s infinite`,
            willChange: 'transform, opacity',
          }}
        />
      ))}

      {/* ⚡ CSS keyframes */}
      <style>{`
        ${flakes
          .map(
            (flake) => `
          @keyframes snowfall-${flake.id} {
            0% {
              transform: translateY(0) translateX(0);
              opacity: 0;
            }
            10% {
              opacity: ${flake.opacity * opacity};
            }
            90% {
              opacity: ${flake.opacity * opacity};
            }
            100% {
              transform: translateY(105vh) translateX(${flake.drift}px);
              opacity: 0;
            }
          }
        `
          )
          .join('')}
      `}</style>
    </div>
  );
}