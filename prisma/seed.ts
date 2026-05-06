/**
 * Prisma seed script — khởi tạo dữ liệu mẫu
 *
 * Tạo:
 *   - 1 tài khoản Admin mặc định
 *   - 11 Section với nội dung placeholder cho từng SectionType
 *
 * Idempotent: dùng upsert, an toàn khi chạy nhiều lần.
 *
 * Chạy: tsx prisma/seed.ts
 * Requirements: 1.1, 5.1
 */

import { PrismaClient, SectionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Admin account
// ---------------------------------------------------------------------------

async function seedAdmin() {
  const email = 'admin@school.edu.vn';
  const plainPassword = 'Admin@123456';
  const passwordHash = await bcrypt.hash(plainPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: 'Quản trị viên',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log(`✅ Admin account: ${admin.email} (id: ${admin.id})`);
}

// ---------------------------------------------------------------------------
// Section seed data
// ---------------------------------------------------------------------------

interface SectionSeed {
  type: SectionType;
  title: string;
  order: number;
  content: Record<string, unknown>;
}

const sections: SectionSeed[] = [
  // 1. HERO
  {
    type: SectionType.HERO,
    title: 'Hero — Trang chủ',
    order: 1,
    content: {
      headline: 'Trường THPT Mẫu — Nơi Ươm Mầm Tài Năng',
      subheadline: 'Chất lượng giáo dục hàng đầu, môi trường học tập hiện đại, đội ngũ giáo viên tận tâm.',
      backgroundType: 'image',
      backgroundUrl: 'https://placehold.co/1920x1080/0071E3/FFFFFF?text=Hero+Background',
      ctaText: 'Đăng ký tư vấn ngay',
      ctaTarget: '#registration-form',
    },
  },

  // 2. INTRO
  {
    type: SectionType.INTRO,
    title: 'Giới thiệu trường',
    order: 2,
    content: {
      title: 'Về Trường THPT Mẫu',
      body: 'Trường THPT Mẫu được thành lập năm 2000, là một trong những trường THPT hàng đầu tại địa phương với hơn 20 năm kinh nghiệm đào tạo. Chúng tôi tự hào về môi trường học tập thân thiện, chương trình giảng dạy tiên tiến và tỷ lệ học sinh đỗ đại học cao.',
      imageUrl: 'https://placehold.co/800x600/EDEDF2/1D1D1F?text=School+Building',
      stats: [
        { label: 'Năm thành lập', value: '2000' },
        { label: 'Học sinh hiện tại', value: '1.200+' },
        { label: 'Giáo viên', value: '80+' },
        { label: 'Tỷ lệ đỗ ĐH', value: '98%' },
      ],
    },
  },

  // 3. PROGRAM
  {
    type: SectionType.PROGRAM,
    title: 'Chương trình đào tạo',
    order: 3,
    content: {
      title: 'Chương Trình Đào Tạo',
      programs: [
        {
          name: 'Chương trình Chuẩn',
          description: 'Chương trình giáo dục phổ thông theo chuẩn Bộ GD&ĐT, tập trung phát triển toàn diện kiến thức và kỹ năng.',
          imageUrl: 'https://placehold.co/400x300/EDEDF2/1D1D1F?text=Standard+Program',
        },
        {
          name: 'Chương trình Nâng cao',
          description: 'Chương trình chuyên sâu dành cho học sinh có năng lực vượt trội, chuẩn bị cho các kỳ thi học sinh giỏi và đại học.',
          imageUrl: 'https://placehold.co/400x300/EDEDF2/1D1D1F?text=Advanced+Program',
        },
        {
          name: 'Chương trình STEM',
          description: 'Tích hợp Khoa học, Công nghệ, Kỹ thuật và Toán học, phát triển tư duy sáng tạo và kỹ năng giải quyết vấn đề.',
          imageUrl: 'https://placehold.co/400x300/EDEDF2/1D1D1F?text=STEM+Program',
        },
      ],
    },
  },

  // 4. ACHIEVEMENT
  {
    type: SectionType.ACHIEVEMENT,
    title: 'Thành tích nổi bật',
    order: 4,
    content: {
      title: 'Thành Tích Nổi Bật',
      achievements: [
        { label: 'Tỷ lệ đỗ đại học', value: '98%', description: 'Trong 5 năm gần nhất' },
        { label: 'Học sinh giỏi cấp tỉnh', value: '150+', description: 'Mỗi năm học' },
        { label: 'Giải quốc gia', value: '12', description: 'Trong 3 năm gần nhất' },
        { label: 'Trường đạt chuẩn quốc gia', value: 'Mức độ 2', description: 'Được công nhận năm 2022' },
        { label: 'Học bổng đại học', value: '200+', description: 'Học sinh nhận học bổng mỗi năm' },
      ],
    },
  },

  // 5. FACILITY
  {
    type: SectionType.FACILITY,
    title: 'Cơ sở vật chất',
    order: 5,
    content: {
      title: 'Cơ Sở Vật Chất Hiện Đại',
      facilities: [
        {
          name: 'Phòng học thông minh',
          description: 'Trang bị màn hình tương tác, hệ thống âm thanh hiện đại, điều hòa không khí.',
          imageUrl: 'https://placehold.co/600x400/EDEDF2/1D1D1F?text=Smart+Classroom',
        },
        {
          name: 'Phòng thí nghiệm',
          description: 'Phòng thí nghiệm Vật lý, Hóa học, Sinh học được trang bị đầy đủ thiết bị hiện đại.',
          imageUrl: 'https://placehold.co/600x400/EDEDF2/1D1D1F?text=Laboratory',
        },
        {
          name: 'Thư viện',
          description: 'Thư viện với hơn 10.000 đầu sách, khu vực đọc sách yên tĩnh và hệ thống tra cứu điện tử.',
          imageUrl: 'https://placehold.co/600x400/EDEDF2/1D1D1F?text=Library',
        },
        {
          name: 'Sân thể thao',
          description: 'Sân bóng đá, bóng rổ, cầu lông và khu vực tập thể dục ngoài trời.',
          imageUrl: 'https://placehold.co/600x400/EDEDF2/1D1D1F?text=Sports+Ground',
        },
      ],
    },
  },

  // 6. EXTRACURRICULAR
  {
    type: SectionType.EXTRACURRICULAR,
    title: 'Hoạt động ngoại khóa',
    order: 6,
    content: {
      title: 'Hoạt Động Ngoại Khóa',
      activities: [
        {
          name: 'CLB Robotics',
          description: 'Câu lạc bộ lập trình và chế tạo robot, tham gia các cuộc thi cấp tỉnh và quốc gia.',
          imageUrl: 'https://placehold.co/400x300/EDEDF2/1D1D1F?text=Robotics+Club',
        },
        {
          name: 'CLB Tiếng Anh',
          description: 'Giao lưu, thực hành tiếng Anh với giáo viên bản ngữ và học sinh quốc tế.',
          imageUrl: 'https://placehold.co/400x300/EDEDF2/1D1D1F?text=English+Club',
        },
        {
          name: 'Đội bóng đá',
          description: 'Đội bóng đá nam và nữ tham gia giải học sinh THPT cấp tỉnh hàng năm.',
          imageUrl: 'https://placehold.co/400x300/EDEDF2/1D1D1F?text=Football+Team',
        },
        {
          name: 'CLB Nghệ thuật',
          description: 'Múa, hát, nhạc cụ và hội họa — phát triển năng khiếu nghệ thuật toàn diện.',
          imageUrl: 'https://placehold.co/400x300/EDEDF2/1D1D1F?text=Arts+Club',
        },
        {
          name: 'Tình nguyện cộng đồng',
          description: 'Các hoạt động tình nguyện, từ thiện và bảo vệ môi trường trong cộng đồng.',
          imageUrl: 'https://placehold.co/400x300/EDEDF2/1D1D1F?text=Volunteer',
        },
      ],
    },
  },

  // 7. TEACHER
  {
    type: SectionType.TEACHER,
    title: 'Đội ngũ giáo viên',
    order: 7,
    content: {
      title: 'Đội Ngũ Giáo Viên Tận Tâm',
      teachers: [
        {
          name: 'Nguyễn Thị Lan',
          subject: 'Toán học',
          bio: 'Thạc sĩ Toán học, 15 năm kinh nghiệm giảng dạy. Giáo viên dạy giỏi cấp tỉnh 5 năm liên tiếp.',
          avatarUrl: 'https://placehold.co/200x200/0071E3/FFFFFF?text=NTL',
        },
        {
          name: 'Trần Văn Minh',
          subject: 'Vật lý',
          bio: 'Tiến sĩ Vật lý, nguyên giảng viên Đại học Bách Khoa. Chuyên gia luyện thi học sinh giỏi quốc gia.',
          avatarUrl: 'https://placehold.co/200x200/0071E3/FFFFFF?text=TVM',
        },
        {
          name: 'Lê Thị Hoa',
          subject: 'Ngữ văn',
          bio: 'Thạc sĩ Ngữ văn, 12 năm kinh nghiệm. Tác giả nhiều tài liệu ôn thi THPT Quốc gia.',
          avatarUrl: 'https://placehold.co/200x200/0071E3/FFFFFF?text=LTH',
        },
        {
          name: 'Phạm Quốc Hùng',
          subject: 'Tiếng Anh',
          bio: 'Cử nhân Ngôn ngữ Anh, chứng chỉ IELTS 8.0. Từng học tập và làm việc tại Úc 3 năm.',
          avatarUrl: 'https://placehold.co/200x200/0071E3/FFFFFF?text=PQH',
        },
        {
          name: 'Hoàng Thị Mai',
          subject: 'Hóa học',
          bio: 'Thạc sĩ Hóa học, 10 năm kinh nghiệm. Giáo viên chủ nhiệm đội tuyển Hóa học cấp tỉnh.',
          avatarUrl: 'https://placehold.co/200x200/0071E3/FFFFFF?text=HTM',
        },
      ],
    },
  },

  // 8. ADMISSION
  {
    type: SectionType.ADMISSION,
    title: 'Thông tin tuyển sinh',
    order: 8,
    content: {
      title: 'Quy Trình Tuyển Sinh',
      steps: [
        {
          step: 1,
          title: 'Đăng ký tư vấn',
          description: 'Điền form đăng ký trực tuyến hoặc liên hệ trực tiếp với phòng tuyển sinh để được tư vấn miễn phí.',
        },
        {
          step: 2,
          title: 'Tham quan trường',
          description: 'Đặt lịch tham quan cơ sở vật chất, gặp gỡ giáo viên và học sinh hiện tại.',
        },
        {
          step: 3,
          title: 'Nộp hồ sơ',
          description: 'Nộp hồ sơ đăng ký bao gồm: học bạ THCS, giấy khai sinh, ảnh 3x4 và các giấy tờ liên quan.',
        },
        {
          step: 4,
          title: 'Kiểm tra đầu vào',
          description: 'Tham dự bài kiểm tra đầu vào (Toán, Văn, Anh) để phân lớp phù hợp với năng lực.',
        },
        {
          step: 5,
          title: 'Nhập học',
          description: 'Hoàn tất thủ tục nhập học, đóng học phí và nhận lịch học chính thức.',
        },
      ],
      requirements: 'Học sinh tốt nghiệp THCS, hạnh kiểm từ Khá trở lên, học lực từ Khá trở lên trong 3 năm THCS.',
      deadline: '31/07 hàng năm',
    },
  },

  // 9. TUITION
  {
    type: SectionType.TUITION,
    title: 'Học phí',
    order: 9,
    content: {
      title: 'Bảng Học Phí',
      items: [
        {
          grade: 'Lớp 10',
          amount: 3500000,
          currency: 'VND',
          period: 'tháng',
          notes: 'Chưa bao gồm học phí các môn năng khiếu',
        },
        {
          grade: 'Lớp 11',
          amount: 3500000,
          currency: 'VND',
          period: 'tháng',
          notes: 'Chưa bao gồm học phí các môn năng khiếu',
        },
        {
          grade: 'Lớp 12',
          amount: 4000000,
          currency: 'VND',
          period: 'tháng',
          notes: 'Bao gồm ôn thi THPT Quốc gia',
        },
      ],
      scholarshipInfo: 'Học sinh xuất sắc (GPA ≥ 9.0) được miễn 50% học phí. Học sinh có hoàn cảnh khó khăn được xét học bổng theo quy định.',
    },
  },

  // 10. TESTIMONIAL
  {
    type: SectionType.TESTIMONIAL,
    title: 'Cảm nhận phụ huynh & học sinh',
    order: 10,
    content: {
      title: 'Cảm Nhận Từ Phụ Huynh & Học Sinh',
      testimonials: [
        {
          authorName: 'Chị Nguyễn Thị Bích',
          role: 'Phụ huynh',
          content: 'Con tôi học tại trường được 2 năm và tiến bộ rõ rệt. Giáo viên rất tận tâm, luôn theo sát từng học sinh. Tôi rất hài lòng với môi trường học tập ở đây.',
          avatarUrl: 'https://placehold.co/100x100/EDEDF2/1D1D1F?text=NTB',
          rating: 5,
        },
        {
          authorName: 'Em Trần Minh Khoa',
          role: 'Học sinh cũ',
          content: 'Nhờ sự dạy dỗ tận tình của thầy cô, em đã đỗ vào Đại học Bách Khoa với điểm cao. Trường không chỉ dạy kiến thức mà còn rèn luyện kỹ năng sống cho chúng em.',
          avatarUrl: 'https://placehold.co/100x100/EDEDF2/1D1D1F?text=TMK',
          rating: 5,
        },
        {
          authorName: 'Anh Lê Văn Đức',
          role: 'Phụ huynh',
          content: 'Cơ sở vật chất hiện đại, chương trình học phong phú. Con tôi rất thích đến trường mỗi ngày. Đây là quyết định đúng đắn nhất của gia đình tôi.',
          avatarUrl: 'https://placehold.co/100x100/EDEDF2/1D1D1F?text=LVD',
          rating: 4,
        },
        {
          authorName: 'Em Phạm Thị Ngọc',
          role: 'Học sinh cũ',
          content: 'Các hoạt động ngoại khóa ở trường giúp em phát triển toàn diện. Em đã tìm được đam mê với lập trình qua CLB Robotics và hiện đang học ngành CNTT.',
          avatarUrl: 'https://placehold.co/100x100/EDEDF2/1D1D1F?text=PTN',
          rating: 5,
        },
      ],
    },
  },

  // 11. FOOTER
  {
    type: SectionType.FOOTER,
    title: 'Footer',
    order: 11,
    content: {
      schoolName: 'Trường THPT Mẫu',
      address: '123 Đường Giáo Dục, Phường Tri Thức, Quận Học Vấn, TP. Hồ Chí Minh',
      phone: '0901234567',
      email: 'tuyensinh@school.edu.vn',
      socialLinks: [
        { platform: 'Facebook', url: 'https://facebook.com/truongthptmau' },
        { platform: 'YouTube', url: 'https://youtube.com/@truongthptmau' },
        { platform: 'Zalo', url: 'https://zalo.me/truongthptmau' },
      ],
      copyrightText: '© 2024 Trường THPT Mẫu. Bảo lưu mọi quyền.',
    },
  },
];

async function seedSections() {
  for (const section of sections) {
    const result = await prisma.section.upsert({
      where: { type: section.type },
      update: {
        title: section.title,
        order: section.order,
        content: section.content,
      },
      create: {
        type: section.type,
        title: section.title,
        order: section.order,
        content: section.content,
        isVisible: true,
      },
    });
    console.log(`✅ Section [${result.type}] (order: ${result.order}): ${result.title}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu...\n');

  await seedAdmin();
  console.log('');
  await seedSections();

  console.log('\n✨ Seed hoàn tất!');
}

main()
  .catch((error) => {
    console.error('❌ Seed thất bại:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
