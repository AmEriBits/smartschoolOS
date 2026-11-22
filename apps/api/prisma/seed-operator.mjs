import { PrismaClient } from "@prisma/client";

const authUserId = process.env.PLATFORM_OPERATOR_USER_ID?.trim();
const email = process.env.PLATFORM_OPERATOR_EMAIL?.trim().toLowerCase();

if (!authUserId || !email) {
  throw new Error("Set PLATFORM_OPERATOR_USER_ID and PLATFORM_OPERATOR_EMAIL before seeding an operator.");
}
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(authUserId)) {
  throw new Error("PLATFORM_OPERATOR_USER_ID must be a Supabase Auth UUID.");
}

const prisma = new PrismaClient();

try {
  await prisma.platformOperator.upsert({
    where: { authUserId },
    update: { email, active: true },
    create: { authUserId, email, active: true },
  });
  console.info(`Authorized platform operator ${email}.`);
} finally {
  await prisma.$disconnect();
}
