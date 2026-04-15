import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma";

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@glamgoddessshop.com" },
    update: { passwordHash },
    create: {
      email: "admin@glamgoddessshop.com",
      passwordHash,
      role: "admin",
    },
  });

  console.log(`✓ Admin user seeded: ${admin.email}`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
