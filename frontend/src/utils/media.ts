export const getMediaUrl = (url?: string | null): string => {
  if (!url) return '';

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  // 1. Agar allaqachon to'liq URL bo'lsa (http bilan boshlansa)
  if (url.startsWith('http')) {
    return url;
  }

  // 2. Agar HR faqat rasm nomini yozgan bo'lsa (masalan: banner1.png)
  // Supabase Storage dagi uploads papkasidan olinadi
  return `${supabaseUrl}/storage/v1/object/public/uploads/${url}`;
};