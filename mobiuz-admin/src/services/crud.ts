import { api } from '../api';

/**
 * Tahrirlash (PUT) uchun yo'llar. Backend yo'llari boshqacha bo'lsa, shu yerda o'zgartiring.
 * Masalan: PUT /employees/:id
 */
export const RES = {
  employees: '/employees',
  departments: '/departments',
  positions: '/positions',
  sections: '/sections',
  banners: '/banners',
} as const;

export type Resource = keyof typeof RES;

export async function updateItem(res: Resource, id: string, data: Record<string, unknown>) {
  const { data: out } = await api.put(`${RES[res]}/${id}`, data);
  return out;
}

/** Server shu yo'lni qo'llab-quvvatlamasa (404/405/501) */
export const isUnsupported = (e: any): boolean =>
  [404, 405, 501].includes(e?.response?.status);