import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Create Universities
  const universitiesData = [
    { name: 'Addis Ababa University', code: 'AAU', domains: 'aau.edu.et' },
    { name: 'Adama Science and Technology University', code: 'ASTU', domains: 'astu.edu.et' },
    { name: 'Jimma University', code: 'JU', domains: 'ju.edu.et' },
  ];

  const universities = [];
  for (const univ of universitiesData) {
    const createdUniv = await prisma.university.upsert({
      where: { code: univ.code },
      update: { domains: univ.domains },
      create: univ,
    });
    universities.push(createdUniv);
    console.log(`University created/verified: ${univ.name} (${univ.code})`);
  }

  const aau = universities.find((u) => u.code === 'AAU');

  // 2. Create Departments
  const departmentsData = [
    { name: 'Computer Science', code: 'CoSc', universityId: aau?.id },
    { name: 'Electrical & Computer Engineering', code: 'ECE', universityId: aau?.id },
    { name: 'Mechanical Engineering', code: 'ME', universityId: aau?.id },
    { name: 'Civil Engineering', code: 'CE', universityId: aau?.id },
    { name: 'Chemical Engineering', code: 'ChE', universityId: aau?.id },
  ];

  const departments = [];
  for (const dept of departmentsData) {
    const createdDept = await prisma.department.upsert({
      where: { code: dept.code },
      update: { universityId: dept.universityId },
      create: dept,
    });
    departments.push(createdDept);
    console.log(`Department created/verified: ${dept.name} (${dept.code})`);
  }

  const csDept = departments.find((d) => d.code === 'CoSc');

  // Helper for password hashing
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);
  const advisorPasswordHash = await bcrypt.hash('advisor123', salt);
  const studentPasswordHash = await bcrypt.hash('student123', salt);

  // 3. Create Users
  // Admin
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
  console.log('Admin user seeded: admin@ethioprojecthub.edu.et / admin123');

  // Advisor
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
  console.log('Advisor user seeded: advisor@ethioprojecthub.edu.et / advisor123');

  // Student
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
  console.log('Student user seeded: student@ethioprojecthub.edu.et / student123');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Connection will close automatically
  });
