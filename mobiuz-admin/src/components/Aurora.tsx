import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const BLOBS = [
  { color: 'rgba(255, 43, 58, 0.30)', size: 620, top: '-14%', left: '58%' },
  { color: 'rgba(124, 92, 255, 0.20)', size: 560, top: '55%', left: '-10%' },
  { color: 'rgba(34, 211, 238, 0.13)', size: 480, top: '62%', left: '70%' },
];

/** GSAP bilan harakatlanuvchi "aurora" fon */
export default function Aurora() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-blob]').forEach((el, i) => {
        gsap.to(el, {
          x: 'random(-140, 140)',
          y: 'random(-110, 110)',
          scale: 'random(0.85, 1.25)',
          duration: 'random(9, 15)',
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.7,
        });
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {BLOBS.map((b, i) => (
        <div
          key={i}
          data-blob
          className="absolute rounded-full"
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            background: b.color,
            filter: 'blur(120px)',
          }}
        />
      ))}
    </div>
  );
}