const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Nettoyer les anciennes données
  await prisma.protocolAccess.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.appEvent.deleteMany();
  await prisma.appUser.deleteMany();
  await prisma.appOrganization.deleteMany();

  // Hash helper
  const hashPassword = async (password) => await bcrypt.hash(password, 10);

  // 1. SUPER ADMIN
  const superAdmin = await prisma.appUser.create({
    data: {
      email: "superadmin@event.com",
      password_hash: await hashPassword("SuperAdmin123!"), // ✅ snake_case
      first_name: "Super",                                 // ✅ snake_case
      last_name: "Admin",                                  // ✅ snake_case
      role: "super_admin",
      isActive: true,
    },
  });
  console.log("✅ Super Admin created:", superAdmin.email);

  // 2. ORGANISATION + ADMIN ORG
  const org = await prisma.appOrganization.create({
    data: { name: "OrgTest" },
  });

  const adminOrg = await prisma.appUser.create({
    data: {
      email: "admin@org.com",
      password_hash: await hashPassword("Admin123!"),
      first_name: "Alice",
      last_name: "Boss",
      role: "admin_org",
      isActive: true,
      organizationId: org.id,
    },
  });
  console.log("✅ Admin Org created:", adminOrg.email);

  // 3. EMPLOYEE ORG
  const employee = await prisma.appUser.create({
    data: {
      email: "employee@org.com",
      password_hash: await hashPassword("Employee123!"),
      first_name: "Bob",
      last_name: "Worker",
      role: "employee_org",
      isActive: true,
      organizationId: org.id,
    },
  });
  console.log("✅ Employee created:", employee.email);

  // 4. PROTOCOL USER
  const protocolUser = await prisma.appUser.create({
    data: {
      email: "protocol@event.com",
      password_hash: await hashPassword("Protocol123!"),
      first_name: "Eve",
      last_name: "Guest",
      role: "protocol",
      isActive: true,
    },
  });
  console.log("✅ Protocol created:", protocolUser.email);

  console.log("🌱 Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error while seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
