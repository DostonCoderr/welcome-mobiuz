import { useEffect, useRef } from 'react';

interface SnowfallProps {
  /** Katta ekrandagi qor parchalari soni (kichik ekranda avtomatik kamayadi) */
  count?: number;
}

interface Flake {
  x: number;
  y: number;
  depth: number; // 0 = uzoq, 1 = yaqin
  size: number;
  speed: number;
  swing: number;
  freq: number;
  phase: number;
  alpha: number;
}

/** Butun ekran bo'ylab mayin yog'adigan qor (Canvas, bosishlarga xalaqit bermaydi) */
export default function Snowfall({ count = 70 }: SnowfallProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    let raf = 0;
    let last = performance.now();
    let time = 0;
    let wind = 0;
    let windTarget = 0;

    // Yumshoq qor parchasi uchun bir marta chiziladigan "sprite"
    const S = 64;
    const sprite = document.createElement('canvas');
    sprite.width = S;
    sprite.height = S;
    const sctx = sprite.getContext('2d');
    if (!sctx) return;
    const g = sctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, S, S);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const total = Math.max(32, Math.round(count * Math.min(1.2, (w * h) / (1440 * 900))));

    const make = (initial: boolean): Flake => {
      const depth = Math.random();
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * h : -30,
        depth,
        size: 5 + depth * 13,
        speed: 16 + depth * 40,
        swing: 6 + Math.random() * 20,
        freq: 0.35 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.18 + depth * 0.42,
      };
    };

    const flakes: Flake[] = Array.from({ length: total }, () => make(true));

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt;
      wind += (windTarget - wind) * Math.min(dt * 1.5, 1);

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        f.y += f.speed * dt;
        f.x += wind * (0.4 + f.depth) * dt;

        if (f.y > h + 30) {
          flakes[i] = make(false);
          continue;
        }
        if (f.x < -40) f.x = w + 40;
        else if (f.x > w + 40) f.x = -40;

        const dx = Math.sin(time * f.freq + f.phase) * f.swing;
        ctx.globalAlpha = f.alpha;
        ctx.drawImage(sprite, f.x + dx - f.size / 2, f.y - f.size / 2, f.size, f.size);
      }

      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    // Sichqoncha harakati qorga juda yengil "shamol" beradi
    const onMove = (e: MouseEvent) => {
      windTarget = (e.clientX / w - 0.5) * 2 * 22;
    };
    // Tab yashirin bo'lsa to'xtatamiz (batareya va CPU tejash)
    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else start();
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    start();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [count]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[55] h-full w-full"
    />
  );
}