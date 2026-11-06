import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

/** Raqamni GSAP bilan 0 dan (yoki oldingi qiymatdan) silliq sanaydi */
export default function AnimatedNumber({
  value,
  decimals = 0,
  duration = 1.3,
  suffix = '',
  className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const last = useRef(0);

  useEffect(() => {
    const obj = { v: last.current };
    const tween = gsap.to(obj, {
      v: value,
      duration,
      ease: 'power3.out',
      onUpdate: () => {
        if (ref.current) ref.current.textContent = obj.v.toFixed(decimals) + suffix;
      },
    });
    return () => {
      last.current = obj.v;
      tween.kill();
    };
  }, [value, decimals, duration, suffix]);

  return (
    <span ref={ref} className={className}>
      {(0).toFixed(decimals) + suffix}
    </span>
  );
}