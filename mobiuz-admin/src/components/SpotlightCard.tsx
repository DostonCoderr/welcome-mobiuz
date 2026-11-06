import { useRef, type HTMLAttributes, type KeyboardEvent, type MouseEvent } from 'react';
import gsap from 'gsap';

interface SpotlightCardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onMouseMove' | 'onMouseLeave'> {
  /** true bo'lsa — sichqoncha ta'sirida 3D qiyshayadi */
  tilt?: boolean;
}

/** Sichqoncha ortidan yog'du yuradigan kartochka (+ ixtiyoriy 3D tilt) */
export default function SpotlightCard({
  children,
  className = '',
  tilt = false,
  onClick,
  ...rest
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty('--mx', `${x}px`);
    el.style.setProperty('--my', `${y}px`);

    if (tilt) {
      gsap.to(el, {
        rotationX: (y / r.height - 0.5) * -9,
        rotationY: (x / r.width - 0.5) * 9,
        transformPerspective: 900,
        duration: 0.4,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
  };

  const handleLeave = () => {
    if (tilt && ref.current) {
      gsap.to(ref.current, {
        rotationX: 0,
        rotationY: 0,
        duration: 0.7,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e as unknown as MouseEvent<HTMLDivElement>);
    }
  };

  return (
    <div
      {...rest}
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      onKeyDown={onClick ? handleKey : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`card spot ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}