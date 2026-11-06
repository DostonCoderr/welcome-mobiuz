import { useEffect, useState } from 'react';

/** Har intervalMs da yangilanadigan joriy vaqt (jonli soat uchun) */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}