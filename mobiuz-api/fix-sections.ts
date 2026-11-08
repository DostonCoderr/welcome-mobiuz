import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Section } from './src/models/Section';

dotenv.config();

async function fixSections() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('✅ MongoDB ulandi');

  const sections = await Section.find({ $or: [{ document_id: null }, { document_id: '' }] });
  console.log(`🔍 ${sections.length} ta maqolada document_id yo'q`);

  for (const sec of sections) {
    const newDocId = `section_${sec._id.toString().slice(-8)}`;
    await Section.findByIdAndUpdate(sec._id, { document_id: newDocId });
    console.log(`✅ ${sec.title_uz} -> ${newDocId}`);
  }

  console.log('🎉 Barcha maqolalar yangilandi!');
  process.exit(0);
}

fixSections();