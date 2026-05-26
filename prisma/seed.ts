import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const dbPath = path.join(__dirname, 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Create Departments
  const departmentsData = [
    { name: 'Computer Science', code: 'CoSc' },
    { name: 'Electrical & Computer Engineering', code: 'ECE' },
    { name: 'Mechanical Engineering', code: 'ME' },
    { name: 'Civil Engineering', code: 'CE' },
    { name: 'Chemical Engineering', code: 'ChE' },
  ];

  const departments = [];
  for (const dept of departmentsData) {
    const createdDept = await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
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

  // 2. Create Users
  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@ethioprojecthub.edu.et' },
    update: {},
    create: {
      email: 'admin@ethioprojecthub.edu.et',
      fullName: 'System Administrator',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });
  console.log('Admin user seeded: admin@ethioprojecthub.edu.et / admin123');

  // Advisor
  await prisma.user.upsert({
    where: { email: 'advisor@ethioprojecthub.edu.et' },
    update: {},
    create: {
      email: 'advisor@ethioprojecthub.edu.et',
      fullName: 'Dr. Abraham Kassahun',
      passwordHash: advisorPasswordHash,
      role: 'ADVISOR',
      departmentId: csDept?.id,
    },
  });
  console.log('Advisor user seeded: advisor@ethioprojecthub.edu.et / advisor123');

  // Student
  await prisma.user.upsert({
    where: { email: 'student@ethioprojecthub.edu.et' },
    update: {},
    create: {
      email: 'student@ethioprojecthub.edu.et',
      fullName: 'Yonas Gebremedhin',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      departmentId: csDept?.id,
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
