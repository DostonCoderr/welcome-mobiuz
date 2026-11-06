const MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
];
const WEEKDAYS = [
  'Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba',
  'Payshanba', 'Juma', 'Shanba',
];

const pad = (n: number) => String(n).padStart(2, '0');

/** "Payshanba, 5 noyabr 2026" */
export const formatUzDate = (d: Date = new Date()): string =>
  `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

/** "14:05" */
export const formatTime = (d: Date = new Date()): string =>
  `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const formatSeconds = (d: Date = new Date()): string => pad(d.getSeconds());

/** Kun vaqtiga qarab salom */
export const greeting = (d: Date = new Date()): string => {
  const h = d.getHours();
  if (h < 5) return 'Xayrli tun';
  if (h < 12) return 'Xayrli tong';
  if (h < 18) return 'Xayrli kun';
  return 'Xayrli kech';
};

/** { name_uz, name_ru } obyektidan nom olish */
export const nameOf = (o: any): string => o?.name_uz || o?.name_ru || o?.name || '';

/** Brauzerda CSV fayl yuklab olish (Excel uchun UTF-8 BOM bilan) */
export function downloadCSV(filename: string, rows: Record<string, unknown>[]): boolean {
  if (!rows.length) return false;

  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const csv =
    '\uFEFF' +
    [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}