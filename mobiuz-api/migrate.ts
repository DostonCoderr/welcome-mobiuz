import { createClient } from '@supabase/supabase-js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Employee } from './src/models/Employee';
import { Department } from './src/models/Department';
import { Position } from './src/models/Position';

dotenv.config();

// ⚡ Supabase kalitlari (o'zingiznikiga almashtiring)
const supabase = createClient(
  'https://rvsjaltreligwaxycjmp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2c2phbHRyZWxpZ3dheHljam1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTk1MTAsImV4cCI6MjEwNzk3NTUxMH0.DO0djpwYESP0z9rPa_ry4y45YifK7rYEqFlbxkaPHgA'
);

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ MongoDB ulandi');


    // ⚡ Eski indekslarni o'chirish (telegram_id_1)
try {
  await mongoose.connection.collection('employees').dropIndex('telegram_id_1');
  console.log('🗑️ Eski telegram_id indeksi o\'chirildi');
} catch (e) {
  console.log('ℹ️ Eski indeks topilmadi (yoki allaqachon o\'chirilgan)');
}

    // ⚡ Barcha eski ma'lumotlarni o'chirish
    await Department.deleteMany({});
    await Position.deleteMany({});
    await Employee.deleteMany({});
    console.log('🗑️ Eski ma\'lumotlar tozalandi');

    // 1. Departments
    const { data: deps, error: depError } = await supabase.from('departments').select('*');
    if (depError) throw depError;
    if (deps) {
      for (const d of deps) {
        // ⚡ Har bir bo'lim uchun unikal slug yasaymiz
        const baseSlug = d.slug || (d.name_uz ? d.name_uz.toLowerCase().replace(/\s+/g, '-') : 'dep');
        const slug = `${baseSlug}-${d.id}`;
        
        await Department.create({
          name_uz: d.name_uz || 'Nomsiz',
          name_ru: d.name_ru || 'Без названия',
          slug: slug,
          icon: d.icon || 'building',
          color: d.color || '#6b7280',
          order: d.order || 0,
          is_active: d.is_active !== false,
        });
      }
      console.log(`✅ ${deps.length} ta bo'lim ko'chirildi`);
    }

    // 2. Positions
    const { data: pos, error: posError } = await supabase.from('positions').select('*');
    if (posError) throw posError;
    if (pos) {
      for (const p of pos) {
        const baseSlug = p.slug || (p.name_uz ? p.name_uz.toLowerCase().replace(/\s+/g, '-') : 'pos');
        const slug = `${baseSlug}-${p.id}`;
        
        await Position.create({
          name_uz: p.name_uz || 'Nomsiz',
          name_ru: p.name_ru || 'Без названия',
          slug: slug,
          is_active: p.is_active !== false,
        });
      }
      console.log(`✅ ${pos.length} ta lavozim ko'chirildi`);
    }

    // 3. Employees
    const { data: emps, error: empError } = await supabase.from('employees').select('*');
    if (empError) throw empError;
    if (emps) {
      for (const e of emps) {
        await Employee.create({
          full_name: e.passport || 'Nomsiz', // vaqtincha passportni ism sifatida yozamiz
          passport: e.passport,
          birth_date: e.birth_date,
          telegram_id: e.telegram_id ? String(e.telegram_id) : null,
        });
      }
      console.log(`✅ ${emps.length} ta xodim ko'chirildi`);
    }

    console.log('🎉 Migratsiya muvaffaqiyatli tugadi!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migratsiya xatosi:', error.message);
    process.exit(1);
  }
}

migrate();