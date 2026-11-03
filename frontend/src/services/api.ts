import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ==================== TYPES ====================
export interface Department { id: number; document_id: string; name_ru: string; name_uz: string; slug: string; icon: string; color: string; order: number; }
export interface Position { id: number; document_id: string; name_ru: string; name_uz: string; slug: string; }
export interface Section { id: number; document_id: string; title_ru: string; title_uz: string; content_ru: string; content_uz: string; icon: string; order: number; is_active: boolean; is_public: boolean; department?: Department; images?: any; publishedAt?: string; }
export interface Banner { id: number; document_id: string; title_ru: string; title_uz: string; description_ru: string; description_uz: string; image: any; link: string; order: number; is_active: boolean; publishedAt?: string; }
export interface Employee { id: number; document_id: string; passport: string; birth_date: string; department?: Department; position?: Position; }
export interface Notification { id: number; document_id: string; title_ru: string; title_uz: string; message_ru: string; message_uz: string; type: 'info' | 'section' | 'event' | 'gift'; icon?: string; is_active: boolean; link?: string; order: number; is_public: boolean; department?: Department; publishedAt?: string; }
export interface Feedback { id: number; document_id: string; rating: number; comment: string; category: string; is_read: boolean; publishedAt: string; }

export const EMPLOYEE_SELECT = '*, department:departments(*), position:positions(*)';

// ==================== SECTIONS ====================

export const getPublicSections = async (): Promise<Section[]> => {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .eq('is_active', true)
    .eq('is_public', true)
    .order('order', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const getPrivateSections = async (positionId: number): Promise<Section[]> => {
  try {
    // 1. Shu lavozimga bog'langan section ID lar
    const { data: links, error: linkError } = await supabase
      .from('section_visible_positions')
      .select('section_id')
      .eq('position_id', Number(positionId));

    if (linkError) {
      console.error('[sections] link xatosi (RLS yoki ustun nomi?):', linkError);
      return [];
    }
    console.log('[sections] position:', positionId, 'links:', links);
    if (!links || links.length === 0) return [];

    const sectionIds = links.map((l: any) => l.section_id);

    // 2. Sectionlarning o'zi
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .in('id', sectionIds)
      .eq('is_active', true)
      .order('order', { ascending: true });

    if (error) {
      console.error('[sections] sections xatosi:', error);
      return [];
    }
    console.log('[sections] private topildi:', data?.length);
    return data || [];
  } catch (e) {
    console.error('getPrivateSections xatosi:', e);
    return [];
  }
};

export const getSectionsForEmployee = async (
  employee: Employee | null
): Promise<{ public: Section[]; private: Section[] }> => {
  let positionId: number | undefined = employee?.position?.id;

  // Eski/to'liq bo'lmagan localStorage bo'lsa, bazadan yangilab olamiz
  if (!positionId && employee) {
    const docId = (employee as any).documentId || employee.document_id;
    if (docId) {
      const fresh = await getEmployeeByDocumentId(docId);
      positionId = fresh?.position?.id;
    }
  }

  const publicSections = await getPublicSections();
  const privateSections = positionId ? await getPrivateSections(positionId) : [];
  return { public: publicSections, private: privateSections };
};

export const getSectionById = async (id: string): Promise<Section> => {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .eq('document_id', id)
    .single();
  if (error) throw error;
  return data;
};

export const getBanners = async (): Promise<Banner[]> => {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .order('order', { ascending: true });
  if (error) throw error;
  return data || [];
};

// ==================== EMPLOYEES ====================

export const verifyEmployee = async (passport: string, birth_date: string): Promise<Employee | null> => {
  const { data, error } = await supabase
    .from('employees')
    .select(EMPLOYEE_SELECT)
    .eq('passport', passport)
    .eq('birth_date', birth_date)
    .maybeSingle();

  if (error || !data) return null;
  return data;
};

export const getEmployeeByDocumentId = async (documentId: string): Promise<Employee | null> => {
  const { data, error } = await supabase
    .from('employees')
    .select(EMPLOYEE_SELECT)
    .eq('document_id', documentId)
    .maybeSingle();

  if (error) console.error('[employee] documentId xatosi:', error);
  return data || null;
};

// limit(1) + maybeSingle(): bir nechta qator bo'lsa ham xato bermaydi
export const getEmployeeByTelegramId = async (telegramId: string): Promise<Employee | null> => {
  const { data, error } = await supabase
    .from('employees')
    .select(EMPLOYEE_SELECT)
    .eq('telegram_id', telegramId)
    .limit(1)
    .maybeSingle();

  if (error) console.error('[employee] telegramId xatosi:', error);
  return data || null;
};

export const saveTelegramId = async (documentId: string, telegramId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('employees')
    .update({ telegram_id: telegramId })
    .eq('document_id', documentId);

  return !error;
};

// ==================== NOTIFICATIONS / FEEDBACK ====================

export const getNotificationsForEmployee = async (employee: Employee | null): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('is_active', true)
    .order('order', { ascending: true });

  if (error) return [];
  return data || [];
};

export const createFeedback = async (data: { rating: number; comment?: string; category?: string }): Promise<Feedback> => {
  const { data: result, error } = await supabase
    .from('feedbacks')
    .insert([{
      rating: data.rating,
      comment: data.comment,
      category: data.category,
    }])
    .select()
    .single();

  if (error) throw error;
  return result;
};