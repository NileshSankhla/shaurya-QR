import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

const name = process.env.BOOTSTRAP_ADMIN_NAME || "Master Admin";
const username = (
  process.env.BOOTSTRAP_ADMIN_USERNAME || "admin"
).toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

if (!password || password.length < 8) {
  console.error("BOOTSTRAP_ADMIN_PASSWORD must contain at least 8 characters.");
  process.exit(1);
}

await prisma.volunteer.upsert({
  where: { username },
  update: {
    name,
    role: "ADMIN",
    active: true,
    passwordHash: hashPassword(password),
  },
  create: {
    name,
    username,
    role: "ADMIN",
    active: true,
    passwordHash: hashPassword(password),
  },
});

console.log(`Master admin ready: ${username}`);
await prisma.$disconnect();
