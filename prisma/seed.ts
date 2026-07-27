import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Comprehensive list of Ethiopian Public & Private Universities
  const universitiesData = [
    // Public Universities
    { name: 'Addis Ababa University', code: 'AAU', domains: 'aau.edu.et' },
    { name: 'Addis Ababa Science and Technology University', code: 'AASTU', domains: 'aastu.edu.et' },
    { name: 'Adama Science and Technology University', code: 'ASTU', domains: 'astu.edu.et' },
    { name: 'Bahir Dar University', code: 'BDU', domains: 'bdu.edu.et' },
    { name: 'Hawassa University', code: 'HU', domains: 'hu.edu.et' },
    { name: 'Jimma University', code: 'JU', domains: 'ju.edu.et' },
    { name: 'Mekelle University', code: 'MU', domains: 'mu.edu.et' },
    { name: 'Haramaya University', code: 'HRU', domains: 'haramaya.edu.et' },
    { name: 'University of Gondar', code: 'UOG', domains: 'uog.edu.et' },
    { name: 'Arba Minch University', code: 'AMU', domains: 'amu.edu.et' },
    { name: 'Wollo University', code: 'WU', domains: 'wu.edu.et' },
    { name: 'Debre Markos University', code: 'DMU', domains: 'dmu.edu.et' },
    { name: 'Debre Berhan University', code: 'DBU', domains: 'dbu.edu.et' },
    { name: 'Dilla University', code: 'DU', domains: 'du.edu.et' },
    { name: 'Dire Dawa University', code: 'DDU', domains: 'ddu.edu.et' },
    { name: 'Jigjiga University', code: 'JJU', domains: 'jju.edu.et' },
    { name: 'Ambo University', code: 'AU', domains: 'au.edu.et' },
    { name: 'Wolaita Sodo University', code: 'WSU', domains: 'wsu.edu.et' },
    { name: 'Semera University', code: 'SU', domains: 'su.edu.et' },
    { name: 'Mizan-Tepi University', code: 'MTU', domains: 'mtu.edu.et' },
    { name: 'Madda Walabu University', code: 'MWU', domains: 'mwu.edu.et' },
    { name: 'Woldia University', code: 'WDU', domains: 'wdu.edu.et' },
    { name: 'Bule Hora University', code: 'BHU', domains: 'bhu.edu.et' },
    { name: 'Kotebe Education University', code: 'KEU', domains: 'keu.edu.et' },

    // Private Universities & University Colleges
    { name: 'St. Mary\'s University', code: 'SMU', domains: 'smu.edu.et' },
    { name: 'Unity University', code: 'UU', domains: 'uu.edu.et' },
    { name: 'Rift Valley University', code: 'RVU', domains: 'rvu.edu.et' },
    { name: 'HiLCoE School of Computer Science & Technology', code: 'HILCOE', domains: 'hilcoe.edu.et' },
    { name: 'CPU College', code: 'CPU', domains: 'cpu.edu.et' },
    { name: 'MicroLink Information Technology College', code: 'MLC', domains: 'microlink.edu.et' },
    { name: 'Admas University', code: 'ADMAS', domains: 'admasuniversity.edu.et' },
    { name: 'Yardstick International College', code: 'YIC', domains: 'yardstick.edu.et' },
    { name: 'Hope Enterprise University College', code: 'HEUC', domains: 'hope.edu.et' },
    { name: 'Leadstar University College', code: 'LUC', domains: 'leadstar.edu.et' },
    { name: 'Gage University College', code: 'GUC', domains: 'gage.edu.et' },
  ];

  const universities = [];
  for (const univ of universitiesData) {
    const createdUniv = await prisma.university.upsert({
      where: { code: univ.code },
      update: { name: univ.name, domains: univ.domains },
      create: univ,
    });
    universities.push(createdUniv);
  }
  console.log(`Seeded ${universities.length} public and private universities.`);

  const defaultDepartments = [
    { name: 'Computer Science', code: 'CoSc' },
    { name: 'Software Engineering', code: 'SE' },
    { name: 'Information Technology', code: 'IT' },
    { name: 'Information Systems', code: 'IS' },
    { name: 'Electrical & Computer Engineering', code: 'ECE' },
    { name: 'Mechanical Engineering', code: 'ME' },
    { name: 'Civil Engineering', code: 'CE' },
    { name: 'Chemical Engineering', code: 'ChE' },
    { name: 'Biomedical Engineering', code: 'BME' },
    { name: 'Accounting & Finance', code: 'AF' },
    { name: 'Business Administration', code: 'BA' },
    { name: 'Economics', code: 'Econ' },
  ];

  let totalDepts = 0;
  for (const univ of universities) {
    for (const dept of defaultDepartments) {
      const existing = await prisma.department.findFirst({
        where: { name: dept.name, universityId: univ.id },
      });

      if (!existing) {
        await prisma.department.create({
          data: {
            name: dept.name,
            code: `${univ.code}-${dept.code}`,
            universityId: univ.id,
          },
        });
        totalDepts++;
      }
    }
  }
  console.log(`Seeded departments across universities (${totalDepts} created).`);

  const aau = universities.find((u) => u.code === 'AAU');
  const csDept = await prisma.department.findFirst({
    where: { name: 'Computer Science', universityId: aau?.id },
  });

  // Helper for password hashing
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);
  const advisorPasswordHash = await bcrypt.hash('advisor123', salt);
  const studentPasswordHash = await bcrypt.hash('student123', salt);

  // Seed Admin
  await prisma.user.upsert({
    where: { email: 'admin@ethioprojecthub.edu.et' },
    update: { universityId: aau?.id },
    create: {
      email: 'admin@ethioprojecthub.edu.et',
      fullName: 'System Administrator',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      universityId: aau?.id,
    },
  });

  // Seed Advisor
  await prisma.user.upsert({
    where: { email: 'advisor@ethioprojecthub.edu.et' },
    update: { departmentId: csDept?.id, universityId: aau?.id },
    create: {
      email: 'advisor@ethioprojecthub.edu.et',
      fullName: 'Dr. Abraham Kassahun',
      passwordHash: advisorPasswordHash,
      role: 'ADVISOR',
      departmentId: csDept?.id,
      universityId: aau?.id,
    },
  });

  // Seed Student
  await prisma.user.upsert({
    where: { email: 'student@ethioprojecthub.edu.et' },
    update: { departmentId: csDept?.id, universityId: aau?.id },
    create: {
      email: 'student@ethioprojecthub.edu.et',
      fullName: 'Yonas Gebremedhin',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      departmentId: csDept?.id,
      universityId: aau?.id,
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Connection completed
  });
